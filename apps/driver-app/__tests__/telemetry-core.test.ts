import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	chunkQueue,
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
