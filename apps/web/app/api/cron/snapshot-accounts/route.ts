import { NextResponse } from "next/server";
import { getPrismaClient, SnapshotService } from "@moja/db";
import { assertCronAuthorized } from "@/lib/cron-auth";

/**
 * GET /api/cron/snapshot-accounts
 *
 * Triggered daily by Vercel Cron to capture point-in-time balance snapshots
 * for every active FinancialAccount.
 *
 * Also takes a WEEKLY snapshot on Mondays and a MONTHLY snapshot on the 1st.
 *
 * Idempotent: safe to re-run within the same period — uses upsert semantics.
 */
export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  const prisma = getPrismaClient();
  const svc = new SnapshotService(prisma);
  const now = new Date();

  try {
    const results: Record<string, number> = {};

    // Always take a daily snapshot
    const daily = await svc.takeDaily(now);
    results["DAILY"] = daily.count;

    // Weekly snapshot on Mondays (getUTCDay() === 1)
    if (now.getUTCDay() === 1) {
      const weekly = await svc.takeWeekly(now);
      results["WEEKLY"] = weekly.count;
    }

    // Monthly snapshot on the 1st of each month
    if (now.getUTCDate() === 1) {
      const monthly = await svc.takeMonthly(now);
      results["MONTHLY"] = monthly.count;
    }

    console.log("[cron/snapshot-accounts] Snapshots taken:", results);
    return NextResponse.json({ success: true, snapshots: results });
  } catch (error) {
    console.error("[cron/snapshot-accounts] Failed:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
