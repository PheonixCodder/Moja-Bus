import { TRPCError } from "@trpc/server";
import {
  type AdminPermissionKey,
  getAdminEffectivePermissions,
  hasAdminPermission,
  assertAdminCanGrant,
  ADMIN_PERMISSION_KEYS,
} from "@moja/schemas";

type AuthzUser = {
  id: string;
  role: string;
};

type AuthzAdminStaff = {
  role: string;
  permissions: string[];
  status: string;
};

export type AdminPermissionContext = {
  user: AuthzUser;
  adminStaff: AuthzAdminStaff;
};

export function getAdminEffectivePermissionsFn(
  adminStaff: AuthzAdminStaff,
): AdminPermissionKey[] {
  return getAdminEffectivePermissions(adminStaff.role, adminStaff.permissions ?? []);
}

export function adminHasPermission(
  ctx: AdminPermissionContext,
  key: AdminPermissionKey,
): boolean {
  if (ctx.user.role === "ADMIN" && ctx.adminStaff.role === "SUPER_ADMIN") return true;
  if (ctx.adminStaff.status === "SUSPENDED") return false;
  return hasAdminPermission(ctx.adminStaff.role, ctx.adminStaff.permissions ?? [], key);
}

export function requireAdminPermission(
  ctx: AdminPermissionContext,
  key: AdminPermissionKey,
): void {
  if (!adminHasPermission(ctx, key)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Access denied: missing permission ${key}`,
    });
  }
}

export function requireAdminAnyPermission(
  ctx: AdminPermissionContext,
  keys: AdminPermissionKey[],
): void {
  if (keys.some((key) => adminHasPermission(ctx, key))) return;
  throw new TRPCError({
    code: "FORBIDDEN",
    message: `Access denied: requires one of ${keys.join(", ")}`,
  });
}

export function requireAdminAllPermissions(
  ctx: AdminPermissionContext,
  keys: AdminPermissionKey[],
): void {
  for (const key of keys) {
    requireAdminPermission(ctx, key);
  }
}

export function requireAdminCanGrant(
  ctx: AdminPermissionContext,
  proposed: string[],
): void {
  if (ctx.user.role === "ADMIN" && ctx.adminStaff.role === "SUPER_ADMIN") return;
  const result = assertAdminCanGrant(
    ctx.adminStaff.role,
    ctx.adminStaff.permissions ?? [],
    proposed,
  );
  if (!result.ok) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Cannot grant permissions you do not hold: ${result.missing.join(", ")}`,
    });
  }
}

export function requireSuperAdmin(ctx: AdminPermissionContext): void {
  if (ctx.user.role === "ADMIN" && ctx.adminStaff.role === "SUPER_ADMIN") return;
  throw new TRPCError({
    code: "FORBIDDEN",
    message: "Only Super Admins can perform this action",
  });
}

export { ADMIN_PERMISSION_KEYS };