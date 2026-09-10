import { describe, expect, it } from "vitest";

describe("Socially.ng live credential", () => {
  it("authenticates and returns the live services catalog", async () => {
    const token = process.env.SOCIALLY_API_TOKEN;
    expect(token, "SOCIALLY_API_TOKEN must be configured").toBeTruthy();

    const form = new FormData();
    form.append("key", token as string);
    form.append("action", "services");

    const response = await fetch("https://socially.ng/api/v1", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: form,
      signal: AbortSignal.timeout(15000),
    });

    expect(response.ok, `Socially returned HTTP ${response.status}`).toBe(true);
    const body = await response.json();
    expect(Array.isArray(body), "Socially services response must be an array").toBe(true);
    expect(body.length).toBeGreaterThan(0);
    expect(body[0]).toHaveProperty("service");
    expect(body[0]).toHaveProperty("category");
  }, 20000);

  it("returns the live Socially account balance in NGN", async () => {
    const token = process.env.SOCIALLY_API_TOKEN;
    expect(token).toBeTruthy();

    const form = new FormData();
    form.append("key", token as string);
    form.append("action", "balance");
    const response = await fetch("https://socially.ng/api/v1", {
      method: "POST",
      headers: { Accept: "application/json" },
      body: form,
      signal: AbortSignal.timeout(15000),
    });

    expect(response.ok).toBe(true);
    const body = await response.json();
    expect(body.status).toBe("success");
    expect(body.currency).toBe("NGN");
    expect(body).toHaveProperty("balance");
  }, 20000);
});
