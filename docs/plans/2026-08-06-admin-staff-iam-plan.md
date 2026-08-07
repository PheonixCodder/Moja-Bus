# Admin Dashboard Staff IAM System — Implementation Plan

**Created**: 2026-08-06  
**Status**: Ready for Implementation  
**Goal**: Create an enterprise-grade admin staff management system mirroring the operator staff system architecture, with platform-wide permissions and granular role hierarchy.

---

## 1. Executive Summary

The current admin dashboard uses a single `UserRole.ADMIN` with no permission granularity. This plan creates a complete **AdminStaff** model with:
- **Separate Prisma model** (`AdminStaff`) linked to `User`
- **Granular roles**: `SUPER_ADMIN`, `ADMIN`, `OPERATIONS`, `SUPPORT`, `COMPLIANCE`, `FINANCE`
- **Platform-wide permission catalog** (70+ keys across 10 groups)
- **Role templates**, **assignable roles**, **role levels** for hierarchy
- **Full invitation flow** with token-based email invites (Novu)
- **Activity logging** for all staff actions
- **Server-side authorization** mirroring operator patterns
- **Client-side UI** with sheets, tables, permission matrices

---

## 2. Database Schema Changes (Prisma)

### 2.1 New Enums

```prisma
enum AdminStaffRole {
  SUPER_ADMIN
  ADMIN
  OPERATIONS
  SUPPORT
  COMPLIANCE
  FINANCE
}

enum AdminStaffStatus {
  ACTIVE
  INACTIVE
  SUSPENDED
}
```

### 2.2 New Models

```prisma
model AdminStaff {
  id              String   @id @default(cuid())
  userId          String   @unique
  user            User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  
  // Role & Permissions
  role            AdminStaffRole   @default(SUPPORT)
  permissions     String[]         @default([])
  permissionsUpdatedAt DateTime?
  permissionsUpdatedBy String?
  status          AdminStaffStatus @default(ACTIVE)
  isActive        Boolean          @default(true)
  deletedAt       DateTime?
  
  // Profile
  jobTitle        String?
  profilePhotoUrl String?
  department      String? // e.g., "Platform Operations", "Compliance", "Finance"
  
  // Timestamps
  joinedAt        DateTime @default(now())
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  @@index([role])
  @@index([status])
  @@map("admin_staff")
}

model AdminStaffInvitation {
  id          String   @id @default(cuid())
  email       String
  role        AdminStaffRole
  permissions String[]
  jobTitle    String?
  message     String?
  token       String   @unique // hashed
  status      String   @default("PENDING") // PENDING, ACCEPTED, CANCELLED, EXPIRED
  expiresAt   DateTime
  invitedById String
  invitedBy   User     @relation("AdminInvitationsSent", fields: [invitedById], references: [id])
  acceptedById String?
  acceptedBy  User?    @relation("AdminInvitationsAccepted", fields: [acceptedById], references: [id])
  acceptedAt  DateTime?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  @@index([email])
  @@index([status])
  @@index([invitedById])
  @@map("admin_staff_invitation")
}

// Reuse ActivityLog with companyId = NULL for platform-level events
// Add adminStaffId field for attribution
```

### 2.3 User Model Updates

Add relations to `User` model:
```prisma
// In User model
adminStaff          AdminStaff?
sentAdminInvitations AdminStaffInvitation[] @relation("AdminInvitationsSent")
acceptedAdminInvitations AdminStaffInvitation[] @relation("AdminInvitationsAccepted")
```

### 2.4 Migration Strategy

1. Create migration: `pnpm prisma migrate dev --name add_admin_staff_iam`
2. Seed initial `SUPER_ADMIN` from existing `UserRole.ADMIN` users
3. Run data migration script to promote first admin to `SUPER_ADMIN`

---

## 3. Permission Catalog (`packages/schemas/src/admin-permissions.ts`)

### 3.1 New Admin Permission Keys (Platform-Wide)

```typescript
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
```

### 3.2 Role Templates

```typescript
export const ADMIN_ROLE_TEMPLATES: Record<AdminStaffRole, AdminPermissionKey[]> = {
  SUPER_ADMIN: [
    // All permissions - implicit at runtime
  ],
  
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
```

### 3.3 Role Hierarchy & Assignable Roles

