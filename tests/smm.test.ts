import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import { applyTokFuelMarkup, TOKFUEL_MARKUP_PERCENT } from "../server/socially";

describe("TokFuel live gift API Suite", () => {
  it("exposes only a generic availability check", async () => {
    const caller = appRouter.createCaller({} as any);
    const status = await caller.smm.getAvailability();
    expect(typeof status.available).toBe("boolean");
  });

  it("returns only public gift fields and hides wholesale implementation data", async () => {
    const caller = appRouter.createCaller({} as any);
    const gifts = await caller.smm.getServices();
    expect(gifts.length).toBeGreaterThan(0);
    expect(gifts.every((gift) => gift.giftId && gift.title && gift.customerRatePerThousand >= 0)).toBe(true);
    expect(gifts.every((gift) => !Object.prototype.hasOwnProperty.call(gift, "rate"))).toBe(true);
    expect(gifts.every((gift) => !Object.prototype.hasOwnProperty.call(gift, "service"))).toBe(true);
  }, 20000);

  it("provides the four featured home categories with views priced as a high-volume product", async () => {
    const caller = appRouter.createCaller({} as any);
    const gifts = await caller.smm.getServices();
    const categories = new Set(gifts.map((gift) => gift.category));
    expect(categories.has("TikTok Followers")).toBe(true);
    expect(categories.has("TikTok Likes")).toBe(true);
    expect(categories.has("TikTok Views")).toBe(true);
    expect(categories.has("TikTok Streams")).toBe(true);
    expect(gifts.filter((gift) => gift.category === "TikTok Views").every((gift) => gift.customerRatePerThousand >= 5000)).toBe(true);
  }, 20000);

  it("calculates customer gift pricing from live service data in 500-unit increments", async () => {
    const caller = appRouter.createCaller({} as any);
    const gifts = await caller.smm.getServices();
    const gift = gifts[0];
    const quantity = gift.minQuantity;
    const calculation = await caller.smm.calculateCost({ giftId: gift.giftId, quantity });
    expect(calculation.customerTotal).toBe(Number(((gift.customerRatePerThousand / 1000) * quantity).toFixed(2)));
    expect(calculation.totalNaira).toBe(calculation.customerTotal);
    expect(calculation).not.toHaveProperty("wholesaleTotal");
    expect(calculation).not.toHaveProperty("markupPercent");
  }, 20000);

  it("keeps the internal pricing formula at 80 percent markup", () => {
    expect(TOKFUEL_MARKUP_PERCENT).toBe(80);
    expect(applyTokFuelMarkup(100)).toBe(180);
  });
});
