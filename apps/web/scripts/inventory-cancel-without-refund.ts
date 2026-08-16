/**
 * Read-only inventory of bookings/refunds left in CANCEL_WITHOUT_REFUND-style
 * failure paths (pre–Phase 00) and current REFUND_PENDING / FAILED refunds.
 *
 * Usage:
 *   pnpm exec tsx apps/web/scripts/inventory-cancel-without-refund.ts
 */
import { getPrismaClient } from "@moja/db";

async function main() {
  const prisma = getPrismaClient();

  const auditRows = await prisma.financialTransaction.findMany({
    where: {
      OR: [
        { type: "CANCEL_WITHOUT_REFUND" },
        { description: { contains: "CANCEL_WITHOUT_REFUND" } },
        { businessIdempotencyKey: { contains: "CANCEL_WITHOUT_REFUND" } },
      ],
    },
    select: {
      id: true,
      type: true,
      description: true,
      businessIdempotencyKey: true,
      externalPaymentId: true,
      createdAt: true,
    },
    take: 500,
    orderBy: { createdAt: "desc" },
  });

  const refundPending = await prisma.booking.count({
    where: { status: "REFUND_PENDING" },
  });

  const refundGroups = await prisma.refund.groupBy({
    by: ["status", "channel"],
    _count: { _all: true },
    _sum: { amountXOF: true },
  });

  console.log("=== CANCEL_WITHOUT_REFUND / audit-like FT rows (up to 500) ===");
  console.log(`count=${auditRows.length}`);
  for (const row of auditRows.slice(0, 50)) {
    console.log(
      `  ${row.createdAt.toISOString()} id=${row.id} type=${row.type} key=${row.businessIdempotencyKey ?? "-"}`,
    );
  }
  if (auditRows.length > 50) {
    console.log(`  ... +${auditRows.length - 50} more`);
  }

  console.log("\n=== Booking REFUND_PENDING ===");
  console.log(`count=${refundPending}`);

  console.log("\n=== Refund status × channel ===");
  for (const g of refundGroups) {
    console.log(
      `  ${g.status}/${g.channel}: n=${g._count._all} sumXOF=${g._sum.amountXOF ?? 0}`,
    );
  }

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
