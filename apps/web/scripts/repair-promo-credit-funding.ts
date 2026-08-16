/**
 * Dry-run / apply repair for ACTIVE promo credit lots underfunded vs ledger.
 *
 * Usage:
 *   pnpm exec tsx apps/web/scripts/repair-promo-credit-funding.ts --dry-run
 *   pnpm exec tsx apps/web/scripts/repair-promo-credit-funding.ts --apply
 *
 * Posts missing PROMO_CREDITS with idempotency REPAIR_PROMO_GRANT:{lotId}.
 */
import { PrismaClient } from "@moja/db";
import { postPromoCreditGrantLedger } from "../features/discounts/services/promo-credit-grant-ledger";

const dryRun = !process.argv.includes("--apply");

async function main() {
  const prisma = new PrismaClient();
  const lots = await prisma.creditLot.findMany({
    where: {
      status: { in: ["ACTIVE", "PARTIALLY_REDEEMED"] },
      remainingXOF: { gt: 0 },
      source: { in: ["ADMIN", "PROMO_GRANT", "REFERRAL"] },
    },
    select: {
      id: true,
      userId: true,
      remainingXOF: true,
      amountXOF: true,
      source: true,
      grantIdempotencyKey: true,
    },
  });

  const byUser = new Map<string, typeof lots>();
  for (const lot of lots) {
    const list = byUser.get(lot.userId) ?? [];
    list.push(lot);
    byUser.set(lot.userId, list);
  }

  let usersChecked = 0;
  let shortfallUsers = 0;
  let repairLots = 0;
  let repairXOF = 0;

  for (const [userId, userLots] of byUser) {
    usersChecked++;
    const lotRemaining = userLots.reduce((s, l) => s + l.remainingXOF, 0);
    const acct = await prisma.financialAccount.findFirst({
      where: {
        ownerType: "USER",
        ownerId: userId,
        accountClass: "PROMO_CREDITS",
      },
      select: { id: true, availableBalance: true },
    });
    const ledgerAvail = Number(acct?.availableBalance ?? 0n);
    const shortfall = lotRemaining - ledgerAvail;
    if (shortfall <= 0) continue;

    shortfallUsers++;
    console.log(
      `[shortfall] user=${userId} lots=${lotRemaining} ledger=${ledgerAvail} gap=${shortfall}`,
    );

    // Fund the oldest underfunded lots first until gap is covered (report only per lot amount).
    let remainingGap = shortfall;
    for (const lot of userLots.toSorted((a, b) => a.id.localeCompare(b.id))) {
      if (remainingGap <= 0) break;
      const fund = Math.min(lot.remainingXOF, remainingGap);
      if (fund <= 0) continue;
      const key = `REPAIR_PROMO_GRANT:${lot.id}`;
      console.log(
        `  ${dryRun ? "DRY" : "APPLY"} lot=${lot.id} source=${lot.source} fund=${fund} key=${key}`,
      );
      if (!dryRun) {
        await postPromoCreditGrantLedger(prisma, {
          userId,
          amountXOF: fund,
          idempotencyKey: key,
          description: `Repair underfunded promo credit lot ${lot.id}`,
          referenceType: "CREDIT_LOT",
          referenceId: lot.id,
        });
      }
      repairLots++;
      repairXOF += fund;
      remainingGap -= fund;
    }
  }

  console.log(
    JSON.stringify(
      {
        dryRun,
        usersChecked,
        shortfallUsers,
        repairLots,
        repairXOF,
      },
      null,
      2,
    ),
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
