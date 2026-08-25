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
  "TREASURY",
  "DISPATCHER",
  "CONDUCTOR",
  "DRIVER",
] as const;

export type StaffRole = (typeof STAFF_ROLES)[number];

/**
 * Phase 14 (F-DV-08) — roles that may hold an ERP staff seat via invitation
 * or role-update. DRIVER is excluded server-side: the migration
 * `20260822000001_phase17_driver_operator_cleanup` deleted exactly those
 * over-provisioned rows, and this constant keeps them from resurrecting
 * through a crafted invite. Note the distinction: OPERATIONS→DRIVER trip
 * ASSIGNMENT stays legal (crew junction, not ERP membership).
 */
export const INVITABLE_STAFF_ROLES = [
  "ADMIN",
  "MANAGER",
  "OPERATIONS",
  "FINANCE",
  "SUPPORT",
  "TREASURY",
  "DISPATCHER",
  "CONDUCTOR",
] as const;

export const InvitableStaffRoleSchema = z.enum(INVITABLE_STAFF_ROLES);

export type InvitableStaffRole = (typeof INVITABLE_STAFF_ROLES)[number];

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
  "terminals:geocapture": {
    group: "Terminals",
    label: "Geocapture terminal coordinates",
  },

  // Fleet
  "fleet:read": { group: "Fleet", label: "View buses & layouts" },
  "fleet:create": { group: "Fleet", label: "Add buses & layouts" },
  "fleet:update": { group: "Fleet", label: "Edit buses & layouts" },
  "fleet:delete": { group: "Fleet", label: "Delete buses & layouts" },

  // Drivers
  "drivers:read": { group: "Drivers", label: "View drivers & live status" },
  "drivers:create": { group: "Drivers", label: "Add & onboard drivers" },
  "drivers:update": {
    group: "Drivers",
    label: "Edit driver profiles & licenses",
  },
  "drivers:delete": { group: "Drivers", label: "Remove driver affiliations" },
  "drivers:verify": {
    group: "Drivers",
    label: "Verify driver licenses & compliance",
  },
  "drivers:assign": { group: "Drivers", label: "Assign drivers to trips" },

  // Telemetry & GPS
  "telemetry:stream": {
    group: "Telemetry",
    label: "Broadcast live GPS telemetry",
  },

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
  "trips:dispatch": { group: "Trips", label: "Dispatch trips" },

  // Bookings
  "bookings:read": { group: "Bookings", label: "View bookings" },
  "bookings:update": { group: "Bookings", label: "Modify / check-in bookings" },
  "bookings:cancel": { group: "Bookings", label: "Cancel bookings" },
  "bookings:checkin": { group: "Bookings", label: "Check in passengers" },

  // Revenue & withdrawals
  "revenue:view": { group: "Financials", label: "View revenue" },
  "revenue:export": { group: "Financials", label: "Export revenue data" },
  "financials:view": {
    group: "Financials",
    label: "View financials & payouts",
  },
  "withdrawals:view": { group: "Financials", label: "View withdrawals" },
  "withdrawals:create": { group: "Financials", label: "Request withdrawals" },

  // Staff
  "staff:read": { group: "Staff", label: "View staff" },
  "staff:invite": { group: "Staff", label: "Invite staff" },
  "staff:update": { group: "Staff", label: "Update staff roles & permissions" },
  "staff:remove": { group: "Staff", label: "Remove staff" },

  // Company
  "company:view": { group: "Company", label: "View company settings" },
  "company:profile:update": { group: "Company", label: "Edit company profile" },
  "company:banking:update": { group: "Company", label: "Manage bank accounts" },
  "company:compliance:update": {
    group: "Company",
    label: "Manage compliance documents",
  },
  "company:delete": { group: "Company", label: "Delete company" },

  // Reviews
  "reviews:read": { group: "Reviews", label: "View passenger reviews" },
  "reviews:respond": { group: "Reviews", label: "Respond to reviews" },

  // Promotions / discounts
  "promotions:read": { group: "Promotions", label: "View promotions" },
  "promotions:create": { group: "Promotions", label: "Create promotions" },
  "promotions:update": { group: "Promotions", label: "Edit promotions" },
  "promotions:pause": { group: "Promotions", label: "Pause promotions" },
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
  const groups: Record<
    string,
    Array<{ key: PermissionKey; label: string }>
  > = {};
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
    "terminals:geocapture",
    "fleet:read",
    "fleet:create",
    "fleet:update",
    "fleet:delete",
    "schedules:read",
    "schedules:create",
    "schedules:update",
    "schedules:delete",
    "trips:read",
    "trips:update",
    "trips:cancel",
    "trips:dispatch",
    "bookings:read",
    "bookings:update",
    "bookings:cancel",
    "reviews:read",
    "reviews:respond",
    "revenue:view",
    "revenue:export",
    "financials:view",
    "withdrawals:view",
    "withdrawals:create",
    "staff:read",
    "staff:invite",
    "staff:update",
    "staff:remove",
    "company:view",
    "company:profile:update",
    "company:banking:update",
    "company:compliance:update",
    "company:delete",
    "promotions:read",
    "promotions:create",
    "promotions:update",
    "promotions:pause",
    "drivers:read",
    "drivers:create",
    "drivers:update",
    "drivers:delete",
    "drivers:verify",
    "drivers:assign",
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
    "trips:update",
    "trips:cancel",
    "bookings:read",
    "bookings:update",
    "reviews:read",
    "reviews:respond",
    "staff:read",
    "company:view",
    "promotions:read",
    "promotions:create",
    "promotions:update",
    "promotions:pause",
    "drivers:read",
    "drivers:create",
    "drivers:update",
    "drivers:assign",
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
    "bookings:cancel",
    "reviews:read",
    "reviews:respond",
    "drivers:read",
    "drivers:assign",
  ],

  FINANCE: [
    "routes:read",
    "bookings:read",
    "reviews:read",
    "revenue:view",
    "revenue:export",
    "financials:view",
    "withdrawals:view",
    "company:view",
    "promotions:read",
  ],

  SUPPORT: [
    "schedules:read",
    "trips:read",
    "bookings:read",
    "reviews:read",
    "drivers:read",
  ],

  TREASURY: [
    "routes:read",
    "bookings:read",
    "reviews:read",
    "revenue:view",
    "revenue:export",
    "financials:view",
    "withdrawals:view",
    "withdrawals:create",
    "company:view",
  ],

  DISPATCHER: [
    "routes:read",
    "terminals:read",
    "fleet:read",
    "schedules:read",
    "trips:read",
    "trips:update",
    "trips:cancel",
    "trips:dispatch",
    "bookings:read",
    "drivers:read",
    "drivers:assign",
  ],

  CONDUCTOR: [
    "routes:read",
    "trips:read",
    "bookings:read",
    "bookings:update",
    "bookings:checkin",
    "reviews:read",
  ],

  DRIVER: [
    "trips:read",
    "bookings:read",
    "bookings:checkin",
    "telemetry:stream",
    "reviews:read",
  ],
};

