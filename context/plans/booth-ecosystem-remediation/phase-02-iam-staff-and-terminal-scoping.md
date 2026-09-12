# Phase 02: IAM, Operator Staff Governance & Terminal Scoping

> **Phase Focus**: Unlock `BOOTH` Role Invitations, Eliminate Admin Elevation Bug, Add Terminal Scoping  
> **Defects Resolved**: `BTH-P0-03`, `BTH-P0-04`, `BTH-P2-03`, `BTH-P2-04`  

---

## 1. Problem Definition & Root Causes

1. **Invitation Schema Block (`BTH-P0-03`)**: `packages/schemas/src/permissions.ts:34` defines `INVITABLE_STAFF_ROLES` without `BOOTH`. Any attempt by an operator to invite a cashier throws a Zod validation error: `Invalid enum value. Expected 'ADMIN' | 'MANAGER' | 'OPERATIONS' ...`.
2. **Silent Admin Elevation (`BTH-P0-04`)**: In `apps/web/features/operator/components/staff/role-sheet.tsx:84`, opening the role sheet for a `BOOTH` member coerces them to `ADMIN`. If the operator saves, the cashier is granted full enterprise administrator rights.
3. **Manager Role Assignment Barrier (`BTH-P2-04`)**: `ASSIGNABLE_ROLES` permits only `OWNER` to assign `BOOTH`. Operations Managers and Admins are blocked from delegating the role.
4. **No Station/Terminal Binding (`BTH-P2-03`)**: `Operator` has no foreign key to `CompanyLocation`. Cashiers can execute sales against any terminal in the country.

---

## 2. Implementation Specifications

### Step 1: Update Monorepo IAM Catalog
File: `packages/schemas/src/permissions.ts`
```diff
export const INVITABLE_STAFF_ROLES = [
  "ADMIN",
  "MANAGER",
  "OPERATIONS",
  "FINANCE",
  "SUPPORT",
  "TREASURY",
  "DISPATCHER",
  "CONDUCTOR",
+ "BOOTH",
] as const;

export const ASSIGNABLE_ROLES: Record<StaffRole, StaffRole[]> = {
  OWNER: [
    "ADMIN", "MANAGER", "OPERATIONS", "FINANCE", "SUPPORT",
    "TREASURY", "DISPATCHER", "CONDUCTOR", "DRIVER", "BOOTH",
  ],
  ADMIN: [
    "MANAGER", "OPERATIONS", "FINANCE", "SUPPORT",
    "TREASURY", "DISPATCHER", "CONDUCTOR",
+   "BOOTH",
  ],
  MANAGER: [
    "OPERATIONS", "SUPPORT", "DISPATCHER", "CONDUCTOR",
+   "BOOTH",
  ],
  ...
};
```

### Step 2: Fix Role Sheet & Invite Sheet in Operator ERP
File: `apps/web/features/operator/components/staff/role-sheet.tsx`
```diff
const FALLBACK_ROLES: InvitableStaffRole[] = [
  "OPERATIONS",
  "MANAGER",
  "ADMIN",
  "FINANCE",
  "SUPPORT",
  "TREASURY",
  "DISPATCHER",
  "CONDUCTOR",
+ "BOOTH",
];

// In useEffect:
- setRole(
-   member.role === "OWNER" || member.role === "DRIVER" || member.role === "BOOTH"
-     ? "ADMIN"
-     : member.role,
- );
+ setRole(
+   member.role === "OWNER" || member.role === "DRIVER"
+     ? "ADMIN"
+     : member.role,
+ );
```

File: `apps/web/features/operator/components/staff/invite-sheet.tsx`
```diff
const INVITABLE_ROLES: InvitableStaffRole[] = [
  "OPERATIONS",
  "MANAGER",
  "ADMIN",
  "FINANCE",
  "SUPPORT",
  "TREASURY",
  "DISPATCHER",
  "CONDUCTOR",
+ "BOOTH",
];
```

### Step 3: Add `assignedTerminalId` to Prisma Schema
File: `packages/db/prisma/schema.prisma`
```prisma
model Operator {
  id     String @id @default(cuid())
  userId String
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  companyId String
  company   Company @relation(fields: [companyId], references: [id], onDelete: Cascade)

  role       StaffRole      @default(OWNER)
  status     OperatorStatus @default(ACTIVE)
  isActive   Boolean        @default(true)
  deletedAt  DateTime?

  // Assigned terminal for counter staff and station dispatchers
  assignedTerminalId String?
  assignedTerminal   CompanyLocation? @relation("OperatorAssignedTerminal", fields: [assignedTerminalId], references: [id], onDelete: SetNull)

  ...
  @@index([assignedTerminalId])
}

model CompanyLocation {
  ...
  assignedOperators Operator[] @relation("OperatorAssignedTerminal")
}

model StaffInvitation {
  ...
  // Optional pre-assigned terminal in invitation
  assignedTerminalId String?
  assignedTerminal   CompanyLocation? @relation("InvitationAssignedTerminal", fields: [assignedTerminalId], references: [id], onDelete: SetNull)
}
```

### Step 4: Expose Terminal Scoping in Staff tRPC Router
File: `apps/web/trpc/routers/staff.ts`
1. Update `CreateInvitationSchema` and `UpdateRoleSchema` to accept optional `assignedTerminalId: z.string().cuid().optional()`.
2. When creating `StaffInvitation`, store `assignedTerminalId`.
3. In `apps/web/trpc/routers/invitation.ts:accept`, copy `assignedTerminalId` onto the new `Operator` record.
4. In `apps/web/trpc/routers/booth.ts:getMyProfile`, include `assignedTerminal`:
```typescript
getMyProfile: boothProcedure.query(async ({ ctx }) => {
  return {
    operatorId: ctx.operator.id,
    role: ctx.operator.role,
    companyId: ctx.operator.companyId,
    companyName: ctx.operator.company.name,
    companyLogoUrl: ctx.operator.company.logoUrl,
    staffName: ctx.user.name,
    staffEmail: ctx.user.email,
    assignedTerminal: ctx.operator.assignedTerminal
      ? {
          id: ctx.operator.assignedTerminal.id,
          name: ctx.operator.assignedTerminal.name,
        }
      : null,
  };
}),
```

### Step 5: Auto-Lock Assigned Terminal on Boot Gate
File: `apps/booth-app/app/index.tsx`
- In `BootGate`, if `profileData.assignedTerminal` is non-null:
  ```typescript
  setTerminal(profileData.assignedTerminal);
  return <Redirect href="/(tabs)" />;
  ```
- If null: allow manual selection via `/terminal-select`.

---

## 3. Verification & Acceptance Criteria

- [ ] **Probe 2.1**: Log in as Operator Admin in `apps/web`. Open "Invite Staff". Verify "Booth Agent" appears in the Role dropdown.
- [ ] **Probe 2.2**: Send invite to a test email as `BOOTH` with an assigned terminal selected. Verify invite record is created in DB with `role: "BOOTH"` and `assignedTerminalId`.
- [ ] **Probe 2.3**: Accept the invite. Verify the new `Operator` row has `role: "BOOTH"`, permissions `["bookings:read", "bookings:checkin"]`, and the assigned terminal ID.
- [ ] **Probe 2.4**: Open the role edit sheet for that member in `apps/web`. Verify their role displays as "Booth Agent" (not "Admin"), and saving retains the `BOOTH` role.
- [ ] **Probe 2.5**: Log in to `booth-app` as that user. Verify the app skips `/terminal-select` and boots directly into `/(tabs)` locked to the assigned terminal.
