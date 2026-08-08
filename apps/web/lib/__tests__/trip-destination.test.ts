import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { computeDestinationArrivalOffset } from "../trip-destination";

describe("computeDestinationArrivalOffset", () => {
  it("uses the full-route duration for a direct (no-waypoint) route", () => {
    const offset = computeDestinationArrivalOffset({
      waypoints: [],
      timings: new Map(),
      fullRouteDurationMin: 240,
    });
    assert.equal(offset, 240);
  });

  it("returns 0 for a direct route with no fare duration (falls back to legacy behavior)", () => {
    const offset = computeDestinationArrivalOffset({
      waypoints: [],
      timings: new Map(),
      fullRouteDurationMin: null,
    });
    assert.equal(offset, 0);
  });

  it("adds the final-leg travel after the last waypoint's departure", () => {
    // Waypoint leg travel totals 90 min; full-route duration is 180 min; final leg = 90.
    const timings = new Map([
      ["w1", { arrivalOffsetMinutes: 30, departureOffsetMinutes: 45 }], // 30 travel + 15 dwell
      ["w2", { arrivalOffsetMinutes: 90, departureOffsetMinutes: 105 }], // +60 travel +15 dwell
    ]);
    const offset = computeDestinationArrivalOffset({
      waypoints: [
        { id: "w1", stopOrder: 1 },
        { id: "w2", stopOrder: 2 },
      ],
      timings,
      fullRouteDurationMin: 180,
    });
    // lastDeparture (105) + finalLegTravel (180 - 90 = 90) = 195
    assert.equal(offset, 195);
  });

  it("never goes negative when waypoint legs already exceed the fare duration", () => {
    const timings = new Map([
      ["w1", { arrivalOffsetMinutes: 300, departureOffsetMinutes: 310 }],
    ]);
    const offset = computeDestinationArrivalOffset({
      waypoints: [{ id: "w1", stopOrder: 1 }],
      timings,
      fullRouteDurationMin: 180,
    });
    // finalLegTravel clamped to 0 -> destination at last waypoint departure
    assert.equal(offset, 310);
  });

  it("falls back to the full duration when timing for the last waypoint is missing", () => {
    const offset = computeDestinationArrivalOffset({
      waypoints: [{ id: "w1", stopOrder: 1 }],
      timings: new Map(), // no timing stored
      fullRouteDurationMin: 200,
    });
    assert.equal(offset, 200);
  });
});
