import { getPrismaClient } from "@moja/db";
import { NextResponse } from "next/server";
import { assertCronAuthorized } from "@/lib/cron-auth";

export const runtime = "nodejs";

const BATCH_SIZE = 2_000;
const RETENTION_DAYS = 180;

export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  const prisma = getPrismaClient();
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - RETENTION_DAYS);

  let totalPruned = 0;
  let batchPruned = BATCH_SIZE;

  while (batchPruned === BATCH_SIZE) {
    const result: Array<{ id: string }> = await prisma.$queryRaw`
      DELETE FROM "driver_location_ping"
      WHERE "id" IN (
        SELECT "id" FROM "driver_location_ping"
        WHERE "recordedAt" < ${cutoff}
        LIMIT ${BATCH_SIZE}
      )
      RETURNING "id"
    `;
    batchPruned = result.length;
    totalPruned += batchPruned;
    if (batchPruned > 0) {
      await new Promise((r) => setTimeout(r, 200));
    }
  }

  return NextResponse.json({
    success: true,
    pruned: totalPruned,
    cutoff: cutoff.toISOString(),
  });
}
