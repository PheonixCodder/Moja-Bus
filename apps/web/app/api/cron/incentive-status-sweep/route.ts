import { NextResponse } from "next/server";
import { getPrismaClient } from "@moja/db";
import { sweepIncentiveStatuses } from "@/features/discounts/services/incentive-status-sweep";
import { assertCronAuthorized } from "@/lib/cron-auth";

export const runtime = "nodejs";

/** Expire credit lots and advance campaign SCHEDULED/ACTIVE/EXPIRED windows. */
export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  const prisma = getPrismaClient();
  try {
    const result = await sweepIncentiveStatuses(prisma);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("incentive-status-sweep cron failed:", error);
    return NextResponse.json(
      { error: "incentive-status-sweep failed" },
      { status: 500 },
    );
  }
}
