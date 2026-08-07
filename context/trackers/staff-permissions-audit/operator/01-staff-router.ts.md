# OPERATOR STAFF tRPC Router — Security + Correctness Audit

**Scope:** `apps/web/trpc/routers/staff.ts`, staff-related procedures in `apps/web/trpc/routers/operator.ts`, `apps/web/trpc/routers/operator/settings.ts`, and the operator staff UI (`apps/web/features/operator/{components/staff,hooks,lib,views}`).
**Audit date:** 2026-08-07
**Authorization primitives:** `lib/permissions/authorize.ts` (`requirePermission`, `requireAnyPermission`, `requireCanGrant`, `requireOwner`, `operatorHasPermission`) + `packages/schemas/src/permissions.ts` (catalog, `canAssignRole`, `canModifyMember`, `assertCanGrant`, `ROLE_TEMPLATES`, `ASSIGNABLE_ROLES`).

> **Platform-admin note (ignored per instructions):** the `operator-staff:*` keys that gate `adminStaff` (platform admins managing operators) are a *separate* IAM domain. This report concerns the **operator** staff router only. None of the operator routes reference `operator-staff:*`.

---

## 0. Permission catalog

### 0.1 Catalog size correction
The prompt states the catalog has **40 keys**. Counting `PERMISSION_META` (`packages/schemas/src/permissions.ts:25-87`) yields **42 keys**, not 40:

| Group | Keys | Count |
|---|---|---|
| Routes | routes:read, create, update, delete | 4 |
| Terminals | terminals:read, create, update, delete, geocapture | 5 |
| Fleet | fleet:read, create, update, delete | 4 |
| Schedules | schedules:read, create, update, delete | 4 |
| Trips | trips:read, create, update, cancel, dispatch | 5 |
| Bookings | bookings:read, update, cancel, checkin | 4 |
| Revenue/Financials | revenue:view, revenue:export, financials:view, withdrawals:view, withdrawals:create | 5 |
| Staff | staff:read, invite, update, remove | 4 |
| Company | company:view, profile:update, banking:update, compliance:update, delete | 5 |
| Reviews | reviews:read, respond | 2 |
| **Total** | | **42** |

`PERMISSION_KEYS` (line 91) is derived directly from `Object.keys(PERMISSION_META)`, so `PermissionListSchema` and all `require*` helpers are automatically consistent with these 42 keys. There are **no code references to keys that do not exist in the catalog**, and **no catalog key can be accepted by a schema that is not in the catalog** (`PermissionKeySchema` is an enum over `PERMISSION_KEYS`). All findings below that mention "keys are catalog-consistent".

### 31.2 Keys declared but **never enforced** by any server gate (see G)
- `bookings:checkin` — declared + seeded into `ROLE_TEMPLATES.CONDUCTOR`, but **no server procedure calls `requirePermission(ctx,"bookings:checkin")`**. Check-in enforcement is `bookings:update` (`operator.ts:1196`, `:1222`). The key is only referenced in tests and in client `can("bookings:checkin")`. **Dead-ish / half-implemented.**
- `company:delete` — declared + in `ROLE_TEMPLATES.ADMIN`, but **no server procedure gates on `company:delete`** anywhere (`apps/web`). Only present in unit tests (`lib/__tests__/permissions/authorize.test.ts:234`). **Catalog-only key.**
- `terminals:geocapture` — only enforced **client-side** (`operator-terminals-view.tsx:327,340`); the underlying server operation (`captures.ts`) gates on `terminals:update`. So `terminals:geocapture` has no matching server `requirePermission`. **Client-only key.**
- `bookings:cancel` — referenced only in a `requireAnyPermission` *list* in `payments.ts:117`; the operator `cancelBooking`/`bulkCancelBookings` procedures gate on `bookings:update` instead. Effectively unenforced as a standalone key.

---

## 1. Procedure-by-procedure table (`staff.ts`)

Legend — **Gate** column: exact `require*` call + key(s) asserted. **Key ok** = key exists in the 42-key catalog. **Susp** = suspended-session handling.

