"use client";

import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import type { PermissionKey, StaffRole } from "@moja/schemas";
import { ASSIGNABLE_ROLES } from "@moja/schemas";

export function useStaffPermissions() {
  const trpc = useTRPC();
  const query = useQuery(trpc.staff.getMyPermissions.queryOptions());

  const role = (query.data?.role ?? "SUPPORT") as StaffRole;
  const permissions = (query.data?.permissions ?? []) as PermissionKey[];
  const permissionSet = new Set(permissions);

  function can(key: PermissionKey): boolean {
    if (role === "OWNER") return true;
    return permissionSet.has(key);
  }

  return {
    role,
    permissions,
    companyId: query.data?.companyId ?? null,
    isLoading: query.isLoading,
    can,
    assignableRoles: (ASSIGNABLE_ROLES[role] ?? []) as StaffRole[],
    refetch: query.refetch,
  };
}
