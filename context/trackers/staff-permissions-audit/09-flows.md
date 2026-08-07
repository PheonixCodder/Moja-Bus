# 09 — Flows (End-to-End Walkthrough)

How each staff-related flow actually works, step by step, including side effects, audit logging, and where the guard sits.

---

## Flow 1 — Staff invite → accept → member

### Invite (`staff.createInvitation`)
1. Guard: `requirePermission(ctx, "staff:invite")` + `requireCanGrant(input.permissions)` (caller may only grant keys they hold) + `canAssignRole(caller.role, input.role)` + "ADMIN invite requires OWNER (or platform ADMIN)".
2. Duplicate checks: user already a member (CONFLICT), pending invitation exists (CONFLICT), rate limit (≤10 invites/hour/company).
3. Token: raw 32-byte hex token → hashed with SHA-256 → stored (`StaffInvitation.token` unique). Raw token never stored.
4. `StaffInvitation` created with `role`, `permissions` snapshot, `jobTitle`, `message`, `expiresAt` (`expiryDays`, default 7).
5. Audit: `activityLog` `INVITATION_SENT` (metadata includes email, role, permissions).
6. Email: Novu `operator-staff-invite` workflow → `inviteUrl = /invite?token=<raw>`. **URL is never returned in the API response** (H21). In dev it's printed to server stdout.
7. Client: `invite-sheet.tsx` collects email/role/jobTitle/message/expiry + permission matrix (grantable-filtered).

### Validate (`invitation.validateToken`) — PUBLIC
- Hashes the raw token, looks up invitation, checks status `PENDING` and `expiresAt`. On expiry, marks `EXPIRED`. Renders the invite landing page.

### Accept (`invitation.accept`) — PUBLIC
1. Looks up by hashed token; must be `PENDING` and unexpired.
2. If no session → `{ requiresAuth: true, email, companyName }` → redirect to OTP sign-in, token preserved in query string, acceptance completes post-login.
3. If logged in → **email must equal invitation email** (else FORBIDDEN).
4. Re-entrancy: existing active membership → error; **soft-deleted membership → restored** (avoids `@@unique([userId, companyId])` conflict) with role/permissions/status refreshed.
5. Transaction:
   - `User.update`: `emailVerified: true`, `role: "OPERATOR"` (upgrade platform identity).
   - Operator create (or restore): `role`, `jobTitle`, `permissions` = `invitation.permissions` (fallback `ROLE_TEMPLATES[role]`), `status: ACTIVE`, `isActive: true`, `deletedAt: null`, `onboardingStatus: "COMPLETED"`.
   - `StaffInvitation` → `ACCEPTED` + `acceptedById`.
   - `activityLog` `MEMBER_JOINED`.
6. Novu `staff-acceptance-alert` to the inviter.
7. Session handled natively by Better Auth.

> **Security note:** the invitation grants **exactly** the snapshot permissions; the fallback to role template only happens for legacy invites with an empty set. Acceptance does NOT re-validate `requireCanGrant` against the inviter (the invite-time check already did), so a role/permission granted at invite time survives even if the inviter's permissions were later reduced — acceptable, but worth knowing.

---

