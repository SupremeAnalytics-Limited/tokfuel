import { describe, expect, it } from "vitest";
import { appRouter } from "../server/routers";
import { VERIFIED_TIKTOK_SERVICES } from "../server/socially";

describe("TokFuel SMM API Suite", () => {
  it("provides integration status without exposing secrets", async () => {
    const caller = appRouter.createCaller({} as any);
    const status = await caller.smm.getIntegrationStatus();
    
    expect(status).toBeDefined();
    expect(status.baseUrl).toBe("https://socially.ng/api/v1");
    expect(typeof status.configured).toBe("boolean");
    // Token must never be fully exposed
    if (status.maskedToken) {
      expect(status.maskedToken).toContain("••••");
    }
  });

  it("retrieves curated Nigerian TikTok growth services", async () => {
    const caller = appRouter.createCaller({} as any);
    const services = await caller.smm.getServices();

    expect(services.length).toBeGreaterThanOrEqual(5);
    const followerService = services.find((s) => s.category.includes("FOLLOWER"));
    expect(followerService).toBeDefined();
    expect(followerService?.rate).toBeGreaterThan(0);
  });

  it("correctly computes Naira charges for different quantities", async () => {
    const caller = appRouter.createCaller({} as any);
    
    // Service 125: Followers at ₦1,250 per 1,000
    const calc1k = await caller.smm.calculateCost({
      serviceId: 125,
      quantity: 1000,
    });
    expect(calc1k.totalNaira).toBe(1250);
    expect(calc1k.formattedTotal).toContain("1,250");

    // Service 123: Views at ₦28.50 per 1,000 -> 10,000 views = ₦285.00
    const calc10kViews = await caller.smm.calculateCost({
      serviceId: 123,
      quantity: 10000,
    });
    expect(calc10kViews.totalNaira).toBe(285);
  });

  it("creates an order and lists it in session tracking", async () => {
    const caller = appRouter.createCaller({} as any);
    const newOrder = await caller.smm.createOrder({
      serviceId: 123,
      link: "https://www.tiktok.com/@testcreator/video/123456789",
      quantity: 2000,
    });

    expect(newOrder.order_id).toBeDefined();
    expect(newOrder.status).toBe("in_progress");
    expect(newOrder.quantity).toBe(2000);

    const orders = await caller.smm.listOrders();
    expect(orders.some((o) => o.order_id === newOrder.order_id)).toBe(true);
  });
});
