import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { toLocalISODate } from "../local-date";

describe("toLocalISODate", () => {
  test("formats local date components, not UTC", () => {
    const d = new Date(2026, 7, 2, 23, 30, 0);
    assert.equal(toLocalISODate(d), "2026-08-02");
  });

  test("pads month and day", () => {
    assert.equal(toLocalISODate(new Date(2026, 0, 5)), "2026-01-05");
  });
});
