import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADMIN_ROLE_TEMPLATES,
  ADMIN_PERMISSION_KEYS,
  ADMIN_PERMISSION_META,
  hasAdminPermission,
  assertAdminCanGrant,
  getAdminTemplatePermissions,
  getAdminEffectivePermissions,
  isAdminPermissionKey,
} from "@moja/schemas";

describe("admin permissions — effective permissions", () => {
  it("SUPER_ADMIN bypasses stored list and gets the full catalog", () => {
    const effective = getAdminEffectivePermissions("SUPER_ADMIN", []);
    assert.equal(effective.length, ADMIN_PERMISSION_KEYS.length);
    assert.equal(hasAdminPermission("SUPER_ADMIN", [], "admin-staff:invite"), true);
    assert.equal(hasAdminPermission("SUPER_ADMIN", [], "audit:read"), true);
  });

  it("non-SUPER_ADMIN only retains valid stored keys", () => {
    const stored = ["audit:read", "users:read", "not:valid"];
    const effective = getAdminEffectivePermissions("FINANCE", stored);
    assert.deepEqual(effective, ["audit:read", "users:read"]);
    assert.equal(hasAdminPermission("FINANCE", stored, "audit:read"), true);
    assert.equal(hasAdminPermission("FINANCE", stored, "staff:invite"), false);
  });

  it("SUPER_ADMIN template is empty but template accessor returns full catalog", () => {
    assert.deepEqual(ADMIN_ROLE_TEMPLATES.SUPER_ADMIN, []);
    assert.equal(
      getAdminTemplatePermissions("SUPER_ADMIN").length,
      ADMIN_PERMISSION_KEYS.length,
    );
  });
});

describe("admin permissions — grant subset rule", () => {
  it("SUPER_ADMIN may grant any catalog key", () => {
    const result = assertAdminCanGrant("SUPER_ADMIN", [], [
      "admin-staff:invite",
      "platform:withdrawals:resolve",
    ]);
    assert.equal(result.ok, true);
  });

  it("rejects escalation beyond the actor's own permissions", () => {
    const actor = ADMIN_ROLE_TEMPLATES.FINANCE;
    const result = assertAdminCanGrant("FINANCE", actor, [
      "audit:read",
      "admin-staff:invite",
    ]);
    assert.equal(result.ok, false);
    if (!result.ok) {
      assert.ok(result.missing.includes("admin-staff:invite"));
    }
  });

  it("allows grants that are a subset of the actor's permissions", () => {
    const actor = ADMIN_ROLE_TEMPLATES.ADMIN;
    const result = assertAdminCanGrant("ADMIN", actor, [
      "users:read",
      "audit:read",
    ]);
    assert.equal(result.ok, true);
  });
});

describe("admin permissions — role template seeding", () => {
  it("FINANCE template has no staff management or trip management keys", () => {
    const fin = new Set(ADMIN_ROLE_TEMPLATES.FINANCE);
    assert.equal(fin.has("admin-staff:invite"), false);
    assert.equal(fin.has("platform:trips:manage"), false);
    assert.equal(fin.has("platform:withdrawals:resolve"), true);
    assert.equal(fin.has("platform:ledger:read"), true);
  });

  it("SUPPORT template has no financial or write keys", () => {
    const sup = new Set(ADMIN_ROLE_TEMPLATES.SUPPORT);
    assert.equal(sup.has("platform:ledger:read"), false);
    assert.equal(sup.has("admin-staff:update"), false);
    assert.equal(sup.has("support:inquiries:respond"), true);
  });

  it("OPERATIONS template includes operations but not finance or staff", () => {
    const ops = new Set(ADMIN_ROLE_TEMPLATES.OPERATIONS);
    assert.equal(ops.has("platform:trips:manage"), true);
    assert.equal(ops.has("platform:ledger:read"), false);
    assert.equal(ops.has("admin-staff:invite"), false);
  });
});

describe("admin permissions — catalog integrity", () => {
  it("every metadata entry defines a valid permission key", () => {
    for (const key of Object.keys(ADMIN_PERMISSION_META)) {
      assert.equal(isAdminPermissionKey(key), true);
      assert.ok(ADMIN_PERMISSION_META[key].group.length > 0);
      assert.ok(ADMIN_PERMISSION_META[key].label.length > 0);
    }
  });
});