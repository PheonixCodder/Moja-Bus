import { NextResponse } from "next/server";
import { getPrismaClient } from "@moja/db";
import { generateTripsForSchedule } from "@/lib/trip-generator";
import { assertCronAuthorized } from "@/lib/cron-auth";

export async function GET(request: Request) {
  const denied = assertCronAuthorized(request);
  if (denied) return denied;

  const prisma = getPrismaClient();

  try {
    const schedules = await prisma.schedule.findMany({
      where: {
        isActive: true,
        preferredBusId: { not: null },
      },
      select: {
        id: true,
        preferredBusId: true,
      },
    });

    let processed = 0;
    let tripsCreated = 0;
    const errors: Array<{ scheduleId: string; error: string }> = [];

    for (const schedule of schedules) {
      try {
        const created = await generateTripsForSchedule(
          schedule.id,
          schedule.preferredBusId,
          14,
        );
        processed += 1;
        tripsCreated += created.length;
      } catch (err: unknown) {
        errors.push({
          scheduleId: schedule.id,
          error: err instanceof Error ? err.message : String(err),
        });
      }
    }

    return NextResponse.json({
      success: true,
      schedulesProcessed: processed,
      tripsCreated,
      errorCount: errors.length,
      errors: errors.slice(0, 20),
    });
  } catch (error) {
    console.error("Failed to generate rolling trips:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 },
    );
  }
}
