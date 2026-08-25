/**
 * Sole executable specification of the Operator StaffRole hierarchy (Phase 01 / D5-A).
 *
 * Consolidates the deleted `apps/web/features/operator/lib/__tests__/staff-hierarchy.test.ts`
 * and asserts the SHIPPED model — deliberately reversed from the pre-DRIVER draft:
 * DISPATCHER(350) outranks OPERATIONS(300), OPERATIONS can assign only DRIVER,
 * MANAGER assigns [SUPPORT, TREASURY, DISPATCHER, CONDUCTOR, DRIVER].
 * If you dispute the model itself, that is a code change in a dedicated phase —
 * do not edit these expectations to match a local change without that ruling.
 */
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ASSIGNABLE_ROLES,
  assertCanGrant,
  canAssignRole,
  canModifyMember,
  getRoleLevel,
  getTemplatePermissions,
  hasPermission,
  isPermissionKey,
  PERMISSION_META,
  ROLE_LEVELS,
  ROLE_TEMPLATES,
  STAFF_ROLES,
} from "@moja/schemas";

describe("Role Hierarchy and Permissions", () => {
  it("includes all shipped roles in STAFF_ROLES", () => {
    for (const role of [
      "OWNER",
      "ADMIN",
      "MANAGER",
      "OPERATIONS",
      "FINANCE",
      "SUPPORT",
      "TREASURY",
      "DISPATCHER",
      "CONDUCTOR",
      "DRIVER",
    ]) {
      assert.ok(STAFF_ROLES.includes(role as (typeof STAFF_ROLES)[number]));
    }
    assert.ok(!STAFF_ROLES.includes("VIEWER" as (typeof STAFF_ROLES)[number])); // VIEWER was removed per decision
  });

  it("has exact role levels including DRIVER and the DISPATCHER reversal", () => {
    assert.equal(getRoleLevel("OWNER"), 600);
    assert.equal(getRoleLevel("ADMIN"), 500);
    assert.equal(getRoleLevel("MANAGER"), 400);
    assert.equal(getRoleLevel("DISPATCHER"), 350); // deliberately ABOVE OPERATIONS
    assert.equal(getRoleLevel("OPERATIONS"), 300);
    assert.equal(getRoleLevel("CONDUCTOR"), 275);
    assert.equal(getRoleLevel("TREASURY"), 260);
    assert.equal(getRoleLevel("FINANCE"), 250);
    assert.equal(getRoleLevel("SUPPORT"), 200);
    assert.equal(getRoleLevel("DRIVER"), 150); // lowest — placeholder accounts
    assert.equal(getRoleLevel("UNKNOWN"), 0);

    // The maps stay in sync with each other.
    for (const [role, level] of Object.entries(ROLE_LEVELS)) {
      assert.equal(getRoleLevel(role), level);
    }
  });

  it("has correct shipped hierarchy ordering", () => {
    // OWNER > ADMIN > MANAGER > DISPATCHER > OPERATIONS > CONDUCTOR > TREASURY > FINANCE > SUPPORT > DRIVER
    assert.ok(getRoleLevel("OWNER") > getRoleLevel("ADMIN"));
    assert.ok(getRoleLevel("ADMIN") > getRoleLevel("MANAGER"));
    assert.ok(getRoleLevel("MANAGER") > getRoleLevel("DISPATCHER"));
    assert.ok(getRoleLevel("DISPATCHER") > getRoleLevel("OPERATIONS")); // reversed vs pre-DRIVER draft
    assert.ok(getRoleLevel("OPERATIONS") > getRoleLevel("CONDUCTOR"));
    assert.ok(getRoleLevel("CONDUCTOR") > getRoleLevel("TREASURY"));
    assert.ok(getRoleLevel("TREASURY") > getRoleLevel("FINANCE"));
    assert.ok(getRoleLevel("FINANCE") > getRoleLevel("SUPPORT"));
    assert.ok(getRoleLevel("SUPPORT") > getRoleLevel("DRIVER"));
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

  it("DRIVER template is narrow with zero ERP-write access", () => {
    // Phase 17 D2 invariant: placeholder driver accounts get dispatch/runtime reads only.
    assert.deepEqual([...ROLE_TEMPLATES.DRIVER].sort(), [
      "bookings:checkin",
      "bookings:read",
      "reviews:read",
      "telemetry:stream",
      "trips:read",
    ]);
    for (const forbidden of [
      "drivers:update",
      "drivers:verify",
      "fleet:update",
      "company:delete",
      "withdrawals:create",
    ]) {
      assert.ok(!ROLE_TEMPLATES.DRIVER.includes(forbidden as never));
    }
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

  it("ASSIGNABLE_ROLES matches the shipped map exactly", () => {
    assert.deepEqual(ASSIGNABLE_ROLES.OWNER.slice().sort(), [
      "ADMIN",
      "CONDUCTOR",
      "DISPATCHER",
      "DRIVER",
      "FINANCE",
      "MANAGER",
      "OPERATIONS",
      "SUPPORT",
      "TREASURY",
    ]);
    assert.deepEqual(ASSIGNABLE_ROLES.ADMIN.slice().sort(), [
      "CONDUCTOR",
      "DISPATCHER",
      "DRIVER",
      "FINANCE",
      "MANAGER",
      "SUPPORT",
      "TREASURY",
    ]);
    assert.deepEqual(ASSIGNABLE_ROLES.MANAGER.slice().sort(), [
      "CONDUCTOR",
      "DISPATCHER",
      "DRIVER",
      "SUPPORT",
      "TREASURY",
    ]);
    // Deliberate reversal: OPERATIONS assigns ONLY drivers.
    assert.deepEqual(ASSIGNABLE_ROLES.OPERATIONS, ["DRIVER"]);
    for (const role of [
      "FINANCE",
      "SUPPORT",
      "TREASURY",
      "DISPATCHER",
      "CONDUCTOR",
      "DRIVER",
    ] as const) {
      assert.deepEqual(
        ASSIGNABLE_ROLES[role],
        [],
        `${role} must assign nothing`,
      );
    }
    // Nobody ever assigns their own role or above except via explicit listing.
    assert.ok(!ASSIGNABLE_ROLES.OWNER.includes("OWNER"));
    assert.ok(!ASSIGNABLE_ROLES.ADMIN.includes("ADMIN"));
  });

  it("canAssignRole allows OWNER to assign every other role", () => {
    assert.ok(canAssignRole("OWNER", "TREASURY"));
    assert.ok(canAssignRole("OWNER", "DISPATCHER"));
    assert.ok(canAssignRole("OWNER", "CONDUCTOR"));
    assert.ok(canAssignRole("OWNER", "DRIVER"));
    assert.ok(!canAssignRole("OWNER", "OWNER"));
  });

  it("canAssignRole allows ADMIN to assign its listed roles but not OWNER/ADMIN", () => {
    assert.ok(canAssignRole("ADMIN", "TREASURY"));
    assert.ok(canAssignRole("ADMIN", "DISPATCHER"));
    assert.ok(canAssignRole("ADMIN", "DRIVER"));
    assert.ok(!canAssignRole("ADMIN", "OWNER"));
    assert.ok(!canAssignRole("ADMIN", "ADMIN"));
  });

  it("canAssignRole gives MANAGER its five roles but not OPERATIONS or above", () => {
    assert.ok(canAssignRole("MANAGER", "TREASURY"));
    assert.ok(canAssignRole("MANAGER", "DISPATCHER"));
    assert.ok(canAssignRole("MANAGER", "DRIVER"));
    assert.ok(!canAssignRole("MANAGER", "OPERATIONS"));
    assert.ok(!canAssignRole("MANAGER", "ADMIN"));
    assert.ok(!canAssignRole("MANAGER", "MANAGER"));
  });

  it("OPERATIONS can assign DRIVER and nothing else", () => {
    assert.ok(canAssignRole("OPERATIONS", "DRIVER"));
    assert.ok(!canAssignRole("OPERATIONS", "SUPPORT"));
    assert.ok(!canAssignRole("OPERATIONS", "TREASURY"));
    assert.ok(!canAssignRole("OPERATIONS", "DISPATCHER"));
    assert.ok(!canAssignRole("OPERATIONS", "OPERATIONS"));
  });

  it("canModifyMember is strict-greater on levels, honoring the DISPATCHER reversal", () => {
    assert.ok(canModifyMember("DISPATCHER", "OPERATIONS")); // 350 > 300 — reversed vs draft
    assert.ok(!canModifyMember("OPERATIONS", "DISPATCHER"));
    assert.ok(canModifyMember("OPERATIONS", "DRIVER")); // 300 > 150
    assert.ok(canModifyMember("OWNER", "ADMIN"));
    assert.ok(canModifyMember("ADMIN", "MANAGER"));
    assert.ok(canModifyMember("DISPATCHER", "TREASURY"));
    assert.ok(canModifyMember("CONDUCTOR", "SUPPORT"));
    assert.ok(!canModifyMember("FINANCE", "CONDUCTOR"));
    assert.ok(!canModifyMember("SUPPORT", "FINANCE"));
    assert.ok(!canModifyMember("DRIVER", "SUPPORT")); // lowest role modifies nobody
    assert.ok(!canModifyMember("DRIVER", "OWNER"));
  });

  it("canModifyMember prevents same-role modification everywhere", () => {
    for (const role of STAFF_ROLES) {
      assert.ok(
        !canModifyMember(role, role),
        `${role} must not modify ${role}`,
      );
    }
  });

  it("hasPermission works for new keys", () => {
    assert.ok(hasPermission("ADMIN", ["revenue:export"], "revenue:export"));
    assert.ok(
      hasPermission("TREASURY", ["withdrawals:create"], "withdrawals:create"),
    );
    assert.ok(
      hasPermission("DISPATCHER", ["trips:dispatch"], "trips:dispatch"),
    );
    assert.ok(
      hasPermission("CONDUCTOR", ["bookings:checkin"], "bookings:checkin"),
    );
    assert.ok(
      hasPermission("DRIVER", ["bookings:checkin"], "bookings:checkin"),
    );
    assert.ok(
      !hasPermission("FINANCE", ["withdrawals:view"], "withdrawals:create"),
    );
    assert.ok(
      !hasPermission("DISPATCHER", ["trips:dispatch"], "bookings:checkin"),
    );
    assert.ok(!hasPermission("DRIVER", ["telemetry:stream"], "drivers:update"));
  });

  it("assertCanGrant rejects granting permissions not in actor's set", () => {
    const result = assertCanGrant(
      "TREASURY",
      ["withdrawals:view"],
      ["withdrawals:create", "revenue:export"],
    );
    assert.ok(!result.ok);
    assert.ok(result.missing.includes("withdrawals:create"));
    assert.ok(result.missing.includes("revenue:export"));
  });

  it("assertCanGrant allows granting permissions actor holds", () => {
    const result = assertCanGrant(
      "TREASURY",
      ["withdrawals:view", "withdrawals:create"],
      ["withdrawals:create"],
    );
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
    assert.ok(isPermissionKey("telemetry:stream"));
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