```typescript
export const ADMIN_ROLE_LEVELS: Record<AdminStaffRole, number> = {
  SUPER_ADMIN: 600,
  ADMIN: 500,
  OPERATIONS: 400,
  COMPLIANCE: 350,
  FINANCE: 300,
  SUPPORT: 200,
};

export const ADMIN_ASSIGNABLE_ROLES: Record<AdminStaffRole, AdminStaffRole[]> = {
  SUPER_ADMIN: ["ADMIN", "OPERATIONS", "SUPPORT", "COMPLIANCE", "FINANCE"],
  ADMIN: ["OPERATIONS", "SUPPORT", "COMPLIANCE", "FINANCE"],
  OPERATIONS: [],
  COMPLIANCE: [],
  FINANCE: [],
  SUPPORT: [],
};
```

### 3.4 Export Types

```typescript
export type AdminPermissionKey = keyof typeof ADMIN_PERMISSION_META;
export type AdminStaffRole = keyof typeof ADMIN_ROLE_TEMPLATES;

export const ADMIN_PERMISSION_KEYS = Object.keys(ADMIN_PERMISSION_META) as AdminPermissionKey[];
export const ADMIN_STAFF_ROLES = Object.keys(ADMIN_ROLE_TEMPLATES) as AdminStaffRole[];

export const AdminPermissionKeySchema = z.enum(ADMIN_PERMISSION_KEYS as [AdminPermissionKey, ...AdminPermissionKey[]]);
export const AdminPermissionListSchema = z.array(AdminPermissionKeySchema);
export const AdminStaffRoleSchema = z.enum(ADMIN_STAFF_ROLES as [AdminStaffRole, ...AdminStaffRole[]]);
export const AdminStaffStatusSchema = z.enum(["ACTIVE", "INACTIVE", "SUSPENDED"]);
```

---

## 4. tRPC Router: `apps/web/trpc/routers/admin-staff.ts`

### 4.1 Procedures Structure

```typescript
// Follows exact pattern from staff.ts router
export const adminStaffRouter = createTRPCRouter({
  // Self
  getMyPermissions: adminStaffProcedure.query(...),
  
  // List & Read
  listStaff: adminStaffProcedure.input(ListAdminStaffSchema).query(...),
  getStaffMember: adminStaffProcedure.input(z.object({ id: z.string() })).query(...),
  getActivityLog: adminStaffProcedure.input(GetAdminActivityLogSchema).query(...),
  
  // Mutations
  updatePermissions: adminStaffProcedure.input(UpdateAdminPermissionsSchema).mutation(...),
  updateRole: adminStaffProcedure.input(UpdateAdminRoleSchema).mutation(...),
  updateStatus: adminStaffProcedure.input(UpdateAdminStatusSchema).mutation(...),
  removeStaff: adminStaffProcedure.input(RemoveAdminStaffSchema).mutation(...),
  transferOwnership: adminStaffProcedure.input(TransferAdminOwnershipSchema).mutation(...),
  requestTransferOtp: adminStaffProcedure.mutation(...),
  
  // Invitations
  listInvitations: adminStaffProcedure.input(ListAdminInvitationsSchema).query(...),
  createInvitation: adminStaffProcedure.input(CreateAdminInvitationSchema).mutation(...),
  cancelInvitation: adminStaffProcedure.input(AdminInvitationIdSchema).mutation(...),
  resendInvitation: adminStaffProcedure.input(ResendAdminInvitationSchema).mutation(...),
});
```

### 4.2 Authorization Patterns

- Use `adminStaffProcedure` (new middleware: verifies `User.role === "ADMIN"` + resolves `AdminStaff` record)
- `requireAdminPermission(ctx, key)` - mirrors `requirePermission`
- `requireAdminCanGrant(ctx, proposed)` - mirrors `requireCanGrant`
- `requireSuperAdmin(ctx)` - mirrors `requireOwner`
- Hierarchy checks: `canAssignAdminRole(assignerRole, targetRole)`, `canModifyAdminMember(modifierRole, targetRole)`

---

## 5. Server Authorization Layer (`apps/web/lib/permissions/admin-authorize.ts`)

