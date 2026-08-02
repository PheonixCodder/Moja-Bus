import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { matchSegmentFare, type SegmentFare } from "../segment-fare-match";

const baseFare: SegmentFare = {
  fromStopOrder: 0,
  toStopOrder: 4,
  isActive: true,
  validFrom: null,
  validUntil: null,
  priceXOF: 5000,
};

describe("matchSegmentFare", () => {
  test("returns null when no fare covers the segment", () => {
    const fares: SegmentFare[] = [
      { ...baseFare, fromStopOrder: 2, toStopOrder: 4 },
    ];
    assert.equal(matchSegmentFare(fares, 0, 1, new Date("2026-08-02")), null);
  });

  test("returns null for inactive fare", () => {
    const fares: SegmentFare[] = [{ ...baseFare, isActive: false }];
    assert.equal(matchSegmentFare(fares, 0, 4, new Date("2026-08-02")), null);
  });

  test("returns null when departure is before validFrom", () => {
    const fares: SegmentFare[] = [
      { ...baseFare, validFrom: new Date("2026-09-01") },
    ];
    assert.equal(matchSegmentFare(fares, 0, 4, new Date("2026-08-02")), null);
  });

  test("returns null when departure is after validUntil", () => {
    const fares: SegmentFare[] = [
      { ...baseFare, validUntil: new Date("2026-07-01") },
    ];
    assert.equal(matchSegmentFare(fares, 0, 4, new Date("2026-08-02")), null);
  });

  test("boundary: departure equal to validFrom/validUntil matches", () => {
    const fares: SegmentFare[] = [
      {
        ...baseFare,
        validFrom: new Date("2026-08-02"),
        validUntil: new Date("2026-08-02"),
      },
    ];
    assert.ok(matchSegmentFare(fares, 0, 4, new Date("2026-08-02")));
  });

  test("returns the first covering active fare", () => {
    const fares: SegmentFare[] = [
      { ...baseFare, priceXOF: 6000 },
      { ...baseFare, priceXOF: 4500 },
    ];
    const f = matchSegmentFare(fares, 0, 4, new Date("2026-08-02"));
    assert.equal(f?.priceXOF, 6000);
  });
});
