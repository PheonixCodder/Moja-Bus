import type { Prisma, PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import { evaluateCheckoutDiscounts } from "../engine";
import type { QuoteResult } from "../engine/types";
import type {
  EvalCampaign,
  EvalCoupon,
  EvalCreditLot,
  EvalVoucher,
} from "../engine/types";
import {
  countCompletedBookings,
  loadActiveCampaignsForCheckout,
  loadCouponByCode,
  loadUserCreditLots,
  loadUserVoucher,
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
    voucher: EvalVoucher | null;
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
          camp.redemptionCountGlobal = Math.max(0, camp.redemptionCountGlobal - 1);
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
    if (r.voucherId && state.voucher?.id === r.voucherId) {
      const snap = r.snapshotJson as { voucherAppliedXOF?: number } | null;
      const amount =
        (snap?.voucherAppliedXOF ?? 0) +
        r.ticketDiscountXOF +
        r.feeDiscountXOF;
      state.voucher.reservedAmountXOF = Math.max(
        0,
        state.voucher.reservedAmountXOF - amount,
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
  monetaryVoucherId?: string | undefined;
  autoApply?: boolean | undefined;
  useCredits?: boolean | undefined;
  creditAmountXOF?: number | undefined;
  /** When true, invalid/ineligible codes throw (hold/pay). Preview leaves soft `ok: false`. */
  strict?: boolean | undefined;
  /**
   * Pending-pay / refreeze: treat this hold's own RESERVED instruments as available
   * so self-reservation does not zero out credits/vouchers/budget (P1-17 / Trace C).
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

  const [campaigns, completedBookingCount, coupon, voucher, creditLots, userRow] =
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
      input.monetaryVoucherId && input.userId
        ? loadUserVoucher(prisma, input.userId, input.monetaryVoucherId)
        : Promise.resolve(null),
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

  if (input.monetaryVoucherId && !voucher) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Voucher not found",
    });
  }

  // Mutable copies so we can credit back this hold's own reservations for quoting.
  const campaignsForEval = campaigns.map((c) => ({ ...c }));
  const couponForEval = coupon ? { ...coupon } : null;
  const voucherForEval = voucher ? { ...voucher } : null;
  const creditLotsForEval = creditLots.map((l) => ({ ...l }));

  if (input.excludeHoldGroupId) {
    await creditHoldSelfReservations(prisma, input.excludeHoldGroupId, {
      campaigns: campaignsForEval,
      coupon: couponForEval,
      voucher: voucherForEval,
      creditLots: creditLotsForEval,
    });
  }

  const quote = evaluateCheckoutDiscounts({
    ctx: {
      now,
      userId: input.userId ?? null,
      completedBookingCount,
      userAccountAgeDays,
      phone: userRow?.phoneNumber ?? null,
      companyId: input.offerCompanyId,
      routeId: input.routeId,
      scheduleId: input.scheduleId,
      tripId: input.tripId,
      seatCount: input.seatCount,
      baseFareXOF: input.baseFareXOF,
      preDiscountSubtotalXOF,
      convenienceFeeBps: input.convenienceFeeBps,
      waiveConvenienceFee: input.waiveConvenienceFee,
    },
    campaigns: campaignsForEval,
    code: input.code,
    coupon: couponForEval,
    autoApply: input.autoApply ?? true,
    monetaryVoucher: voucherForEval,
    creditLots: creditLotsForEval,
    useCredits: input.useCredits,
    creditAmountXOF: input.creditAmountXOF,
  });

  if (!quote.ok && input.code && input.strict) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: quote.rejection?.messageKey ?? "Invalid discount code",
    });
  }

  return quote;
}

type Tx = Prisma.TransactionClient;

export async function freezeDiscountOnHold(
  tx: Tx,
  input: {
    holdGroupId: string;
    userId: string | null;
    companyId: string;
    quote: QuoteResult;
    deviceHash?: string | null | undefined;
    basePricing: {
      distanceKm: number | null;
      commissionBps: number;
      convenienceFeeBps: number;
      baseFareXOF: number;
      seatCount: number;
      commissionXOF: number;
      operatorNetXOF: number;
      platformGrossXOF: number;
    };
  },
): Promise<void> {
  const q = input.quote;
  const postSub = q.postDiscountSubtotalXOF;
  const commissionBase =
    q.platformFundedXOF > 0 && q.operatorFundedXOF === 0
      ? q.preDiscountSubtotalXOF
      : postSub;
  // Recompute commission/net using funding rules from plan:
  // OPERATOR funding -> commission on post; PLATFORM -> commission on pre (operator kept whole)
  // HYBRID -> commission on pre, operator net reduced by operatorFunded
  const commissionXOF = Math.round(
    (commissionBase * input.basePricing.commissionBps) / 10_000,
  );
  let operatorNetXOF: number;
  if (q.operatorFundedXOF > 0 && q.platformFundedXOF > 0) {
    operatorNetXOF =
      q.preDiscountSubtotalXOF - commissionXOF - q.operatorFundedXOF;
  } else if (q.platformFundedXOF > 0 && q.operatorFundedXOF === 0) {
    operatorNetXOF = q.preDiscountSubtotalXOF - commissionXOF;
  } else {
    operatorNetXOF = postSub - commissionXOF;
  }
  const platformGrossXOF =
    commissionXOF + q.convenienceFeeXOF + q.platformFundedXOF;

  await tx.pricingSnapshot.create({
    data: {
      holdGroupId: input.holdGroupId,
      distanceKm: input.basePricing.distanceKm,
      commissionBps: input.basePricing.commissionBps,
      convenienceFeeBps: input.basePricing.convenienceFeeBps,
      baseFareXOF: input.basePricing.baseFareXOF,
      seatCount: input.basePricing.seatCount,
      subtotalBaseXOF: postSub,
      convenienceFeeXOF: q.convenienceFeeXOF,
      chargeAmountXOF: q.chargeAmountXOF,
      commissionXOF,
      operatorNetXOF,
      platformGrossXOF,
      ticketDiscountXOF: q.ticketDiscountXOF,
      feeDiscountXOF: q.feeDiscountXOF,
      creditAppliedXOF: q.creditAppliedXOF + q.voucherAppliedXOF,
      preDiscountSubtotalXOF: q.preDiscountSubtotalXOF,
      postDiscountSubtotalXOF: postSub,
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
        voucherId: inst.voucherId ?? null,
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
      const discountTotal = inst.ticketDiscountXOF + inst.feeDiscountXOF;
      if (discountTotal > 0) {
        // Serialize campaign row then conditionally reserve budget (P1-19 / P2-7).
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
    if (inst.voucherId) {
      const amount =
        (inst.voucherAppliedXOF ?? 0) +
        inst.ticketDiscountXOF +
        inst.feeDiscountXOF;
      if (amount > 0) {
        await tx.monetaryVoucher.update({
          where: { id: inst.voucherId },
          data: { reservedAmountXOF: { increment: amount } },
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
    if (r.voucherId) {
      const snap = r.snapshotJson as { voucherAppliedXOF?: number } | null;
      const amount =
        (snap?.voucherAppliedXOF ?? 0) +
        r.ticketDiscountXOF +
        r.feeDiscountXOF;
      if (amount > 0) {
        await tx.monetaryVoucher.update({
          where: { id: r.voucherId },
          data: { reservedAmountXOF: { decrement: amount } },
        });
      }
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
 * Re-quote and re-freeze discounts on an active hold (pending pay).
 * Releases prior RESERVED instruments, then writes a fresh snapshot + reserves.
 */
export async function refreezeHoldDiscounts(
  prisma: PrismaClient,
  input: {
    holdGroupId: string;
    userId: string;
    code?: string | undefined;
    monetaryVoucherId?: string | undefined;
    autoApply?: boolean | undefined;
    useCredits?: boolean | undefined;
    creditAmountXOF?: number | undefined;
    deviceHash?: string | null | undefined;
    waiveConvenienceFee?: boolean | undefined;
  },
): Promise<QuoteResult> {
  const hold = await prisma.holdGroup.findUnique({
    where: { id: input.holdGroupId },
    include: {
      pricingSnapshot: true,
      bookings: { select: { id: true, status: true } },
      trip: {
        select: {
          id: true,
          scheduleId: true,
          companyId: true,
          schedule: { select: { routeId: true, route: { select: { distanceKm: true } } } },
        },
      },
    },
  });

  if (!hold || hold.status !== "ACTIVE") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Hold is not active",
    });
  }
  if (hold.userId && hold.userId !== input.userId) {
    throw new TRPCError({ code: "FORBIDDEN", message: "Hold access denied" });
  }
  if (hold.holdExpiresAt.getTime() <= Date.now()) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Hold has expired" });
  }
  if (!hold.offerId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Hold is missing offer reference",
    });
  }

  const seatCount = hold.seatCount;
  const baseFareXOF = hold.baseFareXOF;
  const { loadPlatformSettings, resolvePricing } = await import(
    "@/features/payments/lib/pricing-resolver"
  );
  const { settings, tiers } = await loadPlatformSettings(prisma);
  const basePricing = resolvePricing({
    baseFareXOF,
    seatCount,
    distanceKm: hold.trip.schedule?.route.distanceKm ?? null,
    settings,
    tiers,
  });

  // Quote while treating this hold's reservations as available (Trace C / P1-17).
  const quote = await quoteCheckoutDiscounts(prisma, {
    offerCompanyId: hold.companyId,
    routeId: hold.trip.schedule?.routeId ?? null,
    scheduleId: hold.trip.scheduleId ?? null,
    tripId: hold.trip.id,
    baseFareXOF,
    seatCount,
    convenienceFeeBps: basePricing.convenienceFeeBps,
    waiveConvenienceFee: input.waiveConvenienceFee,
    userId: input.userId,
    code: input.code,
    monetaryVoucherId: input.monetaryVoucherId,
    autoApply: input.autoApply ?? true,
    useCredits: input.useCredits ?? true,
    creditAmountXOF: input.creditAmountXOF,
    strict: true,
    excludeHoldGroupId: hold.id,
  });

  await prisma.$transaction(async (tx) => {
    await releaseDiscountReservations(tx, hold.id);

    const existingSnapshot = await tx.pricingSnapshot.findUnique({
      where: { holdGroupId: hold.id },
    });
    if (existingSnapshot) {
      await tx.pricingSnapshot.delete({ where: { holdGroupId: hold.id } });
    }

    await freezeDiscountOnHold(tx, {
      holdGroupId: hold.id,
      userId: input.userId,
      companyId: hold.companyId,
      quote,
      deviceHash: input.deviceHash ?? null,
      basePricing: {
        distanceKm: basePricing.distanceKm,
        commissionBps: basePricing.commissionBps,
        convenienceFeeBps: basePricing.convenienceFeeBps,
        baseFareXOF: basePricing.baseFareXOF,
        seatCount: basePricing.seatCount,
        commissionXOF: basePricing.commissionXOF,
        operatorNetXOF: basePricing.operatorNetXOF,
        platformGrossXOF: basePricing.platformGrossXOF,
      },
    });
  });

  return quote;
}

