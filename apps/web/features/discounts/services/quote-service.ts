import type { Prisma, PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import { companyOperatorRecipients } from "@/features/notifications/company-recipients";
import { enqueueCampaignBudgetExhausted } from "@/features/notifications/outbox/campaigns";
import { evaluateCheckoutDiscounts } from "../engine";
import type {
  EvalCampaign,
  EvalCoupon,
  EvalCreditLot,
  QuoteResult,
} from "../engine/types";
import {
  countCompletedBookings,
  loadActiveCampaignsForCheckout,
  loadCouponByCode,
  loadUserCreditLots,
} from "./campaign-loader";

/**
 * Credit back this hold's RESERVED amounts so availability ignores self-reservation.
 */
async function creditHoldSelfReservations(
  prisma: PrismaClient,
  holdGroupId: string,
  state: {
    campaigns: EvalCampaign[];
    coupon: EvalCoupon | null;
    creditLots: EvalCreditLot[];
  },
): Promise<void> {
  const redemptions = await prisma.discountRedemption.findMany({
    where: { holdGroupId, status: "RESERVED" },
  });

  for (const r of redemptions) {
    if (r.campaignId) {
      const camp = state.campaigns.find((c) => c.id === r.campaignId);
      if (camp) {
        const amount = r.ticketDiscountXOF + r.feeDiscountXOF;
        camp.budgetReservedXOF = Math.max(0, camp.budgetReservedXOF - amount);
        if (camp.redemptionCountGlobal != null) {
          camp.redemptionCountGlobal = Math.max(
            0,
            camp.redemptionCountGlobal - 1,
          );
        }
        if (camp.redemptionCountForUser != null) {
          camp.redemptionCountForUser = Math.max(
            0,
            camp.redemptionCountForUser - 1,
          );
        }
        if (camp.redemptionCountForPhone != null) {
          camp.redemptionCountForPhone = Math.max(
            0,
            camp.redemptionCountForPhone - 1,
          );
        }
      }
    }
    if (r.couponCodeId && state.coupon?.id === r.couponCodeId) {
      state.coupon.redemptionCount = Math.max(
        0,
        state.coupon.redemptionCount - 1,
      );
    }
    if (r.creditLotId && r.creditAppliedXOF > 0) {
      const lot = state.creditLots.find((l) => l.id === r.creditLotId);
      if (lot) {
        lot.reservedXOF = Math.max(0, lot.reservedXOF - r.creditAppliedXOF);
      }
    }
  }
}

export type CheckoutDiscountParams = {
  offerCompanyId: string;
  routeId: string | null;
  scheduleId: string | null;
  tripId: string;
  baseFareXOF: number;
  seatCount: number;
  convenienceFeeBps: number;
  waiveConvenienceFee?: boolean | undefined;
  userId?: string | null | undefined;
  code?: string | undefined;
  autoApply?: boolean | undefined;
  useCredits?: boolean | undefined;
  creditAmountXOF?: number | undefined;
  /** When true, invalid/ineligible codes throw (hold/pay). Preview leaves soft `ok: false`. */
  strict?: boolean | undefined;
  /**
   * Pending-pay / refreeze: treat this hold's own RESERVED instruments as available
   * so self-reservation does not zero out credits/budget.
   */
  excludeHoldGroupId?: string | null | undefined;
};

export async function quoteCheckoutDiscounts(
  prisma: PrismaClient,
  input: CheckoutDiscountParams,
): Promise<QuoteResult> {
  const preDiscountSubtotalXOF = input.baseFareXOF * input.seatCount;

  const now = new Date();
  const userRowPromise = input.userId
    ? prisma.user.findUnique({
        where: { id: input.userId },
        select: { phoneNumber: true, createdAt: true },
      })
    : Promise.resolve(null);

  const [campaigns, completedBookingCount, coupon, creditLots, userRow] =
    await Promise.all([
      userRowPromise.then((user) =>
        loadActiveCampaignsForCheckout(prisma, {
          companyId: input.offerCompanyId,
          userId: input.userId ?? null,
          phone: user?.phoneNumber ?? null,
          now,
        }),
      ),
      countCompletedBookings(prisma, input.userId ?? null),
      input.code ? loadCouponByCode(prisma, input.code) : Promise.resolve(null),
      input.userId && input.useCredits !== false
        ? loadUserCreditLots(prisma, input.userId)
        : Promise.resolve([]),
      userRowPromise,
    ]);

  const userAccountAgeDays =
    userRow?.createdAt != null
      ? Math.floor(
          (now.getTime() - userRow.createdAt.getTime()) / (24 * 60 * 60 * 1000),
        )
      : null;

  // Mutable copies so we can credit back this hold's own reservations for quoting.
  const campaignsForEval = campaigns.map((c) => ({ ...c }));
  const couponForEval = coupon ? { ...coupon } : null;
  const creditLotsForEval = creditLots.map((l) => ({ ...l }));

  if (input.excludeHoldGroupId) {
    await creditHoldSelfReservations(prisma, input.excludeHoldGroupId, {
      campaigns: campaignsForEval,
      coupon: couponForEval,
      creditLots: creditLotsForEval,
    });
  }

  const result = evaluateCheckoutDiscounts({
    ctx: {
      now,
      companyId: input.offerCompanyId,
      routeId: input.routeId,
      scheduleId: input.scheduleId,
      tripId: input.tripId,
      seatCount: input.seatCount,
      baseFareXOF: input.baseFareXOF,
      preDiscountSubtotalXOF,
      convenienceFeeBps: input.convenienceFeeBps,
      waiveConvenienceFee: input.waiveConvenienceFee,
      userId: input.userId ?? null,
      phone: userRow?.phoneNumber ?? null,
      completedBookingCount,
      userAccountAgeDays,
    },
    campaigns: campaignsForEval,
    code: input.code,
    coupon: couponForEval,
    autoApply: input.autoApply,
    creditLots: creditLotsForEval,
    useCredits: input.useCredits,
    creditAmountXOF: input.creditAmountXOF,
  });

  if (input.strict && !result.ok && result.rejection) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: result.rejection.code,
    });
  }

  return result;
}

