import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { maxPathOccupancy } from "../max-path-occupancy";

describe("maxPathOccupancy", () => {
  it("counts distinct seats per interval, not booking rows (A→B + B→C reuse)", () => {
    // Seat S1 does A→B then B→C (2 rows); S2 does A→C. Path A→C max load = 2.
    const bookings = [
      { seatId: "S1", boardingStopOrder: 0, dropoffStopOrder: 1 },
      { seatId: "S1", boardingStopOrder: 1, dropoffStopOrder: 2 },
      { seatId: "S2", boardingStopOrder: 0, dropoffStopOrder: 2 },
    ];
    assert.equal(maxPathOccupancy(bookings, 0, 2), 2);
    // Row-count would incorrectly be 3.
  });

  it("A→B only sees interval 0→1", () => {
    const bookings = [
      { seatId: "S1", boardingStopOrder: 0, dropoffStopOrder: 1 },
      { seatId: "S1", boardingStopOrder: 1, dropoffStopOrder: 2 },
      { seatId: "S2", boardingStopOrder: 1, dropoffStopOrder: 2 },
    ];
    assert.equal(maxPathOccupancy(bookings, 0, 1), 1);
    assert.equal(maxPathOccupancy(bookings, 1, 2), 2);
  });

  it("returns 0 for empty path or empty bookings", () => {
    assert.equal(maxPathOccupancy([], 0, 3), 0);
    assert.equal(
      maxPathOccupancy(
        [{ seatId: "S1", boardingStopOrder: 0, dropoffStopOrder: 1 }],
        2,
        2,
      ),
      0,
    );
  });
});
