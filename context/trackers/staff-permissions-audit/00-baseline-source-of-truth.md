# 00 — Baseline: Source-of-Truth Reference (verified 2026-08-07)

> This file records the **actual current code** for the two IAM catalogs, the role
> hierarchies, and the authorization helpers — captured at audit time from the
> source files. Every later findings doc in this folder refers to these facts.
> Where the older audit docs (01–09, 11) contradict this file, THIS file wins.

---

## 1. Operator IAM — `packages/schemas/src/permissions.ts`

### 1.1 Roles (`STAFF_ROLES`)
`OWNER, ADMIN, MANAGER, OPERATIONS, FINANCE, SUPPORT, TREASURY, DISPATCHER, CONDUCTOR` (9 roles).

### 1.2 Full permission catalog (`PERMISSION_META`) — sorted by declaration order

| Key | Group |
|---|---|
| `routes:read` | Routes |
| `routes:create` | Routes |
| `routes:update` | Routes |
| `routes:delete` | Routes |
| `terminals:read` | Terminals |
| `terminals:create` | Terminals |
| `terminals:update` | Terminals |
| `terminals:delete` | Terminals |
| `terminals:geocapture` | Terminals |
| `fleet:read` | Fleet |
| `fleet:create` | Fleet |
| `fleet:update` | Fleet |
| `fleet:delete` | Fleet |
| `schedules:read` | Schedules |
| `schedules:create` | Schedules |
| `schedules:update` | Schedules |
| `schedules:delete` | Schedules |
| `trips:read` | Trips |
| `trips:create` | Trips |
| `trips:update` | Trips |
| `trips:cancel` | Trips |
| `trips:dispatch` | Trips |
| `bookings:read` | Bookings |
| `bookings:update` | Bookings |
| `bookings:cancel` | Bookings |
| `bookings:checkin` | Bookings |
| `revenue:view` | Financials |
| `revenue:export` | Financials |
| `financials:view` | Financials |
| `withdrawals:view` | Financials |
| `withdrawals:create` | Financials |
| `staff:read` | Staff |
| `staff:invite` | Staff |
| `staff:update` | Staff |
| `staff:remove` | Staff |
| `company:view` | Company |
| `company:profile:update` | Company |
| `company:banking:update` | Company |
| `company:compliance:update` | Company |
| `company:delete` | Company |
| `reviews:read` | Reviews |
| `reviews:respond` | Reviews |

Total: **42 keys** (counted from `PERMISSION_META`, `permissions.ts:25-87`).
Note: `company:update` does NOT exist (removed / split into
`company:profile:update`, `company:banking:update`, `company:compliance:update`).
`company:delete` DOES exist. The original tracker's "40"/"31" key counts were
superseded by this exact count (verified 2026-08-07: 42 two/three-part keys in
`PERMISSION_META`).

### 1.3 Role templates (`ROLE_TEMPLATES`)

| Key | OWNER\* | ADMIN | MANAGER | OPERATIONS | FINANCE | SUPPORT | TREASURY | DISPATCHER | CONDUCTOR |
|---|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|:---:|
| routes:read | ✅ | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ✅ | ✅ |
| routes:create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| routes:update | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| routes:delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| terminals:read | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| terminals:create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| terminals:update | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| terminals:delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| terminals:geocapture | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| fleet:read | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| fleet:create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| fleet:update | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| fleet:delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| schedules:read | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ |
| schedules:create | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| schedules:update | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| schedules:delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| trips:read | ✅ | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ✅ |
| trips:create | ✅ | ❌ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| trips:update | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| trips:cancel | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ✅ | ❌ |
| trips:dispatch | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ |
| bookings:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| bookings:update | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ |
| bookings:cancel | ✅ | ✅ | ❌ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |
| bookings:checkin | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ✅ |
| revenue:view | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| revenue:export | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| financials:view | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| withdrawals:view | ✅ | ✅ | ❌ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| withdrawals:create | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ✅ | ❌ | ❌ |
| staff:read | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| staff:invite | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| staff:update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| staff:remove | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| company:view | ✅ | ✅ | ✅ | ❌ | ✅ | ❌ | ✅ | ❌ | ❌ |
| company:profile:update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| company:banking:update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| company:compliance:update | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| company:delete | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ | ❌ |
| reviews:read | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |
| reviews:respond | ✅ | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ | ❌ |

\* `OWNER` template stored `[]`; `getTemplatePermissions("OWNER")` returns ALL keys (implicit-all).

