import { TRPCError } from "@trpc/server";
import {
  type PermissionKey,
  getEffectivePermissions,
  hasPermission,
  assertCanGrant,
  PERMISSION_KEYS,
} from "@moja/schemas";

type AuthzUser = {
  id: string;
  role: string;
};

type AuthzOperator = {
  role: string;
  permissions: string[];
  status: string;
  companyId: string;
};

export type PermissionContext = {
  user: AuthzUser;
  operator: AuthzOperator;
  companyId: string;
};

export function getOperatorEffectivePermissions(
  operator: AuthzOperator,
): PermissionKey[] {
  return getEffectivePermissions(operator.role, operator.permissions ?? []);
}

export function operatorHasPermission(
  ctx: PermissionContext,
  key: PermissionKey,
): boolean {
  if (ctx.user.role === "ADMIN") return true;
  if (ctx.operator.status === "SUSPENDED") return false;
  return hasPermission(ctx.operator.role, ctx.operator.permissions ?? [], key);
}

export function requirePermission(
  ctx: PermissionContext,
  key: PermissionKey,
): void {
  if (!operatorHasPermission(ctx, key)) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Access denied: missing permission ${key}`,
    });
  }
}

export function requireAnyPermission(
  ctx: PermissionContext,
  keys: PermissionKey[],
): void {
  if (keys.some((key) => operatorHasPermission(ctx, key))) return;
  throw new TRPCError({
    code: "FORBIDDEN",
    message: `Access denied: requires one of ${keys.join(", ")}`,
  });
}

export function requireAllPermissions(
  ctx: PermissionContext,
  keys: PermissionKey[],
): void {
  for (const key of keys) {
    requirePermission(ctx, key);
  }
}

export function requireCanGrant(
  ctx: PermissionContext,
  proposed: string[],
): void {
  if (ctx.user.role === "ADMIN") return;
  const result = assertCanGrant(
    ctx.operator.role,
    ctx.operator.permissions ?? [],
    proposed,
  );
  if (!result.ok) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Cannot grant permissions you do not hold: ${result.missing.join(", ")}`,
    });
  }
}

export function requireOwner(ctx: PermissionContext): void {
  if (ctx.user.role === "ADMIN") return;
  if (ctx.operator.role !== "OWNER") {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only the company owner can perform this action",
    });
  }
}

export { PERMISSION_KEYS };
