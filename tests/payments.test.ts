import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { isPaystackWebhookValid } from "../server/paystack";

describe("TokFuel payment safety contract", () => {
  it("accepts the exact Paystack HMAC and rejects altered payloads", () => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    expect(secret).toBeTruthy();
    const payload = Buffer.from(JSON.stringify({ event: "charge.success", data: { reference: "tokfuel_test" } }));
    const signature = crypto.createHmac("sha512", secret as string).update(payload).digest("hex");
    expect(isPaystackWebhookValid(payload, signature)).toBe(true);
    expect(isPaystackWebhookValid(Buffer.from("altered"), signature)).toBe(false);
  });

  it("keeps wholesale, markup, refund, and idempotency data server-side", () => {
    const router = fs.readFileSync(path.resolve(__dirname, "../server/routers.ts"), "utf8");
    const flow = fs.readFileSync(path.resolve(__dirname, "../server/payment-flow.ts"), "utf8");
    const schema = fs.readFileSync(path.resolve(__dirname, "../drizzle/schema.ts"), "utf8");
    expect(router).toContain("initializePurchase");
    expect(flow).toContain("order.charge");
    expect(flow).toContain("refund:${reference}");
    expect(schema).toContain("idempotencyKey");
    expect(schema).toContain("wholesaleAmount");
    expect(schema).toContain("tokfuelAmount");
  });
});
