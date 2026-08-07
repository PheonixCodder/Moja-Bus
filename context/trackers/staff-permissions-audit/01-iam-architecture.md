# 01 — IAM Architecture: How Authorization Actually Works

This file explains the staff/role/permission system end-to-end: where the truth lives, how a request is authorized, how roles and permissions combine, and how the pieces (DB → schema catalog → server guard → client guard) fit together.

---

## 1. Data model (`packages/db/prisma/schema.prisma`)

### Entities
| Model | Purpose | Key fields |
|---|---|---|
| `User` | Identity (Better Auth session user) | `role: UserRole` (TRAVELER / OPERATOR / ADMIN), `email`, `phoneNumber`, `workEmail`, `workPhone`, `fullName` |
| `Operator` | A staff member *inside a company* | `companyId`, `userId`, `role: StaffRole`, `permissions: String[]`, `status: OperatorStatus`, `isActive`, `isVerified`, `deletedAt`, `onboardingStatus`, personal KYC fields |
| `Company` | Operator company | `status: CompanyStatus`, `verifiedBy`, acceptance timestamps, `paystackTransferRecipientCode`, `settlementPolicyId` |
| `StaffInvitation` | Pending invite | `email`, `role`, `permissions: String[]` (snapshot), `token` (hashed), `expiresAt`, `status`, `invitedById`, `acceptedById` |
| `ActivityLog` | Audit trail | `companyId`, `userId`, `action`, `metadata`, `targetUserId`, `description` |
| `PlatformSettings` / `PlatformSettingsAudit` | Global platform config + audit | commission/fee bps, withdrawal rules, `require2FAForWithdrawals` |

### The authoritative IAM store
```prisma
model Operator {
  ...
  role       StaffRole      @default(OWNER)
  permissions String[]      @default([])   // <-- authoritative IAM action set
  status     OperatorStatus @default(ACTIVE)
  ...
  @@unique([userId, companyId])
}
```
Key design decision (documented in the schema comment): **`permissions[]` on `Operator` is the authoritative per-member action set.** For `OWNER` the stored set is ignored at runtime — OWNER is implicit-all. `StaffInvitation.permissions` is a *snapshot* copied onto the `Operator` row on acceptance.

Enums:
- `StaffRole`: `OWNER | ADMIN | MANAGER | OPERATIONS | FINANCE | SUPPORT`
- `OperatorStatus`: `ACTIVE | INACTIVE | SUSPENDED`
- `InvitationStatus`: `PENDING | ACCEPTED | EXPIRED | CANCELLED`
- `UserRole` (platform-level, distinct from staff role): `TRAVELER | OPERATOR | ADMIN`

> **Note:** There are **two different "role" concepts** that must not be conflated:
> 1. `User.role` (platform identity): `TRAVELER` / `OPERATOR` / `ADMIN`. Inviting a user upgrades `User.role` to `OPERATOR`; platform admins are `ADMIN`.
> 2. `Operator.role` (staff role inside a company): `OWNER` / `ADMIN` / ... / `SUPPORT`.
> The permission system uses **both**: `operatorHasPermission` gives an implicit bypass when `user.role === "ADMIN"`, and otherwise evaluates `operator.role` + `operator.permissions`.

---

## 2. Permission catalog (`packages/schemas/src/permissions.ts`)

The single source of truth. Exports:
- `PERMISSION_META` — 31 keys, each with a `group` and `label` (used to render the permission matrix UI).
- `PERMISSION_KEYS` / `PermissionKeySchema` / `PermissionListSchema` (Zod) — used for validation of `updatePermissions` / invitation permissions.
- `ROLE_TEMPLATES` — default permission set per staff role (the "role templates").
- `ASSIGNABLE_ROLES` — which role each role may assign (hierarchy for invitation/role assignment).
- `ROLE_LEVELS` — numeric level per role for `canModifyMember` (hierarchy for modifying/removing members).
- Helpers: `getRoleLevel`, `canAssignRole`, `canModifyMember`, `getTemplatePermissions`, `getEffectivePermissions`, `hasPermission`, `assertCanGrant`, `isPermissionKey`.

The 31 keys (grouped):
- **Routes**: `routes:read`, `routes:create`, `routes:update`, `routes:delete`
- **Terminals**: `terminals:read`, `terminals:create`, `terminals:update`, `terminals:delete`
- **Fleet**: `fleet:read`, `fleet:create`, `fleet:update`, `fleet:delete`
- **Schedules**: `schedules:read`, `schedules:create`, `schedules:update`, `schedules:delete`
- **Trips**: `trips:read`, `trips:create`, `trips:update`, `trips:cancel`
- **Bookings**: `bookings:read`, `bookings:update` (note: **no `bookings:create`, no `bookings:cancel`**)
- **Financials**: `revenue:view`, `withdrawals:view`, `withdrawals:create`
- **Staff**: `staff:read`, `staff:invite`, `staff:update`, `staff:remove`
- **Company**: `company:view`, `company:update`
- **Reviews**: `reviews:read`, `reviews:respond`

Note: `trips:create` exists but is **not** used by any default template (see template analysis). There is no `terminals:geocapture` key — geo-capture actions are gated by `terminals:update`.

---

## 3. The three guard layers (defense in depth)

```
Request → proxy.ts (locale only)
        → (dashboard)/layout.tsx (auth + User.role ∈ {OPERATOR, ADMIN})
        → tRPC procedure type (operatorCompanyProcedure: membership + not SUSPENDED)
        → requirePermission(ctx, key) in the handler   ← THE ONLY REAL ENFORCEMENT
        → client-side can() (UX only — hides buttons/nav; never security)
```

