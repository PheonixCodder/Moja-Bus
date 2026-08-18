import { z } from "zod";

/**
 * Platform-scoped IAM catalog for Moja admin staff.
 * Keys are stored on AdminStaff.permissions / AdminStaffInvitation.permissions
 * and checked via requireAdminPermission on the server.
 */

export const ADMIN_STAFF_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "OPERATIONS",
  "SUPPORT",
  "COMPLIANCE",
  "FINANCE",
] as const;

export type AdminStaffRole = (typeof ADMIN_STAFF_ROLES)[number];

export const AdminStaffRoleSchema = z.enum(ADMIN_STAFF_ROLES);

export const ADMIN_STAFF_STATUSES = ["ACTIVE", "INACTIVE", "SUSPENDED"] as const;

export type AdminStaffStatus = (typeof ADMIN_STAFF_STATUSES)[number];

export const AdminStaffStatusSchema = z.enum(ADMIN_STAFF_STATUSES);

export const ADMIN_PERMISSION_META = {
  // Platform Users
  "users:read": { group: "Users", label: "View users" },
  "users:create": { group: "Users", label: "Create users" },
  "users:update": { group: "Users", label: "Edit users" },
  "users:delete": { group: "Users", label: "Delete users" },
  "users:impersonate": { group: "Users", label: "Impersonate users" },
  
  // Companies (Operators)
  "companies:read": { group: "Companies", label: "View companies" },
  "companies:create": { group: "Companies", label: "Create companies" },
  "companies:update": { group: "Companies", label: "Edit companies" },
  "companies:delete": { group: "Companies", label: "Delete companies" },
  "companies:verify": { group: "Companies", label: "Verify/Reject companies" },
  "companies:suspend": { group: "Companies", label: "Suspend/Activate companies" },
  
  // Operator Staff (cross-company)
  "operator-staff:read": { group: "Operator Staff", label: "View operator staff" },
  "operator-staff:update": { group: "Operator Staff", label: "Edit operator staff" },
  "operator-staff:remove": { group: "Operator Staff", label: "Remove operator staff" },
  
  // Financials (Platform)
  "platform:financials:read": { group: "Financials", label: "View platform financials" },
  "platform:withdrawals:read": { group: "Financials", label: "View all withdrawals" },
  "platform:withdrawals:resolve": { group: "Financials", label: "Resolve withdrawals" },
  "platform:settlements:read": { group: "Financials", label: "View settlements" },
  "platform:settlements:manage": { group: "Financials", label: "Manage settlements" },
  "platform:ledger:read": { group: "Financials", label: "View ledger" },
  "platform:commission:manage": { group: "Financials", label: "Manage commission tiers" },
  
  // Operations (Platform)
  "platform:trips:read": { group: "Operations", label: "View all trips" },
  "platform:trips:manage": { group: "Operations", label: "Manage trips" },
  "platform:routes:read": { group: "Operations", label: "View all routes" },
  "platform:routes:manage": { group: "Operations", label: "Manage routes" },
  "platform:schedules:read": { group: "Operations", label: "View all schedules" },
  "platform:schedules:manage": { group: "Operations", label: "Manage schedules" },
  "platform:fleet:read": { group: "Operations", label: "View all fleet" },
  "platform:terminals:read": { group: "Operations", label: "View all terminals" },
  
  // Verifications
  "verifications:read": { group: "Verifications", label: "View verifications" },
  "verifications:decide": { group: "Verifications", label: "Approve/Reject verifications" },
  "verifications:manage": { group: "Verifications", label: "Manage verification checklist" },
  
  // Audit & Security
  "audit:read": { group: "Audit & Security", label: "View activity logs" },
  "audit:bank-access:read": { group: "Audit & Security", label: "View bank access logs" },
  "audit:webhooks:read": { group: "Audit & Security", label: "View webhook logs" },
  
  // Content Management
  "content:posts:read": { group: "Content", label: "View blog posts" },
  "content:posts:create": { group: "Content", label: "Create blog posts" },
  "content:posts:update": { group: "Content", label: "Edit blog posts" },
  "content:posts:delete": { group: "Content", label: "Delete blog posts" },
  "content:posts:publish": { group: "Content", label: "Publish blog posts" },
  "content:categories:manage": { group: "Content", label: "Manage categories" },
  "content:tags:manage": { group: "Content", label: "Manage tags" },
  "content:redirects:manage": { group: "Content", label: "Manage redirects" },
  "content:analytics:read": { group: "Content", label: "View analytics" },
  
  // Support
  "support:inquiries:read": { group: "Support", label: "View inquiries" },
  "support:inquiries:respond": { group: "Support", label: "Respond to inquiries" },
  "support:inquiries:manage": { group: "Support", label: "Manage inquiries" },

  // Marketing / discounts
  "marketing:campaigns:read": { group: "Marketing", label: "View campaigns" },
  "marketing:campaigns:write": { group: "Marketing", label: "Manage campaigns" },
  "marketing:coupons:write": { group: "Marketing", label: "Manage coupons" },
  "marketing:credits:issue": { group: "Marketing", label: "Issue promo credits" },
  "marketing:referrals:write": { group: "Marketing", label: "Manage referral program" },
  "marketing:fraud:review": { group: "Marketing", label: "Review promo fraud" },
  "platform:promo-financials:read": {
    group: "Financials",
    label: "View promo liability & expense",
  },

  // Platform Settings
  "platform:settings:read": { group: "Settings", label: "View platform settings" },
  "platform:settings:update": { group: "Settings", label: "Update platform settings" },
  "platform:settings:audit": { group: "Settings", label: "View settings audit log" },
  
  // Admin Staff Management
  "admin-staff:read": { group: "Admin Staff", label: "View admin staff" },
  "admin-staff:invite": { group: "Admin Staff", label: "Invite admin staff" },
  "admin-staff:update": { group: "Admin Staff", label: "Update admin staff roles/permissions" },
  "admin-staff:remove": { group: "Admin Staff", label: "Remove admin staff" },
  "admin-staff:transfer": { group: "Admin Staff", label: "Transfer admin ownership" },
  
  // System
  "system:health:read": { group: "System", label: "View system health" },
  "system:feature-flags:manage": { group: "System", label: "Manage feature flags" },
} as const;

