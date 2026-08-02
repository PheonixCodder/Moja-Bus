/**
 * Backfill Phase 3 (urban cadence): mirror each Schedule's primary
 * `departureTime` into the new `departureTimes` array column.
 *
 * Cadence support stores the full list of departure times per schedule;
 * existing schedules only ever had one time, so the array is seeded from
 * `departureTime`. Rows that already have a non-empty `departureTimes`
 * (e.g. created after this feature shipped) are left untouched.
 *
 * Idempotent: safe to re-run after partial failures.
 */
import "dotenv/config";
import { getPrismaClient } from "../src";

const prisma = getPrismaClient();

async function main() {
  const schedules = await prisma.schedule.findMany({
    select: { id: true, departureTime: true, departureTimes: true },
  });

  let updated = 0;
  for (const s of schedules) {
    if (s.departureTimes.length > 0) continue;
    if (!s.departureTime) continue;

    await prisma.schedule.update({
      where: { id: s.id },
      data: { departureTimes: [s.departureTime] },
    });
    updated += 1;
  }

  const stillEmpty = await prisma.schedule.count({
    where: { departureTimes: { isEmpty: true }, departureTime: { not: "" } },
  });
  console.log(
    `Schedules: seeded departureTimes on ${updated} row(s) (${schedules.length} total).`,
  );
  if (stillEmpty > 0) {
    console.warn(`  WARNING: ${stillEmpty} schedule(s) still empty — check data.`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
