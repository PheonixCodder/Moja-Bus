import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  advanceReference,
  isGoodReferencePing,
} from "../../server/telemetry-prev-point";

/**
 * Phase 28 (F-TM-07) — reference-point rules shared by BOTH transports:
 * only GOOD fixes may become the next jump-gate reference. This is the
 * anti-evasion invariant — faking poor accuracy can never launder a
 * teleport past the gate.
 */

const good = {
  latitude: 5.35,
  longitude: -3.99,
  recordedAt: new Date("2026-08-25T10:00:00Z"),
  accuracyMeters: 8,
};

describe("isGoodReferencePing", () => {
  it("accepts accurate fixes", () => {
    assert.equal(isGoodReferencePing(good), true);
  });

  it("accepts NULL accuracy (unknown ≠ bad)", () => {
    assert.equal(isGoodReferencePing({ ...good, accuracyMeters: null }), true);
    assert.equal(isGoodReferencePing({ ...good, accuracyMeters: undefined }), true);
  });

  it("rejects fixes beyond the accuracy threshold", () => {
    assert.equal(isGoodReferencePing({ ...good, accuracyMeters: 51 }), false);
    assert.equal(isGoodReferencePing({ ...good, accuracyMeters: 5000 }), false);
  });
});

describe("advanceReference — chaining", () => {
  it("advances across a good fix", () => {
    const next = advanceReference(null, good);
    assert.ok(next);
    assert.equal(next!.latitude, good.latitude);
  });

  it("a bad FIRST fix must not seed a reference at all", () => {
    const badFirst = { ...good, latitude: 6.35, accuracyMeters: 900 };
    assert.equal(advanceReference(null, badFirst), null);
  });

  it("a flagged ping leaves an existing reference untouched", () => {
    const original = advanceReference(null, good)!;
    const canyonFix = {
      latitude: 6.35,
      longitude: -4.2,
      recordedAt: new Date("2026-08-25T10:00:05Z"),
      accuracyMeters: 300,
    };
    const after = advanceReference(original, canyonFix);
    assert.equal(after, original, "flagged fix must be transparent to the gate");
  });

  it("chains sequentially through mixed batches to the last good fix", () => {
    let ref = advanceReference(null, good);
    ref = advanceReference(ref, {
      ...good,
      latitude: 5.3504,
      recordedAt: new Date("2026-08-25T10:00:05Z"),
      accuracyMeters: 400, // canyon — skipped as reference
    });
    ref = advanceReference(ref, {
      ...good,
      latitude: 5.3508,
      recordedAt: new Date("2026-08-25T10:00:10Z"),
      accuracyMeters: 9, // good again
    });
    assert.equal(ref!.latitude, 5.3508);
    assert.equal(
      new Date(ref!.timestamp).toISOString(),
      "2026-08-25T10:00:10.000Z",
    );
  });
});
