import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  canOperateRuns,
  isLicenseUsableThrough,
  licenseExpiryStatus,
} from "../drivers";

/**
 * Phase 14 (F-OP-03/F-DV-12) — licence gate contracts.
 */

const NOW = new Date("2026-08-24T12:00:00Z");
const days = (n: number) => new Date(NOW.getTime() + n * 86_400_000);

describe("isLicenseUsableThrough", () => {
  it("passes when valid through the trip end", () => {
    assert.equal(isLicenseUsableThrough(days(10), days(5)), true);
  });

  it("fails when it lapses BEFORE the trip ends — even if valid today", () => {
    // The Monday-assignment/Sunday-run trap: expiry is future, trip outlasts it.
    assert.equal(isLicenseUsableThrough(days(3), days(5)), false);
  });

  it("treats exact-day expiry as usable through that day", () => {
    assert.equal(isLicenseUsableThrough(days(5), days(5)), true);
  });

  it("fails outright-expired licences and passes missing data", () => {
    assert.equal(isLicenseUsableThrough(days(-1), days(0)), false);
    assert.equal(isLicenseUsableThrough(null, days(0)), true);
    assert.equal(isLicenseUsableThrough(undefined, NOW), true);
  });
});

describe("licenseExpiryStatus (badge state)", () => {
  it("VALID beyond 30 days and for unknown data", () => {
    assert.equal(licenseExpiryStatus(days(31), NOW), "VALID");
    assert.equal(licenseExpiryStatus(null, NOW), "VALID");
  });

  it("EXPIRING_SOON inside the 30-day window", () => {
    assert.equal(licenseExpiryStatus(days(30), NOW), "EXPIRING_SOON");
    assert.equal(licenseExpiryStatus(days(1), NOW), "EXPIRING_SOON");
  });

  it("EXPIRED in the past", () => {
    assert.equal(licenseExpiryStatus(days(-1), NOW), "EXPIRED");
  });
});

describe("canOperateRuns (F-DV-15 runtime policy)", () => {
  it("only VERIFIED may operate", () => {
    assert.equal(canOperateRuns("VERIFIED"), true);
    for (const s of ["PENDING", "REJECTED", "EXPIRED", "SUSPENDED"]) {
      assert.equal(canOperateRuns(s), false, `${s} must not operate`);
    }
  });
});
