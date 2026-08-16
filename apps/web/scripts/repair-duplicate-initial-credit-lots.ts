/**
 * Inventory + optional revoke of duplicate INITIAL credit lots per referral edge.
 *
 * Historical Trace E: multiple INITIAL lots while edge stayed QUALIFIED.
 * Keeps the oldest ACTIVE/PARTIALLY_REDEEMED/PENDING lot; marks extras REVOKED
 * only when --apply (finance-gated).
 *
 * Usage:
 *   pnpm exec tsx apps/web/scripts/repair-duplicate-initial-credit-lots.ts --dry-run
 *   pnpm exec tsx apps/web/scripts/repair-duplicate-initial-credit-lots.ts --apply
 */
import { getPrismaClient } from "@moja/db";

const dryRun = !process.argv.includes("--apply");

async function main() {
  const prisma = getPrismaClient();

  const lots = await prisma.creditLot.findMany({
    where: {
      source: "REFERRAL",
      grantIdempotencyKey: { contains: ":INITIAL" },
      status: { not: "REVOKED" },
    },
    select: {
      id: true,
      userId: true,
      referralEdgeId: true,
      amountXOF: true,
      remainingXOF: true,
      reservedXOF: true,
      status: true,
      grantIdempotencyKey: true,
      createdAt: true,
    },
    orderBy: { createdAt: "asc" },
  });

  const byEdge = new Map<string, typeof lots>();
  for (const lot of lots) {
    const edgeKey = lot.referralEdgeId ?? `orphan:${lot.userId}`;
    const list = byEdge.get(edgeKey) ?? [];
    list.push(lot);
    byEdge.set(edgeKey, list);
  }

  let groups = 0;
  let revokeCount = 0;
  let revokeXOF = 0;

  for (const [edgeKey, edgeLots] of byEdge) {
    if (edgeLots.length < 2) continue;
    groups++;
    const [keep, ...extras] = edgeLots;
    console.log(
      `[dup-INITIAL] edge=${edgeKey} keep=${keep.id} (${keep.status}) extras=${extras.length}`,
    );
    for (const extra of extras) {
      if (extra.reservedXOF > 0) {
        console.log(
          `  SKIP revoke lot=${extra.id} reservedXOF=${extra.reservedXOF} (release holds first)`,
        );
        continue;
      }
      console.log(
        `  ${dryRun ? "DRY" : "APPLY"} REVOKED lot=${extra.id} remaining=${extra.remainingXOF} key=${extra.grantIdempotencyKey}`,
      );
      revokeCount++;
      revokeXOF += extra.remainingXOF;
      if (!dryRun) {
        await prisma.creditLot.update({
          where: { id: extra.id },
          data: {
            status: "REVOKED",
            remainingXOF: 0,
            reservedXOF: 0,
          },
        });
      }
    }
  }

  console.log(
    `\nDone. duplicateEdges=${groups} revokeLots=${revokeCount} revokeRemainingXOF=${revokeXOF} mode=${dryRun ? "dry-run" : "apply"}`,
  );
  console.log(
    "Note: ledger PROMO_CREDITS for revoked lots is NOT auto-reversed — finance review required.",
  );
  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
