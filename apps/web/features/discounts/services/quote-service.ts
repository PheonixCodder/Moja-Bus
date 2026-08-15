import type { Prisma, PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";
import { evaluateCheckoutDiscounts } from "../engine";
import type { QuoteResult } from "../engine/types";
import {
  countCompletedBookings,
  loadActiveCampaignsForCheckout,
  loadCouponByCode,
  loadUserCreditLots,
  loadUserVoucher,
} from "./campaign-loader";

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
};

export async function quoteCheckoutDiscounts(
  prisma: PrismaClient,
  input: CheckoutDiscountParams,
): Promise<QuoteResult> {
  const preDiscountSubtotalXOF = input.baseFareXOF * input.seatCount;

  const now = new Date();
  const userPhonePromise = input.userId
    ? prisma.user.findUnique({
        where: { id: input.userId },
        select: { phoneNumber: true },
      })
    : Promise.resolve(null);

  const [campaigns, completedBookingCount, coupon, voucher, creditLots, userRow] =
    await Promise.all([
      userPhonePromise.then((user) =>
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
      userPhonePromise,
    ]);

  if (input.monetaryVoucherId && !voucher) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Voucher not found",
    });
  }

  const quote = evaluateCheckoutDiscounts({
    ctx: {
      now,
      userId: input.userId ?? null,
      completedBookingCount,
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
    campaigns,
    code: input.code,
    coupon,
    autoApply: input.autoApply ?? true,
    monetaryVoucher: voucher,
    creditLots,
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
      creditAppliedXOF: q.creditAppliedXOF,
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
        snapshotJson: inst as unknown as Prisma.InputJsonValue,
      },
    });

    if (inst.campaignId) {
      const discountTotal = inst.ticketDiscountXOF + inst.feeDiscountXOF;
      if (discountTotal > 0) {
        await tx.discountCampaign.update({
          where: { id: inst.campaignId },
          data: { budgetReservedXOF: { increment: discountTotal } },
        });
      }
    }
    if (inst.couponCodeId) {
      await tx.couponCode.update({
        where: { id: inst.couponCodeId },
        data: { redemptionCount: { increment: 1 } },
      });
    }
    if (inst.voucherId) {
      const amount = inst.ticketDiscountXOF + inst.feeDiscountXOF;
      await tx.monetaryVoucher.update({
        where: { id: inst.voucherId },
        data: { reservedAmountXOF: { increment: amount } },
      });
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
      const amount = r.ticketDiscountXOF + r.feeDiscountXOF;
      await tx.monetaryVoucher.update({
        where: { id: r.voucherId },
        data: { reservedAmountXOF: { decrement: amount } },
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
      const amount = discountTotal;
      const voucher = await tx.monetaryVoucher.findUniqueOrThrow({
        where: { id: r.voucherId },
      });
      const remaining = Math.max(
        0,
        voucher.remainingAmountXOF - amount,
      );
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