```typescript
// New file mirroring apps/web/lib/permissions/authorize.ts

type AdminAuthzUser = { id: string; role: string };
type AdminAuthzStaff = { role: string; permissions: string[]; status: string };

export type AdminPermissionContext = {
  user: AdminAuthzUser;
  adminStaff: AdminAuthzStaff;
};

export function getAdminEffectivePermissions(admin: AdminAuthzStaff): AdminPermissionKey[] { ... }
export function adminHasPermission(ctx: AdminPermissionContext, key: AdminPermissionKey): boolean { ... }
export function requireAdminPermission(ctx: AdminPermissionContext, key: AdminPermissionKey): void { ... }
export function requireAdminCanGrant(ctx: AdminPermissionContext, proposed: string[]): void { ... }
export function requireSuperAdmin(ctx: AdminPermissionContext): void { ... }
```

### 5.1 Middleware: `adminStaffProcedure`

In `apps/web/trpc/init.ts`:
```typescript
export const adminStaffProcedure = adminProcedure.use(
  async ({ ctx, next }) => {
    // adminProcedure already ensures User.role === "ADMIN"
    // Now resolve AdminStaff record
    const adminStaff = await ctx.prisma.adminStaff.findUnique({
      where: { userId: ctx.user.id, deletedAt: null },
    });
    if (!adminStaff) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin staff profile not found" });
    }
    if (adminStaff.status === "SUSPENDED") {
      throw new TRPCError({ code: "FORBIDDEN", message: "Your admin access is suspended" });
    }
    return next({ ctx: { ...ctx, adminStaff } });
  }
);
```

---

## 6. Client-Side Hooks

### 6.1 `apps/web/features/admin/hooks/use-admin-permissions.ts`

```typescript
"use client";
import { useQuery } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import type { AdminPermissionKey, AdminStaffRole } from "@moja/schemas";
import { ADMIN_ASSIGNABLE_ROLES } from "@moja/schemas";

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
    isLoading: query.isLoading,
    can,
    assignableRoles: (ADMIN_ASSIGNABLE_ROLES[role] ?? []) as AdminStaffRole[],
    refetch: query.refetch,
  };
}
```

---

## 7. Client-Side Lib Files

### 7.1 `apps/web/features/admin/lib/admin-staff.ts`

```typescript
// Mirrors apps/web/features/operator/lib/staff.ts
export {
  ADMIN_PERMISSION_META,
  ADMIN_ROLE_TEMPLATES,
  getAdminPermissionsByGroup,
  getAdminTemplatePermissions,
  type AdminPermissionKey,
  type AdminStaffRole,
} from "@moja/schemas";

export const ADMIN_ROLE_LABELS: Record<AdminStaffRole, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  OPERATIONS: "Operations",
  SUPPORT: "Support",
  COMPLIANCE: "Compliance",
  FINANCE: "Finance",
};

export const ADMIN_ROLE_COLORS: Record<AdminStaffRole, string> = {
  SUPER_ADMIN: "bg-red-500/15 text-red-600 border-red-500/30",
  ADMIN: "bg-purple-500/15 text-purple-600 border-purple-500/30",
  OPERATIONS: "bg-blue-500/15 text-blue-600 border-blue-500/30",
  SUPPORT: "bg-green-500/15 text-green-600 border-green-500/30",
  COMPLIANCE: "bg-orange-500/15 text-orange-600 border-orange-500/30",
  FINANCE: "bg-amber-500/15 text-amber-600 border-amber-500/30",
};

export const ADMIN_STATUS_CONFIG = {
  ACTIVE: { label: "Active", className: "text-emerald-700", icon: "●" },
  INACTIVE: { label: "Inactive", className: "text-slate-600", icon: "○" },
  SUSPENDED: { label: "Suspended", className: "text-red-700", icon: "⊘" },
} as const;

export type AdminStaffStatus = keyof typeof ADMIN_STATUS_CONFIG;

// Types mirroring StaffMember, StaffInvitation, ActivityLogEntry
export type AdminStaffMember = { ... };
export type AdminStaffInvitation = { ... };
export type AdminActivityLogEntry = { ... };

// Helpers: getInitials, getAvatarColor, formatRelativeTime, formatInvitationExpiry
```

### 7.2 `apps/web/features/admin/lib/validations/admin-staff.ts`