/** Who may assign which role labels (OWNER never via invite). */
export const ASSIGNABLE_ROLES: Record<StaffRole, StaffRole[]> = {
  OWNER: [
    "ADMIN",
    "MANAGER",
    "OPERATIONS",
    "FINANCE",
    "SUPPORT",
    "TREASURY",
    "DISPATCHER",
    "CONDUCTOR",
    "DRIVER",
  ],
  ADMIN: [
    "MANAGER",
    "FINANCE",
    "SUPPORT",
    "TREASURY",
    "DISPATCHER",
    "CONDUCTOR",
    "DRIVER",
  ],
  MANAGER: ["SUPPORT", "TREASURY", "DISPATCHER", "CONDUCTOR", "DRIVER"],
  OPERATIONS: ["DRIVER"],
  FINANCE: [],
  SUPPORT: [],
  TREASURY: [],
  DISPATCHER: [],
  CONDUCTOR: [],
  DRIVER: [],
};

export const ROLE_LEVELS: Record<StaffRole, number> = {
  OWNER: 600,
  ADMIN: 500,
  MANAGER: 400,
  OPERATIONS: 300,
  DISPATCHER: 350,
  TREASURY: 260,
  CONDUCTOR: 275,
  FINANCE: 250,
  SUPPORT: 200,
  DRIVER: 150,
};

import {
  checkCanAssignRole,
  checkCanModifyMember,
  checkHasPermission,
  evaluateAssertCanGrant,
  evaluateEffectivePermissions,
} from "./iam-core";

export function getRoleLevel(role: string): number {
  return ROLE_LEVELS[role as StaffRole] ?? 0;
}

export function canAssignRole(
  assignerRole: string,
  targetRole: string,
): boolean {
  return checkCanAssignRole(ASSIGNABLE_ROLES, assignerRole, targetRole);
}

export function canModifyMember(
  modifierRole: string,
  targetRole: string,
): boolean {
  return checkCanModifyMember(ROLE_LEVELS, modifierRole, targetRole);
}

export function getTemplatePermissions(role: StaffRole): PermissionKey[] {
  if (role === "OWNER") return [...PERMISSION_KEYS];
  return [...ROLE_TEMPLATES[role]];
}

export function getEffectivePermissions(
  role: string,
  stored: string[],
): PermissionKey[] {
  return evaluateEffectivePermissions(
    "OWNER",
    PERMISSION_KEYS,
    role,
    stored,
    ROLE_TEMPLATES,
  );
}

export function hasPermission(
  role: string,
  stored: string[],
  key: PermissionKey,
): boolean {
  return checkHasPermission("OWNER", role, stored, key, ROLE_TEMPLATES);
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
  return evaluateAssertCanGrant(
    "OWNER",
    getEffectivePermissions,
    actorRole,
    actorStored,
    proposed,
  );
}

export function isPermissionKey(value: string): value is PermissionKey {
  return value in PERMISSION_META;
}
