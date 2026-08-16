import { NextResponse } from "next/server";
import { getPrismaClient } from "@moja/db";
import { sweepExpiredHolds } from "@/features/payments/services/expire-or-release-hold";
import { assertCronAuthorized } from "@/lib/cron-auth";

export const runtime = "nodejs";

/** Expire soft-expired ACTIVE holds and release incentive reservations (P1-1 / P1-7). */
export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  const prisma = getPrismaClient();

  try {
    const result = await sweepExpiredHolds(prisma, { limit: 75 });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("expire-holds cron failed:", error);
    return NextResponse.json({ error: "expire-holds failed" }, { status: 500 });
  }
}
