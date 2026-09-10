import crypto from "node:crypto";

const PAYSTACK_BASE_URL = "https://api.paystack.co";
const BENEFICIARY_ACCOUNT_NUMBER = "6635796668";
const BENEFICIARY_BANK_CODE = "999991";
const BENEFICIARY_NAME = "Riteweb Digital Services-Sim(Paymentpoint)";

export type PaystackTransaction = {
  reference: string;
  status: string;
  amount: number;
  currency: string;
  metadata?: Record<string, unknown>;
};

export type PaystackPaymentInit = {
  authorizationUrl: string;
  accessCode: string;
  reference: string;
};

function requireSecret() {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  if (!secret) throw new Error("PAYSTACK_SECRET_KEY is not configured");
  return secret;
}

async function request<T>(path: string, init: RequestInit = {}): Promise<T> {
  const response = await fetch(`${PAYSTACK_BASE_URL}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${requireSecret()}`,
      Accept: "application/json",
      "Content-Type": "application/json",
      ...(init.headers ?? {}),
    },
    signal: AbortSignal.timeout(20000),
  });
  const body = await response.json().catch(() => null) as { status?: boolean; message?: string; data?: T } | null;
  if (!response.ok || body?.status !== true) throw new Error(`Paystack request failed: ${body?.message ?? `HTTP ${response.status}`}`);
  return body.data as T;
}

export function isPaystackWebhookValid(rawBody: Buffer, signature: string | undefined): boolean {
  if (!signature) return false;
  const expected = crypto.createHmac("sha512", requireSecret()).update(rawBody).digest("hex");
  if (expected.length !== signature.length) return false;
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
}

export async function initializePaystackTransaction(input: { email: string; amountNaira: number; reference: string; callbackUrl: string; metadata: Record<string, unknown> }): Promise<PaystackPaymentInit> {
  const data = await request<{ authorization_url: string; access_code: string; reference: string }>("/transaction/initialize", {
    method: "POST",
    body: JSON.stringify({
      email: input.email,
      amount: Math.round(input.amountNaira * 100),
      currency: "NGN",
      reference: input.reference,
      callback_url: input.callbackUrl,
      metadata: input.metadata,
    }),
  });
  return { authorizationUrl: data.authorization_url, accessCode: data.access_code, reference: data.reference };
}

export async function verifyPaystackTransaction(reference: string): Promise<PaystackTransaction> {
  const data = await request<{ reference: string; status: string; amount: number; currency: string; metadata?: Record<string, unknown> }>(`/transaction/verify/${encodeURIComponent(reference)}`);
  return { reference: data.reference, status: data.status, amount: Number(data.amount) / 100, currency: data.currency, metadata: data.metadata };
}

async function findBeneficiaryRecipient(): Promise<string> {
  const data = await request<Array<{ recipient_code?: string; details?: { account_number?: string }; name?: string }>>("/transferrecipient?perPage=100");
  const existing = data.find((item) => item.details?.account_number === BENEFICIARY_ACCOUNT_NUMBER);
  if (existing?.recipient_code) return existing.recipient_code;
  const created = await request<{ recipient_code: string }>("/transferrecipient", {
    method: "POST",
    body: JSON.stringify({ type: "nuban", name: BENEFICIARY_NAME, account_number: BENEFICIARY_ACCOUNT_NUMBER, bank_code: BENEFICIARY_BANK_CODE, currency: "NGN" }),
  });
  return created.recipient_code;
}

export async function transferWholesaleToBeneficiary(amountNaira: number, paymentReference: string): Promise<{ status: string; reference: string }> {
  const transferReference = `tokfuel-wholesale-${paymentReference}`;
  try {
    const existing = await request<{ status: string; reference: string }>(`/transfer/verify/${encodeURIComponent(transferReference)}`);
    return existing;
  } catch {
    // A missing transfer is expected on the first attempt; any created transfer is idempotent by reference.
  }
  const recipient = await findBeneficiaryRecipient();
  const data = await request<{ status: string; reference: string }>("/transfer", {
    method: "POST",
    body: JSON.stringify({ source: "balance", amount: Math.round(amountNaira * 100), recipient, reason: `Wholesale settlement for ${paymentReference}`, reference: transferReference }),
  });
  return data;
}