```typescript
// Mirrors apps/web/features/operator/lib/validations/staff.ts
import { z } from "zod";
import { AdminStaffRoleSchema, AdminPermissionListSchema, AdminStaffStatusSchema } from "@moja/schemas";

export const ListAdminStaffSchema = z.object({
  search: z.string().max(100).optional(),
  role: AdminStaffRoleSchema.optional(),
  status: AdminStaffStatusSchema.optional(),
  page: z.number().int().min(1).max(1000).default(1),
  limit: z.number().int().min(1).max(100).default(50),
});

export const GetAdminActivityLogSchema = z.object({
  limit: z.number().int().min(1).max(500).default(40),
  offset: z.number().int().min(0).default(0),
  action: z.string().optional(),
  userId: z.string().optional(),
});

export const UpdateAdminRoleSchema = z.object({
  memberId: z.string().min(1),
  role: AdminStaffRoleSchema.refine((r) => r !== "SUPER_ADMIN", {
    message: "Use transfer-ownership to assign SUPER_ADMIN",
  }),
  resetPermissions: z.boolean().default(true),
  reason: z.string().max(500).optional(),
});

export const UpdateAdminPermissionsSchema = z.object({
  memberId: z.string().min(1),
  permissions: AdminPermissionListSchema,
  reason: z.string().max(500).optional(),
});

export const UpdateAdminStatusSchema = z.object({
  memberId: z.string().min(1),
  status: AdminStaffStatusSchema,
  reason: z.string().max(500).optional(),
});

export const TransferAdminOwnershipSchema = z.object({
  memberId: z.string().min(1),
  otp: z.string().length(6, "Code must be exactly 6 digits"),
  confirmationText: z.string().min(1),
});

export const CreateAdminInvitationSchema = z.object({
  email: z.string().email().toLowerCase(),
  role: AdminStaffRoleSchema.refine((r) => r !== "SUPER_ADMIN", {
    message: "Cannot invite a new SUPER_ADMIN via invitation",
  }),
  permissions: AdminPermissionListSchema.min(1, "Select at least one permission"),
  jobTitle: z.string().max(100).optional(),
  message: z.string().max(500).optional(),
  expiryDays: z.number().int().min(1).max(30).default(7),
});

export const AdminInvitationIdSchema = z.object({
  invitationId: z.string().min(1),
  reason: z.string().max(200).optional(),
});

export const ResendAdminInvitationSchema = AdminInvitationIdSchema.extend({
  extendExpiry: z.boolean().default(true),
});

export const RemoveAdminStaffSchema = z.object({
  memberId: z.string().min(1),
  reason: z.string().max(500).optional(),
});
```

### 7.3 `apps/web/features/admin/lib/admin-staff-search-params.ts`

```typescript
// Mirrors apps/web/features/operator/lib/staff-search-params.ts
import {
  createSearchParamsCache,
  parseAsInteger,
  parseAsString,
  parseAsStringEnum,
  parseAsBoolean,
} from "nuqs/server";

export const adminStaffParsers = {
  tab: parseAsStringEnum(["members", "invitations", "activity"]).withDefault("members"),
  q: parseAsString.withDefault(""),
  role: parseAsString.withDefault("ALL"),
  status: parseAsString.withDefault("ALL"),
  page: parseAsInteger.withDefault(1),
  invite: parseAsBoolean.withDefault(false),
  member: parseAsString.withDefault(""),
};

export const adminStaffSearchParamsCache = createSearchParamsCache(adminStaffParsers);
```

---

## 8. Admin Staff View Components

### 8.1 Directory Structure

```
apps/web/features/admin/components/staff/
├── admin-staff-page-header.tsx
├── admin-staff-filters-toolbar.tsx
├── admin-staff-members-section.tsx
├── admin-staff-invitations-section.tsx
├── admin-staff-activity-section.tsx
├── admin-staff-member-row.tsx
├── admin-staff-invitation-card.tsx
├── admin-staff-activity-item.tsx
├── invite-sheet.tsx
├── role-sheet.tsx
├── edit-permissions-sheet.tsx
├── transfer-ownership-dialog.tsx
├── remove-staff-dialog.tsx
├── permission-matrix.tsx
├── role-badge.tsx
├── status-badge.tsx
└── member-avatar.tsx
```

### 8.2 `apps/web/features/admin/views/admin-staff-view.tsx`

**Mirrors `operator-staff-view.tsx` exactly** — same patterns:
- `useQueryStates` with `adminStaffParsers`
- `useQuery` for staff list, invitations, activity log, my permissions
- Mutations for all CRUD operations
- Deep-link support for `?member=<id>` opening edit-permissions sheet
- Sheets for invite, role change, permissions edit, transfer, remove
- Sections: Members, Invitations, Activity