**Observations from the template matrix:**
- `trips:create` present in OPERATIONS but NOT in ADMIN/MANAGER (unusual — lower tier has a creation right ADMIN/MANAGER lack; same for `bookings:cancel` in OPERATIONS but not MANAGER).
- `bookings:checkin` only CONDUCTOR (+ ADMIN implicit).
- FINANCE is view-only on payouts (`withdrawals:view`, no `withdrawals:create`); TREASURY is the creator.
- SUPPORT is effectively read-only (schedules:read, trips:read, bookings:read, reviews:read) — no `bookings:update` anymore, unlike the OLD audit doc 02 which said SUPPORT had `bookings:update` + `reviews:respond`.
- MANAGER has no delete keys.
- DISPATCHER has dispatch/trips-ops; CONDUCTOR has checkin.

### 1.4 `ASSIGNABLE_ROLES` (who can invite/assign whom)
- OWNER → all 8 others
- ADMIN → MANAGER, OPERATIONS, FINANCE, SUPPORT, TREASURY, DISPATCHER, CONDUCTOR
- MANAGER → OPERATIONS, SUPPORT, TREASURY, DISPATCHER, CONDUCTOR
- OPERATIONS/FINANCE/SUPPORT/TREASURY/DISPATCHER/CONDUCTOR → none

### 1.5 `ROLE_LEVELS`
OWNER 600 · ADMIN 500 · MANAGER 400 · OPERATIONS 300 · DISPATCHER 350 · TREASURY 260 · CONDUCTOR 275 · FINANCE 250 · SUPPORT 200

(Note ordering: DISPATCHER 350 < OPERATIONS 300? No — 350 > 300; but FINANCE 250 < CONDUCTOR 275 < TREASURY 260 — CONDUCTOR (275) > TREASURY (260) > FINANCE (250), unusual.)

### 1.6 Runtime semantics
- `getTemplatePermissions(role)`: OWNER→all keys, else template.
- `getEffectivePermissions(role, stored)`: OWNER→all keys, else only stored keys that are valid catalog keys (invalid/stale stored keys filtered out).
- `hasPermission(role, stored, key)`: OWNER→true, else `stored.includes(key)`.
- `assertCanGrant(actorRole, actorStored, proposed)`: OWNER→ok, else every proposed key must be in actor's **effective** (stored) set.

---

## 2. Admin IAM — `packages/schemas/src/admin-permissions.ts`

### 2.1 Roles (`ADMIN_STAFF_ROLES`)
`SUPER_ADMIN, ADMIN, OPERATIONS, SUPPORT, COMPLIANCE, FINANCE` (6 roles).

### 2.2 Full permission catalog (`ADMIN_PERMISSION_META`)
Groups: Users (users:read/create/update/delete/impersonate), Companies (companies:read/create/update/delete/verify/suspend), Operator Staff (operator-staff:read/update/remove), Financials (platform:financials:read, platform:withdrawals:read/resolve, platform:settlements:read/manage, platform:ledger:read, platform:commission:manage), Operations (platform:trips:read/manage, platform:routes:read/manage, platform:schedules:read/manage, platform:fleet:read, platform:terminals:read), Verifications (verifications:read/decide/manage), Audit & Security (audit:read, audit:bank-access:read, audit:webhooks:read), Content (content:posts:read/create/update/delete/publish, content:categories:manage, content:tags:manage, content:redirects:manage, content:analytics:read), Support (support:inquiries:read/respond/manage), Platform Settings (platform:settings:read/update/audit), Admin Staff (admin-staff:read/invite/update/remove/transfer), System (system:health:read, system:feature-flags:manage).

### 2.3 Templates (`ADMIN_ROLE_TEMPLATES`)
- `SUPER_ADMIN`: `[]` (implicit all). `ADMIN`/`OPERATIONS`/`SUPPORT`/`COMPLIANCE`/`FINANCE` each have explicit lists (see code).
- Notable: `system:feature-flags:manage` appears in NO template. `users:impersonate`, `companies:create`, `companies:delete`, `content:posts:delete` appear in NO template. `admin-staff:transfer` present only in SUPER_ADMIN implicit (not in ADMIN template — but SUPER_ADMIN is implicit-all anyway).

### 2.4 `ADMIN_ASSIGNABLE_ROLES`
SUPER_ADMIN → ADMIN, OPERATIONS, SUPPORT, COMPLIANCE, FINANCE. ADMIN → OPERATIONS, SUPPORT, COMPLIANCE, FINANCE. Others → none.

