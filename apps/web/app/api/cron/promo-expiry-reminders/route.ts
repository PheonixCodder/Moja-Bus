import { NextResponse } from "next/server";
import { getPrismaClient } from "@moja/db";
import { assertCronAuthorized } from "@/lib/cron-auth";
import { processExpiringIncentiveReminders } from "@/features/discounts/services/expiry-reminders";

export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  const prisma = getPrismaClient();

  try {
    const result = await processExpiringIncentiveReminders(prisma);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Failed to process expiring incentive reminders:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
