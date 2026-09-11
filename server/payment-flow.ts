import crypto from "node:crypto";
import { TRPCError } from "@trpc/server";
import { appendWalletEntry, createPaymentTransaction, getPaymentTransaction, getWalletBalance, updatePaymentTransaction } from "./db";
import { initializePaystackTransaction, transferWholesaleToBeneficiary, verifyPaystackTransaction } from "./paystack";
import { sociallyClient } from "./socially";

function makeReference() {
  return `tokfuel_${Date.now()}_${crypto.randomBytes(6).toString("hex")}`;
}

export function calculatePaystackFee(serviceAmount: number): number {
  const percentage = serviceAmount * 0.015;
  const flat = serviceAmount >= 2500 ? 100 : 0;
  return Number(Math.min(2000, percentage + flat).toFixed(2));
}

function normaliseOrderStatus(status: string) {
  const value = status.toLowerCase();
  if (["failed", "error", "canceled", "cancelled"].includes(value)) return "failed";
  if (["completed", "complete", "success", "successful"].includes(value)) return "completed";
  return "processing";
}

export async function initializePurchase(input: { email: string; giftId: string; link: string; quantity: number; callbackUrl: string }) {
  const services = await sociallyClient.getServices();
  const service = services.find((item) => String(item.service) === input.giftId);
  if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "That gift is no longer available" });
  const customerRatePerThousand = Math.max(Number((service.rate * 1.8).toFixed(2)), service.category.toLowerCase().includes("view") ? 5000 : service.category.toLowerCase().includes("stream") ? 6000 : service.category.toLowerCase().includes("follower") ? 7000 : service.category.toLowerCase().includes("like") ? 1800 : 0);
  const serviceAmount = Number(((customerRatePerThousand / 1000) * input.quantity).toFixed(2));
  const processingFee = calculatePaystackFee(serviceAmount);
  const customerAmount = Number((serviceAmount + processingFee).toFixed(2));
  const reference = makeReference();
  await createPaymentTransaction({ reference, customerEmail: input.email, giftId: input.giftId, link: input.link, quantity: input.quantity, customerAmount: customerAmount.toFixed(2), paystackStatus: "initialized", orderStatus: "awaiting_payment", refundStatus: "not_applicable" });
  try {
    const payment = await initializePaystackTransaction({ email: input.email, amountNaira: customerAmount, reference, callbackUrl: input.callbackUrl, metadata: { reference, giftId: input.giftId, quantity: input.quantity } });
    return { ...payment, serviceAmount, processingFee, customerAmount, currency: "NGN" as const };
  } catch (error) {
    await updatePaymentTransaction(reference, { paystackStatus: "initialization_failed", orderStatus: "failed", refundStatus: "not_applicable" });
    throw new TRPCError({ code: "BAD_GATEWAY", message: "Secure payment could not be initialized" });
  }
}

export async function verifyAndFulfilPurchase(reference: string) {
  const transaction = await getPaymentTransaction(reference);
  if (!transaction) throw new TRPCError({ code: "NOT_FOUND", message: "Payment reference not found" });
  if (transaction.refundStatus === "credited_to_wallet") return { ...transaction, fulfilled: false, refundedToWallet: true };
  if (transaction.sociallyOrderId && transaction.wholesaleAmount && transaction.orderStatus === "completed") return { ...transaction, fulfilled: true };

  if (transaction.sociallyOrderId && transaction.wholesaleAmount) {
    try {
      const transfer = await transferWholesaleToBeneficiary(Number(transaction.wholesaleAmount), reference);
      const settled = await updatePaymentTransaction(reference, { orderStatus: "completed", transferReference: transfer.reference });
      return { ...settled, fulfilled: true, wholesaleAmount: Number(transaction.wholesaleAmount), tokfuelAmount: Number(transaction.tokfuelAmount ?? 0) };
    } catch {
      const pending = await updatePaymentTransaction(reference, { orderStatus: "settlement_pending" });
      return { ...pending, fulfilled: false, settlementPending: true };
    }
  }

  const payment = await verifyPaystackTransaction(reference);
  const amountMatches = payment.amount === Number(transaction.customerAmount);
  if (payment.status !== "success" || payment.currency !== "NGN" || !amountMatches) {
    const failed = await updatePaymentTransaction(reference, { paystackStatus: payment.status, orderStatus: "payment_failed" });
    return { ...failed, paymentStatus: payment.status, fulfilled: false };
  }

  await updatePaymentTransaction(reference, { paystackStatus: "success", orderStatus: "processing" });
  try {
    const order = await sociallyClient.createOrder({ service: transaction.giftId, link: transaction.link, quantity: transaction.quantity });
    const wholesaleAmount = Number(order.charge ?? 0);
    if (!Number.isFinite(wholesaleAmount) || wholesaleAmount <= 0 || wholesaleAmount > Number(transaction.customerAmount)) throw new Error("Upstream wholesale charge was invalid for this payment");
    const tokfuelAmount = Number((Number(transaction.customerAmount) - wholesaleAmount).toFixed(2));
    const orderStatus = normaliseOrderStatus(order.status);
    const updated = await updatePaymentTransaction(reference, { wholesaleAmount: wholesaleAmount.toFixed(2), tokfuelAmount: tokfuelAmount.toFixed(2), sociallyOrderId: order.order_id, orderStatus, refundStatus: "not_applicable", transferReference: `tokfuel-wholesale-${reference}` });
    if (orderStatus === "failed") {
      await refundToWallet(transaction.customerEmail, Number(transaction.customerAmount), reference);
      return { ...updated, paymentStatus: "success", fulfilled: false, refundedToWallet: true };
    }
    try {
      const transfer = await transferWholesaleToBeneficiary(wholesaleAmount, reference);
      const settled = await updatePaymentTransaction(reference, { orderStatus: "completed", transferReference: transfer.reference });
      return { ...settled, paymentStatus: "success", fulfilled: true, wholesaleAmount, tokfuelAmount };
    } catch {
      const pending = await updatePaymentTransaction(reference, { orderStatus: "settlement_pending" });
      return { ...pending, paymentStatus: "success", fulfilled: false, settlementPending: true, wholesaleAmount, tokfuelAmount };
    }
  } catch (error) {
    await updatePaymentTransaction(reference, { orderStatus: "failed", refundStatus: "credited_to_wallet" });
    await refundToWallet(transaction.customerEmail, Number(transaction.customerAmount), reference);
    return { ...(await getPaymentTransaction(reference)), paymentStatus: "success", fulfilled: false, refundedToWallet: true };
  }
}

export async function refundToWallet(customerEmail: string, amount: number, reference: string) {
  const credited = await appendWalletEntry({ customerEmail, idempotencyKey: `refund:${reference}`, amount: amount.toFixed(2), direction: "credit", reason: "failed_purchase_refund", paymentReference: reference });
  if (credited) await updatePaymentTransaction(reference, { refundStatus: "credited_to_wallet" });
  return { credited, balance: await getWalletBalance(customerEmail) };
}

export async function getRefundWallet(customerEmail: string) {
  return { balance: await getWalletBalance(customerEmail), mode: "refund_only" as const };
}