### Layer 1 — Middleware / proxy (`apps/web/proxy.ts`)
Next-intl locale routing **only**. No auth, no role, no permission checks. Matcher excludes `/api`, `/_next`, static files.

### Layer 2 — Route layout (`apps/web/app/[locale]/dashboard/operator/(dashboard)/layout.tsx`)
- Reads `getServerSession()`; redirects to `/operator/login` if no session.
- Redirects to `/dashboard` if `user.role` is neither `OPERATOR` nor `ADMIN`.
- **Every staff member has `User.role === "OPERATOR"`**, so this gate admits all staff regardless of their staff permissions.
- Prefetches `operator.getShellContext` (ungated) and `staff.getMyPermissions` (ungated) for the sidebar.

### Layer 3 — tRPC procedure type (`apps/web/trpc/init.ts`)
| Procedure | Chain | Gate |
|---|---|---|
| `publicProcedure` | `t.procedure` + CSRF middleware | None |
| `protectedProcedure` | `publicProcedure` + session | `ctx.user.id` exists |
| `operatorProcedure` | `protectedProcedure` + role | `user.role ∈ {OPERATOR, ADMIN}` |
| `operatorCompanyProcedure` | `operatorProcedure` + profile | has non-SUSPENDED `Operator` with `companyId` |
| `adminProcedure` | `protectedProcedure` + role | `user.role === "ADMIN"` |

CSRF: the base middleware rejects mutations whose `Origin` host ≠ `Host` host.

### Layer 4 — Handler-level `requirePermission` (`apps/web/lib/permissions/authorize.ts`)
This is where staff permissions are actually evaluated:
```ts
export function operatorHasPermission(ctx, key) {
  if (ctx.user.role === "ADMIN") return true;                    // platform ADMIN bypass
  if (ctx.operator.status === "SUSPENDED") return false;         // suspended = denied
  return hasPermission(ctx.operator.role, ctx.operator.permissions ?? [], key);
}
// hasPermission(role, stored, key): OWNER → true; else stored.includes(key)
```
Helpers:
- `requirePermission(ctx, key)` — throws `FORBIDDEN` if `operatorHasPermission` false.
- `requireAnyPermission(ctx, keys)` — needs at least one.
- `requireAllPermissions(ctx, keys)` — needs all.
- `requireCanGrant(ctx, proposed)` — every proposed key must be in the caller's effective set (OWNER/ADMIN bypass).
- `requireOwner(ctx)` — `user.role === "ADMIN"` OR `operator.role === "OWNER"`.

### Layer 5 — Client-side `can()` (`apps/web/features/operator/hooks/use-staff-permissions.ts`)
```ts
function can(key) {
  if (role === "OWNER") return true;
  return permissionSet.has(key);     // role/permissions from trpc.staff.getMyPermissions
}
```
Purely cosmetic: hides nav items (`operator-sidebar.tsx`), hides/gates action buttons in 5 of 11 views. **Never a security boundary.**

---

## 4. Effective-permission model

- `getEffectivePermissions(role, stored)`: `OWNER` → **all 31 keys**; otherwise the stored array filtered to valid keys.
- `staff.getMyPermissions` returns `getOperatorEffectivePermissions(operator)` so the client never has to know the catalog.
- **Invitation acceptance** (`trpc/routers/invitation.ts:accept`): copies `invitation.permissions` onto the operator; falls back to `ROLE_TEMPLATES[role]` if empty.
- **Role change** (`staff.updateRole`): always overwrites `permissions` with `ROLE_TEMPLATES[targetRole]` (privilege-reset by design — see `resetPermissions` bug in file 07).
- **Ownership transfer** (`staff.transferOwnership`): old owner → `ADMIN` + `ROLE_TEMPLATES.ADMIN`; target → `OWNER` + `permissions: []`.

---

## 5. Role hierarchy rules (`packages/schemas/src/permissions.ts` + `apps/web/lib/permissions/staff-hierarchy.ts`)

```ts
ASSIGNABLE_ROLES = {
  OWNER:    [ADMIN, MANAGER, OPERATIONS, FINANCE, SUPPORT],
  ADMIN:    [MANAGER, OPERATIONS, FINANCE, SUPPORT],
  MANAGER:  [OPERATIONS, SUPPORT],
  OPERATIONS: [], FINANCE: [], SUPPORT: [],
};
ROLE_LEVELS = { OWNER: 600, ADMIN: 500, MANAGER: 400, OPERATIONS: 300, FINANCE: 250, SUPPORT: 200 };
canModifyMember(modifierRole, targetRole) = level(modifier) > level(target);
```
Enforced server-side in `staff.ts` via `assertCanModifyTarget` (also protects OWNER targets and grants a platform-ADMIN bypass) plus `canAssignRole` checks, and an additional "only OWNER (or platform ADMIN) may assign/invite ADMIN" rule.

---

## 6. Where the truth diverges (summary)

| Concern | Server truth | Client reality |
|---|---|---|
| Who can do an action | `requirePermission` in handler (correct) | 6/11 views show all buttons; settings shows all edit controls; server 403 on submit |
| Page visibility | No explicit route guard; router throw → error boundary | Sidebar hides nav items by `can()` (bypassable by typing URL) |
| Platform ADMIN | Full bypass (read + grant + owner ops) | Invisible — client only knows operator role |
| OWNER | Implicit-all | `can()` returns true; UI hides OWNER row actions |
| Suspension | `operatorCompanyProcedure` blocks + `operatorHasPermission` false | No explicit UI state (suspended users just error) |

Continue to [`02-permission-catalog.md`](./02-permission-catalog.md).