| # | Procedure | Input (zod) | Server gate | Key ok | Susp/rem-upstream | Client gate matches | Notes |
|---|---|---|---|---|---|---|---|
| P1 | `getMyPermissions` | none | *(none — just `operatorCompanyProcedure`)* | n/a | n/a | n/a | Returns `role`, effective `permissions`, status. Conservative: non-privileged sees only effective perms. |
| P2 | `getMyRole` | none | *(none)* | n/a | n/a | n/a | **`@deprecated`** (staff.ts:131). Identical body to P1. **Still prefetched** by `app/[locale]/dashboard/operator/(dashboard)/staff/page.tsx:31` → retained for legacy call-site only; no route removed. |
| P3 | `listStaff` | `ListStaffSchema` (search/role/status/page/limit, max 100/ms) | `requirePermission(ctx,"staff:read")` (staff.ts:146) | ✅ | ✅ (SUSPENDED rejected upstream in `operatorCompanyProcedure`, init.ts:201) | ✅ | Returns `canModify` per row (lines 203-206), nulls personalPhone/nationalId/DOB unless caller is OWNER/ADMIN/platform-ADMIN (callerIsPrivileged, lines 177-179, 196-201). **Good PII minimisation.** |
| P4 | `updatePermissions` | `UpdatePermissionsSchema` (memberId + PermissionListSchema) | `requirePermission("staff:update")` + `requireCanGrant(input.permissions)` (219-220) | ✅ | n/a | ✅ (menu gated `can("staff:update")`+`member.role!==OWNER`; client `grantable` filters matrix) | + `assertCanModifyScreen(memberId)` via `assertCanModifyTarget` (223). **No re-derive of role template** — allows arbitrary per-permission replacement (fine, intended). |
| P5 | `updateRole` | `UpdateRoleSchema` (role ref.: cannot be OWNER; resetPermissions default true) (staff.ts:28-36) | `requirePermission("staff:update")` (255) + `canAssignRole(ctx.operator.role, input.role)` (260) + ADMIN-only assignment guard (267) + **`requireCanGrant(ROLE_TEMPLATES[input.role])`** (276) | ✅ | n/a | ⚠️ | Always **resets permissions to role template** (staff.ts:275) to prevent privilege retention. But see F2/E: ADMIN/MANAGER templates lack `trips:create`, so assigning some roles (e.g. OPERATIONS/CONDUCTOR) to users will be rejected by `requireCanGrant` even though `canAssignRole` said yes. |

   | P7 | ... |
|---|---|

### Table (continued)

