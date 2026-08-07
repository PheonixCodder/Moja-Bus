# ADMIN STAFF tRPC Router — Byte-Level Security & Correctness Audit

Date: 2026-08-07
Scope: `apps/web/trpc/routers/admin-staff.ts`, `apps/web/trpc/routers/admin.ts`, `_app.ts`, `apps/web/trpc/init.ts`, `apps/web/lib/permissions/admin-authorize.ts`, `packages/schemas/src/admin-permissions.ts`, `packages/schemas/src/admin.ts`, `apps/web/lib/permissions/admin-staff-hierarchy.ts`, plus the full admin staff client feature and the two seed scripts.

## 0. Ground truth confirmed

- Admin catalog keys use the prefix pattern `admin-staff:read / invite / update / remove / transfer` (`packages/schemas/src/admin-permissions.ts:100-104`). The catalog also defines many other namespaces (`users:*`, `companies:*`, `platform:*`, `verifications:*`, `content:*`, `support:*`, `audit:*`, etc.).
- Roles `ADMIN_STAFF_ROLES`: SUPER_ADMIN / ADMIN / OPERATIONS / SUPPORT / COMPLIANCE / FINANCE (`admin-permissions.ts:9-16`).
- `hasAdminPermission`/`getAdminEffectivePermissions`: SUPER_ADMIN → implicit-all; else `stored.includes(key)` (`admin-permissions.ts:249-265`).
- `adminHasPermission` (`admin-authorize.ts:32-39`): SUPER_ADMIN (user.role ADMIN + adminStaff.role SUPER_ADMIN) → true; SUSPENDED → false; else stored-set membership.
- Five gate helpers exist: `requireAdminPermission`, `requireAdminAnyPermission`, `requireAdminAllPermissions`, `requireAdminCanGrant`, `requireSuperAdmin`.
- `requireSuperAdmin` = `ctx.user.role === "ADMIN" && ctx.adminStaff.role === "SUPER_ADMIN"` (`admin-authorize.ts:91-97`).
- Procedure chain: `adminStaffProcedure` (`init.ts:234-258`) loads `adminStaff` by `userId` + `deletedAt:null`, throws FORBIDDEN if no profile or `status === "SUSPENDED"`. It sits on `adminProcedure` (`init.ts:218`), which requires only `ctx.user.role === "ADMIN"`.

---

## 2. Procedure table — `adminStaffRouter` (`admin-staff.ts`)

