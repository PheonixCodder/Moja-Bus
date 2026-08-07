import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  CreateAdminInvitationSchema,
  ListAdminStaffSchema,
  ResendAdminInvitationSchema,
  TransferAdminOwnershipSchema,
  UpdateAdminPermissionsSchema,
  UpdateAdminRoleSchema,
  UpdateAdminStatusSchema,
} from "@/features/admin/lib/validations/admin-staff";

describe("admin staff — CreateAdminInvitationSchema", () => {
  it("accepts a valid invitation", () => {
    const parsed = CreateAdminInvitationSchema.parse({
      email: "ADA@example.com",
      role: "FINANCE",
      permissions: ["audit:read", "platform:ledger:read"],
      jobTitle: "Payroll Analyst",
      message: "Welcome",
    });
    assert.equal(parsed.email, "ada@example.com");
    assert.equal(parsed.role, "FINANCE");
  });

  it("applies sensible defaults", () => {
    const parsed = CreateAdminInvitationSchema.parse({
      email: "a@b.com",
      role: "SUPPORT",
      permissions: ["users:read"],
    });
    assert.equal(parsed.expiryDays, 7);
    assert.equal(parsed.jobTitle, undefined);
  });

  it("rejects SUPER_ADMIN role and invalid emails/permissions", () => {
    assert.throws(() =>
      CreateAdminInvitationSchema.parse({
        email: "a@b.com",
        role: "SUPER_ADMIN",
        permissions: ["users:read"],
      }),
    );
    assert.throws(() =>
      CreateAdminInvitationSchema.parse({
        email: "not-an-email",
        role: "SUPPORT",
        permissions: ["users:read"],
      }),
    );
    assert.throws(() =>
      CreateAdminInvitationSchema.parse({
        email: "a@b.com",
        role: "SUPPORT",
        permissions: [],
      }),
    );
    assert.throws(() =>
      CreateAdminInvitationSchema.parse({
        email: "a@b.com",
        role: "SUPPORT",
        permissions: ["not:real:perm"],
      }),
    );
  });
});

describe("admin staff — UpdateAdminRoleSchema", () => {
  it("accepts a non-super-admin role", () => {
    const parsed = UpdateAdminRoleSchema.parse({
      memberId: "m1",
      role: "OPERATIONS",
    });
    assert.equal(parsed.role, "OPERATIONS");
    assert.equal(parsed.resetPermissions, true);
  });

  it("rejects SUPER_ADMIN (must go through transfer-ownership)", () => {
    assert.throws(() =>
      UpdateAdminRoleSchema.parse({ memberId: "m1", role: "SUPER_ADMIN" }),
    );
  });
});

describe("admin staff — UpdateAdminPermissionsSchema", () => {
  it("accepts a valid permission list", () => {
    const parsed = UpdateAdminPermissionsSchema.parse({
      memberId: "m1",
      permissions: ["users:read"],
    });
    assert.deepEqual(parsed.permissions, ["users:read"]);
  });

  it("rejects unknown permission keys", () => {
    assert.throws(() =>
      UpdateAdminPermissionsSchema.parse({
        memberId: "m1",
        permissions: ["staff:invite"],
      }),
    );
  });
});

describe("admin staff — UpdateAdminStatusSchema", () => {
  it("accepts a valid status", () => {
    const parsed = UpdateAdminStatusSchema.parse({
      memberId: "m1",
      status: "SUSPENDED",
    });
    assert.equal(parsed.status, "SUSPENDED");
  });

  it("rejects an invalid status", () => {
    assert.throws(() =>
      UpdateAdminStatusSchema.parse({ memberId: "m1", status: "PENDING" }),
    );
  });
});

describe("admin staff — TransferAdminOwnershipSchema", () => {
  it("accepts a 6-digit code and confirmation text", () => {
    const parsed = TransferAdminOwnershipSchema.parse({
      memberId: "m1",
      otp: "123456",
      confirmationText: "TRANSFER OWNERSHIP",
    });
    assert.equal(parsed.otp, "123456");
  });

  it("rejects otp that is not exactly 6 digits", () => {
    assert.throws(() =>
      TransferAdminOwnershipSchema.parse({
        memberId: "m1",
        otp: "123",
        confirmationText: "TRANSFER OWNERSHIP",
      }),
    );
  });
});

describe("admin staff — ListAdminStaffSchema", () => {
  it("applies pagination defaults", () => {
    const parsed = ListAdminStaffSchema.parse({});
    assert.equal(parsed.page, 1);
    assert.equal(parsed.limit, 50);
  });

  it("accepts valid filters and rejects invalid role/status", () => {
    const ok = ListAdminStaffSchema.parse({
      search: "a",
      role: "FINANCE",
      status: "ACTIVE",
    });
    assert.equal(ok.role, "FINANCE");

    assert.throws(() =>
      ListAdminStaffSchema.parse({ role: "OWNER", status: "ACTIVE" }),
    );
    assert.throws(() => ListAdminStaffSchema.parse({ status: "PENDING" }));
  });
});

describe("admin staff — ResendAdminInvitationSchema", () => {
  it("defaults extendExpiry to true", () => {
    const parsed = ResendAdminInvitationSchema.parse({ invitationId: "inv1" });
    assert.equal(parsed.extendExpiry, true);
  });
});