export async function finalizeDiscountRedemptions(
  tx: Tx,
  holdGroupId: string,
): Promise<{ exhaustedCampaignIds: string[] }> {
  const redemptions = await tx.discountRedemption.findMany({
    where: { holdGroupId, status: "RESERVED" },
  });

  const exhaustedCampaignIds: string[] = [];

  for (const r of redemptions) {
    const discountTotal = r.ticketDiscountXOF + r.feeDiscountXOF;
    if (r.campaignId && discountTotal > 0) {
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
    if (r.voucherId) {
      const snap = r.snapshotJson as { voucherAppliedXOF?: number } | null;
      const amount =
        (snap?.voucherAppliedXOF ?? 0) +
        r.ticketDiscountXOF +
        r.feeDiscountXOF;
      const voucher = await tx.monetaryVoucher.findUniqueOrThrow({
        where: { id: r.voucherId },
      });
      const remaining = Math.max(0, voucher.remainingAmountXOF - amount);
      await tx.monetaryVoucher.update({
        where: { id: r.voucherId },
        data: {
          reservedAmountXOF: { decrement: amount },
          remainingAmountXOF: remaining,
          status:
            remaining === 0
              ? "REDEEMED"
              : remaining < voucher.originalAmountXOF
                ? "PARTIALLY_REDEEMED"
                : "ACTIVE",
        },
      });
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

  // P1-6: vouchers flagged expiresOnFirstCompletedBooking expire on first confirm.
  const hold = await tx.holdGroup.findUnique({
    where: { id: holdGroupId },
    select: { userId: true },
  });
  if (hold?.userId) {
    await tx.monetaryVoucher.updateMany({
      where: {
        userId: hold.userId,
        expiresOnFirstCompletedBooking: true,
        status: { in: ["ACTIVE", "PARTIALLY_REDEEMED"] },
      },
      data: { status: "EXPIRED" },
    });
  }

  return { exhaustedCampaignIds: [...new Set(exhaustedCampaignIds)] };
}

/** Fire-and-forget budget exhaustion emails after a successful confirm. */
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
      ownerType: true,
      companyId: true,
      createdByUserId: true,
    },
  });

  const { notifyCampaignBudgetExhausted } = await import("./notify");

  for (const campaign of campaigns) {
    const recipients: Array<{
      userId: string;
      email?: string | null;
      fullName?: string | null;
    }> = [];

    if (campaign.createdByUserId) {
      const creator = await prisma.user.findUnique({
        where: { id: campaign.createdByUserId },
        select: { id: true, email: true, fullName: true },
      });
      if (creator) {
        recipients.push({
          userId: creator.id,
          email: creator.email,
          fullName: creator.fullName,
        });
      }
    }

    if (campaign.ownerType === "OPERATOR" && campaign.companyId) {
      const owners = await prisma.operator.findMany({
        where: {
          companyId: campaign.companyId,
          role: { in: ["OWNER", "ADMIN", "MANAGER"] },
          isActive: true,
          deletedAt: null,
        },
        include: {
          user: { select: { id: true, email: true, fullName: true } },
        },
      });
      for (const m of owners) {
        recipients.push({
          userId: m.user.id,
          email: m.user.email,
          fullName: m.user.fullName,
        });
      }
    }

    const unique = new Map(recipients.map((r) => [r.userId, r]));
    notifyCampaignBudgetExhausted({
      recipients: [...unique.values()],
      campaignId: campaign.id,
      campaignName: campaign.name,
      budgetXOF: campaign.budgetXOF ?? 0,
    });
  }
}
