import { getPrismaClient } from "@moja/db";
import type { DriverLocationPingInput } from "@moja/schemas";
import Redis from "ioredis";
import {
  anomalyPenalty,
  derivePingAnomaly,
  MAX_DAILY_PENALTY,
} from "@/lib/driver-scoring";
import { logTelemetryEvent } from "@/lib/telemetry-observability";
import { isGoodReferencePing } from "./telemetry-prev-point";
import { redisPub } from "./telemetry-redis";

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

/** In-memory fallback tracker for daily penalties when Redis is absent/memory mode. */
const IN_MEMORY_DAILY_PENALTIES = new Map<
  string,
  { total: number; expiresAt: number }
>();

/**
 * Atomic lock-free daily penalty counter.
 * Uses Redis INCRBY when Redis is active, or an in-memory Map fallback.
 * Eliminates PostgreSQL `FOR UPDATE` row locks and table scans from the 5-second ingest hot path.
 */
async function getAndIncrementDailyPenalty(
  driverProfileId: string,
  penalty: number,
  utcDateString: string,
): Promise<{ applicablePenalty: number }> {
  if (penalty <= 0) return { applicablePenalty: 0 };

  const key = `driver:${driverProfileId}:penalty:${utcDateString}`;

  if (redisPub instanceof Redis) {
    try {
      const newTotal = await redisPub.incrby(key, penalty);
      if (newTotal === penalty) {
        // Set 48-hour expiration on initial creation
        await redisPub.expire(key, 86400 * 2);
      }
      const prevTotal = newTotal - penalty;
      const allowance = Math.max(0, MAX_DAILY_PENALTY - prevTotal);
      const applicablePenalty = Math.min(penalty, allowance);
      return { applicablePenalty };
    } catch (err) {
      console.warn(
        "[Telemetry] Redis daily penalty tracking failed, using in-memory fallback:",
        err,
      );
    }
  }

  // In-memory atomic fallback
  const now = Date.now();
  const entry = IN_MEMORY_DAILY_PENALTIES.get(key);
  const currentTotal = entry && entry.expiresAt > now ? entry.total : 0;
  const newTotal = currentTotal + penalty;
  IN_MEMORY_DAILY_PENALTIES.set(key, {
    total: newTotal,
    expiresAt: now + 86400 * 2000,
  });

  const allowance = Math.max(0, MAX_DAILY_PENALTY - currentTotal);
  const applicablePenalty = Math.min(penalty, allowance);
  return { applicablePenalty };
}

/**
 * Phase 18 / Phase 1B remediation:
 * Lock-free, high-throughput telemetry persistence shared by both HTTP and WS ingest paths.
 *
 * Persists raw pings as fast append-only records without PostgreSQL row locks.
 * Applies real-time daily-capped safety score penalties via Redis atomic counter.
 * Nightly reconciliation cron (/api/cron/reconcile-driver-stats) remains the self-healing source of truth.
 */
export async function persistPingBatch(
  pings: DriverLocationPingInput[],
): Promise<number> {
  if (pings.length === 0) return 0;
  const batch = pings.map((ping) => ({ ping, receivedAt: new Date() }));

  // 1. Normalize anomalies across the whole batch
  const normalized = batch.map(({ ping }) => {
    const { isAnomaly, anomalyReason } = derivePingAnomaly(ping);
    return {
      driverProfileId: ping.driverProfileId,
      tripId: ping.tripId ?? null,
      latitude: ping.latitude,
      longitude: ping.longitude,
      speedKmh: ping.speedKmh,
      heading: ping.heading ?? null,
      accuracyMeters: ping.accuracyMeters,
      altitudeMeters: ping.altitudeMeters ?? null,
      isAnomaly,
      anomalyReason,
      recordedAt: new Date(ping.recordedAt),
      _penalty: isAnomaly ? anomalyPenalty(anomalyReason) : 0,
    };
  });

  // 2. Direct lock-free bulk insert to DriverLocationPing
  await prisma.driverLocationPing.createMany({
    data: normalized.map(({ _penalty, ...row }) => row),
  });

  // 3. Batch penalties grouped per driver
  const penaltyByDriver = new Map<string, number>();
  for (const row of normalized) {
    if (row._penalty > 0) {
      penaltyByDriver.set(
        row.driverProfileId,
        (penaltyByDriver.get(row.driverProfileId) ?? 0) + row._penalty,
      );
    }
  }

  // 4. Apply safety score deltas using atomic Redis daily caps and direct atomic SQL updates
  if (penaltyByDriver.size > 0) {
    const utcDateString = new Date().toISOString().slice(0, 10);
    for (const [driverId, rawPenalty] of penaltyByDriver.entries()) {
      const { applicablePenalty } = await getAndIncrementDailyPenalty(
        driverId,
        rawPenalty,
        utcDateString,
      );

      if (applicablePenalty > 0) {
        await prisma.$executeRaw`
          UPDATE "driver_profile"
          SET "safetyScore" = GREATEST(0, "safetyScore" - ${Math.round(applicablePenalty)})
          WHERE "id" = ${driverId}
        `;
      }
    }
  }

  // 5. Log stamped anomalies for auditing
  const stampCounts: Record<string, number> = {};
  for (const row of normalized) {
    if (row.isAnomaly && row.anomalyReason) {
      stampCounts[row.anomalyReason] =
        (stampCounts[row.anomalyReason] ?? 0) + 1;
    }
  }
  if (Object.keys(stampCounts).length > 0) {
    logTelemetryEvent("telemetry_anomalies_stamped", {
      counts: stampCounts,
      drivers: [...new Set(normalized.map((r) => r.driverProfileId))].length,
    });
  }

  // 6. Update latest driver coordinates in parallel (only GOOD fixes advance the reference)
  const latestPerDriver = new Map<string, DriverLocationPingInput>();
  for (const item of batch) {
    if (!isGoodReferencePing(item.ping)) continue;
    const current = latestPerDriver.get(item.ping.driverProfileId);
    if (
      !current ||
      new Date(item.ping.recordedAt).getTime() >
        new Date(current.recordedAt).getTime()
    ) {
      latestPerDriver.set(item.ping.driverProfileId, item.ping);
    }
  }

  if (latestPerDriver.size > 0) {
    await Promise.all(
      Array.from(latestPerDriver.entries()).map(([driverId, latest]) =>
        prisma.driverProfile.update({
          where: { id: driverId },
          data: {
            lastLatitude: latest.latitude,
            lastLongitude: latest.longitude,
            lastHeading: latest.heading ?? null,
            lastSpeedKmh: latest.speedKmh,
            lastPingAt: new Date(latest.recordedAt),
          },
        }),
      ),
    );
  }

  return batch.length;
}

/**
 * Drains the in-memory buffer. On DB failure the batch is restored so pings
 * aren't lost — safe here because the gateway/WS host is a long-lived node
 * process whose module state survives across requests.
 */
export async function flushTelemetryBuffer() {
  if (PING_BUFFER.length === 0) return;

  const batch = PING_BUFFER.splice(0, PING_BUFFER.length);

  try {
    await persistPingBatch(batch.map(({ ping }) => ping));
  } catch (err) {
    console.error("[Telemetry] Failed to persist batch to DB:", err);
    // On DB failure, restore back to buffer so pings aren't lost
    PING_BUFFER.unshift(...batch);
  }
}
