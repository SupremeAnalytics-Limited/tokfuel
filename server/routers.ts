import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { applyTokFuelMarkup, sociallyClient } from "./socially";

const giftQuantitySchema = z.number().int().min(500).refine((value) => value % 500 === 0, "Gift quantity must increase in 500-unit steps");

// Customer-facing floors are intentionally separate from Socially wholesale rates.
// Views receive a stronger floor because they are a high-volume discovery product.
const CUSTOMER_RATE_FLOORS: Record<string, number> = {
  followers: 7000,
  likes: 1800,
  views: 5000,
  streams: 6000,
};

type PublicGiftService = {
  giftId: string;
  title: string;
  category: string;
  description: string;
  customerRatePerThousand: number;
  minQuantity: number;
  maxQuantity: number;
  refillAvailable: boolean;
  averageTime?: string;
};

function toPublicGift(service: Awaited<ReturnType<typeof sociallyClient.getServices>>[number]): PublicGiftService {
  const normalizedCategory = service.category.replace(/[^a-zA-Z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
  const categoryValue = `${service.category} ${service.name}`.toLowerCase();
  const productKey = categoryValue.includes("follower") ? "followers" : categoryValue.includes("like") ? "likes" : categoryValue.includes("view") ? "views" : categoryValue.includes("stream") ? "streams" : "other";
  const customerRatePerThousand = Math.max(applyTokFuelMarkup(service.rate), CUSTOMER_RATE_FLOORS[productKey] ?? 0);
  const customerCategory = productKey === "followers" ? "TikTok Followers" : productKey === "likes" ? "TikTok Likes" : productKey === "views" ? "TikTok Views" : productKey === "streams" ? "TikTok Streams" : "TikTok Gifts";
  return {
    giftId: String(service.service),
    title: customerCategory,
    category: customerCategory,
    description: productKey === "views" ? "Help a creator get discovered by more viewers." : productKey === "followers" ? "Show lasting support for a creator's community." : productKey === "likes" ? "Add encouragement to a creator's latest post." : productKey === "streams" ? "Support a creator's live moment." : normalizedCategory || "TikTok creator gift",
    customerRatePerThousand,
    minQuantity: Math.max(500, Math.ceil(service.min / 500) * 500),
    maxQuantity: Math.floor(service.max / 500) * 500,
    refillAvailable: service.refill,
    averageTime: service.average_time,
  };
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  smm: router({
    getAvailability: publicProcedure.query(() => ({ available: sociallyClient.hasToken() })),

    getServices: publicProcedure.query(async () => {
      try {
        const services = await sociallyClient.getServices();
        return services.map(toPublicGift);
      } catch (error) {
        throw new TRPCError({ code: "BAD_GATEWAY", message: "Live TikTok gifts are temporarily unavailable" });
      }
    }),

    calculateCost: publicProcedure
      .input(z.object({ giftId: z.string(), quantity: giftQuantitySchema }))
      .query(async ({ input }) => {
        try {
          const services = await sociallyClient.getServices();
          const service = services.find((item) => String(item.service) === input.giftId);
          if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "That live TikTok gift is no longer available" });
          const gift = toPublicGift(service);
          if (input.quantity < gift.minQuantity || input.quantity > gift.maxQuantity) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a quantity within the available gift range" });
          }
          const customerTotal = Number(((gift.customerRatePerThousand / 1000) * input.quantity).toFixed(2));
          return {
            giftId: gift.giftId,
            quantity: input.quantity,
            customerRatePerThousand: gift.customerRatePerThousand,
            customerTotal,
            totalNaira: customerTotal,
            formattedTotal: `₦${customerTotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
            currency: "NGN",
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "BAD_GATEWAY", message: "Live gift pricing is temporarily unavailable" });
        }
      }),

    createOrder: publicProcedure
      .input(z.object({ giftId: z.string(), link: z.string().url("Please provide a valid TikTok URL"), quantity: giftQuantitySchema }))
      .mutation(async ({ input }) => {
        try {
          const services = await sociallyClient.getServices();
          const service = services.find((item) => String(item.service) === input.giftId);
          if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "That live TikTok gift is no longer available" });
          const gift = toPublicGift(service);
          if (input.quantity < gift.minQuantity || input.quantity > gift.maxQuantity) {
            throw new TRPCError({ code: "BAD_REQUEST", message: "Choose a quantity within the available gift range" });
          }
          const order = await sociallyClient.createOrder({ service: input.giftId, link: input.link, quantity: input.quantity });
          return {
            orderId: order.order_id,
            status: order.status,
            link: order.link,
            quantity: order.quantity,
            customerTotal: Number(((gift.customerRatePerThousand / 1000) * input.quantity).toFixed(2)),
            currency: "NGN" as const,
            createdAt: order.createdAt,
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "BAD_GATEWAY", message: "Live gift submission failed" });
        }
      }),

    getOrderStatus: publicProcedure
      .input(z.object({ orderId: z.string() }))
      .query(async ({ input }) => {
        try {
          return await sociallyClient.getOrderStatus(input.orderId);
        } catch (error) {
          throw new TRPCError({ code: "BAD_GATEWAY", message: "Live gift status is temporarily unavailable" });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
