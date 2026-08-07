# 07 — Staff Management Audit

Deep dive on the Staff feature: invite, role edit, permission editor, suspend/activate, remove, transfer ownership, invitations, activity log. Files: `features/operator/views/operator-staff-view.tsx`, `features/operator/components/staff/**`, `features/operator/lib/validations/staff.ts`.

---

## 1. Actions & their client-side gates

| Action | UI element | Client gate (exact) | Server gate |
|---|---|---|---|
| Invite staff | header button + empty-state CTA | `can("staff:invite")` (hidden) | `staff:invite` + `requireCanGrant` + assign-role rules |
| Edit role | `staff-member-row.tsx` kebab → `RoleSheet` | `canUpdate && member.role !== "OWNER"` (hidden) | `staff:update` + hierarchy + assign-role |
| Edit permissions | kebab → `EditPermissionsSheet` | `canUpdate && member.role !== "OWNER"` (hidden) — **bypassable via `?member=` deep-link** | `staff:update` + `requireCanGrant` |
| Suspend / Activate | kebab | **NOT GATED** — shown for any non-OWNER row to anyone with `staff:read` | `staff:update` + hierarchy + no-OWNER-suspend |
| Remove from company | kebab → `RemoveStaffDialog` | `callerRole === "OWNER"` (hidden otherwise) | `staff:remove` + hierarchy + not-self |
| Transfer ownership | kebab → `TransferOwnershipDialog` (OTP) | `callerRole === "OWNER"` (hidden otherwise) | `requireOwner` + OTP |
| Cancel invitation | `staff-invitation-card.tsx` | **NOT GATED** | `staff:invite` + OWNER/ADMIN/inviter |
| Resend invitation | `staff-invitation-card.tsx` | **NOT GATED** | `staff:invite` (+ resend limit) |
| View activity log | `staff-activity-section.tsx` | none (read-only) | `staff:read` |

---

## 2. Gating mechanics

- `useStaffPermissions()` (client): `can(key) = role === "OWNER" ? true : permissionSet.has(key)`. Role/permissions from `staff.getMyPermissions`.
- `assignableRoles = ASSIGNABLE_ROLES[role] ?? []`.
- `grantable` = caller's own effective permissions (fed into the permission matrix).
- Server computes per-member `canModify` (`staff.ts:202-205`): `m.role !== "OWNER" && (platform ADMIN || canModifyMember(callerOpRole, m.role))` — **but the client never consumes it**.

---

## 3. Inconsistencies (client vs server)

### 3.1 Suspend/activate is un-gated client-side
`staff-member-row.tsx` renders suspend/activate for any non-OWNER row with **no `can("staff:update")` check** and **no `canModify` check**. A MANAGER with `staff:read` sees suspend on every non-OWNER member; clicking → server FORBIDDEN toast (`staff.updateStatus` requires `staff:update`). Buttons shown without permission.

### 3.2 `canModify` is computed but never used
The server ships exactly the right affordance — "can this caller modify this member per the role hierarchy?" — and the UI ignores it. Consequences:
- A caller with `staff:update` sees "Edit role/permissions" on **same-level or higher-level** members (ADMIN on ADMIN, MANAGER on MANAGER/ADMIN), which `assertCanModifyTarget` (`level > level` required) rejects. Menu items shown that cannot succeed.
- Hierarchy is invisible in the UI.

### 3.3 Remove is over-gated client-side
Client hides Remove unless `callerRole === "OWNER"`. Server `staff.removeStaff` requires only `staff:remove` + hierarchy — and the **ADMIN template includes `staff:remove`**. An operator ADMIN can remove staff server-side but never sees the button. `can("staff:remove")` is never consulted anywhere in the UI.

### 3.4 Transfer is gated on OWNER only (matches server, minus ADMIN bypass)
Client `callerRole === "OWNER"`. Server `requireOwner` allows platform ADMIN too — invisible client-side (see 3.8).

### 3.5 Deep-link bypass of the permission editor
`operator-staff-view.tsx`:
```ts
const found = members.find((m) => m.id === memberId);
if (found && found.role !== "OWNER") { setPermissionsMember(found); }
```
`?member=<id>` opens `EditPermissionsSheet` for any non-OWNER member with **no `can("staff:update")` and no `canModify` check**. Save still 403s server-side, but the sheet + permission data are exposed.

### 3.6 `resetPermissions` checkbox is cosmetic
`RoleSheet` sends `resetPermissions` (default true); schema accepts it; **the router never reads it** — `updateRole` always overwrites `permissions` with `ROLE_TEMPLATES[targetRole]`. A user who unchecks "reset permissions" is silently overridden (the reset is actually the correct security behavior, but the checkbox lies).

### 3.7 Invitation resend/cancel are un-gated
Both buttons render for every pending invitation for every page viewer. Server: cancel requires `staff:invite` **plus** OWNER/ADMIN/inviter/platform-ADMIN; resend requires `staff:invite`. A `staff:read`-only viewer sees both and gets 403s.

