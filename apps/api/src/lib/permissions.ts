import type { StaffRole } from "@moja/db";

// ─────────────────────────────────────────────────────────────────────────────
// PERMISSIONS — Typed constants.
// Use these everywhere (middleware, frontend guards, tests) — never raw strings.
// ─────────────────────────────────────────────────────────────────────────────

export const PERMISSIONS = {
  STAFF_INVITE: "staff:invite",
  STAFF_MANAGE: "staff:manage",
  STAFF_VIEW: "staff:view",
  ROUTES_MANAGE: "routes:manage",
  SCHEDULES_MANAGE: "schedules:manage",
  FLEET_MANAGE: "fleet:manage",
  FINANCE_VIEW: "finance:view",
  FINANCE_MANAGE: "finance:manage",
  DISPATCH_MANAGE: "dispatch:manage",
  TRIPS_VIEW: "trips:view",
  BOOKINGS_VIEW: "bookings:view",
  OWNERSHIP_TRANSFER: "ownership:transfer",
} as const;

export type Permission = (typeof PERMISSIONS)[keyof typeof PERMISSIONS];

// ─────────────────────────────────────────────────────────────────────────────
// ROLE → PERMISSIONS MAP
// "*" means all permissions (OWNER only).
// ─────────────────────────────────────────────────────────────────────────────

export const ROLE_PERMISSIONS: Record<StaffRole, Permission[] | ["*"]> = {
  OWNER: ["*"],
  ADMIN: [
    PERMISSIONS.STAFF_INVITE,
    PERMISSIONS.STAFF_MANAGE,
    PERMISSIONS.STAFF_VIEW,
    PERMISSIONS.ROUTES_MANAGE,
    PERMISSIONS.SCHEDULES_MANAGE,
    PERMISSIONS.FLEET_MANAGE,
    PERMISSIONS.FINANCE_VIEW,
    PERMISSIONS.DISPATCH_MANAGE,
  ],
  MANAGER: [
    PERMISSIONS.ROUTES_MANAGE,
    PERMISSIONS.SCHEDULES_MANAGE,
    PERMISSIONS.DISPATCH_MANAGE,
    PERMISSIONS.STAFF_VIEW,
  ],
  OPERATIONS: [PERMISSIONS.DISPATCH_MANAGE, PERMISSIONS.TRIPS_VIEW],
  FINANCE: [PERMISSIONS.FINANCE_VIEW, PERMISSIONS.FINANCE_MANAGE],
  SUPPORT: [PERMISSIONS.BOOKINGS_VIEW, PERMISSIONS.TRIPS_VIEW],
};

// ─────────────────────────────────────────────────────────────────────────────
// HELPERS
// ─────────────────────────────────────────────────────────────────────────────

export function hasPermission(
  role: StaffRole,
  permission: Permission,
): boolean {
  const perms = ROLE_PERMISSIONS[role] as string[];
  return perms.includes("*") || perms.includes(permission);
}

/** Returns the flat list of permission strings for a role — used for UI preview. */
export function getPermissionsForRole(role: StaffRole): Permission[] {
  const perms = ROLE_PERMISSIONS[role];
  if ((perms as string[]).includes("*"))
    return Object.values(PERMISSIONS) as Permission[];
  return perms as Permission[];
}

/** Human-readable label for each permission key — used in the role-change Sheet preview. */
export const PERMISSION_LABELS: Record<Permission, string> = {
  "staff:invite": "Invite Staff",
  "staff:manage": "Manage Staff",
  "staff:view": "View Staff",
  "routes:manage": "Manage Routes",
  "schedules:manage": "Manage Schedules",
  "fleet:manage": "Manage Fleet",
  "finance:view": "View Finance",
  "finance:manage": "Manage Finance",
  "dispatch:manage": "Manage Dispatch",
  "trips:view": "View Trips",
  "bookings:view": "View Bookings",
  "ownership:transfer": "Transfer Ownership",
};
