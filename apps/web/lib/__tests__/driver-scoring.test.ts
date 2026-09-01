import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  anomalyPenalty,
  derivePingAnomaly,
  isScoringAnomaly,
  MAX_DAILY_PENALTY,
} from "../driver-scoring";
import {
  computeDriverCleanStreak,
  computeDriverStreaksFromRecords,
  computeSegmentDistanceKm,
} from "../telemetry-reconcile";

/**
 * Phase 29 — scoring-authority + reconcile-math tests.
 *
 * derivePingAnomaly is the SINGLE classification authority for every ingest
 * path; these cases pin LOW_ACCURACY precedence (bad fixes never score) and
 * the ratio-calibrated segment-distance credit that replaced full-route km
 * for RELIEF/partial assignments.
 */

describe("derivePingAnomaly", () => {
  it("stamps OVERSPEED from speedKmh, never the client flag", () => {
    const r = derivePingAnomaly({ speedKmh: 130, isOverspeed: false });
    assert.equal(r.anomalyReason, "OVERSPEED");
  });

  it("stamps HARSH_BRAKING from the client detector", () => {
    const r = derivePingAnomaly({ speedKmh: 40, isHarshBraking: true });
    assert.equal(r.anomalyReason, "HARSH_BRAKING");
  });

  it("LOW_ACCURACY takes PRECEDENCE over overspeed (garbage fix never scores)", () => {
    const r = derivePingAnomaly({
      speedKmh: 150,
      accuracyMeters: 300,
      isHarshBraking: false,
    });
    assert.equal(r.anomalyReason, "LOW_ACCURACY");
    assert.equal(anomalyPenalty(r.anomalyReason), 0);
  });

  it("NULL accuracy means unknown — falls through to normal classification", () => {
    const r = derivePingAnomaly({ speedKmh: 130, accuracyMeters: null });
    assert.equal(r.anomalyReason, "OVERSPEED");
    const clean = derivePingAnomaly({
      speedKmh: 50,
      accuracyMeters: undefined,
    });
    assert.equal(clean.isAnomaly, false);
  });

  it("accurate pings at legal speeds stay clean", () => {
    const r = derivePingAnomaly({ speedKmh: 60, accuracyMeters: 10 });
    assert.deepEqual(r, { isAnomaly: false, anomalyReason: null });
  });

  it("penalty map: scored reasons only; DELAY and LOW_ACCURACY informational", () => {
    assert.equal(anomalyPenalty("OVERSPEED"), 5);
    assert.equal(anomalyPenalty("HARSH_BRAKING"), 10);
    assert.equal(anomalyPenalty("DELAY"), 0);
    assert.equal(anomalyPenalty("LOW_ACCURACY"), 0);
    assert.equal(isScoringAnomaly("LOW_ACCURACY"), false);
    assert.ok(MAX_DAILY_PENALTY === 20);
  });
});

describe("computeSegmentDistanceKm — ratio-calibrated segments", () => {
  // Linear mock route along a meridian: each leg ≈ 1.11 km (0.01° lat).
  const stops = [
    { stopOrder: 0, latitude: 5.0, longitude: -4.0 },
    { stopOrder: 1, latitude: 5.01, longitude: -4.0 },
    { stopOrder: 2, latitude: 5.02, longitude: -4.0 },
    { stopOrder: 3, latitude: 5.03, longitude: -4.0 },
    { stopOrder: 4, latitude: 5.04, longitude: -4.0 },
  ];

  it("full-span assignments keep FULL route credit", () => {
    const km = computeSegmentDistanceKm({
      startStopOrder: 0,
      endStopOrder: null,
      stops,
      routeDistanceKm: 100,
    });
    assert.equal(km, 100);
  });

  it("a mid-route span earns its chain RATIO × road distance", () => {
    // Span [1..3] covers legs (1→2, 2→3) = 2 of 4 legs ⇒ ratio 0.5.
    const km = computeSegmentDistanceKm({
      startStopOrder: 1,
      endStopOrder: 3,
      stops,
      routeDistanceKm: 100,
    });
    assert.equal(km, 50);
  });

  it("startStopOrder > 0 alone marks a partial span (default-0 caveat)", () => {
    const km = computeSegmentDistanceKm({
      startStopOrder: 2,
      endStopOrder: null,
      stops,
      routeDistanceKm: 100,
    });
    // Legs with midpoint ≥ 2: (2→3), (3→4) ⇒ half the chain.
    assert.equal(km, 50);
  });

  it("missing coordinates degrade to FULL credit, never punitive", () => {
    const coordless = stops.map((s) => ({ ...s, latitude: null }));
    const km = computeSegmentDistanceKm({
      startStopOrder: 1,
      endStopOrder: 3,
      stops: coordless,
      routeDistanceKm: 100,
    });
    assert.equal(km, 100);
  });

  it("inverted spans degrade to full credit", () => {
    const km = computeSegmentDistanceKm({
      startStopOrder: 3,
      endStopOrder: 1,
      stops,
      routeDistanceKm: 100,
    });
    assert.equal(km, 100);
  });
});