---

## 9. Pages & Routing

### 9.1 `apps/web/app/[locale]/dashboard/admin/(dashboard)/staff/page.tsx`

```typescript
// Mirrors apps/web/app/[locale]/dashboard/operator/(dashboard)/staff/page.tsx
import { getTranslations } from "next-intl/server";
import { AdminStaffView } from "@/features/admin/views/admin-staff-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "adminDashboard.staff" });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function AdminStaffPage() {
  await Promise.all([
    prefetch(trpc.adminStaff.listStaff.queryOptions({ search: undefined, role: undefined, status: undefined, page: 1, limit: 50 })),
    prefetch(trpc.adminStaff.listInvitations.queryOptions({ limit: 20 })),
    prefetch(trpc.adminStaff.getActivityLog.queryOptions({ limit: 100 })),
    prefetch(trpc.adminStaff.getMyPermissions.queryOptions()),
  ]);

  return <HydrateClient><AdminStaffView /></HydrateClient>;
}
```

### 9.2 Route Group

Place under `apps/web/app/[locale]/dashboard/admin/(dashboard)/staff/page.tsx` to match operator pattern.

---

## 10. Admin Sidebar Integration

### 10.1 Update `apps/web/features/admin/components/admin-sidebar.tsx`

Add "Admin Staff" to navigation with permission-based visibility:

```typescript
const platformItems: MenuItem[] = [
  { title: t("verifications"), url: "/dashboard/admin/verifications", icon: ShieldCheck },
  { title: t("settings"), url: "/dashboard/admin/settings", icon: Settings },
  { 
    title: t("staff"), 
    url: "/dashboard/admin/staff", 
    icon: Users,
    permissions: ["admin-staff:read"] // Only show if user has permission
  },
];
```

### 10.2 Modify `NavSection` Component

Accept optional `permissions` array on MenuItem and filter using `useAdminPermissions()` hook's `can()` function.

---

## 11. Translation Keys

### 11.1 New Namespace: `adminDashboard.staff`

Add to `apps/web/messages/en.json` and `apps/web/messages/fr.json`:

```json
{
  "adminDashboard": {
    "staff": {
      "metaTitle": "Admin Staff",
      "metaDescription": "Manage platform admin team members, roles, and permissions",
      "title": "Admin Staff",
      "description": "Invite and manage platform administrators with granular permissions",
      "inviteButton": "Invite Admin",
      "inviteSheet": {
        "title": "Invite Admin Staff",
        "description": "Enter details to invite a new admin team member",
        "emailLabel": "Email",
        "emailPlaceholder": "admin@company.com",
        "roleLabel": "Role",
        "jobTitleLabel": "Job Title",
        "permissionsLabel": "Permissions",
        "messageLabel": "Personal Message (optional)",
        "send": "Send Invitation",
        "cancel": "Cancel"
      },
      "roleSheet": {
        "title": "Change Role",
        "description": "Select a new role. Permissions will be reset to the role template.",
        "newRoleLabel": "New Role",
        "templateIncludes": "Role includes:",
        "resetNotice": "This will replace current permissions with the role's default template.",
        "save": "Save Role"
      },
      "editPermissionsSheet": {
        "title": "Edit Permissions",
        "description": "Customize individual permissions for this admin",
        "save": "Save Permissions"
      },
      "toast": {
        "invitationSent": "Invitation sent to {email}",
        "inviteFailed": "Failed to send invitation",
        "roleUpdated": "Role updated",
        "roleUpdateFailed": "Failed to update role",
        "permissionsUpdated": "Permissions updated",
        "permissionsUpdateFailed": "Failed to update permissions",
        "statusChanged": "Status changed to {status} for {name}",
        "statusUpdateFailed": "Failed to update status",
        "removed": "Removed {name} from admin team",
        "removeFailed": "Failed to remove admin",
        "ownershipTransferred": "Ownership transferred",
        "ownershipTransferFailed": "Failed to transfer ownership",
        "invitationCancelled": "Invitation cancelled for {email}",
        "cancelInviteFailed": "Failed to cancel invitation",
        "invitationResent": "Invitation resent to {email}",
        "resendInviteFailed": "Failed to resend invitation"
      },
      "filters": {
        "searchPlaceholder": "Search by name, email, job title...",
        "roleAll": "All Roles",
        "statusAll": "All Statuses"
      },
      "table": {
        "name": "Name",
        "role": "Role",
        "status": "Status",
        "jobTitle": "Job Title",
        "lastActive": "Last Active",
        "actions": "Actions",
        "noMembers": "No admin staff found",
        "editRole": "Edit Role",
        "editPermissions": "Edit Permissions",
        "suspend": "Suspend",
        "activate": "Activate",
        "transferOwnership": "Transfer Ownership",
        "remove": "Remove"
      },
      "invitations": {
        "title": "Pending Invitations",
        "empty": "No pending invitations",
        "resend": "Resend",
        "cancel": "Cancel",
        "expired": "Expired",
        "expiresIn": "Expires in {days} days",
        "expiresToday": "Expires today"
      },
      "activity": {
        "title": "Activity Log",
        "empty": "No activity yet",
        "justNow": "Just now",
        "minutesAgo": "{mins}m ago",
        "hoursAgo": "{hours}h ago",
        "daysAgo": "{days}d ago"
      },
      "permissionMatrix": {
        "filterPlaceholder": "Filter permissions...",
        "users": "Users",
        "companies": "Companies",
        "operatorStaff": "Operator Staff",
        "financials": "Financials",
        "operations": "Operations",
        "verifications": "Verifications",
        "auditSecurity": "Audit & Security",
        "content": "Content",
        "support": "Support",
        "settings": "Settings",
        "adminStaff": "Admin Staff",
        "system": "System"
      }
    }
  }
}
```

