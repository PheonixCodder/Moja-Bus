import { NextResponse } from "next/server";
import { getPrismaClient } from "@moja/db";
import { assertCronAuthorized } from "@/lib/cron-auth";
import { processDueReferralRewards } from "@/features/discounts/services/referral-service";

export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  const prisma = getPrismaClient();

  try {
    const result = await processDueReferralRewards(prisma);
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Failed to process referral rewards:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