type Tx = Prisma.TransactionClient;

export type HoldGroupDiscountReserveInput = {
  holdGroupId: string;
  userId: string | null;
  companyId: string;
  deviceHash?: string | null | undefined;
  quote: QuoteResult;
};

/**
 * Persists RESERVED discount_redemption rows and atomically decrements/reserves
 * campaign budget, coupon code max, and credit lots inside the hold transaction.
 */
export async function reserveDiscountOnHold(
  tx: Tx,
  input: HoldGroupDiscountReserveInput,
): Promise<void> {
  const q = input.quote;

  const postSub = q.preDiscountSubtotalXOF - q.ticketDiscountXOF;

  const existingSnapshot = await tx.pricingSnapshot.findUnique({
    where: { holdGroupId: input.holdGroupId },
  });
  const effectiveOperatorNetXOF = existingSnapshot
    ? Math.max(0, existingSnapshot.operatorNetXOF - q.operatorFundedXOF)
    : undefined;

  await tx.pricingSnapshot.updateMany({
    where: { holdGroupId: input.holdGroupId },
    data: {
      ticketDiscountXOF: q.ticketDiscountXOF,
      feeDiscountXOF: q.feeDiscountXOF,
      creditAppliedXOF: q.creditAppliedXOF,
      preDiscountSubtotalXOF: q.preDiscountSubtotalXOF,
      postDiscountSubtotalXOF: postSub,
      chargeAmountXOF: q.chargeAmountXOF,
      convenienceFeeXOF: Math.max(0, q.convenienceFeeXOF - q.feeDiscountXOF),
      ...(effectiveOperatorNetXOF !== undefined
        ? { operatorNetXOF: effectiveOperatorNetXOF }
        : {}),
      platformPromoFundedXOF: q.platformFundedXOF,
      operatorPromoFundedXOF: q.operatorFundedXOF,
      discountBreakdownJson: q as unknown as Prisma.InputJsonValue,
    },
  });

  for (const inst of q.instruments) {
    await tx.discountRedemption.create({
      data: {
        holdGroupId: input.holdGroupId,
        userId: input.userId,
        status: "RESERVED",
        instrumentType: inst.instrumentType,
        campaignId: inst.campaignId ?? null,
        couponCodeId: inst.couponCodeId ?? null,
        creditLotId: inst.creditLotId ?? null,
        ticketDiscountXOF: inst.ticketDiscountXOF,
        feeDiscountXOF: inst.feeDiscountXOF,
        creditAppliedXOF: inst.creditAppliedXOF,
        fundingType: inst.fundingType ?? null,
        platformFundedXOF: inst.platformFundedXOF,
        operatorFundedXOF: inst.operatorFundedXOF,
        companyId: input.companyId,
        deviceHash: input.deviceHash ?? null,
        snapshotJson: inst as unknown as Prisma.InputJsonValue,
      },
    });

    if (inst.campaignId) {
      if (input.userId) {
        const campaignMeta = await tx.discountCampaign.findUnique({
          where: { id: inst.campaignId },
          select: { maxRedemptionsPerUser: true },
        });
        if (campaignMeta?.maxRedemptionsPerUser != null) {
          const userActiveCount = await tx.discountRedemption.count({
            where: {
              campaignId: inst.campaignId,
              userId: input.userId,
              status: { in: ["RESERVED", "FINALIZED"] },
              holdGroupId: { not: input.holdGroupId },
            },
          });
          if (userActiveCount >= campaignMeta.maxRedemptionsPerUser) {
            throw new TRPCError({
              code: "CONFLICT",
              message: "User redemption limit reached for this campaign.",
            });
          }
        }
      }

      const discountTotal = inst.ticketDiscountXOF + inst.feeDiscountXOF;
      if (discountTotal > 0) {
        // Serialize campaign row then conditionally reserve budget.
        await tx.$queryRaw`
          SELECT id FROM "discount_campaign" WHERE id = ${inst.campaignId} FOR UPDATE
        `;
        const reserved = await tx.$executeRaw`
          UPDATE "discount_campaign"
          SET "budgetReservedXOF" = "budgetReservedXOF" + ${discountTotal}
          WHERE id = ${inst.campaignId}
            AND (
              "budgetXOF" IS NULL
              OR ("budgetConsumedXOF" + "budgetReservedXOF" + ${discountTotal}) <= "budgetXOF"
            )
        `;
        if (reserved === 0) {
          throw new TRPCError({
            code: "CONFLICT",
            message: "Campaign budget exhausted. Try a different offer.",
          });
        }
      }
    }
    if (inst.couponCodeId) {
      const couponReserved = await tx.$executeRaw`
        UPDATE "coupon_code"
        SET "redemptionCount" = "redemptionCount" + 1
        WHERE id = ${inst.couponCodeId}
          AND (
            "maxRedemptions" IS NULL
            OR "redemptionCount" < "maxRedemptions"
          )
      `;
      if (couponReserved === 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Promo code has no redemptions left.",
        });
      }
    }
    if (inst.creditLotId && inst.creditAppliedXOF > 0) {
      await tx.creditLot.update({
        where: { id: inst.creditLotId },
        data: { reservedXOF: { increment: inst.creditAppliedXOF } },
      });
    }
  }
}

