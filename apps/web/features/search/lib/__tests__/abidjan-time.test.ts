import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  abidjanDateKey,
  abidjanDayBounds,
  abidjanHour,
} from "../abidjan-time";

describe("abidjan-time", () => {
  it("day bounds for a calendar key are full UTC day (Abidjan=UTC)", () => {
    const { startOfDay, endOfDay } = abidjanDayBounds("2026-08-16");
    assert.equal(startOfDay.toISOString(), "2026-08-16T00:00:00.000Z");
    assert.equal(endOfDay.toISOString(), "2026-08-16T23:59:59.999Z");
  });

  it("date key matches Abidjan civil date", () => {
    assert.equal(
      abidjanDateKey(new Date("2026-08-16T15:30:00.000Z")),
      "2026-08-16",
    );
  });

  it("hour is Abidjan local hour", () => {
    assert.equal(abidjanHour(new Date("2026-08-16T06:30:00.000Z")), 6);
  });
});
