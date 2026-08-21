import { getPrismaClient } from "@moja/db";
import { redisPub } from "./telemetry-redis";
import type { DriverLocationPingInput } from "@moja/schemas";

const prisma = getPrismaClient();

interface QueuedPing {
  ping: DriverLocationPingInput;
  receivedAt: Date;
}

const PING_BUFFER: QueuedPing[] = [];
const BATCH_SIZE = 50;
const FLUSH_INTERVAL_MS = 5000;

let flushTimer: NodeJS.Timeout | null = null;

export function queueTelemetryPing(ping: DriverLocationPingInput) {
  PING_BUFFER.push({ ping, receivedAt: new Date() });

  if (PING_BUFFER.length >= BATCH_SIZE) {
    flushTelemetryBuffer().catch((err) => {
      console.error("[Telemetry] Batch flush error:", err);
    });
  } else if (!flushTimer) {
    flushTimer = setTimeout(() => {
      flushTimer = null;
      flushTelemetryBuffer().catch((err) => {
        console.error("[Telemetry] Periodic flush error:", err);
      });
    }, FLUSH_INTERVAL_MS);
  }
}

export async function flushTelemetryBuffer() {
  if (PING_BUFFER.length === 0) return;

  const batch = PING_BUFFER.splice(0, PING_BUFFER.length);

  try {
    // 1. Bulk insert to DriverLocationPing table
    await prisma.driverLocationPing.createMany({
      data: batch.map((item) => ({
        driverProfileId: item.ping.driverProfileId,
        tripId: item.ping.tripId ?? null,
        latitude: item.ping.latitude,
        longitude: item.ping.longitude,
        speedKmh: item.ping.speedKmh,
        heading: item.ping.heading ?? null,
        accuracyMeters: item.ping.accuracyMeters,
        batteryPercent: item.ping.batteryPercent ?? null,
        isCharging: item.ping.isCharging ?? false,
        networkType: item.ping.networkType ?? null,
        recordedAt: new Date(item.ping.recordedAt),
      })),
    });

    // 2. Update latest driver locations
    const latestPerDriver = new Map<string, DriverLocationPingInput>();
    for (const item of batch) {
      latestPerDriver.set(item.ping.driverProfileId, item.ping);
    }

    for (const [driverId, latest] of latestPerDriver.entries()) {
      await prisma.driverProfile.update({
        where: { id: driverId },
        data: {
          lastLatitude: latest.latitude,
          lastLongitude: latest.longitude,
          lastHeading: latest.heading ?? null,
          lastSpeedKmh: latest.speedKmh,
          lastPingAt: new Date(latest.recordedAt),
        },
      });

      // Update Redis live_location cache
      await redisPub.hset(`driver:${driverId}:live`, {
        lat: latest.latitude,
        lng: latest.longitude,
        speed: latest.speedKmh,
        heading: latest.heading ?? 0,
        tripId: latest.tripId ?? "",
        updatedAt: new Date(latest.recordedAt).toISOString(),
      });
    }
  } catch (err) {
    console.error("[Telemetry] Failed to persist batch to DB:", err);
    // On DB failure, restore back to buffer so pings aren't lost
    PING_BUFFER.unshift(...batch);
  }
}
