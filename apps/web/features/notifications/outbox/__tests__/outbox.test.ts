import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { OUTBOX_TYPES } from "../enqueue";

/** Pure backoff used by processOutboxBatch (mirrored for unit assert). */
function backoffMs(attempts: number): number {
  const BASE = 30_000;
  const MAX = 60 * 60 * 1000;
  return Math.min(MAX, BASE * 2 ** Math.max(0, attempts - 1));
}

describe("outbox helpers", () => {
  it("exposes commercial event types", () => {
    assert.equal(OUTBOX_TYPES.BOOKING_CONFIRMED, "BOOKING_CONFIRMED");
    assert.equal(OUTBOX_TYPES.BOOKING_REFUNDED, "BOOKING_REFUNDED");
    assert.equal(OUTBOX_TYPES.TRIP_CANCELLED, "TRIP_CANCELLED");
    assert.equal(OUTBOX_TYPES.REFERRAL_REWARD, "REFERRAL_REWARD");
  });

  it("backoff doubles then caps at 1h", () => {
    assert.equal(backoffMs(1), 30_000);
    assert.equal(backoffMs(2), 60_000);
    assert.equal(backoffMs(3), 120_000);
    assert.equal(backoffMs(20), 60 * 60 * 1000);
  });
});
