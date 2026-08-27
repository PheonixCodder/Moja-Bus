"use client";

import { usePathname } from "next/navigation";
import { useStaffPermissions } from "@/features/operator/hooks/use-staff-permissions";
import { AccessDeniedCard } from "@/features/operator/components/access-denied-card";
import type { PermissionKey } from "@moja/schemas";

const ROUTE_PERMISSIONS: Record<string, PermissionKey[]> = {
  "/dashboard/operator": ["trips:read", "bookings:read", "company:view"],
  "/dashboard/operator/trips": ["trips:read"],
  "/dashboard/operator/bookings": ["bookings:read"],
  "/dashboard/operator/reviews": ["reviews:read"],
  "/dashboard/operator/terminals": ["terminals:read"],
  "/dashboard/operator/routes": ["routes:read"],
  "/dashboard/operator/schedules": ["schedules:read"],
  "/dashboard/operator/fleet": ["fleet:read"],
  "/dashboard/operator/revenue": ["revenue:view"],
  "/dashboard/operator/withdraw": ["withdrawals:view"],
  "/dashboard/operator/staff": ["staff:read"],
  "/dashboard/operator/settings": ["company:view"],
};

function normalizePathname(pathname: string): string {
  const stripped = pathname.replace(/^\/[a-z]{2}(-[A-Z]{2})?(\/|$)/, "/");
  return stripped.length > 1 && stripped.endsWith("/")
    ? stripped.slice(0, -1)
    : stripped;
}

function resolvePermissions(pathname: string): PermissionKey[] | undefined {
  const exact = ROUTE_PERMISSIONS[pathname];
  if (exact) return exact;
  for (const [prefix, perms] of Object.entries(ROUTE_PERMISSIONS)) {
    if (pathname.startsWith(prefix + "/")) return perms;
  }
  return undefined;
}

export function OperatorRouteGuard({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { can, role } = useStaffPermissions();

  if (role === "OWNER") {
    return <>{children}</>;
  }

  const normalized = normalizePathname(pathname);
  const required = resolvePermissions(normalized);
  if (required && !required.some((key) => can(key))) {
    return <AccessDeniedCard />;
  }

  return <>{children}</>;
}
