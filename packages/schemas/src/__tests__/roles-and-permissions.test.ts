import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  STAFF_ROLES,
  ROLE_TEMPLATES,
  ROLE_LEVELS,
  ASSIGNABLE_ROLES,
  PERMISSION_META,
  getRoleLevel,
  canAssignRole,
  canModifyMember,
  getTemplatePermissions,
  hasPermission,
  assertCanGrant,
  isPermissionKey,
} from "@moja/schemas";

describe("Role Hierarchy and Permissions", () => {
  it("includes all new roles in STAFF_ROLES", () => {
    assert.ok(STAFF_ROLES.includes("TREASURY"));
    assert.ok(STAFF_ROLES.includes("DISPATCHER"));
    assert.ok(STAFF_ROLES.includes("CONDUCTOR"));
    assert.ok(!STAFF_ROLES.includes("VIEWER")); // VIEWER was removed per decision
  });

  it("has correct role levels for new roles", () => {
    assert.equal(getRoleLevel("TREASURY"), 260);
    assert.equal(getRoleLevel("DISPATCHER"), 350);
    assert.equal(getRoleLevel("CONDUCTOR"), 275);
    assert.equal(getRoleLevel("FINANCE"), 250);
    assert.equal(getRoleLevel("SUPPORT"), 200);
  });

  it("has correct role hierarchy ordering", () => {
    // OWNER > ADMIN > MANAGER > OPERATIONS > DISPATCHER > TREASURY > CONDUCTOR > FINANCE > SUPPORT
    assert.ok(getRoleLevel("OWNER") > getRoleLevel("ADMIN"));
    assert.ok(getRoleLevel("ADMIN") > getRoleLevel("MANAGER"));
    assert.ok(getRoleLevel("MANAGER") > getRoleLevel("OPERATIONS"));
    assert.ok(getRoleLevel("OPERATIONS") > getRoleLevel("DISPATCHER"));
    assert.ok(getRoleLevel("DISPATCHER") > getRoleLevel("TREASURY"));
    assert.ok(getRoleLevel("TREASURY") > getRoleLevel("CONDUCTOR"));
    assert.ok(getRoleLevel("CONDUCTOR") > getRoleLevel("FINANCE"));
    assert.ok(getRoleLevel("FINANCE") > getRoleLevel("SUPPORT"));
  });

  it("has new permission keys in PERMISSION_META", () => {
    assert.ok("revenue:export" in PERMISSION_META);
    assert.ok("terminals:geocapture" in PERMISSION_META);
    assert.ok("company:delete" in PERMISSION_META);
    assert.ok("company:profile:update" in PERMISSION_META);
    assert.ok("company:banking:update" in PERMISSION_META);
    assert.ok("company:compliance:update" in PERMISSION_META);
    assert.ok("trips:dispatch" in PERMISSION_META);
    assert.ok("bookings:checkin" in PERMISSION_META);
    assert.ok(!("company:update" in PERMISSION_META)); // old key removed
  });

  it("TREASURY template includes withdrawals:create and revenue:export but not withdrawals:view only", () => {
    const treasuryPerms = ROLE_TEMPLATES.TREASURY;
    assert.ok(treasuryPerms.includes("withdrawals:create"));
    assert.ok(treasuryPerms.includes("revenue:export"));
    assert.ok(treasuryPerms.includes("withdrawals:view"));
    assert.ok(treasuryPerms.includes("financials:view"));
    assert.ok(treasuryPerms.includes("revenue:view"));
  });

  it("FINANCE template does NOT include withdrawals:create", () => {
    const financePerms = ROLE_TEMPLATES.FINANCE;
    assert.ok(!financePerms.includes("withdrawals:create"));
    assert.ok(financePerms.includes("withdrawals:view"));
    assert.ok(financePerms.includes("revenue:export"));
  });

  it("DISPATCHER template includes trips:dispatch but not bookings:checkin", () => {
    const dispatcherPerms = ROLE_TEMPLATES.DISPATCHER;
    assert.ok(dispatcherPerms.includes("trips:dispatch"));
    assert.ok(dispatcherPerms.includes("trips:update"));
    assert.ok(!dispatcherPerms.includes("bookings:checkin"));
    assert.ok(!dispatcherPerms.includes("bookings:update"));
  });

  it("CONDUCTOR template includes bookings:checkin but not trips:dispatch", () => {
    const conductorPerms = ROLE_TEMPLATES.CONDUCTOR;
    assert.ok(conductorPerms.includes("bookings:checkin"));
    assert.ok(conductorPerms.includes("bookings:update"));
    assert.ok(!conductorPerms.includes("trips:dispatch"));
    assert.ok(!conductorPerms.includes("trips:update"));
  });

  it("ADMIN template includes all new keys", () => {
    const adminPerms = ROLE_TEMPLATES.ADMIN;
    assert.ok(adminPerms.includes("revenue:export"));
    assert.ok(adminPerms.includes("terminals:geocapture"));
    assert.ok(adminPerms.includes("company:delete"));
    assert.ok(adminPerms.includes("company:profile:update"));
    assert.ok(adminPerms.includes("company:banking:update"));
    assert.ok(adminPerms.includes("company:compliance:update"));
    assert.ok(adminPerms.includes("trips:dispatch"));
    assert.ok(adminPerms.includes("bookings:cancel"));
    assert.ok(!adminPerms.includes("company:update")); // old key removed
  });

  it("MANAGER template does NOT include *_delete keys", () => {
    const managerPerms = ROLE_TEMPLATES.MANAGER;
    assert.ok(!managerPerms.includes("fleet:delete"));
    assert.ok(!managerPerms.includes("routes:delete"));
    assert.ok(!managerPerms.includes("terminals:delete"));
    assert.ok(!managerPerms.includes("schedules:delete"));
  });

  it("canAssignRole allows OWNER to assign all new roles", () => {
    assert.ok(canAssignRole("OWNER", "TREASURY"));
    assert.ok(canAssignRole("OWNER", "DISPATCHER"));
    assert.ok(canAssignRole("OWNER", "CONDUCTOR"));
  });

  it("canAssignRole allows ADMIN to assign all new roles", () => {
    assert.ok(canAssignRole("ADMIN", "TREASURY"));
    assert.ok(canAssignRole("ADMIN", "DISPATCHER"));
    assert.ok(canAssignRole("ADMIN", "CONDUCTOR"));
  });

  it("canAssignRole allows MANAGER to assign new roles below MANAGER", () => {
    assert.ok(canAssignRole("MANAGER", "TREASURY"));
    assert.ok(canAssignRole("MANAGER", "DISPATCHER"));
    assert.ok(canAssignRole("MANAGER", "CONDUCTOR"));
    assert.ok(!canAssignRole("MANAGER", "ADMIN"));
    assert.ok(!canAssignRole("MANAGER", "OPERATIONS"));
  });

  it("canModifyMember respects new role levels", () => {
    // DISPATCHER (350) > TREASURY (260) > CONDUCTOR (275) > FINANCE (250) > SUPPORT (200)
    assert.ok(canModifyMember("DISPATCHER", "TREASURY"));
    assert.ok(canModifyMember("TREASURY", "FINANCE"));
    assert.ok(canModifyMember("CONDUCTOR", "SUPPORT"));
    assert.ok(!canModifyMember("FINANCE", "CONDUCTOR"));
    assert.ok(!canModifyMember("SUPPORT", "FINANCE"));
  });

  it("hasPermission works for new keys", () => {
    assert.ok(hasPermission("ADMIN", ["revenue:export"], "revenue:export"));
    assert.ok(hasPermission("TREASURY", ["withdrawals:create"], "withdrawals:create"));
    assert.ok(hasPermission("DISPATCHER", ["trips:dispatch"], "trips:dispatch"));
    assert.ok(hasPermission("CONDUCTOR", ["bookings:checkin"], "bookings:checkin"));
    assert.ok(!hasPermission("FINANCE", ["withdrawals:view"], "withdrawals:create"));
    assert.ok(!hasPermission("DISPATCHER", ["trips:dispatch"], "bookings:checkin"));
  });

  it("assertCanGrant rejects granting permissions not in actor's set", () => {
    const result = assertCanGrant("TREASURY", ["withdrawals:view"], ["withdrawals:create", "revenue:export"]);
    assert.ok(!result.ok);
    assert.ok(result.missing.includes("withdrawals:create"));
    assert.ok(result.missing.includes("revenue:export"));
  });

  it("assertCanGrant allows granting permissions actor holds", () => {
    const result = assertCanGrant("TREASURY", ["withdrawals:view", "withdrawals:create"], ["withdrawals:create"]);
    assert.ok(result.ok);
  });

  it("isPermissionKey returns true for new keys", () => {
    assert.ok(isPermissionKey("revenue:export"));
    assert.ok(isPermissionKey("terminals:geocapture"));
    assert.ok(isPermissionKey("company:delete"));
    assert.ok(isPermissionKey("company:profile:update"));
    assert.ok(isPermissionKey("company:banking:update"));
    assert.ok(isPermissionKey("company:compliance:update"));
    assert.ok(isPermissionKey("trips:dispatch"));
    assert.ok(isPermissionKey("bookings:checkin"));
  });

  it("isPermissionKey returns false for removed key", () => {
    assert.ok(!isPermissionKey("company:update"));
  });

  it("getTemplatePermissions returns all keys for OWNER", () => {
    const ownerPerms = getTemplatePermissions("OWNER");
    assert.ok(ownerPerms.includes("revenue:export"));
    assert.ok(ownerPerms.includes("terminals:geocapture"));
    assert.ok(ownerPerms.includes("company:delete"));
  });
});