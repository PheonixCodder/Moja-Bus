import type { PrismaClient } from "@moja/db";
import {
  notifyCreditExpiring,
  notifyVoucherExpiring,
} from "./notify";

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Notify passengers whose vouchers/credits expire within ~7 days.
 * Uses transactionId with date so Novu dedupes to ~once per day per instrument.
 */
export async function processExpiringIncentiveReminders(
  prisma: PrismaClient,
  options?: { withinDays?: number; limit?: number },
): Promise<{ vouchersNotified: number; creditsNotified: number }> {
  const withinDays = options?.withinDays ?? 7;
  const limit = options?.limit ?? 200;
  const now = new Date();
  const horizon = new Date(now.getTime() + withinDays * DAY_MS);

  const [vouchers, credits] = await Promise.all([
    prisma.monetaryVoucher.findMany({
      where: {
        status: { in: ["ACTIVE", "PARTIALLY_REDEEMED"] },
        remainingAmountXOF: { gt: 0 },
        expiresAt: { gt: now, lte: horizon },
      },
      take: limit,
      orderBy: { expiresAt: "asc" },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    }),
    prisma.creditLot.findMany({
      where: {
        status: { in: ["ACTIVE", "PARTIALLY_REDEEMED"] },
        remainingXOF: { gt: 0 },
        expiresAt: { gt: now, lte: horizon },
      },
      take: limit,
      orderBy: { expiresAt: "asc" },
      include: {
        user: { select: { id: true, email: true, fullName: true } },
      },
    }),
  ]);

  for (const v of vouchers) {
    if (!v.expiresAt) continue;
    notifyVoucherExpiring({
      user: {
        userId: v.user.id,
        email: v.user.email,
        fullName: v.user.fullName,
      },
      voucherId: v.id,
      amountXOF: v.remainingAmountXOF,
      expiresAt: v.expiresAt,
    });
  }

  for (const c of credits) {
    if (!c.expiresAt) continue;
    notifyCreditExpiring({
      user: {
        userId: c.user.id,
        email: c.user.email,
        fullName: c.user.fullName,
      },
      creditLotId: c.id,
      amountXOF: c.remainingXOF,
      expiresAt: c.expiresAt,
    });
  }

  return {
    vouchersNotified: vouchers.length,
    creditsNotified: credits.length,
  };
}
