import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { driverLocationPingSchema } from "@moja/schemas";
import { validateTelemetryPing } from "@/server/telemetry-validator";
import { queueTelemetryPing } from "@/server/telemetry-flush";
import { redisPub } from "@/server/telemetry-redis";

const batchPingSchema = z.object({
  pings: z.array(driverLocationPingSchema).min(1).max(100),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const isBatch = Array.isArray(body?.pings);

    const pingsToProcess = isBatch
      ? batchPingSchema.parse(body).pings
      : [driverLocationPingSchema.parse(body)];

    let accepted = 0;
    let rejected = 0;

    for (const ping of pingsToProcess) {
      const validation = validateTelemetryPing(ping);
      if (!validation.isValid) {
        rejected++;
        continue;
      }

      queueTelemetryPing(ping);
      accepted++;

      if (ping.tripId) {
        const payload = JSON.stringify({
          event: "telemetry:update",
          data: {
            driverProfileId: ping.driverProfileId,
            tripId: ping.tripId,
            latitude: ping.latitude,
            longitude: ping.longitude,
            speedKmh: ping.speedKmh,
            heading: ping.heading,
            accuracyMeters: ping.accuracyMeters,
            recordedAt: ping.recordedAt,
          },
        });
        redisPub.publish(`trip:${ping.tripId}:telemetry`, payload).catch(() => {});
      }
    }

    return NextResponse.json({
      success: true,
      processed: pingsToProcess.length,
      accepted,
      rejected,
      timestamp: new Date().toISOString(),
    });
  } catch (err: any) {
    return NextResponse.json(
      {
        success: false,
        error: err.message || "Failed to process telemetry ping",
      },
      { status: 400 }
    );
  }
}
