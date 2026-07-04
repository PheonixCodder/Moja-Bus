import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildConsecutiveSegments,
  countSegmentOccupancy,
  getActiveBookings,
  getBookingsForSegment,
  getSegmentSeatStatus,
} from "@/features/booking/lib/trip-segments";

const stops = [
  {
    stopOrder: 0,
    terminal: { name: "Terminal A", cityRelation: { name: "City A" } },
  },
  {
    stopOrder: 1,
    terminal: { name: "Terminal B", cityRelation: { name: "City B" } },
  },
  {
    stopOrder: 2,
    terminal: { name: "Terminal C", cityRelation: { name: "City C" } },
  },
];

const future = new Date(Date.now() + 60_000);
const past = new Date(Date.now() - 60_000);

const bookings = [
  {
    seatId: "seat-1",
    boardingStopOrder: 0,
    dropoffStopOrder: 2,
    status: "CONFIRMED",
    holdExpiresAt: null,
  },
  {
    seatId: "seat-2",
    boardingStopOrder: 0,
    dropoffStopOrder: 2,
    status: "CONFIRMED",
    holdExpiresAt: null,
  },
  {
    seatId: "seat-3",
    boardingStopOrder: 0,
    dropoffStopOrder: 2,
    status: "CONFIRMED",
    holdExpiresAt: null,
  },
  {
    seatId: "seat-4",
    boardingStopOrder: 0,
    dropoffStopOrder: 1,
    status: "PENDING_PAYMENT",
    holdExpiresAt: future,
  },
  {
    seatId: "seat-5",
    boardingStopOrder: 0,
    dropoffStopOrder: 1,
    status: "PENDING_PAYMENT",
    holdExpiresAt: future,
  },
  {
    seatId: "seat-6",
    boardingStopOrder: 0,
    dropoffStopOrder: 1,
    status: "PENDING_PAYMENT",
    holdExpiresAt: past,
  },
];

describe("buildConsecutiveSegments", () => {
  it("builds one segment per consecutive stop pair", () => {
    const segments = buildConsecutiveSegments(stops);
    assert.equal(segments.length, 2);
    assert.deepEqual(segments[0], {
      originOrder: 0,
      destinationOrder: 1,
      originLabel: "City A",
      destinationLabel: "City B",
    });
    assert.deepEqual(segments[1], {
      originOrder: 1,
      destinationOrder: 2,
      originLabel: "City B",
      destinationLabel: "City C",
    });
  });
});

describe("getBookingsForSegment", () => {
  const segmentAB = { originOrder: 0, destinationOrder: 1 };
  const segmentBC = { originOrder: 1, destinationOrder: 2 };

  it("counts A-C bookings on both segments", () => {
    assert.equal(
      getBookingsForSegment(bookings, segmentAB).length,
      5,
    );
    assert.equal(
      getBookingsForSegment(bookings, segmentBC).length,
      3,
    );
  });

  it("excludes expired holds", () => {
    const active = getActiveBookings(bookings);
    assert.equal(active.length, 5);
    assert.equal(getBookingsForSegment(active, segmentAB).length, 5);
  });
});

describe("countSegmentOccupancy", () => {
  it("splits confirmed and held counts", () => {
    const segmentAB = { originOrder: 0, destinationOrder: 1 };
    const counts = countSegmentOccupancy(bookings, segmentAB);
    assert.deepEqual(counts, { occupied: 5, confirmed: 3, held: 2 });
  });
});

describe("getSegmentSeatStatus", () => {
  const segmentAB = { originOrder: 0, destinationOrder: 1 };

  it("marks confirmed overlap as booked", () => {
    assert.equal(
      getSegmentSeatStatus("seat-1", bookings, segmentAB, false),
      "booked",
    );
  });

  it("marks pending hold as held", () => {
    assert.equal(
      getSegmentSeatStatus("seat-4", bookings, segmentAB, false),
      "held",
    );
  });

  it("marks blocked seats", () => {
    assert.equal(
      getSegmentSeatStatus("seat-1", bookings, segmentAB, true),
      "blocked",
    );
  });

  it("marks available when no overlap on segment", () => {
    const segmentBC = { originOrder: 1, destinationOrder: 2 };
    assert.equal(
      getSegmentSeatStatus("seat-4", bookings, segmentBC, false),
      "available",
    );
  });
});
