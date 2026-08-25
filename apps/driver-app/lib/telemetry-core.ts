/**
 * Pure telemetry primitives (Phase 10 / F-TM-04·05·06) — no React Native,
 * Expo or network imports so they run under Hermes AND node:test unchanged.
 * Constants here are product decisions; boundary-value tests live in
 * `__tests__/telemetry-core.test.ts`.
 */

/** Offline queue ceiling. Oldest pings are trimmed (with logged counts). */
export const OFFLINE_QUEUE_CAP = 500;

/** Server ingest accepts ≤100 pings per request (ping/route.ts). */
export const OFFLINE_FLUSH_CHUNK_SIZE = 100;

/**
 * Harsh braking = deceleration SEVERITY, not raw speed drop (Phase 10 D5
 * correction). A naive "≥25 km/h drop within N seconds" flags every bus-stop
 * approach once N grows past ~4 s (25 km/h over 6 s ≈ 1.16 m/s² — normal
 * braking). Industry harsh-braking band is ≈2.5–3.4 m/s²; we use 2.8 m/s²,
 * keep the 25 km/h floor as GPS-noise guard, and allow Δt up to 8 s so one
 * missed fix doesn't blind the detector.
 */
export const HARSH_BRAKE_MIN_DROP_KMH = 25;
export const HARSH_BRAKE_MIN_DECEL_MS2 = 2.8;
export const HARSH_BRAKE_MAX_WINDOW_SEC = 8;
export const KMH_PER_MS = 3.6;

export function shouldFlagHarshBraking(
	prevSpeedKmh: number,
	currSpeedKmh: number,
	deltaSec: number,
): boolean {
	if (deltaSec <= 0 || deltaSec > HARSH_BRAKE_MAX_WINDOW_SEC) return false;
	const dropKmh = prevSpeedKmh - currSpeedKmh;
	if (dropKmh < HARSH_BRAKE_MIN_DROP_KMH) return false;
	const decelMs2 = dropKmh / KMH_PER_MS / deltaSec;
	return decelMs2 >= HARSH_BRAKE_MIN_DECEL_MS2;
}

/** Split a queue into flush-sized chunks (order-preserving). */
export function chunkQueue<T>(items: readonly T[], size: number): T[][] {
	const chunks: T[][] = [];
	for (let i = 0; i < items.length; i += size) {
		chunks.push(items.slice(i, i + size));
	}
	return chunks;
}

/**
 * Phase 09 Option B — WS is dormant unless EXPO_PUBLIC_WS_URL is set (future
 * gateway hosting). When set, reconnects back off exponentially and stop after
 * a per-segment budget instead of hammering every 5 s forever.
 */
export const WS_BACKOFF_BASE_MS = 5_000;
export const WS_BACKOFF_CAP_MS = 60_000;
export const WS_MAX_ATTEMPTS_PER_SEGMENT = 5;

/** Milliseconds to wait before reconnect attempt N, or null when exhausted. */
export function nextWsBackoffMs(attempt: number): number | null {
	if (attempt < 1 || attempt > WS_MAX_ATTEMPTS_PER_SEGMENT) return null;
	return Math.min(WS_BACKOFF_CAP_MS, WS_BACKOFF_BASE_MS * 2 ** (attempt - 1));
}

/** How often the offline queue gets a background drain sweep while tracking. */
export const FLUSH_SWEEP_INTERVAL_MS = 60_000;
