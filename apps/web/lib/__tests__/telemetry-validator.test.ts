import assert from "node:assert/strict";
import { describe, it } from "node:test";
import type { DriverLocationPingInput } from "@moja/schemas";
import { validateTelemetryPing } from "../../server/telemetry-validator";
import type { PreviousPoint } from "../../server/telemetry-prev-point";

/**
 * Phase 28 (F-TM-07/F-TM-14) — contract tests for the shared validator now
 * that BOTH transports consume it. Pins the post-Phase-28 semantics: poor
 * accuracy NO LONGER rejects (it is classified LOW_ACCURACY downstream);
 * only physically-impossible signals reject.
 */

function ping(
  overrides: Partial<DriverLocationPingInput> = {},
): DriverLocationPingInput {
  return {
    driverProfileId: "drv_1",
    latitude: 5.35,
    longitude: -3.99,
    speedKmh: 42,
    accuracyMeters: 8,
    recordedAt: new Date("2026-08-25T10:00:00Z"),
    ...overrides,
  } as DriverLocationPingInput;
}

const ref: PreviousPoint = {
  latitude: 5.35,
  longitude: -3.99,
  timestamp: new Date("2026-08-25T09:59:55Z"),
};

describe("telemetry validator — hard gates", () => {
  it("rejects out-of-bounds coordinates", () => {
    const result = validateTelemetryPing(ping({ latitude: 95 }));
    assert.equal(result.isValid, false);
    assert.match(result.reason!, /bounds/);
  });

  it("rejects physically impossible instantaneous speed", () => {
    const result = validateTelemetryPing(ping({ speedKmh: 240 }));
    assert.equal(result.isValid, false);
    assert.match(result.reason!, /Speed/);
  });

  it("accepts a first-ever ping with no previous point", () => {
    const result = validateTelemetryPing(ping(), null);
    assert.equal(result.isValid, true);
  });

  it("rejects an implausible jump against a previous point", () => {
    // ~111 km in 5 s — a teleport
    const farAway = ping({ latitude: 6.35 });
    const result = validateTelemetryPing(farAway, ref);
    assert.equal(result.isValid, false);
    assert.match(result.reason!, /jump/i);
  });

  it("passes a plausible move at normal cadence", () => {
    const nearby = ping({
      latitude: 5.3504, // ~45 m north
      longitude: -3.99,
    });
    const result = validateTelemetryPing(nearby, ref);
    assert.equal(result.isValid, true);
    assert.ok((result.calculatedSpeedKmh ?? 0) < 220);
  });

  it("passes a large displacement across a long gap (offline queue drain)", () => {
    // ~15 km in 30 min ≈ 30 km/h — slow drift over a dead zone must NOT trip
    const distantButSlow = ping({
      latitude: 5.4844,
      longitude: -3.99,
      recordedAt: new Date("2026-08-25T10:30:00Z"),
    });
    const result = validateTelemetryPing(distantButSlow, ref);
    assert.equal(result.isValid, true);
  });

  it("PHASE-28 CONTRACT: accuracy beyond threshold no longer rejects", () => {
    for (const bad of [51, 200, 5000]) {
      const result = validateTelemetryPing(ping({ accuracyMeters: bad }));
      assert.equal(
        result.isValid,
        true,
        `accuracy ${bad}m must be accepted (flagged LOW_ACCURACY downstream)`,
      );
    }
  });
});