export async function releaseDiscountReservations(
  tx: Tx,
  holdGroupId: string,
): Promise<void> {
  const redemptions = await tx.discountRedemption.findMany({
    where: { holdGroupId, status: "RESERVED" },
  });

  for (const r of redemptions) {
    if (r.campaignId) {
      const amount = r.ticketDiscountXOF + r.feeDiscountXOF;
      if (amount > 0) {
        await tx.discountCampaign.update({
          where: { id: r.campaignId },
          data: {
            budgetReservedXOF: { decrement: amount },
          },
        });
      }
    }
    if (r.couponCodeId) {
      await tx.couponCode.update({
        where: { id: r.couponCodeId },
        data: { redemptionCount: { decrement: 1 } },
      });
    }
    if (r.creditLotId && r.creditAppliedXOF > 0) {
      await tx.creditLot.update({
        where: { id: r.creditLotId },
        data: { reservedXOF: { decrement: r.creditAppliedXOF } },
      });
    }
  }

  await tx.discountRedemption.updateMany({
    where: { holdGroupId, status: "RESERVED" },
    data: { status: "CANCELLED" },
  });
}

/**
 * Re-quotes and replaces discount reservations on an active hold (e.g. pending-pay flow).
 */
export async function refreezeHoldDiscounts(
  prisma: PrismaClient,
  input: {
    holdGroupId: string;
    userId: string;
    code?: string | undefined;
    autoApply?: boolean | undefined;
    useCredits?: boolean | undefined;
    creditAmountXOF?: number | undefined;
    waiveConvenienceFee?: boolean | undefined;
    deviceHash?: string | undefined;
  },
): Promise<QuoteResult> {
  const holdGroup = await prisma.holdGroup.findUniqueOrThrow({
    where: { id: input.holdGroupId },
    include: {
      trip: {
        include: {
          schedule: true,
        },
      },
      pricingSnapshot: true,
      bookings: true,
    },
  });

  return prisma.$transaction(async (tx) => {
    // Release existing RESERVED redemptions on this hold
    const existing = await tx.discountRedemption.findMany({
      where: { holdGroupId: input.holdGroupId, status: "RESERVED" },
    });

    for (const r of existing) {
      if (r.campaignId) {
        const discountTotal = r.ticketDiscountXOF + r.feeDiscountXOF;
        await tx.discountCampaign.update({
          where: { id: r.campaignId },
          data: { budgetReservedXOF: { decrement: discountTotal } },
        });
      }
      if (r.creditLotId && r.creditAppliedXOF > 0) {
        await tx.creditLot.update({
          where: { id: r.creditLotId },
          data: { reservedXOF: { decrement: r.creditAppliedXOF } },
        });
      }
    }

    await tx.discountRedemption.deleteMany({
      where: { holdGroupId: input.holdGroupId, status: "RESERVED" },
    });

    const quote = await quoteCheckoutDiscounts(tx as unknown as PrismaClient, {
      offerCompanyId: holdGroup.companyId,
      routeId: holdGroup.trip.schedule?.routeId ?? null,
      scheduleId: holdGroup.trip.scheduleId ?? null,
      tripId: holdGroup.tripId,
      baseFareXOF: holdGroup.baseFareXOF,
      seatCount: holdGroup.seatCount,
      convenienceFeeBps: holdGroup.pricingSnapshot?.convenienceFeeBps ?? 250,
      waiveConvenienceFee: input.waiveConvenienceFee ?? false,
      userId: input.userId,
      code: input.code,
      autoApply: input.autoApply,
      useCredits: input.useCredits,
      creditAmountXOF: input.creditAmountXOF,
      excludeHoldGroupId: input.holdGroupId,
    });

    if (quote.instruments.length > 0) {
      await reserveDiscountOnHold(tx, {
        holdGroupId: input.holdGroupId,
        userId: input.userId,
        companyId: holdGroup.companyId,
        deviceHash: input.deviceHash ?? null,
        quote,
      });
    } else {
      const preDiscountSubtotalXOF =
        holdGroup.baseFareXOF * holdGroup.seatCount;
      await tx.pricingSnapshot.updateMany({
        where: { holdGroupId: input.holdGroupId },
        data: {
          ticketDiscountXOF: 0,
          feeDiscountXOF: 0,
          creditAppliedXOF: 0,
          preDiscountSubtotalXOF,
          postDiscountSubtotalXOF: preDiscountSubtotalXOF,
          platformPromoFundedXOF: 0,
          operatorPromoFundedXOF: 0,
          discountBreakdownJson: quote as unknown as Prisma.InputJsonValue,
        },
      });
    }

    return quote;
  });
}