| # | Procedure | Input (zod) | Server gate | Key ok | Susp/rem-up handled | Client gate | Notes |
|---|---|---|---|---|---|---|---|
| P6 | `updateStatus` | `UpdateStatusSchema` (status bool ACTIVE/INACTIVE/SUSPENDED) | `requirePermission("staff:update")` (309) | ✅ | ✅ **Force-invalidates sessions on SUSPEND** via `session.deleteMany({ userId: target.userId })` (321-325) | ⚠️ see F-3 | `assertCanModifyTarget` blocks OWNER (staff.ts:103-117). Redundant OWNER guard at 314. |
| P7 | `removeStaff` | `RemoveStaffSchema` (memberId) | `requirePermission("staff:remove")` (355) | ✅ | ✅ **Force invalidates** in a txn: sets deletedAt, inactive, INACTIVE + `session.deleteMany` (367-381) | ✅ `can("staff:remove")` + `member.role!==OWNER` | Self-removal guard (360-364) is effectively **dead code for non-privileged users** — `assertCanModifyScreen` already threw self-check for same/higher-target roles before it (see B-4). Cross-company prevented via `getMasking`. |
| P8 | `requestTransferOtp` | none | `requireOwner(ctx)` (400) | n/a | n/a | 🔒 Transfer dialog surfaces regardless of role (see H-3) | Server rate-limit 2 min per `(transfer-ownership:<email>)`. OTP 6-digit, sha256, 10 min TTL. Logs audit. |
| P9 | `transferOwnership` | `TransferOwnershipSchema` (memberId, otp len 6, confirmationText) | `requireOwner` (466) | ✅ | n/a | 🔐 requires OWNER | Verifies OTP + expiry + confirmation text. Target must be ACTIVE (502). Reads **current owner record by `role: OWNER`** (506-517). In one txn: old owner→ADMIN `ROLE_TEMPLATES.ADMIN`, target→OWNER `permissions: []` (519-551). **Does NOT delete the new owner's or old owner's sessions** (pre-existing sessions stay valid across the demotion — low severity, see G). |
| P10 | `listInvitations` | inline object (status enum; limit ≤100; offset) | `requirePermission("staff:read")` (573) | ✅ | ✅ | — finds non-PENDING list passed down | Adds `isExpired`/`daysUntilExpiry`. |
| P11 | `createInvitation` | `CreateInvitationSchema` (email, role != OWNER, permissions ≥1, jobTitle, expiry 1-30) | `requirePermission("staff:invite")` (609) + **`requireCanGrant(input.permissions)`** (610) + `canAssignRole` (612) + ADMIN-only-invite guard (619) | ✅ | ✅ | ✅ UI seeds from `seedPermissions(role,grantable)` | Dedupe existing member (CONFLICT), pending-invite (645), **rate limit 10 invites/hr/company** (660-669). Invite token hashed at rest, raw sent only to inbox (H21). **Note:** `ROLE_TEMPLATES` used for seeding is fine, but assignability is capped by `requireCanGrant` (see F-2). |
| P12 | `cancelInvitation` | `InvitationIdSchema` (invitationId + reason) | `requirePermission("staff:invite")` (757) + `canCancel`= OWNER||ADMIN||inviter||platform-ADMIN (773-777) | ✅ | n/a | **client hides cancel behind `can("staff:remove")`** — mismatch with server `staff:invite` (H-2) | Note: membership-based `invitedBy` is used, not hierarchical `canModifyRole`. |
| P13 | `resendInvitation` | `InvitationIdSchema.extend({extendExpiry default true})` | `requirePermission("staff:invite")` (808) only | ✅ | n/a | client hides resend behind `can("staff:remove")` — mismatch | **No inviter/hierarchy/can-grant re-check** (unlike cancel). Any `staff:invite` holder can resend another inviter's PENDING invitation, minting a fresh token+w prom address. (See A-2.) |
| P14 | `getActivityLog` | `GetActivityLog` (limit/offset/action/userId) | `requirePermission("staff:read")` (903) | ✅ | n/a | ✅ | `parsedMetadata` JSON.parse guarded. |

### Deprecated / dead procedures

| # | Procedure | Status | Referenced by client? |
|---|---|---|---|
| P2 | `getMyRole` | `@deprecated` (staff.ts:131) | YES — `staff/page.tsx:31` still prefetches it |
| P15 | `getPermissionCatalog` | `@deprecated` (staff.ts:940) | **NO** — never called by any client; only defined here |
| S2 | `settings.updateBank` | `@deprecated` (settings.ts:240) | no |
| S5 | `settings.revealBankAccount` | `@deprecated` (settings.ts:354) | no |
| S6 | `settings.setDefaultBankAccount` | `@deprecated` (settings.ts:465) | no |

---

## 2. Starlight bank/company/payout procedures and their keys (F)

Spread under `operator.*` via `...operatorSettingsProcedures` (operator.ts:1029) + inline onboarding in `operator.ts`.

| Procedure | Mutates | Server gate | Owner-only? | Key ok? |
|---|---|---|---|---|
| `settings.updateCompany` | company profile | `requirePermission("company:profile:update")` (settings.ts:83) | no | ✅ (ADMIN holds it) |
| `settings.updateCompany` | — (owner) | — | — | |
| `settings.updateCompany` | — | — | | |
| `settings.updateBankAccount` | bank account + Paystack recipient + company recipient mirror | `company:banking:update` (159) | no | ✅ |
| `settings.addBankAccount` | bank account + company recipient | `company:banking:update` (412) | no | ✅ |
| `settings.updateBank` (@deprecated) | bank + company | **`requireOwner`** (244) | R-only | ✅ |
| `settings.setDefaultBankAccount` (@deprecated) | bank default + company recipient | **`requireOwner`** (469) | R-only | ✅ |
| `settings.deleteBankAccount` | bank delete | **`requireOwner`** (509) | R-only | ✅ |
| `settings.addDocument`/`deleteDocument` | compliance docs + S3 | `company:compliance:update` (538, 564) | no | ✅ |
| `settings.getSettings` | (read) bank view | `company:view` (39) | | |
| `settings.listBankAccounts` | (read) | `requireAnyPermission [company:view, financials:view]` (390) | | |
| `settings.updateProfile` | own operator profile | **NO gate** (settings.ts:122-154) | self | n/a |
| `operator.completeFeedBack`/`saveOnboardingStep`/`reopenOnboardingStep`/`completeOnboarding`/`resubmitVerification` | company/operator state | `company:profile:update` (operator.ts:257, 375, 943, 458) | no | ✅ |
| `operator.listLeadger`/`exportLedgerCsv` | (read) | `revenue:view` (1518, 2016, 1577) | | |
| `operator.requestWithdrawal` / `requestWithdrawalChallenge` | ledger + payout | `withdrawals:create` (1893, 1937) | no | ✅ resources check live |
| `operator.listWithdrawals` | (read) | `withdrawals:view` (2317) | | |

