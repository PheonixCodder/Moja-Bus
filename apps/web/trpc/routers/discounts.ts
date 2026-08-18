import {
  applyReferralCodeSchema,
  claimCreditGrantSchema,
  listMyInviteesSchema,
} from "@moja/schemas";
import { TRPCError } from "@trpc/server";
import { createTRPCRouter, protectedProcedure, publicProcedure } from "../init";
import {
  applyReferralCode,
  getPublicReferralProgram,
  getReferralStats,
  listMyInvitees,
} from "@/features/discounts/services/referral-service";
import { claimCreditGrant } from "@/features/discounts/services/claim-credit-grant-service";
import { loadUserCreditLots } from "@/features/discounts/services/campaign-loader";
import { createRateLimiter } from "@/lib/rate-limit";

/** Soft gate against code spraying: 10 attempts / 15 min / user. */
const referralApplyLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
});

const creditClaimLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 20,
});

export const discountsRouter = createTRPCRouter({
  listMyCredits: protectedProcedure.query(async ({ ctx }) => {
    return loadUserCreditLots(ctx.prisma, ctx.user.id);
  }),

  /** All lots for wallet UI (includes PENDING). */
  listMyCreditLots: protectedProcedure.query(async ({ ctx }) => {
    return ctx.prisma.creditLot.findMany({
      where: {
        userId: ctx.user.id,
        status: {
          in: ["PENDING", "ACTIVE", "PARTIALLY_REDEEMED"],
        },
      },
      orderBy: [{ status: "asc" }, { expiresAt: "asc" }, { createdAt: "desc" }],
      take: 50,
    });
  }),

  myReferral: protectedProcedure.query(async ({ ctx }) => {
    return getReferralStats(ctx.prisma, ctx.user.id);
  }),

  listMyInvitees: protectedProcedure
    .input(listMyInviteesSchema)
    .query(async ({ ctx, input }) => {
      return listMyInvitees(ctx.prisma, ctx.user.id, input);
    }),

  /** Safe public fields for invite landing / share UX. */
  getReferralProgramPublic: publicProcedure.query(async ({ ctx }) => {
    return getPublicReferralProgram(ctx.prisma);
  }),

  claimCreditGrant: protectedProcedure
    .input(claimCreditGrantSchema)
    .mutation(async ({ ctx, input }) => {
      const limited = creditClaimLimiter(`credit-claim:${ctx.user.id}`);
      if (!limited.ok) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many claim attempts. Try again in a few minutes.",
        });
      }
      return claimCreditGrant(ctx.prisma, {
        userId: ctx.user.id,
        code: input.code,
        ...(input.deviceHash !== undefined
          ? { deviceHash: input.deviceHash }
          : {}),
      });
    }),

  applyReferralCode: protectedProcedure
    .input(applyReferralCodeSchema)
    .mutation(async ({ ctx, input }) => {
      const limited = referralApplyLimiter(`referral-apply:${ctx.user.id}`);
      if (!limited.ok) {
        throw new TRPCError({
          code: "TOO_MANY_REQUESTS",
          message: "Too many invite attempts. Try again in a few minutes.",
        });
      }
      return applyReferralCode(ctx.prisma, {
        refereeUserId: ctx.user.id,
        code: input.code,
        ...(input.deviceHash !== undefined
          ? { deviceHash: input.deviceHash }
          : {}),
      });
    }),
});
