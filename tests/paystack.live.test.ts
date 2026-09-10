import { describe, expect, it } from "vitest";

describe("Paystack live credential", () => {
  it("authenticates against the Paystack balance endpoint", async () => {
    const secret = process.env.PAYSTACK_SECRET_KEY;
    expect(secret, "PAYSTACK_SECRET_KEY must be configured").toBeTruthy();

    const response = await fetch("https://api.paystack.co/balance", {
      headers: { Authorization: `Bearer ${secret}`, Accept: "application/json" },
      signal: AbortSignal.timeout(15000),
    });

    expect(response.ok, `Paystack returned HTTP ${response.status}`).toBe(true);
    const body = await response.json();
    expect(body.status).toBe(true);
    expect(Array.isArray(body.data)).toBe(true);
  }, 20000);
});
