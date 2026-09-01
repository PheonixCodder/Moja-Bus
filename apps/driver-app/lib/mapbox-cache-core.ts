/**
 * Phase 30 (F-TM-17) — pure route-cache envelope primitives. No React
 * Native, Expo or network imports so they run under Hermes AND node:test
 * unchanged (same discipline as telemetry-core.ts).
 *
 * Policy decisions encoded here:
 *  - Route geometry caches for ROUTE_CACHE_TTL_MS (24 h). Routes are
 *    terminal-pair-static; TTL beats coupling to a schema updatedAt.
 *  - Envelopes are versioned by the storage KEY prefix in lib/mapbox.ts
 *    (`_v2_`), so pre-TTL "cached forever" entries are orphaned, never read.
 *  - A stale entry is reported with fresh:false — the caller re-fetches and
 *    overwrites; it is never silently served.
 */

export const ROUTE_CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface CacheEnvelope<T> {
  storedAt: number;
  result: T;
}

/**
 * Serializes a route result into the version-2 cache envelope.
 * `nowMs` is injected so tests can pin the clock.
 */
export function serializeCacheEntry<T>(result: T, nowMs: number): string {
  const envelope: CacheEnvelope<T> = { storedAt: nowMs, result };
  return JSON.stringify(envelope);
}

/**
 * Parses a raw AsyncStorage value into its result + freshness verdict.
 * Returns null for absent/corrupt/malformed entries (caller refetches);
 * returns fresh:false for well-formed but expired ones.
 */
export function parseCacheEntry<T>(
  raw: string | null | undefined,
  nowMs: number,
  ttlMs: number = ROUTE_CACHE_TTL_MS,
): { result: T; fresh: boolean } | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Partial<CacheEnvelope<T>> | null;
    if (
      !parsed ||
      typeof parsed.storedAt !== "number" ||
      !Number.isFinite(parsed.storedAt) ||
      !parsed.result ||
      typeof parsed.result !== "object"
    ) {
      return null;
    }
    return {
      result: parsed.result,
      fresh: nowMs - parsed.storedAt < ttlMs,
    };
  } catch {
    return null;
  }
}

export interface RawTripStopInput {
	id?: string;
	stopOrder?: number | null;
	terminal?: {
		name?: string | null;
		latitude?: number | null;
		longitude?: number | null;
		isTerminal?: boolean | null;
	} | null;
}

export interface RouteCoordinate {
	latitude: number;
	longitude: number;
}

/**
 * Extracts and sorts valid coordinates from trip stops (Phase 3C / DRV-P2-11).
 * Filters out null/undefined/non-finite coordinates.
 */
export function extractTripCoordinates(
	stops: readonly RawTripStopInput[] | null | undefined,
): RouteCoordinate[] {
	if (!stops || stops.length === 0) return [];
	return stops
		.slice()
		.sort((a, b) => (a.stopOrder ?? 0) - (b.stopOrder ?? 0))
		.flatMap((stop) => {
			const lat = stop.terminal?.latitude;
			const lng = stop.terminal?.longitude;
			if (
				typeof lat === "number" &&
				typeof lng === "number" &&
				Number.isFinite(lat) &&
				Number.isFinite(lng)
			) {
				return [{ latitude: lat, longitude: lng }];
			}
			return [];
		});
}