| # | Procedure | Line | Input schema (validations/admin-staff.ts) | Server gate (key) | Client button gate | Effect | Catalog-consistent | Gap |
|---|-----------|------|------------------------------------------|-------------------|--------------------|--------|--------------------|-----|
| 1 | `getMyPermissions` | 129 | none | none (procedure only) | n/a (hook) | returns effective role/permissions | yes | none |
| 2 | `listStaff` | 139 | `ListAdminStaffSchema` (search/role/status/page/limit; page 1..1000, limit 1..100) | `admin-staff:read` (142) | not pre-gated; page always queries | paginated staff incl. `user.phone`, `lastLoginAt`, full `permissions`, `canModify` | yes | **L-issue**: reads whole staff list (all phones, session last-login, full permission arrays) to ANY holder of `admin-staff:read` (incl. non-super roles) — see §10 |
| 3 | `getStaffMember` | 198 | `{id}` (min 1) | `admin-staff:read` (201) | — | single member incl `permissionsUpdatedBy` | yes | none |
| 4 | `updatePermissions` | 224 | `UpdateAdminPermissionsSchema` (`permissions` = AdminPermissionListSchema, reason) | `adminStaff:update` (227) + `requireAdminCanGrant(ctx, permissions)` (228) + `assertCanModifyAdminTarget` (231) | member-row button when `canUpdate && !isSuperAdmin` | writes exact `permissions`, logs PERMISSIONS_CHANGED | yes (grant ⊆ own + hierarchy) | Client shows button even when `canModify` is false (hierarchy) ⇒ cosmetic mismatch; server still blocks |
| 5 | `updateRole` | 260 | `UpdateAdminRoleSchema` (role refine ≠ SUPER_ADMIN; resetPermissions; reason) | `adminStaff:update` (263) + `assertCanModifyAdminTarget` (266) + `assertCanAssignAdminRole` (267) + `requireCanGrant(template)` (271) | row button `canUpdate && !isSuperAdmin` | resets role + perms to `getAdminTemplatePermissions(role)`; prevents privilege retention; logs ROLE_CHANGED | yes — bounded 3× | same cosmetic mismatch as #4 |
| 6 | `updateStatus` | 301 | `UpdateAdminStatusSchema` (status enum, reason) | `adminStaff:update` (304) + `assertCanModifyAdminTarget` (307) + SUPER_ADMIN block (309) | row suspend/activate when `canUpdate && !isSuperAdmin` | set status; on SUSPENDED deletes all target sessions (317-320) | yes — SUPER_ADMIN protected; hierarchy enforced | none security-wise |
| 7 | `removeStaff` | 347 | `RemoveAdminStaffSchema` (memberId, reason) | `adminStaff:remove` (350) + `assertCanModifyAdminTarget` (353) + self-block (355) | row delete when `canDelete && !isSuperAdmin` | soft-delete, deactivate, delete sessions | yes | none |
| 8 | `requestTransferOtp` | 394 | — | **`requireSuperAdmin`** (395) | dialog "Send code" (any member w/ `canDelete`) | rate-limited OTP (2-min) → verification row keyed `admin-transfer-ownership:{email}` (SHA-256) | — | client shows for any `admin-staff:remove` holder, server allows SUPER_ADMIN only ⇒ cosmetic |
| 9 | `transferOwnership` | 458 | `TransferAdminOwnershipSchema` (memberId, otp 6 digits, confirmationText) | **`requireSuperAdmin`** (461) + OTP verify (471-497) + target checks (500-522) | dialog visible with `canDelete && !isSuperAdmin` | PROMOTES target→SUPER_ADMIN, demotes current→ADMIN w/ template, deletes verification | transfer path bypasses `admin-staff:transfer` key ⇒ uses superadmin (see §7, §Q B) | client visible for non-supers; server 403 |
| 10 | `listInvitations` | 569 | inline `{status enum, limit 1..100, offset}` | `admin-staff:read` (580) | invitations tab | lists invites (PENDING/ACCEPTED/CANCELLED/EXPIRED) | yes | none |
| 11 | `createInvitation` | 616 | `CreateAdminInvitationSchema` (email lowercase, role refine ≠ SUPER_ADMIN, permissions ≥1, jobTitle/department/message, expiryDays 1..30) | `require-admin-staff:invite` (619) + `requireCanGrant(permissions)` (620) + `assertCanAssignAdminRole` (621) | header/section button `canInvite` | creates `adminStaffInvitation` (hashed token), rate-limits 10/hr, logs INVITATION_SENT | **A: bounded** (assignable + canGrant) | **FATAL functional gap**: email points to `/admin/invite` that does NOT exist (§5) ⇒ invited users can never be onboarded |
| 12 | `cancelInvitation` | 747 | `AdminInvitationIdSchema` (invitationId, reason) | `admin-staff:invite` (750) | card Cancel when `canDelete` | status→CANCELLED | **gate mismatch**: server `admin-staff:invite`, client gates on `admin-staff:remove` (`canDelete`) — cosmetic | |
| 13 | `resendInvitation` | 784 | `ResendAdminInvitationSchema` (+extendExpiry) | `admin-staff:invite` (787) | card Resend when `canDelete` | re-issue token, max 3 resends | same client mismatch as #12; **returns full invitation row incl. token + `newInviteUrl` (raw token, non-prod)** — see §10 / J |
| 14 | `getActivityLog` | 876 | `GetAdminActivityLogSchema` (limit≤500, offset, action, userId) | **`audit:read`** (879) | activity tab, always rendered (100) | admin-staff activity log | key `audit:read` (not `admin-staff:` namespace) — still in catalog | `audit:read` not itself granted by any admin.ts path (§9) |

> `adminStaff` router procedures 2-14 all additionally pass through `adminStaffProcedure` (profile required + not SUSPENDED). So for these 13 procedures BASE *permission* is `admin-staff:*` (or `audit:read`), consistent with the catalog. This is the **only** place the IAM catalog is enforced.

---

## 3. Answers to the audit questions

### A. Is invitation role bounded by ADMIN_ASSIGNABLE_ROLES AND grants bounded by can-grant?
**Yes.** `createInvitation` calls `assertCanAssignAdminRole` (`admin-staff.ts:621` → `canAssignAdminRole`, from `ADMIN_ASSIGNABLE_ROLES` `admin-permissions.ts:228-235`) and `requireAdminCanGrant(ctx, input.permissions)` (`admin-staff.ts:620` → `assertAdminCanGrant`, `admin-permissions.ts:271-281`). The schema also hard-rejects `SUPER_ADMIN` (`validations/admin-staff.ts:71-73`). `updateRole` is equally bounded + resets to template + re-runs can-grant on the template (`admin-staff.ts:267-271`). Not assignable: SUPER_ADMIN only via transfer.