/**
 * Re-quotes and replaces discount reservations on an active hold (for routers).
 */
export async function requoteAndRefreezeHoldGroupDiscounts(
  prisma: PrismaClient,
  input: {
    holdGroupId: string;
    offerCompanyId: string;
    routeId?: string | null;
    scheduleId?: string | null;
    tripId: string;
    baseFareXOF: number;
    seatCount: number;
    convenienceFeeBps: number;
    userId: string;
    code?: string | undefined;
    autoApply?: boolean | undefined;
    useCredits?: boolean | undefined;
    creditAmountXOF?: number | undefined;
    deviceHash?: string | undefined;
  },
): Promise<QuoteResult> {
  return prisma.$transaction(async (tx) => {
    // Release existing RESERVED redemptions on this hold
    const existing = await tx.discountRedemption.findMany({
      where: { holdGroupId: input.holdGroupId, status: "RESERVED" },
    });

    for (const r of existing) {
      if (r.campaignId) {
        const discountTotal = r.ticketDiscountXOF + r.feeDiscountXOF;
        await tx.discountCampaign.update({
          where: { id: r.campaignId },
          data: { budgetReservedXOF: { decrement: discountTotal } },
        });
      }
      if (r.creditLotId && r.creditAppliedXOF > 0) {
        await tx.creditLot.update({
          where: { id: r.creditLotId },
          data: { reservedXOF: { decrement: r.creditAppliedXOF } },
        });
      }
    }

    await tx.discountRedemption.deleteMany({
      where: { holdGroupId: input.holdGroupId, status: "RESERVED" },
    });

    const quote = await quoteCheckoutDiscounts(tx as unknown as PrismaClient, {
      offerCompanyId: input.offerCompanyId,
      routeId: input.routeId ?? null,
      scheduleId: input.scheduleId ?? null,
      tripId: input.tripId,
      baseFareXOF: input.baseFareXOF,
      seatCount: input.seatCount,
      convenienceFeeBps: input.convenienceFeeBps,
      waiveConvenienceFee: false,
      userId: input.userId,
      code: input.code,
      autoApply: input.autoApply,
      useCredits: input.useCredits,
      creditAmountXOF: input.creditAmountXOF,
      excludeHoldGroupId: input.holdGroupId,
    });

    if (quote.instruments.length > 0) {
      await reserveDiscountOnHold(tx, {
        holdGroupId: input.holdGroupId,
        userId: input.userId,
        companyId: input.offerCompanyId,
        deviceHash: input.deviceHash ?? null,
        quote,
      });
    } else {
      const preDiscountSubtotalXOF = input.baseFareXOF * input.seatCount;
      await tx.pricingSnapshot.updateMany({
        where: { holdGroupId: input.holdGroupId },
        data: {
          ticketDiscountXOF: 0,
          feeDiscountXOF: 0,
          creditAppliedXOF: 0,
          preDiscountSubtotalXOF,
          postDiscountSubtotalXOF: preDiscountSubtotalXOF,
          platformPromoFundedXOF: 0,
          operatorPromoFundedXOF: 0,
          discountBreakdownJson: quote as unknown as Prisma.InputJsonValue,
        },
      });
    }

    return quote;
  });
}

