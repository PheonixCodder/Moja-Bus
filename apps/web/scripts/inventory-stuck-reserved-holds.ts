/**
 * Read-only inventory of ACTIVE hold groups past holdExpiresAt or older than N hours.
 * Release/expiry command lands in Phase 03 — this script only reports.
 *
 * Usage:
 *   pnpm exec tsx apps/web/scripts/inventory-stuck-reserved-holds.ts
 *   pnpm exec tsx apps/web/scripts/inventory-stuck-reserved-holds.ts --hours=4
 */
import { PrismaClient } from "@moja/db";

const hoursArg = process.argv.find((a) => a.startsWith("--hours="));
const hours = hoursArg ? Number(hoursArg.split("=")[1]) : 2;

async function main() {
  const prisma = new PrismaClient();
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000);
  const now = new Date();

  const holds = await prisma.holdGroup.findMany({
    where: {
      status: "ACTIVE",
      OR: [{ holdExpiresAt: { lt: now } }, { createdAt: { lt: cutoff } }],
    },
    select: {
      id: true,
      offerId: true,
      companyId: true,
      userId: true,
      createdAt: true,
      holdExpiresAt: true,
      _count: {
        select: {
          discountRedemptions: true,
          bookings: true,
        },
      },
      payment: { select: { id: true, status: true, amountXOF: true } },
    },
    orderBy: { createdAt: "asc" },
    take: 200,
  });

  const reservedRedemptions = await prisma.discountRedemption.count({
    where: {
      status: "RESERVED",
      createdAt: { lt: cutoff },
    },
  });

  console.log(
    `=== ACTIVE holds expired or older than ${hours}h (up to 200) ===`,
  );
  console.log(`count=${holds.length} cutoff=${cutoff.toISOString()}`);
  for (const h of holds) {
    console.log(
      `  created=${h.createdAt.toISOString()} expires=${h.holdExpiresAt.toISOString()} hold=${h.id} offer=${h.offerId} pay=${h.payment?.status ?? "none"} redemptions=${h._count.discountRedemptions} bookings=${h._count.bookings}`,
    );
  }

  console.log(`\n=== DiscountRedemption RESERVED older than ${hours}h ===`);
  console.log(`count=${reservedRedemptions}`);
  console.log(
    "\nPhase 03 will own release/expiry commands. Do not hard-delete hold_group after money moved (Restrict FKs).",
  );

  await prisma.$disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
