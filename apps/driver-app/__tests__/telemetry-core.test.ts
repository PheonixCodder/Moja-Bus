import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	chunkQueue,
	computeSmoothedSpeed,
	evaluateOverspeedAlert,
	nextWsBackoffMs,
	shouldFlagHarshBraking,
} from "../lib/telemetry-core";

describe("shouldFlagHarshBraking (Phase 10 / D5 deceleration severity)", () => {
	it("flags a genuine slam: 40 km/h dropped in 3 s (~3.7 m/s²)", () => {
		assert.equal(shouldFlagHarshBraking(70, 30, 3), true);
	});

	it("flags at the exact threshold boundary (≥2.8 m/s²)", () => {
		// drop 23.33 km/h in 3 s = 2.166 m/s² → below band even above floor? floor 25 rules it out.
		assert.equal(shouldFlagHarshBraking(60, 34, 3), false); // 26 km/h, 2.41 m/s²
		// 28 km/h drop in 3 s = 2.59 m/s² — still under 2.8
		assert.equal(shouldFlagHarshBraking(60, 32, 3), false);
		// 29 km/h drop in 3 s = 2.69 m/s² — under
		assert.equal(shouldFlagHarshBraking(60, 31, 3), false);
		// 30 km/h drop in 3 s = 2.78 m/s² — just under
		assert.equal(shouldFlagHarshBraking(60, 30, 3), false);
		// 31 km/h drop in 3 s = 2.88 m/s² — harsh ✓
		assert.equal(shouldFlagHarshBraking(60, 29, 3), true);
	});

	it("ignores everyday bus-stop braking (the naive-widening false positive)", () => {
		// 25 km/h drop over exactly 6 s ≈ 1.16 m/s² — routine approach
		assert.equal(shouldFlagHarshBraking(45, 20, 6), false);
		// 15 km/h over 5 s ≈ 0.83 m/s²
		assert.equal(shouldFlagHarshBraking(35, 20, 5), false);
	});

	it("keeps long-window events honest: hard stop over 7 s still flags", () => {
		// 80 km/h = 22.2 m/s; over 7 s needs ≥19.6 m/s drop → 70.6 km/h
		assert.equal(shouldFlagHarshBraking(80, 8, 7), true); // ~2.87 m/s²
		assert.equal(shouldFlagHarshBraking(80, 30, 7), false); // ~1.99 m/s²
	});

	it("rejects windows beyond 8 s regardless of drop", () => {
		assert.equal(shouldFlagHarshBraking(120, 10, 9), false);
		assert.equal(shouldFlagHarshBraking(120, 10, 8), true); // ~3.82 m/s²
	});

	it("guards against noise: no drop, acceleration, or zero/negative dt", () => {
		assert.equal(shouldFlagHarshBraking(50, 50, 2), false);
		assert.equal(shouldFlagHarshBraking(30, 60, 2), false);
		assert.equal(shouldFlagHarshBraking(90, 10, 0), false);
	});
});

describe("chunkQueue (F-TM-04)", () => {
	it("splits ≤100-sized chunks preserving order", () => {
		const items = Array.from({ length: 250 }, (_, i) => i);
		const chunks = chunkQueue(items, 100);
		assert.deepEqual(
			chunks.map((c) => c.length),
			[100, 100, 50],
		);
		assert.deepEqual(chunks.flat(), items);
	});

	it("handles empty and exact-multiple queues", () => {
		assert.deepEqual(chunkQueue([], 100), []);
		assert.equal(chunkQueue(Array.from({ length: 200 }, (_, i) => i), 100).length, 2);
	});
});

describe("nextWsBackoffMs (Phase 09 Option B reconnect budget)", () => {
	it("doubles from 5 s and caps at 60 s", () => {
		assert.equal(nextWsBackoffMs(1), 5_000);
		assert.equal(nextWsBackoffMs(2), 10_000);
		assert.equal(nextWsBackoffMs(3), 20_000);
		assert.equal(nextWsBackoffMs(4), 40_000);
		assert.equal(nextWsBackoffMs(5), 60_000); // capped, not 80 s
	});

	it("exhausts after the per-segment budget", () => {
		assert.equal(nextWsBackoffMs(6), null);
		assert.equal(nextWsBackoffMs(0), null);
	});
});

describe("computeSmoothedSpeed (Phase 3B / DRV-P2-08)", () => {
	it("initializes to raw speed when prev is null", () => {
		assert.equal(computeSmoothedSpeed(80, null), 80);
	});

	it("snaps to 0 when raw speed is below stationary threshold (<2 km/h)", () => {
		assert.equal(computeSmoothedSpeed(1.5, 50), 0);
		assert.equal(computeSmoothedSpeed(0, 30), 0);
	});

	it("smooths fluctuating GPS speeds with alpha 0.35", () => {
		// Starting at 80, receiving 100: 0.35 * 100 + 0.65 * 80 = 35 + 52 = 87
		const s1 = computeSmoothedSpeed(100, 80);
		assert.equal(Math.round(s1), 87);

		// Next receiving 85: 0.35 * 85 + 0.65 * 87 = 29.75 + 56.55 = 86.3
		const s2 = computeSmoothedSpeed(85, s1);
		assert.equal(Math.round(s2), 86);
	});
});

describe("evaluateOverspeedAlert (Phase 3B / DRV-P2-16)", () => {
	const initialArmedState = { isArmed: true, lastAlertTimestamp: 0 };

	it("triggers alert on rising edge over 110 km/h and disarms", () => {
		const res = evaluateOverspeedAlert(112, initialArmedState, 1000);
		assert.equal(res.shouldAlert, true);
		assert.equal(res.nextState.isArmed, false);
		assert.equal(res.nextState.lastAlertTimestamp, 1000);
	});

	it("does NOT re-trigger immediately while hovering above limit within cooldown window", () => {
		const stateAfterAlert = { isArmed: false, lastAlertTimestamp: 1000 };
		// 5 seconds later (within 15s cooldown)
		const res = evaluateOverspeedAlert(114, stateAfterAlert, 6000);
		assert.equal(res.shouldAlert, false);
		assert.equal(res.nextState.isArmed, false);
	});

	it("re-triggers after cooldown window (15s) if still overspeeding", () => {
		const stateAfterAlert = { isArmed: false, lastAlertTimestamp: 1000 };
		// 16 seconds later
		const res = evaluateOverspeedAlert(114, stateAfterAlert, 17000);
		assert.equal(res.shouldAlert, true);
		assert.equal(res.nextState.isArmed, false);
		assert.equal(res.nextState.lastAlertTimestamp, 17000);
	});

	it("re-arms when speed drops below hysteresis band (<= 106 km/h)", () => {
		const disarmedState = { isArmed: false, lastAlertTimestamp: 1000 };
		// Drops to 108 (still in hysteresis dead-zone: not re-armed yet)
		const res1 = evaluateOverspeedAlert(108, disarmedState, 2000);
		assert.equal(res1.shouldAlert, false);
		assert.equal(res1.nextState.isArmed, false);

		// Drops to 105 (below 106 km/h: re-arms!)
		const res2 = evaluateOverspeedAlert(105, disarmedState, 3000);
		assert.equal(res2.shouldAlert, false);
		assert.equal(res2.nextState.isArmed, true);

		// Accelerates back to 112: triggers immediately because it was re-armed!
		const res3 = evaluateOverspeedAlert(112, res2.nextState, 4000);
		assert.equal(res3.shouldAlert, true);
		assert.equal(res3.nextState.isArmed, false);
	});
});
