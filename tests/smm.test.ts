import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import { applyTokFuelMarkup, TOKFUEL_MARKUP_PERCENT } from "../server/socially";

describe("TokFuel live SMM API Suite", () => {
  it("provides integration status without exposing secrets", async () => {
    const caller = appRouter.createCaller({} as any);
    const status = await caller.smm.getIntegrationStatus();

    expect(status.baseUrl).toBe("https://socially.ng/api/v1");
    expect(typeof status.configured).toBe("boolean");
    expect(status).not.toHaveProperty("maskedToken");
  });

  it("retrieves only live TikTok services from Socially.ng", async () => {
    const caller = appRouter.createCaller({} as any);
    const services = await caller.smm.getServices();

    expect(services.length).toBeGreaterThan(0);
    expect(services.every((service) => `${service.category} ${service.name}`.toLowerCase().includes("tiktok"))).toBe(true);
    expect(services.every((service) => service.rate >= 0 && service.min >= 0 && service.max >= service.min)).toBe(true);
  }, 20000);

  it("calculates pricing from the live Socially catalog", async () => {
    const caller = appRouter.createCaller({} as any);
    const services = await caller.smm.getServices();
    const service = services[0];
    const calculation = await caller.smm.calculateCost({ serviceId: service.service, quantity: service.min });

    const wholesaleTotal = Number(((service.rate / 1000) * service.min).toFixed(2));
    expect(calculation.wholesaleTotal).toBe(wholesaleTotal);
    expect(calculation.markupPercent).toBe(TOKFUEL_MARKUP_PERCENT);
    expect(calculation.customerTotal).toBe(applyTokFuelMarkup(wholesaleTotal));
    expect(calculation.totalNaira).toBe(calculation.customerTotal);
    expect(calculation.currency).toBe("NGN");
  }, 20000);

  it("uses an 80 percent markup, not an 80 percent gross margin", () => {
    expect(TOKFUEL_MARKUP_PERCENT).toBe(80);
    expect(applyTokFuelMarkup(100)).toBe(180);
  });
});
