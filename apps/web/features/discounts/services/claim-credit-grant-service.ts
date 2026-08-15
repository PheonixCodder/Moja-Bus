import type { PrismaClient } from "@moja/db";
import { TRPCError } from "@trpc/server";

/**
 * Claim a WALLET_CREDIT_GRANT coupon: mint a PROMO_GRANT CreditLot.
 * Does not apply as a checkout ticket discount.
 */
export async function claimCreditGrant(
  prisma: PrismaClient,
  input: {
    userId: string;
    code: string;
    deviceHash?: string | null | undefined;
  },
): Promise<{
  creditLotId: string;
  amountXOF: number;
  expiresAt: Date | null;
}> {
  void input.deviceHash;
  const code = input.code.trim().toUpperCase();
  const coupon = await prisma.couponCode.findUnique({
    where: { code },
    include: { campaign: true },
  });

  if (!coupon || !coupon.isActive) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Invalid or inactive credit code",
    });
  }

  const campaign = coupon.campaign;
  if (campaign.status !== "ACTIVE") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Campaign is not active",
    });
  }
  if (campaign.benefitType !== "WALLET_CREDIT_GRANT") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "This code is not a promo credit grant",
    });
  }
  if (campaign.ownerType !== "PLATFORM") {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Only platform credit grants can be claimed",
    });
  }

  const now = new Date();
  if (campaign.startsAt && now < campaign.startsAt) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Campaign has not started",
    });
  }
  if (campaign.endsAt && now > campaign.endsAt) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Campaign has ended",
    });
  }
  if (coupon.expiresAt && now > coupon.expiresAt) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Code has expired",
    });
  }
  if (coupon.assignedUserId && coupon.assignedUserId !== input.userId) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Code is assigned to another traveler",
    });
  }
  if (
    coupon.maxRedemptions != null &&
    coupon.redemptionCount >= coupon.maxRedemptions
  ) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Code has no redemptions left",
    });
  }

  const amountXOF = campaign.amountXOF ?? 0;
  if (amountXOF <= 0) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: "Campaign has no credit amount configured",
    });
  }

  const grantIdempotencyKey = `promo-grant:${coupon.id}:${input.userId}`;
  const existing = await prisma.creditLot.findUnique({
    where: { grantIdempotencyKey },
  });
  if (existing) {
    return {
      creditLotId: existing.id,
      amountXOF: existing.amountXOF,
      expiresAt: existing.expiresAt,
    };
  }

  const campaignCoupons = await prisma.couponCode.findMany({
    where: { campaignId: campaign.id },
    select: { id: true },
  });
  const grantKeyPrefixes = campaignCoupons.map((c) => `promo-grant:${c.id}:`);

  if (campaign.maxRedemptionsGlobal != null) {
    const globalClaims = await prisma.creditLot.count({
      where: {
        source: "PROMO_GRANT",
        OR: grantKeyPrefixes.map((prefix) => ({
          grantIdempotencyKey: { startsWith: prefix },
        })),
      },
    });
    if (globalClaims >= campaign.maxRedemptionsGlobal) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "Campaign redemption cap reached",
      });
    }
  }

  if (campaign.maxRedemptionsPerUser != null) {
    const userClaims = await prisma.creditLot.count({
      where: {
        userId: input.userId,
        source: "PROMO_GRANT",
        OR: grantKeyPrefixes.map((prefix) => ({
          grantIdempotencyKey: { startsWith: prefix },
        })),
      },
    });
    if (userClaims >= campaign.maxRedemptionsPerUser) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: "You have already claimed the maximum for this campaign",
      });
    }
  }

  const expiresAt = coupon.expiresAt ?? campaign.endsAt ?? null;

  try {
    const lot = await prisma.$transaction(async (tx) => {
      const created = await tx.creditLot.create({
        data: {
          userId: input.userId,
          source: "PROMO_GRANT",
          status: "ACTIVE",
          amountXOF,
          remainingXOF: amountXOF,
          expiresAt,
          grantIdempotencyKey,
        },
      });

      const updated = await tx.couponCode.updateMany({
        where: {
          id: coupon.id,
          ...(coupon.maxRedemptions != null
            ? { redemptionCount: { lt: coupon.maxRedemptions } }
            : {}),
        },
        data: { redemptionCount: { increment: 1 } },
      });
      if (updated.count === 0) {
        throw new TRPCError({
          code: "BAD_REQUEST",
          message: "Code has no redemptions left",
        });
      }

      return created;
    });

    return {
      creditLotId: lot.id,
      amountXOF: lot.amountXOF,
      expiresAt: lot.expiresAt,
    };
  } catch (err) {
    if (err instanceof TRPCError) throw err;
    const raced = await prisma.creditLot.findUnique({
      where: { grantIdempotencyKey },
    });
    if (raced) {
      return {
        creditLotId: raced.id,
        amountXOF: raced.amountXOF,
        expiresAt: raced.expiresAt,
      };
    }
    throw err;
  }
}
