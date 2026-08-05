import { getPrismaClient } from "@moja/db";
import { NextResponse } from "next/server";
import { createCaptureService } from "@/features/capture/services/capture-service";
import { assertCronAuthorized } from "@/lib/cron-auth";

export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  try {
    const service = createCaptureService(getPrismaClient());
    const result = await service.sweepExpired();
    return NextResponse.json({ success: true, count: result.count });
  } catch (error) {
    console.error("Failed to sweep expired captures:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