### B. How is SUPER_ADMIN created? Bootstrap/seed? Can it be transferred/removed?
- **Only via the idempotent seed script** `packages/db/scripts/seed-admin-staff.ts`: the **first** existing `UserRole.ADMIN` gets `role="SUPER_ADMIN"` (line 9-23), everyone else `ADMIN`. The main GeoLayout seed (`packages/db/prisma/seed.ts`) does not create SUPER_ADMIN / adminStaff.
- **Transfer**: `transferOwnership` replaces the current SUPER_ADMIN with the target (promote target, demote self to ADMIN w/ template, delete OTP row — `admin-staff.ts:524-556`). So a SUPER_ADMIN **can be replaced**.
- **Removed**: NO. `removeStaff`/`updateStatus`/`updateRole`/`updatePermissions` all hit `assertCanModifyAdminTarget`, which throws `FORBIDDEN: "Cannot modify a Super Admin."` for `targetRole==="SUPER_ADMIN"` (`admin-staff.ts:104-117`). `updateStatus` also re-blocks SUSPEND of a SUPER_ADMIN (`admin-staff.ts:309-314`). The only way to change a SUPER_ADMIN is the OTP-only transfer.
- **No bootstrap enforcement at runtime**: the seed assigns the FIRST ADMIN as SUPER_ADMIN by iteration order (no tie-breaker on `.sort`; nondeterministic order), and there is nothing preventing an operator from manually deleting all SUPER_ADMIN rows → leaving the platform without a SUPER_ADMIN (hash no re-provisioning). Latent availability concern.

### C. Are transfer-of-ownership flows safe?
**Yes (server-side), with one caveat.**
- Only `requireSuperAdmin` (role gate) → SUPER_ADMIN-only. OTP is: minimum 6-digit, stored SHA-256 (`admin-staff.ts:411-412`, `488-497`), 10-min expiry, 2-min resend throttle, single-use (deleted on success `admin-staff.ts:525`), plus confirmation string `"TRANSFER OWNERSHIP"`.
- Target must be existing `adminStaff`, NOT already SUPER_ADMIN, `status === "ACTIVE"` (`admin-staff.ts:499-511`). Safe — cannot be used to self-demote into access-loss: the demoted owner becomes an `ADMIN` with the ADMIN template and keeps `user.role === "ADMIN"`, so they retain admin-dashboard access (see **THE core bug** below).
- **The caveat is NOT the OTP flow — it is the systemic gap**: after transfer the ex-SUPER_ADMIN (now role ADMIN, adminStaff) **still retains full access to every `admin.ts` resource** because those are gated only by `user.role === "ADMIN"` (§3-F/G). So "demotion" does not actually remove the previous owner's backend power. The OTP mechanism is sound; the significance is undermined by the unlocked router.

### D. Are suspended adminStaff sessions invalidated or just denied?
**Both.** On `updateStatus`→SUSPENDED the server runs `prisma.session.deleteMany({ where: { userId } })` (`admin-staff.ts:316-320`) — sessions are physically deleted — AND `adminStaffProcedure` rejects any later request from a SUSPENDED profile (`init.ts:245-250`). **However**: this protection is scoped to `adminStaffProcedure` only. A suspended user with `user.role === "ADMIN"` still has fully valid sessions for every `admin.ts`/`adminProcedure` endpoint (and the admin dashboard layout), because those only check `user.role`. So suspension is a **no-op for the majority of the admin surface.**

### E. Does admin-staff obey canModifyAdminMember hierarchy independent of assignable roles?
**Yes.** `assertCanModifyAdminTarget` (`admin-staff.ts:104-117`) enforces `canModifyAdminMember` (role-level strict-greater-than, `admin-permissions.ts:237-242`) independent of `ADMIN_ASSIGNABLE_ROLES`. `updateRole` ALSO enforces assignable roles (`admin-staff.ts:267`), i.e., modification requires BOTH hierarchy and assignability. `listStaff` exposes per-row `canModify` from the same hierarchy (`admin-staff.ts:186-188`). Consistency is correct on the server.

