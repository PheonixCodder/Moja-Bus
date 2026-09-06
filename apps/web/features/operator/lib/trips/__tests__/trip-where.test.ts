import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  buildOperatorTripWhere,
  parseAppCalendarDayBound,
  sumStatusCounts,
} from "../trip-where";
import {
  getAppRollingTripWindow,
  getCalendarDateKey,
  OPERATOR_TRIP_BOARD_DAYS,
} from "@/lib/timezone";

describe("parseAppCalendarDayBound", () => {
  it("uses inclusive end-of-day for YYYY-MM-DD end bounds", () => {
    const end = parseAppCalendarDayBound("2026-09-06", "end");
    assert.equal(getCalendarDateKey(end), "2026-09-06");
    assert.equal(end.getUTCHours(), 23);
    assert.equal(end.getUTCMinutes(), 59);
    assert.equal(end.getUTCSeconds(), 59);
  });

  it("uses start-of-day for YYYY-MM-DD start bounds", () => {
    const start = parseAppCalendarDayBound("2026-09-06", "start");
    assert.equal(getCalendarDateKey(start), "2026-09-06");
    assert.equal(start.getUTCHours(), 0);
    assert.equal(start.getUTCMinutes(), 0);
  });
});

describe("getAppRollingTripWindow", () => {
  it("spans OPERATOR_TRIP_BOARD_DAYS inclusive calendar days", () => {
    const now = new Date("2026-09-06T15:30:00.000Z");
    const { startDate, endDate } = getAppRollingTripWindow(
      OPERATOR_TRIP_BOARD_DAYS,
      now,
    );
    assert.equal(getCalendarDateKey(startDate), "2026-09-06");
    // today + 13 = 14th day inclusive
    assert.equal(getCalendarDateKey(endDate), "2026-09-19");
  });
});

describe("buildOperatorTripWhere", () => {
  const now = new Date("2026-09-06T12:00:00.000Z");

  it("applies default rolling window without status", () => {
    const { where, window } = buildOperatorTripWhere({
      companyId: "co_1",
      now,
    });
    assert.equal(where.companyId, "co_1");
    assert.equal(where.archivedAt, null);
    assert.ok(where.departureDate);
    assert.equal(window?.startDate, "2026-09-06");
    assert.equal(window?.endDate, "2026-09-19");
    assert.equal(where.status, undefined);
  });

  it("applies status only when provided (list mode)", () => {
    const { where } = buildOperatorTripWhere({
      companyId: "co_1",
      status: "BOARDING",
      now,
    });
    assert.equal(where.status, "BOARDING");
  });

  it("honors inclusive toolbar endDate instead of UTC midnight", () => {
    const { where, window } = buildOperatorTripWhere({
      companyId: "co_1",
      startDate: "2026-09-01",
      endDate: "2026-09-06",
      now,
    });
    const dep = where.departureDate as { gte: Date; lte: Date };
    assert.equal(getCalendarDateKey(dep.gte), "2026-09-01");
    assert.equal(getCalendarDateKey(dep.lte), "2026-09-06");
    assert.equal(dep.lte.getUTCHours(), 23);
    assert.equal(window?.startDate, "2026-09-01");
    assert.equal(window?.endDate, "2026-09-06");
  });

  it("skips date window for driverProfileId history mode", () => {
    const { where, window } = buildOperatorTripWhere({
      companyId: "co_1",
      driverProfileId: "drv_1",
      now,
    });
    assert.equal(where.departureDate, undefined);
    assert.equal(window, null);
    assert.deepEqual(where.driverAssignments, {
      some: { driverProfileId: "drv_1" },
    });
  });

  it("past ARRIVED trips fall outside default window (chip/list parity premise)", () => {
    const { where } = buildOperatorTripWhere({
      companyId: "co_1",
      status: "ARRIVED",
      now,
    });
    const dep = where.departureDate as { gte: Date; lte: Date };
    const pastArrived = new Date("2026-09-01T08:00:00.000Z");
    assert.ok(pastArrived < dep.gte);
  });
});

describe("sumStatusCounts", () => {
  it("sums all status buckets for the All badge", () => {
    assert.equal(
      sumStatusCounts({ SCHEDULED: 10, BOARDING: 1, ARRIVED: 2 }),
      13,
    );
    assert.equal(sumStatusCounts({}), 0);
  });
});