### 3.8 Platform-ADMIN bypass invisible client-side
Server gives platform ADMIN full bypass (`operatorHasPermission`, `requireCanGrant`, `requireOwner`, `assertCanModifyTarget`). The client never knows `user.role === "ADMIN"` — `getMyPermissions` returns only operator role/permissions. A platform ADMIN whose operator record isn't OWNER sees no invite/transfer/remove controls despite full server power. Over-restrictive UI, no escalation risk.

### 3.9 Role-select fallback leaks unassignable roles
`RoleSheet` / `InviteSheet` build role options from `assignableRoles`; for OPERATIONS/FINANCE/SUPPORT, `ASSIGNABLE_ROLES[role]` is `[]`, so both sheets **fall back to all five non-owner roles**. `InviteSheet` defaults the role to `roles[0]` — for a SUPPORT member granted `staff:invite`, the default invite role is **ADMIN**, which the server rejects ("Only company owners can invite ADMIN staff"). A SUPPORT member granted `staff:update` sees all 5 roles in the role dropdown, most of which `canAssignRole` rejects.

### 3.10 Status toggle skips INACTIVE
Rows only offer ACTIVE ↔ SUSPENDED. `OperatorStatusEnum` allows INACTIVE and the filter exposes it, but an INACTIVE member can only be flipped to ACTIVE via the else-branch.

### 3.11 `RemoveStaffSchema.transferAssignments` never surfaced
The field exists (default false) but `handleRemoveStaff` sends only `{ memberId }`. There's no UI to reassign a removed member's trips/schedules.

### 3.12 Empty kebab menu on OWNER rows
The trigger always renders; for an OWNER row every item is null → an empty dropdown.

### 3.13 `getPermissionCatalog` is dead for this feature
`staff.getPermissionCatalog` requires `staff:invite`; the client derives grantables from `getMyPermissions` instead. Dead endpoint.

---

## 4. Validation schemas (`features/operator/lib/validations/staff.ts`)

```ts
OperatorStatusEnum     = z.enum(["ACTIVE","INACTIVE","SUSPENDED"])
ListStaffSchema        { search≤100, role?, status?, page≥1, limit≤100 default 50 }
GetActivityLogSchema   { limit≤500 default 40, offset≥0, action?, userId? }
UpdateRoleSchema       { memberId, role (≠ OWNER), resetPermissions default true, reason≤500 }
UpdatePermissionsSchema{ memberId, permissions: PermissionListSchema, reason≤500 }
UpdateStatusSchema     { memberId, status: OperatorStatusEnum, reason≤500 }
TransferOwnershipSchema{ memberId, otp: 6-digit, confirmationText }
CreateInvitationSchema { email (lowercased), role (≠ OWNER), permissions.min(1), jobTitle≤100, message≤500, expiryDays 1..30 default 7 }
InvitationIdSchema     { invitationId, reason≤200 }
RemoveStaffSchema      { memberId, reason≤500, transferAssignments default false }
```

---

## 5. OWNER special-casing

- `can()` → true for OWNER (implicit-all).
- OWNER rows are immutable in the UI: no edit role/permissions, no suspend, no transfer/remove target.
- OWNER excluded from every role selector + schema `.refine(r => r !== "OWNER")`.
- Server hard-blocks modifying OWNER targets (`assertCanModifyTarget`), suspending OWNER, transferring to an OWNER, assigning OWNER via invite.
- Transfer turns old owner → ADMIN + `ROLE_TEMPLATES.ADMIN`; target → OWNER + `permissions: []`.

---

## 6. Staff findings

| # | Finding | Severity |
|---|---|---|
| S1 | Suspend/activate shown to any viewer; server `staff:update` required → 403 toasts | MEDIUM |
| S2 | `canModify` computed server-side but never used → edit controls on unmodifiable members | MEDIUM |
| S3 | Remove hidden from ADMINs who hold `staff:remove` (over-gated client) | LOW |
| S4 | `?member=` deep-link opens permission editor without `staff:update`/`canModify` | MEDIUM |
| S5 | `resetPermissions` checkbox ignored by router (always resets) | LOW |
| S6 | Invitation resend/cancel un-gated | MEDIUM |
| S7 | Role-select fallback leaks unassignable roles; default invite role = ADMIN for low-tier inviters | MEDIUM |
| S8 | Platform-ADMIN bypass invisible client-side (no escalation risk, but confusing) | LOW |
| S9 | INACTIVE status unreachable via UI | LOW |
| S10 | `transferAssignments` field never surfaced | LOW |
| S11 | Empty kebab menu on OWNER rows | LOW |
| S12 | `getPermissionCatalog` dead endpoint | INFO |

Continue to [`08-settings-audit.md`](./08-settings-audit.md).
