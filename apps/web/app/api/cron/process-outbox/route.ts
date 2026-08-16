import { NextResponse } from "next/server";
import { getPrismaClient } from "@moja/db";
import { processOutboxBatch } from "@/features/notifications/outbox/process";
import { assertCronAuthorized } from "@/lib/cron-auth";

export const runtime = "nodejs";

/** Deliver due OutboxMessage rows via Novu (Phase 07 / D8). */
export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  const prisma = getPrismaClient();
  try {
    const result = await processOutboxBatch(prisma, { limit: 40 });
    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("process-outbox cron failed:", error);
    return NextResponse.json(
      { error: "process-outbox failed" },
      { status: 500 },
    );
  }
}
