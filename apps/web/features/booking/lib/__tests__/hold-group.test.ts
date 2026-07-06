import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  bookingSummaryGroupKey,
  holdGroupWhere,
} from "@/features/booking/lib/hold-group";

describe("holdGroupWhere", () => {
  it("uses holdGroupId when present", () => {
    const where = holdGroupWhere(
      {
        holdGroupId: "group-abc",
        tripId: "trip-1",
        holdExpiresAt: new Date("2026-01-01T10:00:00Z"),
        passengerPhone: "+2250700000000",
        status: "PENDING_PAYMENT",
      },
      "PENDING_PAYMENT",
    );

    assert.deepEqual(where, {
      holdGroupId: "group-abc",
      status: "PENDING_PAYMENT",
    });
  });

  it("falls back to legacy phone grouping when holdGroupId is null", () => {
    const holdExpiresAt = new Date("2026-01-01T10:00:00Z");
    const where = holdGroupWhere(
      {
        holdGroupId: null,
        tripId: "trip-1",
        holdExpiresAt,
        passengerPhone: "+2250700000001",
        status: "PENDING_PAYMENT",
      },
      "PENDING_PAYMENT",
    );

    assert.deepEqual(where, {
      tripId: "trip-1",
      holdExpiresAt,
      passengerPhone: "+2250700000001",
      status: "PENDING_PAYMENT",
    });
  });
});

describe("bookingSummaryGroupKey", () => {
  it("uses holdGroupId for new bookings", () => {
    const key = bookingSummaryGroupKey({
      holdGroupId: "group-xyz",
      tripId: "trip-1",
      passengerPhone: "+2250700000000",
      holdExpiresAt: null,
      issuedAt: new Date("2026-01-02T08:00:00Z"),
    });

    assert.equal(key, "group-xyz");
  });

  it("uses legacy composite key when holdGroupId is missing", () => {
    const issuedAt = new Date("2026-01-02T08:00:00Z");
    const key = bookingSummaryGroupKey({
      holdGroupId: null,
      tripId: "trip-1",
      passengerPhone: "+2250700000000",
      holdExpiresAt: null,
      issuedAt,
    });

    assert.equal(
      key,
      `trip-1:+2250700000000:${issuedAt.toISOString()}`,
    );
  });
});