export type AdminPermissionKey = keyof typeof ADMIN_PERMISSION_META;

export const ADMIN_PERMISSION_KEYS = Object.keys(ADMIN_PERMISSION_META) as AdminPermissionKey[];

export const AdminPermissionKeySchema = z.enum(
  ADMIN_PERMISSION_KEYS as [AdminPermissionKey, ...AdminPermissionKey[]],
);

export const AdminPermissionListSchema = z.array(AdminPermissionKeySchema);

/** Grouped catalog for UI matrices */
export function getAdminPermissionsByGroup(): Record<
  string,
  Array<{ key: AdminPermissionKey; label: string }>
> {
  const groups: Record<string, Array<{ key: AdminPermissionKey; label: string }>> = {};
  for (const key of ADMIN_PERMISSION_KEYS) {
    const meta = ADMIN_PERMISSION_META[key];
    if (!groups[meta.group]) groups[meta.group] = [];
    groups[meta.group]!.push({ key, label: meta.label });
  }
  return groups;
}

/**
 * Role templates seed invite/edit defaults.
 * SUPER_ADMIN is implicit-all at runtime — template stays empty.
 */
export const ADMIN_ROLE_TEMPLATES: Record<AdminStaffRole, AdminPermissionKey[]> = {
  SUPER_ADMIN: [],
  
  ADMIN: [
    "users:read", "users:update",
    "companies:read", "companies:update", "companies:verify", "companies:suspend",
    "operator-staff:read", "operator-staff:update", "operator-staff:remove",
    "platform:financials:read", "platform:withdrawals:read", "platform:withdrawals:resolve",
    "platform:settlements:read", "platform:settlements:manage",
    "platform:ledger:read", "platform:commission:manage",
    "platform:trips:read", "platform:trips:manage",
    "platform:routes:read", "platform:routes:manage",
    "platform:schedules:read", "platform:schedules:manage",
    "platform:fleet:read", "platform:terminals:read",
    "verifications:read", "verifications:decide", "verifications:manage",
    "audit:read", "audit:bank-access:read", "audit:webhooks:read",
    "content:posts:read", "content:posts:create", "content:posts:update", "content:posts:publish",
    "content:categories:manage", "content:tags:manage", "content:redirects:manage", "content:analytics:read",
    "support:inquiries:read", "support:inquiries:respond", "support:inquiries:manage",
    "marketing:campaigns:read", "marketing:campaigns:write", "marketing:coupons:write",
    "marketing:credits:issue", "marketing:referrals:write", "marketing:fraud:review",
    "platform:promo-financials:read",
    "platform:settings:read", "platform:settings:update",
    "admin-staff:read", "admin-staff:invite", "admin-staff:update", "admin-staff:remove",
    "system:health:read",
  ],
  
  OPERATIONS: [
    "companies:read", "companies:verify", "companies:suspend",
    "operator-staff:read",
    "platform:trips:read", "platform:trips:manage",
    "platform:routes:read", "platform:routes:manage",
    "platform:schedules:read", "platform:schedules:manage",
    "platform:fleet:read", "platform:terminals:read",
    "verifications:read", "verifications:decide",
    "audit:read",
    "support:inquiries:read", "support:inquiries:respond",
    "system:health:read",
  ],
  
  SUPPORT: [
    "users:read",
    "companies:read",
    "platform:trips:read",
    "platform:routes:read",
    "verifications:read",
    "support:inquiries:read", "support:inquiries:respond", "support:inquiries:manage",
    "content:posts:read",
  ],
  
  COMPLIANCE: [
    "users:read",
    "companies:read", "companies:verify",
    "verifications:read", "verifications:decide", "verifications:manage",
    "audit:read", "audit:bank-access:read",
    "platform:settlements:read",
    "support:inquiries:read",
  ],
  
  FINANCE: [
    "companies:read",
    "platform:financials:read", "platform:withdrawals:read", "platform:withdrawals:resolve",
    "platform:settlements:read", "platform:settlements:manage",
    "platform:ledger:read", "platform:commission:manage",
    "audit:read",
    "verifications:read",
  ],
};

