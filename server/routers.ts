import { COOKIE_NAME } from "../shared/const.js";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { z } from "zod";
import { sociallyClient, VERIFIED_TIKTOK_SERVICES } from "./socially";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return {
        success: true,
      } as const;
    }),
  }),

  // TokFuel SMM Router
  smm: router({
    // Get integration & API key status
    getIntegrationStatus: publicProcedure.query(() => {
      return sociallyClient.getTokenStatus();
    }),

    // Get upstream balance & currency
    getBalance: publicProcedure.query(async () => {
      return await sociallyClient.getAccountBalance();
    }),

    // Get TikTok services catalog
    getServices: publicProcedure.query(async () => {
      return await sociallyClient.getServices();
    }),

    // Calculate exact pricing in Naira
    calculateCost: publicProcedure
      .input(
        z.object({
          serviceId: z.union([z.number(), z.string()]),
          quantity: z.number().min(1),
        })
      )
      .query(({ input }) => {
        const service = VERIFIED_TIKTOK_SERVICES.find(
          (s) => String(s.service) === String(input.serviceId)
        );
        const ratePerThousand = service ? service.rate : 100;
        const totalNaira = Number(((ratePerThousand / 1000) * input.quantity).toFixed(2));
        return {
          serviceId: input.serviceId,
          quantity: input.quantity,
          ratePerThousand,
          totalNaira,
          formattedTotal: `₦${totalNaira.toLocaleString("en-NG", { minimumFractionDigits: 2 })}`,
          currency: "NGN",
        };
      }),

    // Create a new SMM fulfillment order
    createOrder: publicProcedure
      .input(
        z.object({
          serviceId: z.union([z.number(), z.string()]),
          link: z.string().url("Please provide a valid TikTok URL (profile or video)"),
          quantity: z.number().min(10, "Minimum quantity is 10"),
        })
      )
      .mutation(async ({ input }) => {
        return await sociallyClient.createOrder({
          service: input.serviceId,
          link: input.link,
          quantity: input.quantity,
        });
      }),

    // Check status of an existing order
    getOrderStatus: publicProcedure
      .input(
        z.object({
          orderId: z.string(),
        })
      )
      .query(async ({ input }) => {
        return await sociallyClient.getOrderStatus(input.orderId);
      }),

    // List recent orders
    listOrders: publicProcedure.query(async () => {
      return await sociallyClient.listOrders();
    }),
  }),
});

export type AppRouter = typeof appRouter;
