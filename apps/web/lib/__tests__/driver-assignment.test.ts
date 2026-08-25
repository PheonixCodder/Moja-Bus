import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  driverInterval,
  findTripConflict,
  type TripConflictCandidate,
} from "../driver-assignment";

/**
 * Phase 27 (F-OP-14) — boundary tests for the SHARED overlap core consumed
 * by both the single-driver scan and the roster-batch scan. One math source:
 * these cases pin turnaround-buffer semantics, duration fallbacks, and
 * first-overlap-wins selection for both call sites at once.
 */

const HOUR = 60 * 60 * 1000;

function candidate(
  overrides: Partial<TripConflictCandidate> = {},
): TripConflictCandidate {
  return {
    tripId: "trip_existing",
    departureDate: new Date(10 * HOUR),
    estimatedArrival: new Date(14 * HOUR),
    serviceType: "INTERCITY",
    routeDistanceKm: null,
    originCity: "Abidjan",
    destCity: "Bouaké",
    routeName: "Abidjan–Bouaké Express",
    plate: "AA-111-B",
    companyName: "Probe Transport",
    ...overrides,
  };
}

describe("driverInterval", () => {
  it("uses estimatedArrival when present", () => {
    const i = driverInterval(
      new Date(10 * HOUR),
      new Date(14 * HOUR),
      "INTERCITY",
    );
    assert.equal(i.startMs, 10 * HOUR);
    assert.equal(i.endMs, 14 * HOUR);
  });

  it("derives end from route distance at the conservative fallback speed", () => {
    const i = driverInterval(new Date(0), null, "INTERCITY", 70);
    // 70 km / 35 kmh = exactly 2 h
    assert.equal(i.endMs - i.startMs, 2 * HOUR);
  });

  it("falls back to the static default when no arrival and no distance", () => {
    const intercity = driverInterval(new Date(0), null, "INTERCITY", null);
    const urban = driverInterval(new Date(0), null, "URBAN", null);
    assert.ok(intercity.endMs > intercity.startMs);
    assert.ok(urban.endMs > urban.startMs);
  });
});

describe("findTripConflict — turnaround buffer semantics", () => {
  // Target: departs 10:00, arrives 14:00. Buffer separates consecutive runs.
  const target = { startMs: 10 * HOUR, endMs: 14 * HOUR };

  it("flags a hard overlap", () => {
    const hit = findTripConflict(target, [candidate()]);
    assert.ok(hit);
    assert.equal(hit.tripId, "trip_existing");
    assert.equal(hit.companyName, "Probe Transport");
    assert.equal(hit.routeName, "Abidjan→Bouaké");
  });

  it("flags back-to-back runs still inside the turnaround buffer", () => {
    const hit = findTripConflict(target, [
      candidate({
        tripId: "trip_prev",
        departureDate: new Date(5 * HOUR),
        // ends just before target starts but within the buffer window
        estimatedArrival: new Date(10 * HOUR + 30 * 60 * 1000),
      }),
    ]);
    assert.ok(hit, "existing run ending inside the buffer must block");
  });

  it("clears once the gap exceeds the turnaround buffer on both sides", () => {
    const hit = findTripConflict(target, [
      candidate({
        departureDate: new Date(2 * HOUR),
        estimatedArrival: new Date(6 * HOUR),
      }),
    ]);
    assert.equal(hit, null);
  });

  it("ignores candidates whose interval only touches without buffer intrusion", () => {
    // Existing run ends far enough after target ends that only the far side matters
    const hit = findTripConflict(target, [
      candidate({
        departureDate: new Date(20 * HOUR),
        estimatedArrival: new Date(22 * HOUR),
      }),
    ]);
    assert.equal(hit, null);
  });

  it("treats a null-arrival legacy run via its static fallback duration", () => {
    const hit = findTripConflict(target, [
      candidate({ estimatedArrival: null, routeDistanceKm: null }),
    ]);
    assert.ok(
      hit,
      "legacy row with fallback duration inside the target must conflict",
    );
  });

  it("label chain: city pair wins over route name over plate over default", () => {
    const byCities = findTripConflict(target, [candidate()])!;
    assert.equal(byCities.routeName, "Abidjan→Bouaké");

    const byRoute = findTripConflict(target, [
      candidate({ originCity: null, destCity: null }),
    ])!;
    assert.equal(byRoute.routeName, "Abidjan–Bouaké Express");

    const byPlate = findTripConflict(target, [
      candidate({ originCity: null, destCity: null, routeName: null }),
    ])!;
    assert.equal(byPlate.routeName, "AA-111-B");

    const byDefault = findTripConflict(target, [
      candidate({
        originCity: null,
        destCity: null,
        routeName: null,
        plate: null,
        companyName: null,
      }),
    ])!;
    assert.equal(byDefault.routeName, "un autre trajet");
    assert.equal(byDefault.companyName, "");
  });

  it("returns the FIRST overlapping candidate in caller-supplied order", () => {
    const first = findTripConflict(target, [
      candidate({ tripId: "trip_earlier" }),
      candidate({ tripId: "trip_later" }),
    ]);
    assert.equal(first?.tripId, "trip_earlier");

    const reversed = findTripConflict(target, [
      candidate({ tripId: "trip_later" }),
      candidate({ tripId: "trip_earlier" }),
    ]);
    assert.equal(reversed?.tripId, "trip_later");
  });

  it("returns null for an empty candidate list", () => {
    assert.equal(findTripConflict(target, []), null);
  });
});
