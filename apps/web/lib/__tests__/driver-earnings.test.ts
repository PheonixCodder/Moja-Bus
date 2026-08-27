import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  DEFAULT_DRIVER_PAY_RATE_XOF_PER_MINUTE,
  earningsFromMinutes,
  mondayStartUtc,
  openShiftAccrualMinutes,
  utcMidnight,
} from "../driver-earnings";

describe("utcMidnight (Phase 31 / F-DV-11 window boundaries)", () => {
  it("floors to UTC midnight — Abidjan local midnight in prod", () => {
    const now = new Date("2026-08-25T14:37:22.481Z");
    assert.equal(utcMidnight(now).toISOString(), "2026-08-25T00:00:00.000Z");
  });

  it("is idempotent at midnight itself", () => {
    const now = new Date("2026-01-01T00:00:00.000Z");
    assert.equal(utcMidnight(now).toISOString(), "2026-01-01T00:00:00.000Z");
  });
});

describe("mondayStartUtc (ISO week start, replacing Sunday-start)", () => {
  const cases: Array<[string, string]> = [
    // A Monday floors to itself.
    ["2026-08-24T09:15:00.000Z", "2026-08-24T00:00:00.000Z"],
    // Midweek rolls back to that same Monday.
    ["2026-08-26T23:59:59.999Z", "2026-08-24T00:00:00.000Z"],
    // Sunday (getUTCDay()=0) belongs to the PREVIOUS Monday.
    ["2026-08-30T12:00:00.000Z", "2026-08-24T00:00:00.000Z"],
    // Year-boundary: 2027-01-01 is a Friday → Monday 2026-12-28.
    ["2027-01-01T10:00:00.000Z", "2026-12-28T00:00:00.000Z"],
  ];

  for (const [input, expected] of cases) {
    it(`${input} → ${expected}`, () => {
      assert.equal(mondayStartUtc(new Date(input)).toISOString(), expected);
    });
  }
});

describe("openShiftAccrualMinutes (open shift no longer pays 0)", () => {
  it("accrues live minutes from startedAt", () => {
    const start = new Date("2026-08-25T08:00:00.000Z");
    const now = new Date("2026-08-25T11:07:30.000Z");
    assert.equal(openShiftAccrualMinutes(start, now), 187);
  });

  it("floors partial minutes", () => {
    const start = new Date("2026-08-25T08:00:59.000Z");
    const now = new Date("2026-08-25T08:01:58.000Z");
    assert.equal(openShiftAccrualMinutes(start, now), 0);
  });

  it("never pays negative money on clock skew", () => {
    const start = new Date("2026-08-25T08:10:00.000Z");
    const now = new Date("2026-08-25T08:05:00.000Z");
    assert.equal(openShiftAccrualMinutes(start, now), 0);
  });
});

describe("earningsFromMinutes", () => {
  it("applies the rate and rounds half-up", () => {
    assert.equal(
      earningsFromMinutes(120, DEFAULT_DRIVER_PAY_RATE_XOF_PER_MINUTE),
      6000,
    );
    assert.equal(earningsFromMinutes(3, 50), 150);
    assert.equal(earningsFromMinutes(1, 55), 55);
  });
});