---

## 12. Migration & Seeding Strategy

### 12.1 Database Migration

```bash
# 1. Generate migration
pnpm prisma migrate dev --name add_admin_staff_iam

# 2. Run data migration script
pnpm tsx packages/db/scripts/seed-admin-staff.ts
```

### 12.2 Seed Script

```typescript
// packages/db/scripts/seed-admin-staff.ts
import { PrismaClient } from "@moja/db";
import crypto from "crypto";

const prisma = new PrismaClient();

async function main() {
  // Find existing platform admins (UserRole.ADMIN)
  const admins = await prisma.user.findMany({
    where: { role: "ADMIN" },
  });
  
  for (const [index, admin] of admins.entries()) {
    const existing = await prisma.adminStaff.findUnique({ where: { userId: admin.id } });
    if (!existing) {
      const role = index === 0 ? "SUPER_ADMIN" : "ADMIN"; // First admin = SUPER_ADMIN
      await prisma.adminStaff.create({
        data: {
          userId: admin.id,
          role: role as any,
          permissions: [], // SUPER_ADMIN gets implicit all
          status: "ACTIVE",
          isActive: true,
          joinedAt: admin.createdAt,
          jobTitle: index === 0 ? "Platform Owner" : "Platform Administrator",
        },
      });
    }
  }
  
  console.log("Admin staff seeded successfully");
}

main().finally(() => prisma.$disconnect());
```

---

## 13. File Creation Checklist

### Database & Schemas
- [ ] `packages/db/prisma/schema.prisma` — Add enums, models, relations
- [ ] `packages/schemas/src/admin-permissions.ts` — New permission catalog
- [ ] `packages/schemas/src/index.ts` — Export new admin permission types

### tRPC & Server
- [ ] `apps/web/trpc/routers/admin-staff.ts` — Complete router
- [ ] `apps/web/trpc/init.ts` — Add `adminStaffProcedure` middleware
- [ ] `apps/web/lib/permissions/admin-authorize.ts` — Authorization helpers
- [ ] `apps/web/lib/permissions/admin-staff-hierarchy.ts` — Hierarchy exports

### Client Lib
- [ ] `apps/web/features/admin/lib/admin-staff.ts` — Types, labels, colors, helpers
- [ ] `apps/web/features/admin/lib/validations/admin-staff.ts` — Zod schemas
- [ ] `apps/web/features/admin/lib/admin-staff-search-params.ts` — nuqs parsers

### Hooks
- [ ] `apps/web/features/admin/hooks/use-admin-permissions.ts` — Permission hook