## Flow 2 — Role change (`staff.updateRole`)
1. Guard: `staff:update` + `assertCanModifyTarget` (level(hierarchy) + OWNER-target protection) + `canAssignRole` (or platform ADMIN) + "ADMIN role requires OWNER inviter".
2. **Always resets permissions to `ROLE_TEMPLATES[targetRole]`** (privilege-retention guard; `resetPermissions` input ignored).
3. `requireCanGrant(ROLE_TEMPLATES[role])` — caller must hold every key in the target template (prevents granting an ADMIN template if the caller can't hold it all... except OWNER/ADMIN bypass).
4. Updates operator: `role`, `permissions`, `permissionsUpdatedAt/By`.
5. Audit `ROLE_CHANGED` (prev/new role, `resetPermissions: true`, reason).

---

## Flow 3 — Permission grant/revoke (`staff.updatePermissions`)
1. Guard: `staff:update` + `requireCanGrant(input.permissions)` + `assertCanModifyTarget`.
2. Overwrites the member's full permission array with the submitted set (not a diff).
3. Audit `PERMISSIONS_CHANGED` (previous vs next array, reason).
4. Client: `EditPermissionsSheet` shows a group-by-group matrix filtered to grantable keys; group header select/deselect-all.

---

## Flow 4 — Suspend / activate (`staff.updateStatus`)
1. Guard: `staff:update` + `assertCanModifyTarget` + "cannot suspend OWNER".
2. Sets `status` and `isActive = (status === "ACTIVE")`.
3. Audit `STATUS_CHANGED`.
4. **Runtime effect of suspension:** `operatorCompanyProcedure` middleware (trpc/init.ts:201) rejects SUSPENDED operators on the *next request* (FORBIDDEN "Your account has been suspended"); `operatorHasPermission` also returns false for SUSPENDED. Sessions are not force-killed — the staff member's existing session stops working at the next API call because the middleware 403s. There is no immediate token/session revocation.
5. Client: rows only offer ACTIVE ↔ SUSPENDED (INACTIVE not reachable via UI).

---

## Flow 5 — Remove staff (`staff.removeStaff`)
1. Guard: `staff:remove` + `assertCanModifyTarget` + cannot remove self.
2. **Soft delete**: `deletedAt`, `isActive: false`, `status: "INACTIVE"` (operator row retained for audit; re-invite restores it — Flow 1).
3. Audit `MEMBER_REMOVED` (targetUserId, targetRole, reason).
4. `RemoveStaffSchema.transferAssignments` exists but is never sent by the UI.
5. **Impact of removal:** the operator row no longer matches `deletedAt: null`, so `operatorCompanyProcedure` can't resolve the profile → their access to all operator endpoints stops. Same session-not-killed caveat as suspension.

---

## Flow 6 — Ownership transfer (`staff.requestTransferOtp` + `staff.transferOwnership`)
1. Guard: `requireOwner` (OWNER or platform ADMIN).
2. OTP: 6-digit, hashed SHA-256, stored in `Verification` with identifier `transfer-ownership:<email>`, 10-min expiry, 2-min cooldown between requests; delivered via Novu `auth-otp` (dev: stdout).
3. Transfer requires typed `"TRANSFER OWNERSHIP"` + OTP; target must not already be OWNER and must be ACTIVE.
4. Transaction:
   - Current owner → `role: "ADMIN"`, `permissions: ROLE_TEMPLATES.ADMIN`.
   - Target → `role: "OWNER"`, `permissions: []`.
   - Verification record deleted (single-use).
   - Audit `OWNERSHIP_TRANSFERRED`.
5. Side effect: only one OWNER exists per company (enforced by the transfer path; `updateRole` can't assign OWNER; invites can't target OWNER).

---

## Flow 7 — Page load + sidebar (permission → UI)
1. Layout prefetches `getShellContext` + `getMyPermissions` (both ungated) → sidebar renders.
2. Sidebar `NavSection` filters items: `item.permissions.some(key => can(key))`; `can` = OWNER→true else stored-permission.
3. Page server-prefetches its data query → `requirePermission` throws → error boundary if denied.
4. Client view mounts; `can()` gates secondary fetches (e.g. buses on trips) and action buttons.

---

## Flow 8 — Settings access
1. Footer/sidebar → `/settings` → redirect `/settings/company`.
2. `settings/layout.tsx` prefetches `getSettings` (`company:view`) → denied users hit error boundary.
3. `SettingsSidebar` filters tabs by raw `operator.permissions` (with the `financials:view` bug).
4. Edits call `updateCompany`/`updateProfile`/bank/doc mutations → `company:update` server check → 403 toast if not held.

---

## Flow 9 — Withdrawal (money movement)
1. Page load: `getAccountSnapshot` (`revenue:view`), `listWithdrawals` (`withdrawals:view`), `getSettings` (`company:view`), `getWithdrawalControls` (ungated).
2. "Send code": `requestWithdrawalChallenge` (`withdrawals:create`) → creates `WithdrawalTwoFactorChallenge` (hashed code, attempts, expiry) — platform setting `require2FAForWithdrawals` decides if 2FA is mandatory.
3. "Request withdrawal": `requestWithdrawal` (`withdrawals:create`) → verifies challenge → `AccountingEngine` posts the withdrawal to the operator receivable account; a `WalletReservation` is released; `financial_transaction` created.
4. Audit/bank-access logs on view.

---

## Flow 10 — Geo-capture (terminal geo-linking)
1. `captures.createCapture` (`terminals:update`) mints a single-use, expiring token on a `CompanyLocation` (`captureToken`, `captureExpiresAt`).
2. Public share page: `captures.getInfo` / `submit` / `confirm` (public) — GPS + resolved place (city/municipality/quarter) stored on `LocationCapture`.
3. Operator approves (`captures.approveCapture`, `terminals:update`) → terminal `geoCaptureStatus: COMPLETE`; or rejects → back to `PENDING_CAPTURE`.

---

## Cross-cutting observations

- **Audit trail:** staff actions (`INVITATION_SENT/CANCELLED/RESENT`, `ROLE_CHANGED`, `PERMISSIONS_CHANGED`, `STATUS_CHANGED`, `MEMBER_REMOVED/ADDED`, `OWNERSHIP_TRANSFERRED/OTP_REQUESTED`) all land in `ActivityLog`; `getActivityLog` is `staff:read`-gated.
- **Session invalidation on suspend/remove is missing:** no immediate session revocation — only the middleware's next-request rejection. For higher assurance, revoke sessions via Better Auth on `updateStatus`/`removeStaff`.
- **Money actions under view-permissions:** SUPPORT (`bookings:update`) can refund; schedule edits (`schedules:update`) can cancel trips; withdrawal requires `withdrawals:create` (nobody but OWNER/ADMIN default).
- **All data queries are company-scoped** (`ctx.companyId`) — cross-tenant access is prevented by the middleware + companyId filters, not by permissions.
