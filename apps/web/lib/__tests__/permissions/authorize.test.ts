import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { TRPCError } from "@trpc/server";
import {
  requirePermission,
  requireAnyPermission,
  requireAllPermissions,
  requireCanGrant,
  requireOwner,
  operatorHasPermission,
  getOperatorEffectivePermissions,
} from "@/lib/permissions/authorize";

function createMockCtx(overrides: Partial<{
  userRole: string;
  operatorRole: string;
  operatorPermissions: string[];
  operatorStatus: string;
  companyId: string;
}> = {}) {
  const userRole = overrides.userRole ?? "OPERATOR";
  const operatorRole = overrides.operatorRole ?? "MANAGER";
  const operatorPermissions = overrides.operatorPermissions ?? ["routes:read", "terminals:read", "company:view"];
  const operatorStatus = overrides.operatorStatus ?? "ACTIVE";
  const companyId = overrides.companyId ?? "company-1";

  return {
    user: { id: "user-1", role: userRole },
    operator: {
      role: operatorRole,
      permissions: operatorPermissions,
      status: operatorStatus,
      companyId,
    },
    companyId,
  };
}

describe("Authorization Functions", () => {
  describe("operatorHasPermission", () => {
    it("returns true for ADMIN user role regardless of permissions", () => {
      const ctx = createMockCtx({ userRole: "ADMIN" });
      assert.ok(operatorHasPermission(ctx, "any:permission"));
    });

    it("returns false for SUSPENDED operator", () => {
      const ctx = createMockCtx({ operatorStatus: "SUSPENDED" });
      assert.ok(!operatorHasPermission(ctx, "routes:read"));
    });

    it("returns true when operator has the required permission", () => {
      const ctx = createMockCtx({ operatorPermissions: ["routes:read"] });
      assert.ok(operatorHasPermission(ctx, "routes:read"));
    });

    it("returns false when operator lacks the required permission", () => {
      const ctx = createMockCtx({ operatorPermissions: ["terminals:read"] });
      assert.ok(!operatorHasPermission(ctx, "routes:read"));
    });

    it("returns true for OWNER operator role (implicit all)", () => {
      const ctx = createMockCtx({ operatorRole: "OWNER", operatorPermissions: [] });
      assert.ok(operatorHasPermission(ctx, "any:permission"));
    });
  });

  describe("getOperatorEffectivePermissions", () => {
    it("returns all keys for OWNER", () => {
      const ctx = createMockCtx({ operatorRole: "OWNER", operatorPermissions: [] });
      const perms = getOperatorEffectivePermissions(ctx.operator);
      assert.ok(perms.length > 0);
    });

    it("returns only valid permissions from stored list", () => {
      const ctx = createMockCtx({ 
        operatorPermissions: ["routes:read", "invalid:key", "terminals:read"] 
      });
      const perms = getOperatorEffectivePermissions(ctx.operator);
      assert.ok(perms.includes("routes:read"));
      assert.ok(perms.includes("terminals:read"));
      assert.ok(!perms.includes("invalid:key"));
    });
  });

  describe("requirePermission", () => {
    it("throws FORBIDDEN when permission missing", () => {
      const ctx = createMockCtx({ operatorPermissions: ["terminals:read"] });
      try {
        requirePermission(ctx, "routes:read");
        assert.fail("Should have thrown");
      } catch (err) {
        assert.ok(err instanceof TRPCError);
        assert.equal(err.code, "FORBIDDEN");
      }
    });

    it("does not throw when permission present", () => {
      const ctx = createMockCtx({ operatorPermissions: ["routes:read"] });
      requirePermission(ctx, "routes:read"); // Should not throw
    });

    it("allows ADMIN user to bypass", () => {
      const ctx = createMockCtx({ userRole: "ADMIN", operatorPermissions: [] });
      requirePermission(ctx, "routes:read"); // Should not throw
    });

    it("throws for SUSPENDED operator", () => {
      const ctx = createMockCtx({ operatorStatus: "SUSPENDED", operatorPermissions: ["routes:read"] });
      try {
        requirePermission(ctx, "routes:read");
        assert.fail("Should have thrown");
      } catch (err) {
        assert.ok(err instanceof TRPCError);
        assert.equal(err.code, "FORBIDDEN");
      }
    });
  });

  describe("requireAnyPermission", () => {
    it("allows when at least one permission is present", () => {
      const ctx = createMockCtx({ operatorPermissions: ["routes:read"] });
      requireAnyPermission(ctx, ["routes:read", "terminals:read"]); // Should not throw
    });

    it("throws FORBIDDEN when no permissions match", () => {
      const ctx = createMockCtx({ operatorPermissions: ["company:view"] });
      try {
        requireAnyPermission(ctx, ["routes:read", "terminals:read"]);
        assert.fail("Should have thrown");
      } catch (err) {
        assert.ok(err instanceof TRPCError);
        assert.equal(err.code, "FORBIDDEN");
      }
    });
  });

  describe("requireAllPermissions", () => {
    it("allows when all permissions are present", () => {
      const ctx = createMockCtx({ operatorPermissions: ["routes:read", "terminals:read"] });
      requireAllPermissions(ctx, ["routes:read", "terminals:read"]); // Should not throw
    });

    it("throws FORBIDDEN when any permission is missing", () => {
      const ctx = createMockCtx({ operatorPermissions: ["routes:read"] });
      try {
        requireAllPermissions(ctx, ["routes:read", "terminals:read"]);
        assert.fail("Should have thrown");
      } catch (err) {
        assert.ok(err instanceof TRPCError);
        assert.equal(err.code, "FORBIDDEN");
      }
    });
  });

  describe("requireCanGrant", () => {
    it("allows ADMIN to grant any permission", () => {
      const ctx = createMockCtx({ userRole: "ADMIN", operatorPermissions: [] });
      requireCanGrant(ctx, ["any:permission"]); // Should not throw
    });

    it("allows when actor can grant all proposed permissions", () => {
      const ctx = createMockCtx({ operatorPermissions: ["routes:read", "terminals:read"] });
      requireCanGrant(ctx, ["routes:read"]); // Should not throw
    });

    it("throws FORBIDDEN when actor cannot grant a proposed permission", () => {
      const ctx = createMockCtx({ operatorPermissions: ["routes:read"] });
      try {
        requireCanGrant(ctx, ["routes:read", "terminals:read"]);
        assert.fail("Should have thrown");
      } catch (err) {
        assert.ok(err instanceof TRPCError);
        assert.equal(err.code, "FORBIDDEN");
      }
    });
  });

  describe("requireOwner", () => {
    it("allows ADMIN user role", () => {
      const ctx = createMockCtx({ userRole: "ADMIN" });
      requireOwner(ctx); // Should not throw
    });

    it("allows OWNER operator role", () => {
      const ctx = createMockCtx({ operatorRole: "OWNER" });
      requireOwner(ctx); // Should not throw
    });

    it("throws FORBIDDEN for non-ADMIN, non-OWNER", () => {
      const ctx = createMockCtx({ operatorRole: "MANAGER" });
      try {
        requireOwner(ctx);
        assert.fail("Should have thrown");
      } catch (err) {
        assert.ok(err instanceof TRPCError);
        assert.equal(err.code, "FORBIDDEN");
      }
    });
  });

  describe("New Permission Keys", () => {
    it("checks revenue:export permission", () => {
      const ctx = createMockCtx({ operatorPermissions: ["revenue:export"] });
      assert.ok(operatorHasPermission(ctx, "revenue:export"));
    });

    it("checks terminals:geocapture permission", () => {
      const ctx = createMockCtx({ operatorPermissions: ["terminals:geocapture"] });
      assert.ok(operatorHasPermission(ctx, "terminals:geocapture"));
    });

    it("checks company:delete permission", () => {
      const ctx = createMockCtx({ operatorPermissions: ["company:delete"] });
      assert.ok(operatorHasPermission(ctx, "company:delete"));
    });

    it("checks company:profile:update permission", () => {
      const ctx = createMockCtx({ operatorPermissions: ["company:profile:update"] });
      assert.ok(operatorHasPermission(ctx, "company:profile:update"));
    });

    it("checks company:banking:update permission", () => {
      const ctx = createMockCtx({ operatorPermissions: ["company:banking:update"] });
      assert.ok(operatorHasPermission(ctx, "company:banking:update"));
    });

    it("checks company:compliance:update permission", () => {
      const ctx = createMockCtx({ operatorPermissions: ["company:compliance:update"] });
      assert.ok(operatorHasPermission(ctx, "company:compliance:update"));
    });

    it("checks trips:dispatch permission", () => {
      const ctx = createMockCtx({ operatorPermissions: ["trips:dispatch"] });
      assert.ok(operatorHasPermission(ctx, "trips:dispatch"));
    });

    it("checks bookings:checkin permission", () => {
      const ctx = createMockCtx({ operatorPermissions: ["bookings:checkin"] });
      assert.ok(operatorHasPermission(ctx, "bookings:checkin"));
    });
  });
});