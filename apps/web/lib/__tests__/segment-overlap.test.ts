import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  isActiveBookingStatus,
  segmentsOverlap,
} from "@/features/booking/lib/segment-overlap";
import { parseOfferId, buildOfferId } from "@moja/types";

describe("segmentsOverlap", () => {
  it("returns true when booking spans across passenger segment", () => {
    assert.equal(segmentsOverlap(1, 5, 2, 4), true);
  });

  it("returns false when booking ends before segment starts", () => {
    assert.equal(segmentsOverlap(1, 2, 3, 5), false);
  });

  it("returns false when booking starts at or after segment end", () => {
    assert.equal(segmentsOverlap(4, 6, 1, 4), false);
  });

  it("returns true for identical segment bounds", () => {
    assert.equal(segmentsOverlap(2, 4, 2, 4), true);
  });
});

describe("isActiveBookingStatus", () => {
  it("treats CONFIRMED as active", () => {
    assert.equal(isActiveBookingStatus("CONFIRMED", null), true);
  });

  it("treats non-expired PENDING_PAYMENT as active", () => {
    const future = new Date(Date.now() + 60_000);
    assert.equal(
      isActiveBookingStatus("PENDING_PAYMENT", future, new Date()),
      true,
    );
  });

  it("treats expired PENDING_PAYMENT as inactive", () => {
    const past = new Date(Date.now() - 60_000);
    assert.equal(
      isActiveBookingStatus("PENDING_PAYMENT", past, new Date()),
      false,
    );
  });
});

describe("offerId", () => {
  it("round-trips trip and stop ids", () => {
    const id = buildOfferId("trip1", "stopA", "stopB");
    assert.deepEqual(parseOfferId(id), {
      tripId: "trip1",
      originTripStopId: "stopA",
      destinationTripStopId: "stopB",
    });
  });

  it("rejects malformed offer ids", () => {
    assert.throws(() => parseOfferId("only-one-part"));
  });
});
