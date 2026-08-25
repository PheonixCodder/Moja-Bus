import { getPrismaClient } from "@moja/db";
import { MAX_PING_ACCURACY_METERS } from "@/lib/driver-scoring";

/**
 * Phase 28 (F-TM-07) — shared previous-point store for the Haversine jump
 * gate, consumed by BOTH ingest transports so validation outcomes are
 * identical regardless of path (the phase's own parity criterion).
 *
 * Source of truth = the DriverProfile.last{Latitude,Longitude,PingAt}
 * columns the flush pipeline already maintains. Read-through per HTTP batch
 * (one PK lookup); the WS gateway seeds its hot per-connection cache from
 * here at connect instead of starting blind on every reconnect.
 *
 * Reference-point rule (anti-evasion): EVERY ping is jump-checked against
 * the last GOOD reference, but only pings whose own fix quality passes the
 * accuracy threshold may BECOME the next reference — a spoofer cannot slip
 * a teleport past the gate by faking poor accuracy, and an urban-canyon
 * drift cannot poison the comparison for the next good fix.
 */

export interface PreviousPoint {
  latitude: number;
  longitude: number;
  timestamp: Date;
}

/** A ping may serve as the next reference only if its fix quality is trustworthy. */
export function isGoodReferencePing(ping: {
  accuracyMeters?: number | null | undefined;
}): boolean {
  return !(
    ping.accuracyMeters != null &&
    ping.accuracyMeters > MAX_PING_ACCURACY_METERS
  );
}

/** Advance the reference across one accepted ping (pure). */
export function advanceReference(
  ref: PreviousPoint | null,
  ping: {
    latitude: number;
    longitude: number;
    recordedAt: Date | string;
    accuracyMeters?: number | null | undefined;
  },
): PreviousPoint | null {
  if (!isGoodReferencePing(ping)) return ref;
  return {
    latitude: ping.latitude,
    longitude: ping.longitude,
    timestamp: new Date(ping.recordedAt),
  };
}

/**
 * Read the driver's last persisted GOOD fix. Flagged pings never reach these
 * columns (flush excludes them), so whatever is stored here is trustworthy
 * by construction.
 */
export async function fetchPreviousPoint(
  driverProfileId: string,
): Promise<PreviousPoint | null> {
  const prisma = getPrismaClient();
  const row = await prisma.driverProfile.findUnique({
    where: { id: driverProfileId },
    select: {
      lastLatitude: true,
      lastLongitude: true,
      lastPingAt: true,
    },
  });
  if (
    row?.lastLatitude == null ||
    row?.lastLongitude == null ||
    row?.lastPingAt == null
  ) {
    return null;
  }
  return {
    latitude: row.lastLatitude,
    longitude: row.lastLongitude,
    timestamp: row.lastPingAt,
  };
}
