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

/**
 * Speedometer EMA Smoothing (Phase 3B / DRV-P2-08).
 * Alpha = 0.35 provides rapid responsiveness to genuine acceleration while
 * rejecting GPS multi-path jitter. Speeds below 2.0 km/h snap directly to 0
 * to prevent drift when vehicle is stationary.
 */
export const DEFAULT_SPEED_EMA_ALPHA = 0.35;
export const STATIONARY_SPEED_THRESHOLD_KMH = 2.0;

export function computeSmoothedSpeed(
	rawSpeedKmh: number,
	prevSmoothedKmh: number | null,
	alpha = DEFAULT_SPEED_EMA_ALPHA,
	stationaryThresholdKmh = STATIONARY_SPEED_THRESHOLD_KMH,
): number {
	if (rawSpeedKmh < stationaryThresholdKmh) {
		return 0;
	}
	if (prevSmoothedKmh == null || prevSmoothedKmh < stationaryThresholdKmh) {
		return rawSpeedKmh;
	}
	const smoothed = alpha * rawSpeedKmh + (1 - alpha) * prevSmoothedKmh;
	return smoothed < stationaryThresholdKmh ? 0 : smoothed;
}

/**
 * Overspeed Alert State Machine with Hysteresis & Rate-Limiting (Phase 3B / DRV-P2-16).
 * - Limit: 110 km/h highway speed limit
 * - Hysteresis band: 4 km/h (speed must fall below 106 km/h to re-arm)
 * - Rate limit: minimum 15 seconds between alerts if sustained overspeed
 */
export const HIGHWAY_SPEED_LIMIT_KMH = 110;
export const OVERSPEED_HYSTERESIS_DELTA_KMH = 4;
export const OVERSPEED_ALERT_COOLDOWN_MS = 15_000;

export interface OverspeedAlertState {
	isArmed: boolean;
	lastAlertTimestamp: number;
}

export function evaluateOverspeedAlert(
	currentSpeedKmh: number,
	state: OverspeedAlertState,
	now = Date.now(),
	speedLimitKmh = HIGHWAY_SPEED_LIMIT_KMH,
	hysteresisDeltaKmh = OVERSPEED_HYSTERESIS_DELTA_KMH,
	cooldownMs = OVERSPEED_ALERT_COOLDOWN_MS,
): { shouldAlert: boolean; nextState: OverspeedAlertState } {
	const resetThreshold = speedLimitKmh - hysteresisDeltaKmh;

	// If speed drops below reset threshold, re-arm the trigger
	if (currentSpeedKmh <= resetThreshold) {
		return {
			shouldAlert: false,
			nextState: {
				isArmed: true,
				lastAlertTimestamp: state.lastAlertTimestamp,
			},
		};
	}

	// If speed exceeds limit
	if (currentSpeedKmh > speedLimitKmh) {
		const cooldownElapsed = now - state.lastAlertTimestamp >= cooldownMs;
		if (state.isArmed || cooldownElapsed) {
			return {
				shouldAlert: true,
				nextState: {
					isArmed: false,
					lastAlertTimestamp: now,
				},
			};
		}
	}

	return {
		shouldAlert: false,
		nextState: state,
	};
}
