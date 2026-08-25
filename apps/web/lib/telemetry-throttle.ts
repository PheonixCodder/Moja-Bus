import { createRateLimiter } from "./rate-limit";

/**
 * Phase 37 (F-IN-15) — two-tier telemetry ingest throttle.
 *
 * Tier 1 — coarse IP pre-gate (1200 req/min/IP): evaluated BEFORE token
 * verification so flooding costs an attacker a fixed-window reject instead
 * of HMAC work. Generous by design — it only catches genuine floods, never
 * legitimate fleets (a 30-driver depot on one NAT doing idle cadence is
 * ~60 req/min; full moving fleet bursts stay far below).
 *
 * Tier 2 — per-DRIVER ceiling (60 req/min/driver), keyed on the VERIFIED
 * dispatch-token identity (claims.d). Moving cadence is ~12/min and an
 * offline drain is ≤5 sequential chunk posts — a runaway client gets
 * contained individually with ZERO NAT collision between honest drivers.
 * This is why tier 2 keys on driver, not IP: co-located drivers behind one
 * carrier/depot egress must never punish each other (F-IN-15 challenge fix).
 *
 * Both use the in-memory store — consistent with the documented
 * single-container posture (init.ts); a Redis-backed store belongs to the
 * WS-hosting scale-out roadmap item together with real pub/sub fanout.
 */

export const TELEMETRY_IP_PRE_GATE = { windowMs: 60_000, max: 1200 };
export const TELEMETRY_DRIVER_CEILING = { windowMs: 60_000, max: 60 };

export interface TelemetryThrottle {
	ipGate: ReturnType<typeof createRateLimiter>;
	driverCeiling: ReturnType<typeof createRateLimiter>;
}

/** Injectable for tests (clock + store). */
export function createTelemetryThrottle(options?: {
	now?: () => number;
	storeFactory?: () => Parameters<typeof createRateLimiter>[0]["store"];
}): TelemetryThrottle {
	const ipStore = options?.storeFactory?.();
	const driverStore = options?.storeFactory?.();
	return {
		ipGate: createRateLimiter({
			...TELEMETRY_IP_PRE_GATE,
			...(options?.now ? { now: options.now } : {}),
			...(ipStore ? { store: ipStore } : {}),
		}),
		driverCeiling: createRateLimiter({
			...TELEMETRY_DRIVER_CEILING,
			...(options?.now ? { now: options.now } : {}),
			...(driverStore ? { store: driverStore } : {}),
		}),
	};
}

/** Process-wide singletons used by the ping route. */
export const telemetryThrottle = createTelemetryThrottle();

/** Left-most x-forwarded-for entry → x-real-ip → stable placeholder. */
export function clientIpFromHeaders(headers: Headers): string {
	const forwarded = headers.get("x-forwarded-for");
	if (forwarded) {
		const first = forwarded.split(",")[0]?.trim();
		if (first) return first;
	}
	return headers.get("x-real-ip") ?? "unknown";
}
