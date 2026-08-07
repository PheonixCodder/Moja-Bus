import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  ADMIN_STAFF_ROLES,
  ADMIN_ASSIGNABLE_ROLES,
  ADMIN_ROLE_LEVELS,
  getAdminRoleLevel,
  canAssignAdminRole,
  canModifyAdminMember,
} from "@moja/schemas";

describe("admin staff — role hierarchy", () => {
  it("every role has a positive, unique level defense-in-depth", () => {
    for (const role of ADMIN_STAFF_ROLES) {
      assert.ok(getAdminRoleLevel(role) > 0, `${role} should have a level`);
    }
    assert.ok(getAdminRoleLevel("SUPER_ADMIN") > getAdminRoleLevel("ADMIN"));
    assert.ok(getAdminRoleLevel("ADMIN") > getAdminRoleLevel("OPERATIONS"));
    assert.ok(getAdminRoleLevel("SUPPORT") < getAdminRoleLevel("FINANCE"));
  });

  it("only SUPER_ADMIN and ADMIN can assign roles", () => {
    for (const role of ADMIN_STAFF_ROLES) {
      const assignable = ADMIN_ASSIGNABLE_ROLES[role];
      if (role === "SUPER_ADMIN" || role === "ADMIN") {
        assert.ok(assignable.length > 0, `${role} should be able to assign roles`);
      } else {
        assert.equal(assignable.length, 0, `${role} must not assign roles`);
      }
    }
  });

  it("nobody may assign SUPER_ADMIN via regular role assignment", () => {
    for (const role of ADMIN_STAFF_ROLES) {
      assert.equal(
        canAssignAdminRole(role, "SUPER_ADMIN"),
        false,
        `${role} must not assign SUPER_ADMIN`,
      );
    }
  });

  it("cannot assign your own or a higher role", () => {
    assert.equal(canAssignAdminRole("ADMIN", "ADMIN"), false);
    assert.equal(canAssignAdminRole("ADMIN", "SUPER_ADMIN"), false);
    assert.equal(canAssignAdminRole("SUPPORT", "FINANCE"), false);
  });
});

describe("admin staff — modify target rule (strict level comparison)", () => {
  it("can only modify strictly lower seniority members", () => {
    assert.equal(canModifyAdminMember("SUPER_ADMIN", "ADMIN"), true);
    assert.equal(canModifyAdminMember("ADMIN", "SUPPORT"), true);
    assert.equal(canModifyAdminMember("FINANCE", "SUPPORT"), true);
  });

  it("cannot modify peers or higher members", () => {
    assert.equal(canModifyAdminMember("SUPER_ADMIN", "SUPER_ADMIN"), false);
    assert.equal(canModifyAdminMember("ADMIN", "ADMIN"), false);
    assert.equal(canModifyAdminMember("SUPPORT", "FINANCE"), false);
    assert.equal(canModifyAdminMember("OPERATIONS", "ADMIN"), false);
  });

  it("ADMIN cannot modify another ADMIN or SUPER_ADMIN", () => {
    assert.equal(canModifyAdminMember("ADMIN", "ADMIN"), false);
    assert.equal(canModifyAdminMember("ADMIN", "SUPER_ADMIN"), false);
  });

  it("level map matches helper output", () => {
    for (const role of ADMIN_STAFF_ROLES) {
      assert.equal(getAdminRoleLevel(role), ADMIN_ROLE_LEVELS[role]);
    }
  });
});