import assert from "node:assert/strict";
import { describe, test } from "node:test";
import {
  SALES_CUTOFF_MINUTES,
  isPastSalesCutoff,
  salesCutoffInstant,
} from "../sales-cutoff";

describe("sales-cutoff", () => {
  test("cutoff is 30 minutes", () => {
    assert.equal(SALES_CUTOFF_MINUTES, 30);
  });

  test("salesCutoffInstant adds exactly the cutoff to now", () => {
    const now = new Date("2026-08-02T14:00:00.000Z");
    assert.deepEqual(
      salesCutoffInstant(now),
      new Date("2026-08-02T14:30:00.000Z"),
    );
  });

  test("isPastSalesCutoff: departure before the cutoff instant -> closed", () => {
    const now = new Date("2026-08-02T14:00:00.000Z");
    // Departs after `now` but before the 14:30 cutoff -> sales already closed.
    assert.equal(
      isPastSalesCutoff(new Date("2026-08-02T14:29:59.999Z"), now),
      true,
    );
    assert.equal(
      isPastSalesCutoff(new Date("2026-08-02T09:00:00.000Z"), now),
      true,
    );
  });

  test("isPastSalesCutoff: departure exactly at the cutoff -> still bookable", () => {
    const now = new Date("2026-08-02T14:00:00.000Z");
    assert.equal(
      isPastSalesCutoff(new Date("2026-08-02T14:30:00.000Z"), now),
      false,
    );
  });

  test("isPastSalesCutoff: departure after the cutoff -> bookable", () => {
    const now = new Date("2026-08-02T14:00:00.000Z");
    assert.equal(
      isPastSalesCutoff(new Date("2026-08-02T16:00:00.000Z"), now),
      false,
    );
  });

  test("isPastSalesCutoff defaults to real clock time", () => {
    const departed = new Date(Date.now() - 60 * 60 * 1000); // 1 h ago
    const upcoming = new Date(Date.now() + 2 * 60 * 60 * 1000); // 2 h ahead
    assert.equal(isPastSalesCutoff(departed), true);
    assert.equal(isPastSalesCutoff(upcoming), false);
  });
});
