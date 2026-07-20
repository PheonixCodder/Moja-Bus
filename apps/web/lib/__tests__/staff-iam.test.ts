import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  assertCanGrant,
  getEffectivePermissions,
  hasPermission,
  ROLE_TEMPLATES,
  PERMISSION_KEYS,
} from "@moja/schemas";

describe("staff IAM — effective permissions", () => {
  it("OWNER bypasses stored list and gets the full catalog", () => {
    const effective = getEffectivePermissions("OWNER", []);
    assert.equal(effective.length, PERMISSION_KEYS.length);
    assert.equal(hasPermission("OWNER", [], "staff:invite"), true);
    assert.equal(hasPermission("OWNER", [], "withdrawals:create"), true);
  });

  it("non-OWNER uses only stored valid keys", () => {
    const stored = ["bookings:read", "trips:read", "not:a:key"];
    const effective = getEffectivePermissions("SUPPORT", stored);
    assert.deepEqual(effective, ["bookings:read", "trips:read"]);
    assert.equal(hasPermission("SUPPORT", stored, "bookings:read"), true);
    assert.equal(hasPermission("SUPPORT", stored, "staff:invite"), false);
  });
});

describe("staff IAM — grant subset rule", () => {
  it("OWNER may grant any catalog key", () => {
    const result = assertCanGrant("OWNER", [], ["staff:invite", "revenue:view"]);
    assert.equal(result.ok, true);
  });

  it("rejects escalation beyond the actor's own permissions", () => {
    const actor = ROLE_TEMPLATES.OPERATIONS;
    const result = assertCanGrant("OPERATIONS", actor, [
      "bookings:read",
      "staff:invite",
    ]);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.missing.includes("staff:invite"));
    }
  });

  it("allows grants that are a subset of the actor's permissions", () => {
    const actor = ROLE_TEMPLATES.MANAGER;
    const result = assertCanGrant("MANAGER", actor, [
      "bookings:read",
      "trips:read",
    ]);
    assert.equal(result.ok, true);
  });
});

describe("staff IAM — invite template seeding", () => {
  it("OPERATIONS template has no staff or financial write keys", () => {
    const ops = new Set(ROLE_TEMPLATES.OPERATIONS);
    assert.equal(ops.has("staff:invite"), false);
    assert.equal(ops.has("withdrawals:create"), false);
    assert.equal(ops.has("trips:update"), true);
  });
});