### 2.5 `ADMIN_ROLE_LEVELS`
SUPER_ADMIN 600 · ADMIN 500 · OPERATIONS 400 · COMPLIANCE 350 · FINANCE 300 · SUPPORT 200

### 2.6 Runtime semantics
- `getAdminEffectivePermissions(role, stored)`: SUPER_ADMIN→all keys, else filter valid.
- `hasAdminPermission(role, stored, key)`: SUPER_ADMIN→true, else stored.includes.
- `assertAdminCanGrant`: SUPER_ADMIN→ok, else all proposed in actor effective set.
- `canModifyAdminMember(modifierRole, targetRole)` = level(modifier) > level(target).
- `canAssignAdminRole` via ADMIN_ASSIGNABLE_ROLES.

---

## 3. Operator authorization helpers — `apps/web/lib/permissions/authorize.ts`
- `PermissionContext` = `{ user: {id, role}, operator: {role, permissions, status, companyId}, companyId }`.
- `operatorHasPermission(ctx, key)`: `ADMIN` user → true; `SUSPENDED` → false; else `hasPermission(role, perms, key)`.
- `requirePermission`, `requireAnyPermission`, `requireAllPermissions`, `requireCanGrant`, `requireOwner`.
- `requireOwner`: `ADMIN` user → pass; else role must be `OWNER`.
- `requireCanGrant`: `ADMIN` user → pass; else `assertCanGrant` on operator role+stored.
- Note: `requireOwner` and `requireCanGrant` treat a platform `ADMIN` User as bypassing (caller context user.role === "ADMIN").

## 4. Admin authorization helpers — `apps/web/lib/permissions/admin-authorize.ts`
- `AdminPermissionContext` = `{ user: {id, role}, adminStaff: {role, permissions, status} }`.
- `adminHasPermission(ctx, key)`: `ADMIN` user AND `SUPER_ADMIN` role → true; `SUSPENDED` → false; else `hasAdminPermission`.
- Helpers: `requireAdminPermission`, `requireAdminAnyPermission`, `requireAdminAllPermissions`, `requireAdminCanGrant`, `requireSuperAdmin`.
- `requireSuperAdmin`: user.role ADMIN AND adminStaff.role SUPER_ADMIN → pass.

## 5. Hierarchies (re-export only)
- `apps/web/lib/permissions/staff-hierarchy.ts` re-exports operator ASSIGNABLE_ROLES/ROLE_LEVELS/canAssignRole/canModifyMember/getRoleLevel/StaffRole from schemas.
- `apps/web/lib/permissions/admin-staff-hierarchy.ts` re-exports admin equivalents.
- These are thin re-export shims — logic lives in `@moja/schemas`.

## 6. tRPC procedure chain — `apps/web/trpc/init.ts`
- `publicProcedure` (CSRF middleware on mutations) → `protectedProcedure` (auth) →
  - `operatorProcedure` (user.role OPERATOR or ADMIN) →
    - `operatorCompanyProcedure` (resolves operator profile by userId, caches per-request; requires companyId; blocks SUSPENDED; sets ctx.operator + ctx.companyId)
  - `adminProcedure` (user.role ADMIN)
    - `adminStaffProcedure` (loads adminStaff by userId, requires not-deleted; blocks SUSPENDED; sets ctx.adminStaff)
- Context always includes `prisma`, `user`, `headers`, `_cache`.

## 7. Schema models (Prisma) — relevant to IAM
- `Operator`: `role StaffRole`, `permissions String[]`, `permissionsUpdatedAt`, `permissionsUpdatedBy`, `status OperatorStatus` (NOT enum `StaffRole` — verify `OperatorStatus`), `isActive`, `deletedAt`. `@@unique([userId, companyId])`.
- `AdminStaff`: `role AdminStaffRole`, `permissions String[]`, `permissionsUpdatedAt`, `permissionsUpdatedBy`, `status AdminStaffStatus`, `isActive`, `deletedAt`. `userId @unique`.
- `AdminStaffInvitation`: email, role AdminStaffRole, permissions String[], jobTitle, message, token unique, status String (default PENDING), expiresAt, invitedById, acceptedById, acceptedAt.
- `AdminStaffActivityLog`: userId, user, action, description, metadata, targetUserId, createdAt.
- `StaffInvitation`, `ActivityLog`, `StaffInvitation/InvitedBy etc.` — from the older operator system (verify fields in sub-audit).
- `UserRole`: TRAVELER / OPERATOR / ADMIN. `StaffRole` enum separate from `UserRole`.

---

*End of baseline reference.* This doc is intended to be permanent and updated only when the catalogs/helpers themselves change.