describe("computeDriverCleanStreak — anti-gaming telemetry gate (Phase 2A / DRV-P1-01)", () => {
  const cleanTrip = {
    validPingCount: 50,
    telemetrySpanMinutes: 45,
    hasPenalizedAnomaly: false,
  };

  it("10 consecutive clean runs with telemetry earn a full streak of 10", () => {
    const trips = Array(10).fill(cleanTrip);
    const streak = computeDriverCleanStreak(trips);
    assert.equal(streak, 10);
  });

  it("terminates streak on a zero-ping (GPS disabled) trip", () => {
    // 4 recent clean runs, then a silent trip, then 5 older clean runs
    const trips = [
      cleanTrip,
      cleanTrip,
      cleanTrip,
      cleanTrip,
      { validPingCount: 0, telemetrySpanMinutes: 0, hasPenalizedAnomaly: false },
      cleanTrip,
      cleanTrip,
      cleanTrip,
      cleanTrip,
      cleanTrip,
    ];
    const streak = computeDriverCleanStreak(trips);
    assert.equal(streak, 4);
  });

  it("terminates streak on a gate-only (1 ping) burst exploit", () => {
    const trips = [
      cleanTrip,
      cleanTrip,
      { validPingCount: 1, telemetrySpanMinutes: 0, hasPenalizedAnomaly: false },
      cleanTrip,
    ];
    const streak = computeDriverCleanStreak(trips);
    assert.equal(streak, 2);
  });

  it("terminates streak on a short burst (<10 minutes span)", () => {
    const trips = [
      cleanTrip,
      { validPingCount: 20, telemetrySpanMinutes: 3, hasPenalizedAnomaly: false },
      cleanTrip,
    ];
    const streak = computeDriverCleanStreak(trips);
    assert.equal(streak, 1);
  });

  it("terminates streak on a penalized anomaly (OVERSPEED / HARSH_BRAKING)", () => {
    const trips = [
      cleanTrip,
      cleanTrip,
      cleanTrip,
      { validPingCount: 60, telemetrySpanMinutes: 50, hasPenalizedAnomaly: true },
      cleanTrip,
    ];
    const streak = computeDriverCleanStreak(trips);
    assert.equal(streak, 3);
  });

  it("computeDriverStreaksFromRecords isolates multi-driver runs independently", () => {
    const records = [
      // Driver A: 2 clean runs
      {
        driverProfileId: "drv_a",
        tripId: "trip_1",
        validPingCount: 50,
        telemetrySpanMinutes: 45,
        hasPenalizedAnomaly: false,
      },
      {
        driverProfileId: "drv_a",
        tripId: "trip_2",
        validPingCount: 40,
        telemetrySpanMinutes: 30,
        hasPenalizedAnomaly: false,
      },
      // Driver B (Relief on same trips): GPS disabled (0 pings)
      {
        driverProfileId: "drv_b",
        tripId: "trip_1",
        validPingCount: 0,
        telemetrySpanMinutes: 0,
        hasPenalizedAnomaly: false,
      },
      {
        driverProfileId: "drv_b",
        tripId: "trip_2",
        validPingCount: 0,
        telemetrySpanMinutes: 0,
        hasPenalizedAnomaly: false,
      },
    ];

    const streaks = computeDriverStreaksFromRecords(records);
    assert.equal(streaks.get("drv_a"), 2);
    assert.equal(streaks.get("drv_b"), 0);
  });
});