### Components (Staff)
- [ ] `admin-staff-page-header.tsx`
- [ ] `admin-staff-filters-toolbar.tsx`
- [ ] `admin-staff-members-section.tsx`
- [ ] `admin-staff-invitations-section.tsx`
- [ ] `admin-staff-activity-section.tsx`
- [ ] `admin-staff-member-row.tsx`
- [ ] `admin-staff-invitation-card.tsx`
- [ ] `admin-staff-activity-item.tsx`
- [ ] `invite-sheet.tsx`
- [ ] `role-sheet.tsx`
- [ ] `edit-permissions-sheet.tsx`
- [ ] `transfer-ownership-dialog.tsx`
- [ ] `remove-staff-dialog.tsx`
- [ ] `permission-matrix.tsx`
- [ ] `role-badge.tsx`
- [ ] `status-badge.tsx`
- [ ] `member-avatar.tsx`

### Views & Pages
- [ ] `apps/web/features/admin/views/admin-staff-view.tsx`
- [ ] `apps/web/app/[locale]/dashboard/admin/(dashboard)/staff/page.tsx`

### Sidebar & Navigation
- [ ] Update `apps/web/features/admin/components/admin-sidebar.tsx` — Add Staff link

### Migration & Scripts
- [ ] Prisma migration: `add_admin_staff_iam`
- [ ] `packages/db/scripts/seed-admin-staff.ts` — Seed existing admins

### Translations
- [ ] Add `adminDashboard.staff` namespace to `apps/web/messages/en.json`
- [ ] Add `adminDashboard.staff` namespace to `apps/web/messages/fr.json`

### Tests
- [ ] `packages/schemas/src/__tests__/admin-roles-permissions.test.ts`
- [ ] `apps/web/lib/__tests__/permissions/admin-authorize.test.ts`
- [ ] `apps/web/features/admin/lib/__tests__/admin-staff-hierarchy.test.ts`
- [ ] `apps/web/trpc/routers/__tests__/admin-staff.test.ts`

---

## 14. Implementation Order (Dependencies)

1. **Database Layer** (Prisma schema + migration)
2. **Schemas Package** (Permission catalog, types, validation schemas)
3. **Server Authorization** (admin-authorize.ts, admin-staff-hierarchy.ts, init.ts middleware)
4. **tRPC Router** (admin-staff.ts)
5. **Client Lib** (admin-staff.ts, validations, search-params)
6. **Hook** (use-admin-permissions.ts)
7. **UI Components** (staff components - can parallelize)
8. **View & Page** (admin-staff-view.tsx, page.tsx)
9. **Sidebar Integration** (admin-sidebar.tsx)
10. **Translations** (translation files)
11. **Seeding Script** (seed-admin-staff.ts)
12. **Testing** (run typecheck, lint, manual verification)

---

## 15. Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Separate `AdminStaff` model | Clean separation from operator staff; platform-wide scope |
| `SUPER_ADMIN` as top role | Mirrors `OWNER` pattern; implicit all permissions |
| Email invitation flow | Matches operator UX; secure token-based acceptance |
| `admin-staff:read` permission for sidebar | Consistent permission-gated navigation |
| OTP-based ownership transfer | Same security pattern as operator transfer |
| Activity log with `companyId = NULL` | Platform-level audit trail |
| Permission matrix grouped by domain | Scalable UI for 70+ permissions |

---

## 16. Risk Mitigation

- **Type safety**: All permission keys typed via `AdminPermissionKey` — prevents typos
- **Migration safety**: Seed script idempotent; checks existing records
- **Backward compat**: Existing `UserRole.ADMIN` unchanged; new system additive
- **Performance**: Indexed queries; pagination on all list endpoints
- **Security**: Server-side checks on every mutation; `requireCanGrant` prevents privilege escalation

---

## 17. Estimated Effort

| Phase | Files | Est. Hours |
|-------|-------|------------|
| Database & Schemas | 3 | 2 |
| Server Auth & tRPC | 4 | 4 |
| Client Lib & Hook | 4 | 2 |
| Staff Components | 16 | 12 |
| View & Page | 2 | 3 |
| Sidebar & Translations | 2 | 1 |
| Migration & Seeding | 2 | 1 |
| Tests | 4 | 3 |
| **Total** | **37** | **~28 hours** |

---

## 18. Next Steps

1. **Phase 1**: Create Prisma schema changes + migration
2. **Phase 2**: Build schemas package with admin permissions
3. **Phase 3**: Implement server authorization + tRPC router
4. **Phase 4**: Build client lib, hooks, components
5. **Phase 5**: Create view, page, sidebar integration
6. **Phase 6**: Add translations, seeding, tests
7. **Verification**: Run `pnpm typecheck`, `pnpm lint`, manual QA