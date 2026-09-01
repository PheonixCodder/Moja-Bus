import type { PrismaClient } from "@moja/db";
import { AccountingEngine, FinancialAccountService } from "@moja/db";

/**
 * Mark expired CreditLots, reverse unspent balances on double-entry ledger,
 * and advance campaign windows.
 */
export async function sweepIncentiveStatuses(
  prisma: PrismaClient,
  input: { now?: Date; limit?: number } = {},
): Promise<{
  lotsExpired: number;
  campaignsActivated: number;
  campaignsEnded: number;
}> {
  const now = input.now ?? new Date();
  const limit = input.limit ?? 500;

  const expiredLots = await prisma.creditLot.findMany({
    where: {
      status: { in: ["ACTIVE", "PARTIALLY_REDEEMED", "PENDING"] },
      expiresAt: { lt: now },
    },
    take: limit,
  });

  const accountService = new FinancialAccountService(prisma as any);
  let expiredCount = 0;

  for (const lot of expiredLots) {
    try {
      await prisma.$transaction(async (tx) => {
        if (lot.remainingXOF > 0) {
          const userPromoAcct =
            await accountService.getUserPromoCreditsAccount(lot.userId);
          const promoExpenseAcct =
            await accountService.getPlatformPromoExpenseAccount();

          const engine = new AccountingEngine("PROMO_EXPIRE", {
            description: `Expire unspent promo credit lot ${lot.id}`,
            idempotencyKey: `EXPIRED_LOT_${lot.id}`,
            metadata: {
              lotId: lot.id,
              userId: lot.userId,
              remainingXOF: lot.remainingXOF,
            },
          });

          engine.addDebit({
            accountId: userPromoAcct.id,
            amount: lot.remainingXOF,
            sequenceNumber: 1,
            referenceType: "CREDIT_LOT",
            referenceId: lot.id,
            description: "Debit expired unspent promo credits",
          });

          engine.addCredit({
            accountId: promoExpenseAcct.id,
            amount: lot.remainingXOF,
            sequenceNumber: 2,
            referenceType: "CREDIT_LOT",
            referenceId: lot.id,
            description: "Reversal of platform promo expense on expiry",
          });

          engine.validate();
          await engine.commit(tx as any);
        }

        await tx.creditLot.update({
          where: { id: lot.id },
          data: { status: "EXPIRED", remainingXOF: 0 },
        });

        expiredCount++;
      });
    } catch (err: any) {
      if (err?.code === "P2002") {
        // Idempotent duplicate commit
        continue;
      }
      console.error(`Failed to expire credit lot ${lot.id}:`, err);
    }
  }

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

  return {
    lotsExpired: expiredCount,
    campaignsActivated: activated.count,
    campaignsEnded: ended.count,
  };
}

