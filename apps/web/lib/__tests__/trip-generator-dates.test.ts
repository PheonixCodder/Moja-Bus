import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  addAppCalendarDays,
  buildAppDepartureTimestamp,
  datesMatchCalendarDay,
  getCalendarDateKey,
  getWeekdayKey,
  getZonedDateParts,
  startOfAppCalendarDay,
} from "../timezone";

describe("timezone (Africa/Abidjan)", () => {
  it("maps a known UTC instant to the correct calendar day and weekday", () => {
    // 2026-07-05 23:30 UTC is still Sunday in US Eastern but Monday in Abidjan? 
    // Abidjan is UTC+0, so it's still 2026-07-05 Sunday 23:30
    const instant = new Date("2026-07-05T23:30:00.000Z");
    assert.equal(getCalendarDateKey(instant), "2026-07-05");
    assert.equal(getWeekdayKey(instant), "sunday");
  });

  it("adds calendar days without server-local drift", () => {
    const base = startOfAppCalendarDay(new Date("2026-07-01T12:00:00.000Z"));
    const next = addAppCalendarDays(base, 1);
    assert.equal(getCalendarDateKey(next), "2026-07-02");
  });

  it("builds departure timestamps on the app calendar day", () => {
    const day = startOfAppCalendarDay(new Date("2026-07-03T00:00:00.000Z"));
    const departure = buildAppDepartureTimestamp(day, 8, 30);
    assert.equal(departure.toISOString(), "2026-07-03T08:30:00.000Z");
  });

  it("matches exception dates by calendar day, not UTC string split", () => {
    const exceptionDate = new Date("2026-07-10T00:00:00.000Z");
    const targetDay = startOfAppCalendarDay(new Date("2026-07-10T15:00:00.000Z"));
    assert.equal(datesMatchCalendarDay(exceptionDate, targetDay), true);
  });

  it("returns consistent zoned parts for midnight UTC", () => {
    const parts = getZonedDateParts(new Date("2026-03-01T00:00:00.000Z"));
    assert.equal(parts.year, 2026);
    assert.equal(parts.month, 3);
    assert.equal(parts.day, 1);
    assert.equal(parts.weekday, 0);
  });
});
