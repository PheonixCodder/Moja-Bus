import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ASSIGNABLE_ROLES,
  ROLE_LEVELS,
  canAssignRole,
  canModifyMember,
  getRoleLevel,
  type StaffRole,
} from "@moja/schemas";

describe("Staff Hierarchy Functions", () => {
  describe("ASSIGNABLE_ROLES", () => {
    it("OWNER can assign all roles including new ones", () => {
      const assignable = ASSIGNABLE_ROLES.OWNER;
      assert.ok(assignable.includes("TREASURY"));
      assert.ok(assignable.includes("DISPATCHER"));
      assert.ok(assignable.includes("CONDUCTOR"));
      assert.ok(assignable.includes("ADMIN"));
      assert.ok(assignable.includes("MANAGER"));
      assert.ok(assignable.includes("OPERATIONS"));
      assert.ok(assignable.includes("FINANCE"));
      assert.ok(assignable.includes("SUPPORT"));
    });

    it("ADMIN can assign all roles except OWNER", () => {
      const assignable = ASSIGNABLE_ROLES.ADMIN;
      assert.ok(assignable.includes("TREASURY"));
      assert.ok(assignable.includes("DISPATCHER"));
      assert.ok(assignable.includes("CONDUCTOR"));
      assert.ok(assignable.includes("MANAGER"));
      assert.ok(assignable.includes("OPERATIONS"));
      assert.ok(assignable.includes("FINANCE"));
      assert.ok(assignable.includes("SUPPORT"));
      assert.ok(!assignable.includes("OWNER"));
      assert.ok(!assignable.includes("ADMIN"));
    });

    it("MANAGER can assign roles below MANAGER level", () => {
      const assignable = ASSIGNABLE_ROLES.MANAGER;
      assert.ok(assignable.includes("TREASURY"));
      assert.ok(assignable.includes("DISPATCHER"));
      assert.ok(assignable.includes("CONDUCTOR"));
      assert.ok(assignable.includes("OPERATIONS"));
      assert.ok(assignable.includes("FINANCE"));
      assert.ok(assignable.includes("SUPPORT"));
      assert.ok(!assignable.includes("ADMIN"));
      assert.ok(!assignable.includes("MANAGER"));
      assert.ok(!assignable.includes("OWNER"));
    });

    it("OPERATIONS cannot assign any roles", () => {
      const assignable = ASSIGNABLE_ROLES.OPERATIONS;
      assert.equal(assignable.length, 0);
    });
  });

  describe("ROLE_LEVELS", () => {
    it("has correct levels for new roles", () => {
      assert.equal(ROLE_LEVELS.TREASURY, 260);
      assert.equal(ROLE_LEVELS.DISPATCHER, 350);
      assert.equal(ROLE_LEVELS.CONDUCTOR, 275);
    });

    it("maintains correct hierarchy order", () => {
      assert.ok(ROLE_LEVELS.OWNER > ROLE_LEVELS.ADMIN);
      assert.ok(ROLE_LEVELS.ADMIN > ROLE_LEVELS.MANAGER);
      assert.ok(ROLE_LEVELS.MANAGER > ROLE_LEVELS.OPERATIONS);
      assert.ok(ROLE_LEVELS.OPERATIONS > ROLE_LEVELS.DISPATCHER);
      assert.ok(ROLE_LEVELS.DISPATCHER > ROLE_LEVELS.TREASURY);
      assert.ok(ROLE_LEVELS.TREASURY > ROLE_LEVELS.CONDUCTOR);
      assert.ok(ROLE_LEVELS.CONDUCTOR > ROLE_LEVELS.FINANCE);
      assert.ok(ROLE_LEVELS.FINANCE > ROLE_LEVELS.SUPPORT);
    });
  });

  describe("getRoleLevel", () => {
    it("returns correct level for known roles", () => {
      assert.equal(getRoleLevel("OWNER"), 600);
      assert.equal(getRoleLevel("ADMIN"), 500);
      assert.equal(getRoleLevel("MANAGER"), 400);
      assert.equal(getRoleLevel("OPERATIONS"), 300);
      assert.equal(getRoleLevel("DISPATCHER"), 350);
      assert.equal(getRoleLevel("TREASURY"), 260);
      assert.equal(getRoleLevel("CONDUCTOR"), 275);
      assert.equal(getRoleLevel("FINANCE"), 250);
      assert.equal(getRoleLevel("SUPPORT"), 200);
    });

    it("returns 0 for unknown roles", () => {
      assert.equal(getRoleLevel("UNKNOWN"), 0);
    });
  });

  describe("canAssignRole", () => {
    it("allows OWNER to assign any role", () => {
      assert.ok(canAssignRole("OWNER", "TREASURY"));
      assert.ok(canAssignRole("OWNER", "DISPATCHER"));
      assert.ok(canAssignRole("OWNER", "CONDUCTOR"));
      assert.ok(canAssignRole("OWNER", "ADMIN"));
    });

    it("allows ADMIN to assign roles below ADMIN", () => {
      assert.ok(canAssignRole("ADMIN", "TREASURY"));
      assert.ok(canAssignRole("ADMIN", "DISPATCHER"));
      assert.ok(canAssignRole("ADMIN", "CONDUCTOR"));
      assert.ok(canAssignRole("ADMIN", "MANAGER"));
      assert.ok(!canAssignRole("ADMIN", "OWNER"));
      assert.ok(!canAssignRole("ADMIN", "ADMIN"));
    });

    it("allows MANAGER to assign roles below MANAGER", () => {
      assert.ok(canAssignRole("MANAGER", "TREASURY"));
      assert.ok(canAssignRole("MANAGER", "DISPATCHER"));
      assert.ok(canAssignRole("MANAGER", "CONDUCTOR"));
      assert.ok(!canAssignRole("MANAGER", "OPERATIONS"));
      assert.ok(!canAssignRole("MANAGER", "ADMIN"));
      assert.ok(!canAssignRole("MANAGER", "MANAGER"));
    });

    it("prevents OPERATIONS from assigning any role", () => {
      assert.ok(!canAssignRole("OPERATIONS", "SUPPORT"));
      assert.ok(!canAssignRole("OPERATIONS", "TREASURY"));
    });
  });

  describe("canModifyMember", () => {
    it("allows higher role to modify lower role", () => {
      assert.ok(canModifyMember("OWNER", "ADMIN"));
      assert.ok(canModifyMember("ADMIN", "MANAGER"));
      assert.ok(canModifyMember("MANAGER", "OPERATIONS"));
      assert.ok(canModifyMember("OPERATIONS", "DISPATCHER"));
      assert.ok(canModifyMember("DISPATCHER", "TREASURY"));
      assert.ok(canModifyMember("TREASURY", "FINANCE"));
      assert.ok(canModifyMember("FINANCE", "SUPPORT"));
    });

    it("prevents lower role from modifying higher role", () => {
      assert.ok(!canModifyMember("ADMIN", "OWNER"));
      assert.ok(!canModifyMember("MANAGER", "ADMIN"));
      assert.ok(!canModifyMember("OPERATIONS", "MANAGER"));
      assert.ok(!canModifyMember("DISPATCHER", "OPERATIONS"));
      assert.ok(!canModifyMember("TREASURY", "DISPATCHER"));
      assert.ok(!canModifyMember("CONDUCTOR", "TREASURY"));
      assert.ok(!canModifyMember("FINANCE", "CONDUCTOR"));
      assert.ok(!canModifyMember("SUPPORT", "FINANCE"));
    });

    it("prevents same role from modifying same role", () => {
      assert.ok(!canModifyMember("ADMIN", "ADMIN"));
      assert.ok(!canModifyMember("MANAGER", "MANAGER"));
      assert.ok(!canModifyMember("TREASURY", "TREASURY"));
    });
  });
});