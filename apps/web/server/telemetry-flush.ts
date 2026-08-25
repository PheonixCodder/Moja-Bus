import { getPrismaClient, Prisma } from "@moja/db";
import type { DriverLocationPingInput } from "@moja/schemas";
import {
  anomalyPenalty,
  derivePingAnomaly,
  MAX_DAILY_PENALTY,
} from "@/lib/driver-scoring";
import { logTelemetryEvent } from "@/lib/telemetry-observability";
import { isGoodReferencePing } from "./telemetry-prev-point";

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

/**
 * Phase 18 (P2-11) — persistence core shared by both ingest paths.
 *
 * - WS gateway: pings arrive via queueTelemetryPing and are drained by
 *   flushTelemetryBuffer (safe there — long-lived node process).
 * - HTTP route: calls this DIRECTLY per request so nothing depends on a
 *   timer outliving a serverless invocation.
 *
 * Persists with server-authoritative anomaly classification (overspeed
 * recomputed from speedKmh; harsh braking from the client detector) and
 * applies daily-capped safety-score penalties in one transaction.
 * Throws on DB failure so callers can decide retry semantics.
 */
export async function persistPingBatch(
  pings: DriverLocationPingInput[],
): Promise<number> {
  if (pings.length === 0) return 0;
  const batch = pings.map((ping) => ({ ping, receivedAt: new Date() }));

  // Normalize anomalies for the whole batch before writing.
  // Phase 29 (F-TM-14): derivePingAnomaly is the single classification
  // authority — LOW_ACCURACY fixes are persisted for history but never
  // score (precedence over overspeed/braking), and never update last-position.
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

  await prisma.$transaction(async (tx: any) => {
    // 0. Batch penalties grouped per driver
    const penaltyByDriver = new Map<string, number>();
    for (const row of normalized) {
      if (row._penalty > 0) {
        penaltyByDriver.set(
          row.driverProfileId,
          (penaltyByDriver.get(row.driverProfileId) ?? 0) + row._penalty,
        );
      }
    }

    // 0b. Phase 29 (F-TM-18) — serialize concurrent flushes per driver with
    //     FOR UPDATE row locks in SORTED id order (deadlock hygiene), so two
    //     batches can no longer both compute their allowance from the same
    //     pre-insert snapshot and overshoot the daily cap together.
    const affectedDriverIds = [
      ...new Set(
        normalized.filter((r) => r._penalty > 0).map((r) => r.driverProfileId),
      ),
    ].sort();

    // 1. Pre-insert snapshot: penalties already recorded earlier today, so
    //    the −20/day catastrophe cap holds across batches without
    //    double-counting the batch we're about to insert.
    const startOfDay = new Date();
    startOfDay.setUTCHours(0, 0, 0, 0);

    const priorPenaltyByDriver = new Map<string, number>();
    if (affectedDriverIds.length > 0) {
      await tx.$queryRaw`
        SELECT "id" FROM "driver_profile"
        WHERE "id" IN (${Prisma.join(affectedDriverIds)})
        ORDER BY "id"
        FOR UPDATE
      `;
      const priorRows = await tx.driverLocationPing.findMany({
        where: {
          driverProfileId: { in: affectedDriverIds },
          recordedAt: { gte: startOfDay },
          isAnomaly: true,
          // LOW_ACCURACY rows carry zero penalty — skip scanning them.
          anomalyReason: { in: ["OVERSPEED", "HARSH_BRAKING"] },
        },
        select: { driverProfileId: true, anomalyReason: true },
      });
      for (const row of priorRows) {
        priorPenaltyByDriver.set(
          row.driverProfileId,
          (priorPenaltyByDriver.get(row.driverProfileId) ?? 0) +
            anomalyPenalty(row.anomalyReason),
        );
      }
    }

    // 2. Bulk insert to DriverLocationPing table (LOW_ACCURACY included —
    //    history completeness is the point; they simply score nothing).
    await tx.driverLocationPing.createMany({
      data: normalized.map(({ _penalty, ...row }) => row),
    });

    // 3. Safety-score deltas — grouped per driver with a UTC-daily cap
    for (const [driverId, rawPenalty] of penaltyByDriver.entries()) {
      const allowance = Math.max(
        0,
        MAX_DAILY_PENALTY - (priorPenaltyByDriver.get(driverId) ?? 0),
      );
      const applicable = Math.min(rawPenalty, allowance);

      if (applicable > 0) {
        await tx.$executeRaw`
          UPDATE "driver_profile" SET "safetyScore" = GREATEST(0, "safetyScore" - ${Math.round(applicable)}) WHERE "id" = ${driverId}
        `;
      }
    }
  });

  // Phase 29 (F-TM-13) — one structured line per batch describing every
  // stamped anomaly (disputes answerable from logs).
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

  // Update latest driver locations. Phase 29 (F-TM-14): only GOOD fixes may
  // become the driver's last-position reference — a low-accuracy fix must not
  // feed getLivePositions, HUDs, or serve as a jump-gate anchor. A batch of
  // exclusively flagged pings leaves the previous position untouched.
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
