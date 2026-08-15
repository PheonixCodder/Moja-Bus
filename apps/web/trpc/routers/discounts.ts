import {
  applyReferralCodeSchema,
  listMyVouchersSchema,
} from "@moja/schemas";
import { createTRPCRouter, protectedProcedure } from "../init";
import {
  applyReferralCode,
  getReferralStats,
} from "@/features/discounts/services/referral-service";
import { listUserVouchers } from "@/features/discounts/services/voucher-service";
import { loadUserCreditLots } from "@/features/discounts/services/campaign-loader";

export const discountsRouter = createTRPCRouter({
  listMyVouchers: protectedProcedure
    .input(listMyVouchersSchema)
    .query(async ({ ctx, input }) => {
      return listUserVouchers(ctx.prisma, ctx.user.id, input.includeExpired);
    }),

  listMyCredits: protectedProcedure.query(async ({ ctx }) => {
    return loadUserCreditLots(ctx.prisma, ctx.user.id);
  }),

  myReferral: protectedProcedure.query(async ({ ctx }) => {
    return getReferralStats(ctx.prisma, ctx.user.id);
  }),

  applyReferralCode: protectedProcedure
    .input(applyReferralCodeSchema)
    .mutation(async ({ ctx, input }) => {
      return applyReferralCode(ctx.prisma, {
        refereeUserId: ctx.user.id,
        code: input.code,
        ...(input.deviceHash !== undefined
          ? { deviceHash: input.deviceHash }
          : {}),
      });
    }),
});