### F. Does admin-staff gate on `admin-staff:*` or lock everything to SUPER_ADMIN?
**It correctly gates on `admin-staff:*` (the four real read/update/remove/invite keys) — that part is the GOOD design.** The actual failure is the **adjacent `admin.ts` router — NOT admin-staff.ts — ships with ZERO permission gates** (see §3-G/H). So the admin-staff router is NOT the "lock everything to SUPER_ADMIN" culprit; the real problem is reversed/inverted in `admin.ts`/`adminProcedure`: it locks **nothing** — any `user.role === "ADMIN"` gets the whole admin surface regardless of `adminStaff.role` or permission array. The IAM catalog is therefore effectively decorative for everything outside the 4 admin-staff procedures.

In admin-staff specifically the two SUPER_ADMIN-only endpooints are deliberately `requestTransferOtp`/`transferOwnership` (`admin-staff.ts:395,461`) — which is correct, since UpstreamUpstream considers ownership transfer super-admin-only. The `admin-staff:transfer` catalog key exists but is unused by either router (§3-H).

### G. Which `admin.ts` procedures are gated with `admin-staff:*` keys vs `requireSuperAdmin`?
**None of them.** Every admin `adminProcedure` in `apps/web/trpc/routers/admin.ts` is gated **only** by the generic `adminProcedure` in `init.ts` (`ctx.user.role === "ADMIN"`) — no `requireAdminPermission`, no `requireSuperAdmin`, no `requireAdminCanGrant`. The single grep over `/apps/web` confirms `requireAdminPermission`/`requireSuperAdmin`/etc. appear ONLY inside `admin-staff.ts` and `admin-authorize.ts`.

The 45 `adminProcedure` methods with zero per-procedure permission check (initial read covers lines 35–1634; file is 2413 lines total):
`getDashboardKPIs(35) · listCompaniesForVerification(77) · getCompanyForVerification(134) · updateCompanyVerificationChecklist(179) · listLedgerEntries(215) · listPendingOperators(313) · verifyOperator(336) · rejectOperator(463) · listUsers(532) · getUserProfile(575) · updateUserRole(636) · suspendCompany(686) · activateCompany(755) · listOperations(823) · listAllWithdrawals(872) · resolveWithdrawal(960) · getWithdrawalStats(1189) · getOnboardingFunnel(1270) · createBlogPostDraft(1292) · updateBlogPost(1319) · listBlogPosts(1395) · getBlogPostById(1433) · listBlogCategories(1448) · createBlogCategory(1457) · updateBlogCategory(1476) · deleteBlogCategory(1531) · listBlogTags(1548) · createBlogTag(1554) · updateBlogTagLive(1569) · deleteBlogTag(1586) · getBlogAnalytics(1603) · listBlogRedirects(1693) · createBlogRedirect(1721) · updateBlogRedirect(1733) · deleteBlogRedirect(1747) · listDispatchTrips(1753) · getDispatchTrip(1834) · getTripAudit(1898) · listRoutes(1965) · getRoute(2009) · listActivityLogs(2034) · listBankAccessLogs(2090) · listWebhookEvents(2127) · getDashboardStats(2179) · getRecentActivity(2383)`.

Consequence: a user whose `user.role` is ADMIN — whether SUPER_ADMIN-suspended, demoted, removed, or never-provisioned an `adminStaff` row — can **verify/reject operators, resolve withdrawals, force-complete/fail financial payouts, suspend companies, update any user’s Role, read all ledger/GMV, and manage all content**, with no IAM check. This is the dominant security finding: **`user.role === "ADMIN"` is the single, coarse, unchecked gateway for the entire admin observation/commerce surface.** The admin layout guard likewise only checks `user.role` (`app/[locale]/dashboard/admin/layout.tsx:25-27`).

### H. Catalog keys never used by any router, or gates using a nonexistent key.
The IAM gate calls in the whole repo use exactly these keys: `admin-staff:read`, `admin-staff:update`, `admin-staff:remove`, `admin-staff:invite`, `audit:read` (all in `admin-staff.ts`). All `admin.ts` guards are absent.

**Catalog keys released but not enforced by ANY router** (i.e., the rest of the catalog is a dead token that confers nothing because no endpoint checks it):
`users:* (read/create/update/delete/impersonate) · companies:read/create/update/delete/verify/suspend · operator-staff:* · platform:financials:read · platform:withdrawals:read/resolve · platform:settlements:read/manage · platform:ledger:read · platform:commission:manage · platform:trips/routes/schedules/fleet/terminals (r/m) · verifications:read/decide/manage · audit:bank-access:read · audit:webhooks:read · content:* (posts/categories/tags/redirects/analytics) · support:* · platform:settings:read/update/audit · admin-staff:transfer · system:health:read · system:feature-flags:manage · (audit:read IS used only by getAdminActivityLog, not by listAdminActivityLogs/listBankAccessLogs/listWebhookEvents — those three are unlocked).`