/**
 * Transitions RESERVED discount redemptions to FINALIZED upon successful payment.
 */
export async function finalizeDiscountRedemptions(
  tx: Tx,
  holdGroupId: string,
): Promise<{ exhaustedCampaignIds: string[] }> {
  const redemptions = await tx.discountRedemption.findMany({
    where: { holdGroupId, status: "RESERVED" },
  });

  const exhaustedCampaignIds: string[] = [];

  for (const r of redemptions) {
    if (r.campaignId) {
      const discountTotal = r.ticketDiscountXOF + r.feeDiscountXOF;
      const campaign = await tx.discountCampaign.update({
        where: { id: r.campaignId },
        data: {
          budgetReservedXOF: { decrement: discountTotal },
          budgetConsumedXOF: { increment: discountTotal },
        },
        select: {
          id: true,
          budgetXOF: true,
          budgetConsumedXOF: true,
          budgetReservedXOF: true,
        },
      });
      if (
        campaign.budgetXOF != null &&
        campaign.budgetConsumedXOF + campaign.budgetReservedXOF >=
          campaign.budgetXOF
      ) {
        exhaustedCampaignIds.push(campaign.id);
      }
    }
    if (r.creditLotId && r.creditAppliedXOF > 0) {
      const lot = await tx.creditLot.findUniqueOrThrow({
        where: { id: r.creditLotId },
      });
      const remaining = Math.max(0, lot.remainingXOF - r.creditAppliedXOF);
      await tx.creditLot.update({
        where: { id: r.creditLotId },
        data: {
          reservedXOF: { decrement: r.creditAppliedXOF },
          remainingXOF: remaining,
          status:
            remaining === 0
              ? "REDEEMED"
              : remaining < lot.amountXOF
                ? "PARTIALLY_REDEEMED"
                : "ACTIVE",
        },
      });
    }
  }

  await tx.discountRedemption.updateMany({
    where: { holdGroupId, status: "RESERVED" },
    data: { status: "FINALIZED" },
  });

  return { exhaustedCampaignIds: [...new Set(exhaustedCampaignIds)] };
}

/** Fire-and-forget budget exhaustion alerts after a successful confirm. */
export async function notifyExhaustedCampaignBudgets(
  prisma: PrismaClient,
  campaignIds: string[],
): Promise<void> {
  if (campaignIds.length === 0) return;

  const campaigns = await prisma.discountCampaign.findMany({
    where: { id: { in: campaignIds } },
    select: {
      id: true,
      name: true,
      budgetXOF: true,
      company: { select: { id: true, name: true, email: true } },
    },
  });

  // Phase 22 (F-NF-07) — the audit's "console.log orphan": wiring existed but
  // only logged to stdout. Operators now get a durable outbox notice per
  // active operator, day-throttled (one reminder per exhausted-day; raising
  // the budget and re-exhausting re-alerts from the next day).
  for (const c of campaigns) {
    try {
      const operators = await companyOperatorRecipients(
        prisma,
        c.company?.id ?? "",
      );
      for (const op of operators) {
        await enqueueCampaignBudgetExhausted(prisma as never, {
          campaignId: c.id,
          to: op,
          campaignName: c.name,
          budgetXOF: c.budgetXOF ?? 0,
        });
      }
    } catch (err) {
      console.error("[CampaignBudgetExhausted] notify failed:", err);
    }
  }
}
