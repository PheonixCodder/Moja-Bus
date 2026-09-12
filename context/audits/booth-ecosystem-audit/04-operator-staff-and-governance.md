# Module 04: Operator Staff Management & IAM Governance

> **Audit Context**: Staff Onboarding, Roles, Permissions, Invitations & Dashboard Integration  
> **Target Files**: `apps/web/app/[locale]/dashboard/operator/(dashboard)/staff/*`, `apps/web/features/operator/components/staff/*`, `packages/schemas/src/permissions.ts`, `apps/web/features/operator/lib/validations/staff.ts`, `apps/web/trpc/routers/staff.ts`, `apps/web/trpc/routers/invitation.ts`  

---

## 1. The Broken Staff Invitation Paradox (P0 Blocker)

An operator cannot invite a booth agent to their company. The codebase contains a self-defeating omission where the `BOOTH` role exists in the database enum, but is barred from the invitation and role assignment schemas.

### A. The Schema Exclusion (`packages/schemas/src/permissions.ts`)
```typescript
// packages/schemas/src/permissions.ts:9-22
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
  "BOOTH", // <-- Present in the system role catalog
] as const;

// packages/schemas/src/permissions.ts:34-43
export const INVITABLE_STAFF_ROLES = [
  "ADMIN",
  "MANAGER",
  "OPERATIONS",
  "FINANCE",
  "SUPPORT",
  "TREASURY",
  "DISPATCHER",
  "CONDUCTOR",
  // <-- "BOOTH" IS COMPLETELY MISSING!
] as const;

export const InvitableStaffRoleSchema = z.enum(INVITABLE_STAFF_ROLES);
```

### B. The Validation Rejection (`apps/web/features/operator/lib/validations/staff.ts`)
```typescript
export const CreateInvitationSchema = z.object({
  email: z.string().email(),
  role: InvitableStaffRoleSchema, // <-- Rejects "BOOTH" with 400 Bad Request
  permissions: PermissionListSchema,
  jobTitle: z.string().optional(),
  message: z.string().optional(),
  expiryDays: z.number().default(7),
});

export const UpdateRoleSchema = z.object({
  memberId: z.string(),
  role: InvitableStaffRoleSchema, // <-- Rejects "BOOTH" with 400 Bad Request
  resetPermissions: z.boolean().default(true),
});
```

### C. The Bizarre Role Sheet Coercion (`apps/web/features/operator/components/staff/role-sheet.tsx`)
Because `BOOTH` is missing from `InvitableStaffRole`, the frontend developer encountered a TypeScript error and resolved it by **coercing any existing booth agent to an ADMIN**:
```typescript
// apps/web/features/operator/components/staff/role-sheet.tsx:78-90
useEffect(() => {
  if (member) {
    // Phase B1 — BOOTH is also not an InvitableStaffRole; coerce to ADMIN.
    setRole(
      member.role === "OWNER" || member.role === "DRIVER" || member.role === "BOOTH"
        ? "ADMIN"
        : member.role,
    );
    setResetPermissions(true);
  }
}, [member]);
```
**Consequence**: If an existing operator has a booth staff member, opening their role sheet and clicking "Save" silently elevates them to **full Company Administrator**, granting them access to fleet, banking, withdrawals, routes, and executive permissions!

---

## 2. Dashboard Invite Sheet Omission (`invite-sheet.tsx`)

In `apps/web/features/operator/components/staff/invite-sheet.tsx`:
```typescript
// lines 36-45
const INVITABLE_ROLES: InvitableStaffRole[] = [
  "OPERATIONS",
  "MANAGER",
  "ADMIN",
  "FINANCE",
  "SUPPORT",
  "TREASURY",
  "DISPATCHER",
  "CONDUCTOR",
  // "BOOTH" missing
];
```
The "Role" dropdown in the operator dashboard only lists the 8 non-booth roles. An operator owner or manager looking to add a cashier at the Adjamé or Cocody terminal has **no option for Booth Agent** in the dropdown.

---

## 3. Role Hierarchy & Assignment Matrix Deficiencies

In `packages/schemas/src/permissions.ts:367–400`:
```typescript
export const ASSIGNABLE_ROLES: Record<StaffRole, StaffRole[]> = {
  OWNER: [
    "ADMIN", "MANAGER", "OPERATIONS", "FINANCE", "SUPPORT",
    "TREASURY", "DISPATCHER", "CONDUCTOR", "DRIVER", "BOOTH",
  ],
  ADMIN: [
    "MANAGER", "OPERATIONS", "FINANCE", "SUPPORT",
    "TREASURY", "DISPATCHER", "CONDUCTOR",
    // <-- "BOOTH" IS MISSING FROM ADMIN ASSIGNABLE ROLES!
  ],
  MANAGER: [
    "OPERATIONS", "SUPPORT", "DISPATCHER", "CONDUCTOR",
    // <-- "BOOTH" IS MISSING FROM MANAGER ASSIGNABLE ROLES!
  ],
};
```
### Analysis:
- Company Admins and General Managers (who handle 95% of field hiring for terminal cashiers) are **forbidden from assigning the `BOOTH` role**, even if the schema allowed it! Only the Company `OWNER` can assign `BOOTH`. This does not match real-world operations in transport companies.

---

## 4. Booth Role Permissions Template

In `packages/schemas/src/permissions.ts:360–364`:
```typescript
BOOTH: [
  "bookings:read",
  "bookings:checkin",
],
```
### Deficiencies:
1. **No Counter Sale Permission**: There is no `bookings:sell` or `booth:operate` IAM permission. The booth procedures in `apps/web/trpc/routers/booth.ts` check role membership (`BOOTH_ELIGIBLE_ROLES`) rather than fine-grained IAM action keys.
2. **Missing Terminal Context**: The permissions system has no concept of resource scoping (e.g., `terminals:read` only for assigned terminal). A booth agent granted `bookings:read` can view all bookings across all company terminals.

---

## 5. Staff Invitation Acceptance & Onboarding Flow

In `apps/web/trpc/routers/invitation.ts`:
1. `validateToken`: Validates unexpired invitation token.
2. `accept`: 
   - Verifies `ctx.user.email === invitation.email`.
   - Upgrades `User.role = "OPERATOR"`.
   - Creates or reactivates `Operator` record with `role: invitation.role` and `permissions: invitation.permissions`.
   - Sets `onboardingStatus = "COMPLETED"`.
3. **Novu Notification**: `operator-staff-invite` triggers an email to the staff member with a link to `/invite?token=...`.

### The Mobile Onboarding Gap:
When a booth agent accepts an invite via the web link `/invite?token=...`, they create an account and verify their email on the web portal. However:
- There is no prompt or deep link guiding them to install or open `apps/booth-app`.
- The web dashboard will detect their role as `BOOTH`. Since `BOOTH` has no ERP permissions, the operator dashboard redirects them to an empty state or denies navigation, leaving the employee confused without mobile app instructions.

---

## 6. Complete Absence of Terminal Scoping

In public transport operations, booth cashiers are physically assigned to a specific booth/terminal (e.g., "Gare de Bassam", "Gare de Yopougon"). 
1. **Schema Reality**: Neither `Operator` nor `StaffInvitation` has a `terminalId` field.
2. **Financial Risk**: Because there is no terminal scoping, an agent can log in to the booth app, pick any terminal in the country, and begin recording cash sales against that terminal's shift ledger. This makes shift reconciliation, cash handovers, and till auditing impossible to track accurately by physical station.
