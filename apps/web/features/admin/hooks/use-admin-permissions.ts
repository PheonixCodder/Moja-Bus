"use client";

import type { AdminPermissionKey, AdminStaffRole } from "@moja/schemas";
import { ADMIN_ASSIGNABLE_ROLES } from "@moja/schemas";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";

export function useAdminPermissions() {
  const trpc = useTRPC();
  const query = useQuery(trpc.adminStaff.getMyPermissions.queryOptions());

  const role = (query.data?.role ?? "SUPPORT") as AdminStaffRole;
  const permissions = (query.data?.permissions ?? []) as AdminPermissionKey[];
  const permissionSet = new Set(permissions);

  function can(key: AdminPermissionKey): boolean {
    if (role === "SUPER_ADMIN") return true;
    return permissionSet.has(key);
  }

  return {
    role,
    permissions,
    status: query.data?.status ?? "ACTIVE",
    isActive: query.data?.isActive ?? true,
    isLoading: query.isLoading,
    can,
    assignableRoles: (ADMIN_ASSIGNABLE_ROLES[role] ?? []) as AdminStaffRole[],
    refetch: query.refetch,
  };
}