/** Who may assign which role labels (SUPER_ADMIN never via invite). */
export const ADMIN_ASSIGNABLE_ROLES: Record<AdminStaffRole, AdminStaffRole[]> = {
  SUPER_ADMIN: ["ADMIN", "OPERATIONS", "SUPPORT", "COMPLIANCE", "FINANCE"],
  ADMIN: ["OPERATIONS", "SUPPORT", "COMPLIANCE", "FINANCE"],
  OPERATIONS: [],
  COMPLIANCE: [],
  FINANCE: [],
  SUPPORT: [],
};

export const ADMIN_ROLE_LEVELS: Record<AdminStaffRole, number> = {
  SUPER_ADMIN: 600,
  ADMIN: 500,
  OPERATIONS: 400,
  COMPLIANCE: 350,
  FINANCE: 300,
  SUPPORT: 200,
};

export function getAdminRoleLevel(role: string): number {
  return ADMIN_ROLE_LEVELS[role as AdminStaffRole] ?? 0;
}

export function canAssignAdminRole(
  assignerRole: string,
  targetRole: string,
): boolean {
  return (ADMIN_ASSIGNABLE_ROLES[assignerRole as AdminStaffRole] ?? []).includes(
    targetRole as AdminStaffRole,
  );
}

export function canModifyAdminMember(
  modifierRole: string,
  targetRole: string,
): boolean {
  return getAdminRoleLevel(modifierRole) > getAdminRoleLevel(targetRole);
}

export function getAdminTemplatePermissions(role: AdminStaffRole): AdminPermissionKey[] {
  if (role === "SUPER_ADMIN") return [...ADMIN_PERMISSION_KEYS];
  return [...ADMIN_ROLE_TEMPLATES[role]];
}

export function getAdminEffectivePermissions(
  role: string,
  stored: string[],
): AdminPermissionKey[] {
  if (role === "SUPER_ADMIN") return [...ADMIN_PERMISSION_KEYS];
  const valid = new Set(ADMIN_PERMISSION_KEYS);
  return stored.filter((p): p is AdminPermissionKey => valid.has(p as AdminPermissionKey));
}

export function hasAdminPermission(
  role: string,
  stored: string[],
  key: AdminPermissionKey,
): boolean {
  if (role === "SUPER_ADMIN") return true;
  return stored.includes(key);
}

/**
 * Grant rule: every proposed key must be in the actor's effective set
 * (SUPER_ADMIN may grant any catalog key).
 */
export function assertAdminCanGrant(
  actorRole: string,
  actorStored: string[],
  proposed: string[],
): { ok: true } | { ok: false; missing: string[] } {
  if (actorRole === "SUPER_ADMIN") return { ok: true };
  const effective = new Set(getAdminEffectivePermissions(actorRole, actorStored));
  const missing = proposed.filter((p) => !effective.has(p as AdminPermissionKey));
  if (missing.length > 0) return { ok: false, missing };
  return { ok: true };
}

export function isAdminPermissionKey(value: string): value is AdminPermissionKey {
  return value in ADMIN_PERMISSION_META;
}