**F — findings (bank/payout gates):**
- F-1: `settings.updateProfile` (settings.ts:122) has **no `requirePermission`** gate at all. It is `operatorCompanyProcedure` (company-scoped + non-suspended + role ADMIN/OPERATOR), and only ever writes the **caller's own** operator row (tracker by `userId`), so no cross-operator write. Still, every other mutator in this file is gated; this one is an inconsistency (likely legacy self-onboarding). Low severity.
- F-2: `revealBankAccount` (@deprecated, settings.ts:354) returns the **decrypted full account number** and is gated by `company:view` **+ a `ctx.operator.role !== "OWNER"` check** (hard-coded role, not `can`). Note a **platform ADMIN** bypasses `requirePermission` too (authorize.ts:38 returns true) but the role check `ctx.operator.role !== "OWNER"` still blocks a non-owner operator even if that operator holds `financials:view`. Fine, but inconsistent with the rest of the codebase (which uses `requireOwner`) — one-off custom check, easy to forget.
- F-3: `updateBankAccount` scope-checks `existingBank` by `id + companyId` (settings.ts:200) — good, prevents cross-company bank overwrite.
- F-4: `setDefaultBankAccount`/`deleteBankAccount`/`updateBank` are OWNER-only even though *active* equivalents (`updateBankAccount`/`addBankAccount`) are `company:banking:update`. So an **ADMIN can append/edit bank but cannot delete or default it** (OWNER-only) — asymmetric but deliberate; the deprecated set just predates the key split.
- F-5: none of the bank procedures are `staff:*`-gated (they are company/financial, not staff) — correct.

---

## 3. Findings — security & correctness

### A. Invite grants — role assignment + permission coverage
**A-1 (mostly yes):** `createInvitation` (staff.ts:606-612) enforces BOTH:
- `canAssignRole(ctx.operator.role, input.role)` — can only use `ASSIGNABLE_ROLES[ownRole]` (line 612).
- `requireCanGrant(ctx, input.permissions)` — every granted key must be effective-perms of the caller (`assertCanGrant` backstop, line 610).
So the *inviter can only assign roles within `ASSIGNABLE_ROLES` **and** only grant keys they hold*. ✓

**A-2 (gap):** the two gates are **not coordinated** — `ASSIGNABLE_ROLES[MANGER]` includes `OPERATIONS` (line 260 in catalog; permissions.ts:260) and `ADMIN` template does *not* include `trips:create`, yet `OPERATIONS` template requires `trips:create`. So:
- A **MANAGER** inviting/updating an **OPERATIONS** role: `canAssignScreen` → `true`, then `requireCanGrant(ROLE_TEMPLATES.OPERATIONS)` → **fails** because `trips:create ∉ MANAGER`. Result: manager sees "Operations" in the UI dropdown (it comes from `ASSIGNABLE_ROLES`) but the server rejects it.
- A **platform-ADMIN or operator OWNER** is the only actor that can reproduce a literal `OPERATIONS`/ role template (OWNER implicitly holds all; ADMIN does not hold `trips:create`).

So A is **true in design** but produces an inconsistent assignable surface at runtime. Flag as a template + `ASSIGNABLE_ROLES` contradiction rather than a bypass.

**A-3:** `updateRole` (P5) also resets target permissions to the template (`ROLE_TEMPLATES[input.role]`, staff.ts:275) plus `requireCanGrant`, preventing privilege retention. ✓

