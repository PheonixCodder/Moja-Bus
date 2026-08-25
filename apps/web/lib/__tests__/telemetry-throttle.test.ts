import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	TELEMETRY_DRIVER_CEILING,
	TELEMETRY_IP_PRE_GATE,
	clientIpFromHeaders,
	createTelemetryThrottle,
} from "../telemetry-throttle";

describe("telemetry throttle constants (Phase 37 / F-IN-15)", () => {
	it("pre-gate is generous; driver ceiling absorbs real cadences", () => {
		assert.equal(TELEMETRY_IP_PRE_GATE.max, 1200);
		assert.equal(TELEMETRY_IP_PRE_GATE.windowMs, 60_000);
		assert.equal(TELEMETRY_DRIVER_CEILING.max, 60);
		assert.equal(TELEMETRY_DRIVER_CEILING.windowMs, 60_000);
	});
});

describe("two-tier behavior", () => {
	const makeThrottle = () =>
		createTelemetryThrottle({ storeFactory: () => new Map() });
	const t0 = 1_000_000;

	it("driver ceiling admits the legitimate moving cadence (12/min)", () => {
		const t = makeThrottle();
		for (let i = 0; i < TELEMETRY_DRIVER_CEILING.max - 1; i++) {
			assert.equal(t.driverCeiling(`drv-1`).ok, true, `request ${i + 1}`);
		}
	});

	it("driver ceiling blocks the request past the limit within one window", () => {
		const t = makeThrottle();
		for (let i = 0; i < TELEMETRY_DRIVER_CEILING.max; i++) {
			t.driverCeiling("drv-1");
		}
		const blocked = t.driverCeiling("drv-1");
		assert.equal(blocked.ok, false);
		assert.ok(blocked.retryAfterMs > 0 && blocked.retryAfterMs <= 60_000);
	});

	it("drivers never collide through a shared NAT IP (the challenge fix)", () => {
		const t = makeThrottle();
		for (let i = 0; i < TELEMETRY_DRIVER_CEILING.max; i++) {
			t.driverCeiling("drv-A");
		}
		assert.equal(t.driverCeiling("drv-B").ok, true);
	});

	it("IP pre-gate rejects floods independently of per-driver accounting", () => {
		const t = makeThrottle();
		for (let i = 0; i < TELEMETRY_IP_PRE_GATE.max; i++) {
			t.ipGate("10.0.0.9");
		}
		assert.equal(t.ipGate("10.0.0.9").ok, false);
		assert.equal(t.ipGate("10.0.0.10").ok, true);
	});

	it("windows reset after expiry (fixed-window semantics)", () => {
		let now = t0;
		const stores: Array<Map<string, unknown>> = [];
		const t = createTelemetryThrottle({
			now: () => now,
			storeFactory: () => {
				const m = new Map<string, unknown>();
				stores.push(m);
				return m as never;
			},
		});
		for (let i = 0; i < TELEMETRY_DRIVER_CEILING.max; i++) {
			t.driverCeiling("drv-1");
		}
		assert.equal(t.driverCeiling("drv-1").ok, false);
		now = t0 + TELEMETRY_DRIVER_CEILING.windowMs;
		assert.equal(t.driverCeiling("drv-1").ok, true);
	});
});

describe("clientIpFromHeaders", () => {
	const headers = (init: Record<string, string>) => new Headers(init);

	it("takes the left-most forwarded entry", () => {
		assert.equal(
			clientIpFromHeaders(
				headers({ "x-forwarded-for": "1.1.1.1, 2.2.2.2" }),
			),
			"1.1.1.1",
		);
	});

	it("falls back to x-real-ip, then a stable placeholder", () => {
		assert.equal(clientIpFromHeaders(headers({ "x-real-ip": "3.3.3.3" })), "3.3.3.3");
		assert.equal(clientIpFromHeaders(headers({})), "unknown");
	});
});
