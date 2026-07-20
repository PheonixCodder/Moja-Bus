import { z } from "zod";

/**
 * Company-scoped IAM catalog for Moja operator staff.
 * Keys are stored on Operator.permissions / StaffInvitation.permissions
 * and checked via requirePermission on the server.
 */

export const STAFF_ROLES = [
  "OWNER",
  "ADMIN",
  "MANAGER",
  "OPERATIONS",
  "FINANCE",
  "SUPPORT",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

export const StaffRoleSchema = z.enum(STAFF_ROLES);

export const PERMISSION_META = {
  // Routes
  "routes:read": { group: "Routes", label: "View routes" },
  "routes:create": { group: "Routes", label: "Create routes" },
  "routes:update": { group: "Routes", label: "Edit routes" },
  "routes:delete": { group: "Routes", label: "Delete routes" },

  // Terminals
  "terminals:read": { group: "Terminals", label: "View terminals" },
  "terminals:create": { group: "Terminals", label: "Create terminals" },
  "terminals:update": { group: "Terminals", label: "Edit terminals" },
  "terminals:delete": { group: "Terminals", label: "Delete terminals" },

  // Fleet
  "fleet:read": { group: "Fleet", label: "View buses & layouts" },
  "fleet:create": { group: "Fleet", label: "Add buses & layouts" },
  "fleet:update": { group: "Fleet", label: "Edit buses & layouts" },
  "fleet:delete": { group: "Fleet", label: "Delete buses & layouts" },

  // Schedules
  "schedules:read": { group: "Schedules", label: "View schedules" },
  "schedules:create": { group: "Schedules", label: "Create schedules" },
  "schedules:update": { group: "Schedules", label: "Edit schedules" },
  "schedules:delete": { group: "Schedules", label: "Delete schedules" },

  // Trips / dispatch
  "trips:read": { group: "Trips", label: "View trips" },
  "trips:create": { group: "Trips", label: "Create trips" },
  "trips:update": { group: "Trips", label: "Edit / dispatch trips" },
  "trips:cancel": { group: "Trips", label: "Cancel trips" },

  // Bookings
  "bookings:read": { group: "Bookings", label: "View bookings" },
  "bookings:update": { group: "Bookings", label: "Modify / check-in bookings" },

  // Revenue & withdrawals
  "revenue:view": { group: "Financials", label: "View revenue" },
  "withdrawals:view": { group: "Financials", label: "View withdrawals" },
  "withdrawals:create": { group: "Financials", label: "Request withdrawals" },

  // Staff
  "staff:read": { group: "Staff", label: "View staff" },
  "staff:invite": { group: "Staff", label: "Invite staff" },
  "staff:update": { group: "Staff", label: "Update staff roles & permissions" },
  "staff:remove": { group: "Staff", label: "Remove staff" },

  // Company
  "company:view": { group: "Company", label: "View company settings" },
  "company:update": { group: "Company", label: "Edit company settings" },

  // Reviews
  "reviews:read": { group: "Reviews", label: "View passenger reviews" },
  "reviews:respond": { group: "Reviews", label: "Respond to reviews" },
} as const;

export type PermissionKey = keyof typeof PERMISSION_META;

export const PERMISSION_KEYS = Object.keys(PERMISSION_META) as PermissionKey[];

export const PermissionKeySchema = z.enum(
  PERMISSION_KEYS as [PermissionKey, ...PermissionKey[]],
);

export const PermissionListSchema = z.array(PermissionKeySchema);

/** Grouped catalog for UI matrices */
export function getPermissionsByGroup(): Record<
  string,
  Array<{ key: PermissionKey; label: string }>
> {
  const groups: Record<string, Array<{ key: PermissionKey; label: string }>> =
    {};
  for (const key of PERMISSION_KEYS) {
    const meta = PERMISSION_META[key];
    if (!groups[meta.group]) groups[meta.group] = [];
    groups[meta.group]!.push({ key, label: meta.label });
  }
  return groups;
}

/**
 * Role templates seed invite/edit defaults.
 * OWNER is implicit-all at runtime — template stays empty.
 */
export const ROLE_TEMPLATES: Record<StaffRole, PermissionKey[]> = {
  OWNER: [],

  ADMIN: [
    "routes:read",
    "routes:create",
    "routes:update",
    "routes:delete",
    "terminals:read",
    "terminals:create",
    "terminals:update",
    "terminals:delete",
    "fleet:read",
    "fleet:create",
    "fleet:update",
    "fleet:delete",
    "schedules:read",
    "schedules:create",
    "schedules:update",
    "schedules:delete",
    "trips:read",
    "trips:create",
    "trips:update",
    "trips:cancel",
    "bookings:read",
    "bookings:update",
    "reviews:read",
    "reviews:respond",
    "revenue:view",
    "withdrawals:view",
    "withdrawals:create",
    "staff:read",
    "staff:invite",
    "staff:update",
    "staff:remove",
    "company:view",
    "company:update",
  ],

  MANAGER: [
    "routes:read",
    "routes:create",
    "routes:update",
    "terminals:read",
    "terminals:create",
    "terminals:update",
    "fleet:read",
    "fleet:create",
    "fleet:update",
    "schedules:read",
    "schedules:create",
    "schedules:update",
    "trips:read",
    "trips:create",
    "trips:update",
    "trips:cancel",
    "bookings:read",
    "bookings:update",
    "reviews:read",
    "reviews:respond",
    "staff:read",
    "company:view",
  ],

  OPERATIONS: [
    "routes:read",
    "terminals:read",
    "fleet:read",
    "schedules:read",
    "trips:read",
    "trips:create",
    "trips:update",
    "trips:cancel",
    "bookings:read",
    "bookings:update",
    "reviews:read",
    "reviews:respond",
  ],

  FINANCE: [
    "routes:read",
    "bookings:read",
    "reviews:read",
    "revenue:view",
    "withdrawals:view",
    "company:view",
  ],

  SUPPORT: [
    "schedules:read",
    "trips:read",
    "bookings:read",
    "bookings:update",
    "reviews:read",
    "reviews:respond",
  ],
};

/** Who may assign which role labels (OWNER never via invite). */
export const ASSIGNABLE_ROLES: Record<StaffRole, StaffRole[]> = {
  OWNER: ["ADMIN", "MANAGER", "OPERATIONS", "FINANCE", "SUPPORT"],
  ADMIN: ["MANAGER", "OPERATIONS", "FINANCE", "SUPPORT"],
  MANAGER: ["OPERATIONS", "SUPPORT"],
  OPERATIONS: [],
  FINANCE: [],
  SUPPORT: [],
};

export const ROLE_LEVELS: Record<StaffRole, number> = {
  OWNER: 600,
  ADMIN: 500,
  MANAGER: 400,
  OPERATIONS: 300,
  FINANCE: 250,
  SUPPORT: 200,
};

export function getRoleLevel(role: string): number {
  return ROLE_LEVELS[role as StaffRole] ?? 0;
}

export function canAssignRole(
  assignerRole: string,
  targetRole: string,
): boolean {
  return (ASSIGNABLE_ROLES[assignerRole as StaffRole] ?? []).includes(
    targetRole as StaffRole,
  );
}

export function canModifyMember(
  modifierRole: string,
  targetRole: string,
): boolean {
  return getRoleLevel(modifierRole) > getRoleLevel(targetRole);
}

export function getTemplatePermissions(role: StaffRole): PermissionKey[] {
  if (role === "OWNER") return [...PERMISSION_KEYS];
  return [...ROLE_TEMPLATES[role]];
}

export function getEffectivePermissions(
  role: string,
  stored: string[],
): PermissionKey[] {
  if (role === "OWNER") return [...PERMISSION_KEYS];
  const valid = new Set(PERMISSION_KEYS);
  return stored.filter((p): p is PermissionKey => valid.has(p as PermissionKey));
}

export function hasPermission(
  role: string,
  stored: string[],
  key: PermissionKey,
): boolean {
  if (role === "OWNER") return true;
  return stored.includes(key);
}

/**
 * Grant rule: every proposed key must be in the actor's effective set
 * (OWNER may grant any catalog key).
 */
export function assertCanGrant(
  actorRole: string,
  actorStored: string[],
  proposed: string[],
): { ok: true } | { ok: false; missing: string[] } {
  if (actorRole === "OWNER") return { ok: true };
  const effective = new Set(getEffectivePermissions(actorRole, actorStored));
  const missing = proposed.filter((p) => !effective.has(p as PermissionKey));
  if (missing.length > 0) return { ok: false, missing };
  return { ok: true };
}

export function isPermissionKey(value: string): value is PermissionKey {
  return value in PERMISSION_META;
}