### B. OWNER protection
**B-1 — cannot invite OWNER:**`CreateInvitationSchema` refines `role !== "OWNER"` (validations/staff.ts:66) and `UpdateRoleSchema` refines `role !== "OWNER"` (validations/staff.ts:30). ✓
**B-2 — cannot demote OWNER (by non-owner):** `assertTopModifyTarget` throws for any target with `role === "OWNER"` (staff.ts:105-109) and is applied on `updatePermissions`, `updateRole`, `updateStatus`,Additionally. ✓
**B-3 — cannot remove a member above you in hierarchy:** `assertTargetModifiable` → `canModifyMember(modifier, target)` uses `getRoleLevel(modifier) > getRoleLevel(target)` (permissions.ts:294-299), so strictly-higher-level only. ✓ (Applies to updateRole/updatePermissions/updateStatus/remove.)
**B-4 — OWNER also cannot self-demote; only via `transferOwnership`:** order uses `requireOwner` + OTP. ✓

### C. Can a MANAGER / ADMIN invite a role above themselves?
- **MANAGER** `ASSIGNABLE_ROLES[MANAGER] = [OPERATIONS, SUPPORT, TREASURY, DISPATCHER, CONDUCTOR]` (permissions.ts:260) — **no** ADMIN/MANAGER/FINANCE above it.
- **ADMIN** `ASSIGNABLE_ROLES[ADMIN] = [MANAGER, OPERATIONS, …]` — **cannot** invite ADMIN (level 500) or OWNER (level 600).
- **Role-level escalation via hierarchy check:** `canModifyMember` prevents modifying a member at or above the caller even if invoked directly with a known `memberId`.
→ **No.** Neither a MANAGER nor an ADMIN can invite a role above their hierarchy via role-label, and even a direct-memeber `memberId` cannot demote one above them.

**But** — the *permission* model is separate from the *role- level* model: an ADMIN (level 500, holds nearly all keys) cannot assign ADMIN, but a MANAGER (who holds `staff:read` only) can `listStaff` and read most PII. That's a *read* exposure, not an escalation.

### CQ — Note on `cancelInvitation` not using hierarchy
`cancelInvitation` uses an explicit `OWNER || ADMIN || invitedBy === user || platform-ADMIN` predicate (staff.ts:773-777), **not** `canModifyMember`. This is semantically "restrict inviter or admin", which is fine, but it diverges from the hierarchical `canModify` used everywhere else — a low-level `staff:invite` holder who authored the invite can cancel it. Not a privilege escalation. (Consistency note.)

