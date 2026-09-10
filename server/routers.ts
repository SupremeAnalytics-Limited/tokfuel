import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { applyTokFuelMarkup, sociallyClient, TOKFUEL_MARKUP_PERCENT } from "./socially";

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
    getIntegrationStatus: publicProcedure.query(() => sociallyClient.getTokenStatus()),

    getBalance: publicProcedure.query(async () => {
      try {
        return await sociallyClient.getAccountBalance();
      } catch (error) {
        throw new TRPCError({ code: "BAD_GATEWAY", message: error instanceof Error ? error.message : "Socially balance unavailable" });
      }
    }),

    getServices: publicProcedure.query(async () => {
      try {
        return await sociallyClient.getServices();
      } catch (error) {
        throw new TRPCError({ code: "BAD_GATEWAY", message: error instanceof Error ? error.message : "Socially services unavailable" });
      }
    }),

    calculateCost: publicProcedure
      .input(z.object({ serviceId: z.union([z.number(), z.string()]), quantity: z.number().min(1) }))
      .query(async ({ input }) => {
        try {
          const services = await sociallyClient.getServices();
          const service = services.find((item) => String(item.service) === String(input.serviceId));
          if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "That live TikTok service is no longer available" });
          const wholesaleTotal = Number(((service.rate / 1000) * input.quantity).toFixed(2));
          const customerTotal = applyTokFuelMarkup(wholesaleTotal);
          return {
            serviceId: input.serviceId,
            quantity: input.quantity,
            ratePerThousand: service.rate,
            wholesaleTotal,
            markupPercent: TOKFUEL_MARKUP_PERCENT,
            customerTotal,
            totalNaira: customerTotal,
            formattedTotal: `₦${customerTotal.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
            currency: "NGN",
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "BAD_GATEWAY", message: error instanceof Error ? error.message : "Live pricing unavailable" });
        }
      }),

    createOrder: publicProcedure
      .input(z.object({ serviceId: z.union([z.number(), z.string()]), link: z.string().url("Please provide a valid TikTok URL"), quantity: z.number().min(1, "Quantity must be greater than zero") }))
      .mutation(async ({ input }) => {
        try {
          const services = await sociallyClient.getServices();
          const service = services.find((item) => String(item.service) === String(input.serviceId));
          if (!service) throw new TRPCError({ code: "NOT_FOUND", message: "That live TikTok service is no longer available" });
          if (input.quantity < service.min || input.quantity > service.max) {
            throw new TRPCError({ code: "BAD_REQUEST", message: `Quantity must be between ${service.min.toLocaleString()} and ${service.max.toLocaleString()}` });
          }
          const wholesaleTotal = Number(((service.rate / 1000) * input.quantity).toFixed(2));
          const order = await sociallyClient.createOrder({ service: input.serviceId, link: input.link, quantity: input.quantity });
          return {
            ...order,
            pricing: {
              wholesaleTotal,
              markupPercent: TOKFUEL_MARKUP_PERCENT,
              customerTotal: applyTokFuelMarkup(wholesaleTotal),
              currency: "NGN" as const,
            },
          };
        } catch (error) {
          if (error instanceof TRPCError) throw error;
          throw new TRPCError({ code: "BAD_GATEWAY", message: error instanceof Error ? error.message : "Live order submission failed" });
        }
      }),

    getOrderStatus: publicProcedure
      .input(z.object({ orderId: z.string() }))
      .query(async ({ input }) => {
        try {
          return await sociallyClient.getOrderStatus(input.orderId);
        } catch (error) {
          throw new TRPCError({ code: "BAD_GATEWAY", message: error instanceof Error ? error.message : "Live order status unavailable" });
        }
      }),
  }),
});

export type AppRouter = typeof appRouter;
