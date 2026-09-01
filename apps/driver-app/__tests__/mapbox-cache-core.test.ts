import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
	ROUTE_CACHE_TTL_MS,
	extractTripCoordinates,
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

describe("extractTripCoordinates (Phase 3C / DRV-P2-11)", () => {
	it("sorts stops by stopOrder and extracts valid coordinates", () => {
		const stops = [
			{
				stopOrder: 2,
				terminal: { name: "Yamoussoukro", latitude: 6.8276, longitude: -5.2893 },
			},
			{
				stopOrder: 1,
				terminal: { name: "Abidjan Adjamé", latitude: 5.3599, longitude: -4.0083 },
			},
			{
				stopOrder: 3,
				terminal: { name: "Bouaké", latitude: 7.6905, longitude: -5.0305 },
			},
		];
		const coords = extractTripCoordinates(stops);
		assert.equal(coords.length, 3);
		assert.deepEqual(coords[0], { latitude: 5.3599, longitude: -4.0083 });
		assert.deepEqual(coords[1], { latitude: 6.8276, longitude: -5.2893 });
		assert.deepEqual(coords[2], { latitude: 7.6905, longitude: -5.0305 });
	});

	it("skips stops with null, undefined, or invalid coordinates", () => {
		const stops = [
			{ stopOrder: 1, terminal: { latitude: 5.35, longitude: -4.01 } },
			{ stopOrder: 2, terminal: { latitude: null, longitude: -4.5 } },
			{ stopOrder: 3, terminal: null },
			{ stopOrder: 4, terminal: { latitude: 7.69, longitude: -5.03 } },
		];
		const coords = extractTripCoordinates(stops);
		assert.equal(coords.length, 2);
		assert.deepEqual(coords[0], { latitude: 5.35, longitude: -4.01 });
		assert.deepEqual(coords[1], { latitude: 7.69, longitude: -5.03 });
	});

	it("returns empty array for empty or null inputs", () => {
		assert.deepEqual(extractTripCoordinates(null), []);
		assert.deepEqual(extractTripCoordinates([]), []);
	});
});