### D. Suspended sessions — force-invalidated or deny-on-next-request?
**Both, and correctly:**
- On **status → SUSPENDED**: `updateStatus` runs `session.deleteMany({ where:{ userId: target.userId }})` (staff.ts:321-324) → **force-invalidated immediately.**
- On **remove**: `removeStaff` runs `session.deleteMany` inside the txn (staff.ts:377).
- Additionally, the `operatorCompanyProcedure` middleware (init.ts:201-206) rejects any call by a SUSPENDED operator (defense-in-depth for the suspended user's own new requests).
→ **D: force-invalidated (deleteMany), not merely next-request-denied.** ✓
（Only real gap: the *target*'s Better Auth **session cookie row** is removed, but nothing else — e.g. `verification` entries with a valid TRANSFER OTP for that email remain in table — low risk.)

### E. `canModify` hierarchy enforcement server-side
**E: Yes — there is a server-side hierarchy check** via `assertCanModifyTarget` + `canModifyMember` (`getRoleLevel(modifier) > getRoleLevel(target)`), **in addition** to `ASSIGNABLE_ROLES`:
- `updatePermissions` → `assertCanModifyTarget` (staff.ts:223)
- `updateRole` → `assertCanModifyTarget` (258)
- `updateStatus` → `assertCanModifyTarget` (312)
- `removeStaff` → `assertCanModifyTarget` (358)
- `listStaff` also computes per-row `canModify` (staff.ts:203-205) for the client (purely informational).

So E: hierarchy is enforced server-side, not only `ASSIGNABLE_ROLES`. The **gap**: ownership transfer (`transferOwnership`) intentionally bypasses hierarchy (owner prerogative — correct). `createInvitation` does **not** apply `canModifyMember` to the *target role level* (it uses `canAssignRole` label set). See A-2 for where these two disagree.

### F. bank/company/payout gate table — see §2 above.

### G. Permissions referenced in code that don't exist in the catalog | catalog keys never used
- **None referenced-but-missing** (schemas are enum-typed; all `requirePermission` strings compile against `PermissionKey`).
- **Catalos keys never enforced by any server route (present in catalog, only client/test-referenced):**
  - `bookings:checkin` — only in `ROLE_TEMPLATES.CONDUCTOR` + client `can()`; **no `requirePermission` gate** anywhere → a CONDUCTOR gets check-in via *`bookings:update`* (operator.ts:1196). Duplicate/short-sold.
  - `company:delete` — in catalog + `ROLE_TEMPLATES.ADMIN` but **nothing gates/uses it** (no `requirePermission("company:delete")`).
  - `terminals:geocapture` — **client-only** gate; server (`captures.ts`) gates the real op on `terminals:update`.
  - `bookings:cancel` — used only within a list argument in `payments.ts:117`; actual cancels gate on `bookings:update`.

### H. Client/server gating consistency (`useStaffPermissions` / `can()`)
`useStaffPermissions` (`use-staff-permissions.ts`): `can(key) = role === OWNER ? true : permissionSet.has(key)` where `permissions = query.data.permissions` = the **effective** perms from `getMyPermissions`. This matches `hasPermission` on the server. ✓ baseline.

**Mismatches:**
- **H-1 (invite):** `StaffPageHeader`, `StaffInvitationsSection` buttons gated on `can("staff:invite")`; server `createInvitation` = `requirePermission("staff:invite")`. ✓ consistent.
- **H-2 (cancel/resend invite):** client (`StaffInvitationCard`, via `StaffInvitationsSection`) passes `canDelete={can("staff:remove")}` (staff-invitations-section.tsx:…; invite-card renders both Cancel+Resend when `canDelete`). Server gates **both** on `staff:invite` (staff.ts:757, 808). **Mismatch both directions:**
  - a `staff:remove`-holder without `staff:invite` will see Cancel/Resend disabled styling but the server would let them act (if they call the API) — UI is *stricter* than server.
  - a `staff:invite`-holder (e.g., an ADMIN-with-only-invite) will **not** see cancel/resend (hidden), fine — UI hides but API exposes.
- **H-3 (transfer-ownership visibility):** In `staff-member-row.tsx` the **Transfer** menu item is gated by `canUpdate/transfer`… actually line 171-189 shows it inside `canDelete && member.role !== OWNER`. The server `requestTransferOtp`/`transferOwnership` require **`requireOwner`** (OWNER role _or_ platform ADMIN). So a **non-OWNER staff member with `staff:remove`** will see “Transfer Ownership” and only get a server `FORBIDDEN`. **Client over-exposes a privileged action** → UX + minor consistency bug (an ownership-transfer has strict role). Fix: only show Transfer for OWNER-role callers (no dedicated `staff:*` key exists for it).
- **H-4 (RoleSheet/invite dropdowns):** use `ASSIGNABLE_ROLES[role] ?: FALLBACK/INVITABLE`. For roles with empty `ASSIGNABLE_ROLES`(e.g., OPERATIONS, SUPPORT), both `role-sheet.tsx:66` and `invite-sheet.tsx:72` fall back to a **hard-coded full list (INVITABLE_ROLES/FALLBACK_ROLES)** that includes ADMIN. Because OPERATIONS/SUPPORT don't have `staff:update`/`staff:invite`/per `tempted`, this is unreachable but the fallback list *would* be misleading for a custom-granted OPERATIONS with `staff:update+invite`. Also these hardcoded lists duplicate (and can drift from) `ASSIGNABLE_ROLES`.
- **H-5 (updateRole UI vs server):** RoleSheet options = `ASSIGNABLE_ROLES[caller]` → but server additionally `requirePermission("staff:update")` + `requireCanGrant(ROLE_TEMPLATE)`. Since MANAGER template & others don't hold `trips:create`, some roles shown remain rejectable (see A-2). Client has **no** server-mirror check of `requireCanGrant`.

### I. TODO / FIXME / dead / deprecated / half-implemented
- **Deprecated servers (no client usage except P2):** `getMyRole` (still prefetched — one live job), SHA deprecated endpoints `settings.updateBank`, `settings.revealBankAccount`, `settings.setDefaultBankAccount` — all still callable on the router (no removal).
- **`getMyRole` (P2)** is deprecated yet still `@prefetch`ed at `staff/page.tsx:31` → it should be migrated to `getMyPermissions` (P1) and deleted.
- **`getPermissionCatalog` (P15)** is deprecated and **completely unused by the client** — dead code; delete.
- **`assertTarget` / unused export checks:** `ROLE_BADGE_CLASSES` in `features/operator/lib/staff.ts:43` is a duplicate alias of `ROLE_COLORS`; check usage. `getDouble`… visual components (`RoleBadge`, `StatusBadge`, `MemberAvatar`) all fine.
- **Half-implemented keys:** `bookings:checkin`, `company:delete`, `terminals:geocapture`, `bookings:cancel` (§G).
- **Redundant guards:** `updateStatus` OWNER block (314) inside an `assertTopLevelOPPonent`.
- **Self-removal dead branch:** `removeStaff` self-check (360-365) unreachable for non-ADMIN (assertTopLevel throws first).
- **Hardcoded duplicated role lists** in UI (`INVITABLE_ROLES`, `FALLBACK_ROLES`) — drift risk.
- **Catalog doc drift:** `settings.ts` — the "Re-open onboarding" comment is fine. No TODO/FIXME comments found in staff router code.

---

## 4. Overall severity-ranked findings

| # | Severity | Finding | File:line |
|---|---|---|---|
| S1 | **Medium** | `resendInvitation` has no inviter/hierarchy/can-grant check (only `staff:invite`), so any `staff:invite` holder renews/extends anyone's PENDING invite (fresh 7-day token). `cancelInvitation` has a stricter predicate — inconsistent and should share it. | staff.ts:801-898 |
| S2 | **Medium** | Client shows **Transfer Ownership** to any member with `staff:remove`; server requires `OWNER`/platformADMIN → guaranteed `FORBIDDEN` UX for non-owners, and stale UI. | staff-member-row.tsx:171-189; staff.ts:390,466 |
| S3 | **Medium** | Client gates Invite **cancel/re-send** on `can("staff:remove")` while server gates on `staff:invite` → permission ambiguity both ways. | settings.ts: no — staff.ts:757,808 vs components/staff/staff-invitations-section.tsx:16 |
| S4 | **Medium** | `requireCanGrant` contradicts `ASSIGNABLE_ROLES`/role templates for `trips:create` — MANAGER/ADMIN cannot actually assign OPERATIONS/ fencing roles even though the dropdown offers them; roster UI smaller/larger than server reality. | permissions.ts:260 (logic); role-sheet.tsx:66-68; createInvitation staff.ts:610-612 |
| S5 | **Low-Med** | `settings.updateProfile` has no `requirePermission` (self-only writes, but unprivacy-scoped inconsistency). | settings.ts:122-125 |
| S6 | **Low** | Four catalog keys are not enforced by any server gate (`company:delete`, `bookings:checkin`, `bookings:cancel`, `terminals:geocapture`). | permissions.ts:37,62-… |
| S7 | **Low** | `revealBankAccount` uses bespoke OWNER role check instead of `requireOwner` (and bypasses none); deprecation still exposed. | settings.ts:359 |
| S8 | **Low** | Dead/deprecated surface: `getMyRole` (used by hot client call), `getPermissionCatalog` (unused), 3 deprecated settings mutators still served. | staff.ts:131,940; settings.ts:240,354,465 |
| S9 | **Low** | `removeStaff` self- `guard` is unreachable dead-or-scope (post-assertTop), redundant OWNER guard in `updateStatus`. | staff.ts:360-364, 314 |
| S10 | **Info** | Catalog is **42 keys**, not 40 (counted `PERMISSION_META`). | permissions.ts:25-87 |

**Verified-solid areas:** session force-invalidation on suspend/remove (D ✓); OWNER is protected end-to-end (invite, demote, remove, and self-demote) (B ✓); no cross-company IDOR (all member/invite lookups scoped by `companyId` + `deletedAt:null`); provider rate-limits on OTP + invite; invite URL never returned in API response (H21 comment honored, staff.ts:742-744); role-change resets permissions to template to prevent privilege retention; CSRF origin-check middleware on all mutations.