Also: **no routerReference a key that is missing from the catalog** — `requireCanGrant/Messages useCatalog `AdminPermissionKey` type, so misuse would be a compile error. Good. But the inverse (catalog keys never wired) is severe.

### I. Does admin-staff leak data to non-SUPER_ADMIN?
- `listStaff` (`admin-staff.ts:160-189`) returns, to ANY holder of `admin-staff:read` (which an ADMIN/OPERATIONS/COMPLIANCE/non-SUPER could hold): every member’s **phone number** (from included `user.phoneNumber`), **lastLoginAt** (first session `createdAt`), full **permissions array**, role, status, and a `canModify` hint. Expository SUPER_ADMIN row identity+login lat / phone. `admin-staff:read` template is granted to ADMIN and COMPLIANCE (`admin-permissions.ts:142-193`), so it’s an ordinary-privilege leak of peer admin contact/activity data. Moderate.
- `getStaffMember` returns `permissionsUpdatedBy` + `permissionsUpdatedAt` (admin-staff.ts:214-215) — internal auditor field surfaced.
- `resendInvitation` (line 868-873) spreads the **full invitation row incl. the raw DB token** into the response and, outside `NODE_ENV=production`, `newInviteUrl` = raw secret token. This contradicts the explicit H21 commit on `createInvitation` ("Never return inviteUrl in the API response", line 737-745). High channel-jacking: an admin with `admin-staff:invite` could read another team’s pending invite token.
- NO raw token is returned by `createInvitation` (correct) — only id/email/role/expiresAt (739-744).

No SUPER_ADMIN-only endpoint `transferOwnership` returns the new owner — authoritative, not a leak.

### J. TODO/FIXME / dead code / stale.
- **Dead onboarding flow (critical functional):** `createInvitation` mails `inviteUrl = ${APP_URL}/admin/invite?token=${token}` (`admin-staff.ts:701`) but **no such route exists** (only `/[locale]/invite` for operator invites). No `adminStaffInvitation.accept` procedure, no `adminStaff.create` on acceptance. ⇒ Invited users can never be added; the whole `adminStaffInvitation` lifecycle (create/cancel/resend/list) is **unreachable-to-completion dead code**. New admins can only be provisioned manually via the seed script. The `inviteUrl` also omits the `[locale]` prefix.
- `requireAdminAnyPermission` (`admin-authorize.ts:53`) and `requireAdminAllPermissions` (`admin-authorize.ts:64`) are exported but **never called** anywhere — dead.
- `admin-staff:transfer` catalog key never checked (transfer goes through `requireSuperAdmin` instead) — dead key / misleading (see §3-H).
- `admin.ts` blog: `deleteBlogPost` etc. gated only by role; no `content:*` enforcement ⇒ `content:*` catalog keys dead.
- `UpdateAdminRoleSchema.resetPermissions` field default true (`validations:35`) — value is ingested but the resolver always resets setup — the flag is ignored even when false; misleading API (always rewrites perms).
- `resendInvitation` `resendCount` derives the cap from an `INVITATION_RESENT` activity-log count with a `description contains email` — brittle; and 3-resend cap is per user, not per invite/email.
- `requestTransferOtp` logs a console.debug `OTP` fallback when Novu is absent (`admin-staff.ts:451-453`), and the OTP is a deterministic weak; acceptable dev-leniency.
- `init.ts:22-84` contains a large debuggable `[auth]`-session logging block (cookie-value decode, DB lookups, retries) that is reachable when sessions don't resolve — debug noise/leaks `session.token` shape to logs.
- `admin.ts` Unused imported schemas `verificationChecklist`/some and `getAdminTemplatePermissions(SUPER_ADMIN)` in `role-sheet.tsx:74-75` returns the full catalog `.slice(0,12)` — cosmetic.
- No `admin/layout` requirement for SUPER_ADMIN/permission ⇒ UI navigation to content is unlocked (layout.tsx role-only).

---

## 4. Client ↔ server gate parity (selective)

| Endpoint | Server gate | Client gate | Parity |
|---|---|---|---|
| createInvitation | require `admin-staff:invite` + canGrant + assignable | `can("admin-staff:invite")` header + grantable matrix + assignableRoles passed from `useAdminPermissions` (assignableRoles) | ✅ aligned; matrix restricts to `grantable` (permission-matrix.tsx:38) |
| updateRole / updatePermissions / updateStatus | `admin-staff:update` + hierarchy | button `canUpdate && !isSuperAdmin`; **not** checking `member.canModify` | ⚠️ shows button even when server hierarchy rejects (cosmetic; server wins) |
| transferOwnership | **requireSuperAdmin** only | card shows with `canDelete` = `admin-staff:remove` | ❌ mismatch — a non-super holder of `remove` sees the OTP/transfer UI but is 403’d server-side |
| remove / cancel / resend | remove/cancel/resend→`admin-staff:remove`? NO — remove `remove` → `adminStaff:remove` (350) ; cancel&resend→ **`admin-staff:invite`** (750/787) | client passes `canDelete`(`admin-staff:remove`) for both Cancel and Resend | ❌ cancel & resend must be shown for `invite` but client shows when `remove` |
| listStaff | `admin-staff:read` | tab/dashboard always renders `listStaff`, no pre-gate; on deny server 403 → view shows `loadError` | ✅ enforced server-side |

`useAdminPermissions.can` (`hooks/use-admin-permissions.ts:16-19`) mirrors `hasAdminPermission` exactly (SUPER_ADMIN→true else `permissionSet.has`), so the client capability model is internally consistent; the mismatches are in which capability key each button is bound to.

---

## 5. Ranked findings (for triage)

1. **CRITICAL — admin.ts/IAM bypass (§3-F/G).** The entire `adminRouter` (45+ procedures: operator/company verification, payouts/withdrawals, full financials/GMV, user-role mutation, blog/library) is gated only by `ctx.user.role === "ADMIN"`. No catalog key is enforced, no SUPER_ADMIN is required. Any `user` marked `role:"ADMIN"` — including a SUSPENDED or demoted (ex-SUPER_ADMIN post-transfer) or a staff row-lacking account — keeps full read/write to every admin backend. The `platform:*`/`finance:*`/`verifications:*` catalog keys are therefore functionally inert. **Impact: IAM subsystem provides essentially zero protection beyond what `user.role` already provided.**
2. **CRITICAL — admin invites are dead (§§3-J, 4.11).** `createInvitation` returns a link (`/admin/invite?token=…`) to a route that doesn’t exist; there is no accept mutation, no `adminStaff.create`‑on-accept. Admins can never be added at runtime, only via the `seed-admin-staff.ts` script. The invitation subsystem (create/cancel/resend/list + a whole `adminStaffInvitation` table) is dead, and onboarding automation is broken.
3. **HIGH — Suspended/demoted admins keep dashboard access (§D).** Session invalidation on suspend and the `adminStaffProcedure` SUSPENDED-block only guard `admin-staff`; suspending in `updateStatus` does not block `admin.*`, and the admin layout only checks `user.role`. Suspension is effectively a non-op for the backend admin surface.
4. **MEDIUM — Invite-resend token leak (§3-I).** `resendInvitation` returns the raw invitation token (non-prod `newInviteUrl`) and spreads the token-carrying row; contradicts the H10 no-return comment on `createInvitation`. Do not leak MR tokens to other (viewer) holders of `invite`.
5. **MEDIUM — catalog-key ↔ use mismatches:** `admin-staff:transfer` unused (transfer → `requireSuperAdmin`); `requireAdminAny/AllPermissions` dead; `audit:*` split wiring (`getAdminActivityLog` → `audit:read` but `listAdminActivityLogs/listBankAccessLogs/listWebhookEvents` ungated).
6. **LOW — client/server gate disalignment** on cancel/resend (uses `remove` vs `invite`), transfer (shows for non-supers), and row-actions not gating on `member.canModify`.
7. **INFO —** `seed-admin-staff.ts` picks the SUPER_ADMIN as the first-row ADMIN with no deterministic tiebreaker, and there is no re-bootstrap if the last SUPER_ADMIN row is deleted (the transfer path can be the only creator of a new super, but only if a current one exists) — a single-SUPER_ADMIN availability hazard.

Catalog keys used by any router: `admin-staff:read / update / remove / invite / audit:read`. Everything else in the 57-key catalog (admin-permissions.ts:28-109) is unused by any router-gate.

*(All file:line refs above are against the exact current file contents read during this audit.)*