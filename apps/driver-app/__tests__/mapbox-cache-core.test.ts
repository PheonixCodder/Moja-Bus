import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	ROUTE_CACHE_TTL_MS,
	parseCacheEntry,
	serializeCacheEntry,
} from "../lib/mapbox-cache-core";

interface FakeResult {
	geoJson: string;
	distanceMeters: number | null;
	durationSeconds: number | null;
	isApproximate: boolean;
}

const RESULT: FakeResult = {
	geoJson: "{}",
	distanceMeters: 1234,
	durationSeconds: 600,
	isApproximate: false,
};

describe("mapbox cache envelope (Phase 30 / F-TM-17 TTL policy)", () => {
	it("round-trips a result and reports it fresh inside the TTL", () => {
		const storedAt = 1_000_000;
		const raw = serializeCacheEntry(RESULT, storedAt);
		const entry = parseCacheEntry<FakeResult>(raw, storedAt + ROUTE_CACHE_TTL_MS - 1);
		assert.ok(entry);
		assert.equal(entry.fresh, true);
		assert.deepEqual(entry.result, RESULT);
	});

	it("expires exactly at the TTL boundary — stale, never served", () => {
		const storedAt = 1_000_000;
		const raw = serializeCacheEntry(RESULT, storedAt);
		const entry = parseCacheEntry<FakeResult>(raw, storedAt + ROUTE_CACHE_TTL_MS);
		assert.ok(entry);
		assert.equal(entry.fresh, false);
	});

	it("honours a custom TTL (e.g. a shorter test window)", () => {
		const raw = serializeCacheEntry(RESULT, 1_000_000);
		const fresh = parseCacheEntry<FakeResult>(raw, 1_000_500, 1_000);
		const stale = parseCacheEntry<FakeResult>(raw, 1_002_000, 1_000);
		assert.equal(fresh?.fresh, true);
		assert.equal(stale?.fresh, false);
	});

	it("returns null for absent, corrupt, or malformed entries", () => {
		assert.equal(parseCacheEntry(null, 0), null);
		assert.equal(parseCacheEntry(undefined, 0), null);
		assert.equal(parseCacheEntry("", 0), null);
		assert.equal(parseCacheEntry("not json{", 0), null);
		assert.equal(parseCacheEntry(JSON.stringify({ nope: 1 }), 0), null);
		assert.equal(
			parseCacheEntry(JSON.stringify({ storedAt: "NaN", result: RESULT }), 0),
			null,
		);
	});
});
