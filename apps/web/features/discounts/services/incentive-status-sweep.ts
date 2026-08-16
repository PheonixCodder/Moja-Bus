import type { PrismaClient } from "@moja/db";

/**
 * Mark expired CreditLots / MonetaryVouchers and advance campaign windows (P2-8, P2-22).
 */
export async function sweepIncentiveStatuses(
  prisma: PrismaClient,
  input: { now?: Date; limit?: number } = {},
): Promise<{
  lotsExpired: number;
  vouchersExpired: number;
  campaignsActivated: number;
  campaignsEnded: number;
}> {
  const now = input.now ?? new Date();
  const limit = input.limit ?? 500;

  const lots = await prisma.creditLot.updateMany({
    where: {
      status: { in: ["ACTIVE", "PARTIALLY_REDEEMED", "PENDING"] },
      expiresAt: { lt: now },
    },
    data: { status: "EXPIRED" },
  });

  const vouchers = await prisma.monetaryVoucher.updateMany({
    where: {
      status: { in: ["ACTIVE", "PARTIALLY_REDEEMED"] },
      expiresAt: { lt: now },
    },
    data: { status: "EXPIRED" },
  });

  // SCHEDULED → ACTIVE when window starts
  const activated = await prisma.discountCampaign.updateMany({
    where: {
      status: "SCHEDULED",
      OR: [{ startsAt: null }, { startsAt: { lte: now } }],
      AND: [{ OR: [{ endsAt: null }, { endsAt: { gte: now } }] }],
    },
    data: { status: "ACTIVE" },
  });

  // ACTIVE → EXPIRED when window ends (not PAUSED/EXHAUSTED)
  const ended = await prisma.discountCampaign.updateMany({
    where: {
      status: "ACTIVE",
      endsAt: { lt: now },
    },
    data: { status: "EXPIRED" },
  });

  void limit;
  return {
    lotsExpired: lots.count,
    vouchersExpired: vouchers.count,
    campaignsActivated: activated.count,
    campaignsEnded: ended.count,
  };
}
