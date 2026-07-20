import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { getCandidateDepartureDates } from "../schedule-trip-window";

const baseCalendar = {
  monday: true,
  tuesday: true,
  wednesday: true,
  thursday: true,
  friday: true,
  saturday: false,
  sunday: false,
  validFrom: new Date("2026-07-01T00:00:00.000Z"),
  validUntil: null as Date | null,
};

describe("getCandidateDepartureDates", () => {
  it("only includes days inside the rolling window from today", () => {
    // Wednesday 2026-07-15
    const now = new Date("2026-07-15T10:00:00.000Z");
    const candidates = getCandidateDepartureDates({
      departureTime: "08:00",
      calendar: {
        ...baseCalendar,
        // validFrom far in the future — none in next 14 days
        validFrom: new Date("2026-09-01T00:00:00.000Z"),
      },
      daysCount: 14,
      now,
    });
    assert.equal(candidates.length, 0);
  });

  it("respects validUntil", () => {
    const now = new Date("2026-07-15T10:00:00.000Z");
    const candidates = getCandidateDepartureDates({
      departureTime: "08:00",
      calendar: {
        ...baseCalendar,
        validFrom: new Date("2026-07-01T00:00:00.000Z"),
        validUntil: new Date("2026-07-16T00:00:00.000Z"),
      },
      daysCount: 14,
      now,
    });
    // Wed 15 + Thu 16 only (weekdays)
    assert.equal(candidates.length, 2);
  });

  it("skips CANCELLED exceptions", () => {
    const now = new Date("2026-07-15T10:00:00.000Z");
    const candidates = getCandidateDepartureDates({
      departureTime: "08:00",
      calendar: baseCalendar,
      exceptions: [
        {
          date: new Date("2026-07-15T00:00:00.000Z"),
          type: "CANCELLED",
        },
      ],
      daysCount: 1,
      now,
    });
    assert.equal(candidates.length, 0);
  });

  it("forces EXTRA_SERVICE on a non-operating day", () => {
    const now = new Date("2026-07-18T10:00:00.000Z"); // Saturday
    const candidates = getCandidateDepartureDates({
      departureTime: "09:30",
      calendar: baseCalendar,
      exceptions: [
        {
          date: new Date("2026-07-18T00:00:00.000Z"),
          type: "EXTRA_SERVICE",
        },
      ],
      daysCount: 1,
      now,
    });
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0]!.hours, 9);
    assert.equal(candidates[0]!.minutes, 30);
  });

  it("applies MODIFIED overrideDepartureTime", () => {
    const now = new Date("2026-07-15T10:00:00.000Z");
    const candidates = getCandidateDepartureDates({
      departureTime: "08:00",
      calendar: baseCalendar,
      exceptions: [
        {
          date: new Date("2026-07-15T00:00:00.000Z"),
          type: "MODIFIED",
          overrideDepartureTime: "14:45",
        },
      ],
      daysCount: 1,
      now,
    });
    assert.equal(candidates.length, 1);
    assert.equal(candidates[0]!.hours, 14);
    assert.equal(candidates[0]!.minutes, 45);
  });
});
