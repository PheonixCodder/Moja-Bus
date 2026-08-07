# 12 — Consolidated Findings Across All Subsystems (Re-Audit 2026-08-07)

> **Purpose:** One exhaustive, deduplicated findings doc for the **entire** staff-permissions
> system — operator **and** platform-admin — compiled from the six subsystem audit files produced
> by the full re-audit on 2026-08-07:
> - `operator/01-staff-router.ts.md` · `operator/02-cross-cutting-routers.ts.md` · `operator/03-features-ui.ts.md`
> - `admin/01-admin-staff-router.ts.md` · `admin/02-features-ui.ts.md`
> - `shared/04-pages-guards-schema.ts.md`
>
> This file is the **single source of truth** for open gaps. It supersedes the (stale) flat
> `01-11` files, which are retained as archived history from the first audit pass.
>
> **Catalog ground truth:** operator = **42 keys** (corrected from baseline's 40); admin = 57 keys.
> Status: `Open` | `Fixed` | `In PR` | `Blocked` | `By-design`.
> All file:line references are against current code at audit time (2026-08-07).

---

## Operator subsystem

### Operator — CRITICAL

| # | Status | Finding | Where | Proposed plan |
|---|---|---|---|---|
| O1 | **Open** | **`storage.presignDownload` cross-company IDOR** — `companyDocument.findFirst` is scoped by `documentId`/`objectKey` only, **not** the caller's company (storage.ts:165-203); any `financials:view` holder can mint presigned GET URLs for *other* companies' private compliance docs by iterating IDs. | `apps/web/trpc/routers/storage.ts:165-203` | Add `doc.companyId === caller's company` filter (ADMIN-exempt path must still bound to its own or an explicit target). |
| O2 | **Open** | `operator.getDashboardMetrics` over-exposes — gated `requireAnyPermission([trips:read, bookings:read, company:view])` but unconditionally reads bookings + derives `revenueTodayXOF` from `pricingSnapshot.operatorNetXOF` (operator.ts:1613-1794). Base SUPPORT sees revenue with no `revenue:view`. | `apps/web/trpc/routers/operator.ts:1613-1794` | Sub-gate: `revenue:view` before returning revenue figures; gate booking-feed section on `bookings:read`. |

### Operator — HIGH (client/UI leaks)

| # | Status | Finding | Where | Proposed plan |
|---|---|---|---|---|
| O3 | Open | **Fleet view** gates only `fleet:read` at page level; all Add Vehicle / Edit / Delete / Add Bus Type / Create+Delete Layout leak to read-only roles (server rejects). | `features/operator/views/operator-fleet-view.tsx` + `fleet/*` dialogs | Gate each button on `fleet:create/update/delete`. |
| O4 | Open | **Bookings Export CSV** has no client gate (server = `revenue:export`). | `operator-bookings-view.tsx` | Gate on `can("revenue:export")`. |
| O5 | Open | **Dashboard "Scan Check-In"** control leaks (server = `bookings:update`). | `operator-dashboard-view.tsx` | Hide unless `can("bookings:update")`. |
| O6 | Open | **Settings Company Profile Save** un-gated (server `company:profile:update`); **Banking edit** gated on too-broad `can("company:banking:update") \|\| can("financials:view")` (server only honors `company:banking:update`). | `settings/.../company-profile-view.tsx`, `banking-view.tsx` | Use the exact key on the client. |

### Operator — MEDIUM

| # | Status | Finding | Where | Proposed plan |
|---|---|---|---|---|
| O7 | Open | **`bookings:checkin` is a dead/half-implemented key** — every operator check-in path (client + server) uses `bookings:update`; CONDUCTOR (template = `bookings:checkin`, no `bookings:update`) **cannot actually check in**. | `permissions.ts:62`; `operator.ts:1196,1222`; `manifest-drawer.tsx`, `operator-bookings-view.tsx` | Align: either `checkInBooking`/`bulkCheckInBookings` accept `bookings:checkin`, or gate conductor paths on it. |
| O8 | Open | `operator.cancelBooking`/`bulkCancelBookings` gate on `bookings:update` only; `payments.cancelBooking` requires `bookings:update AND bookings:cancel` — **same action gated inconsistently across routers**. | `operator.ts:1204,1257` vs `payments.ts:110-118` | Unify on `bookings:cancel` for refund-full cancels. |
| O9 | Open | **`resendInvitation` missing author/hierarchy/can-grant check** (staff.ts:808, only `staff:invite`): any `staff:invite` holder re-issues another's PENDING invite; `cancelInvitation` has a strict OWNER/ADMIN/inviter predicate but resend doesn't. | `staff.ts:808` | Mirror the `canCancel` predicate into `resend`. |
| O10 | Open | **Transfer Ownership shown to any `staff:remove` holder** (client), server = `requireOwner` → guaranteed FORBIDDEN UI for non-owners. | `staff-member-row.tsx:171-189` vs `staff.ts:390,466` | Only show Transfer for OWNER-role callers. |
| O11 | Open | **Invite cancel/resend client-gated on `staff:remove` but server-gated on `staff:invite`** — ambiguous both directions. | `staff-invitation-card.tsx`; `staff.ts:757,808` | Align to `staff:invite`. |
| O12 | Open | `requireCanGrant` contradicts `ASSIGNABLE_ROLES` for `trips:create`: MANAGER/ADMIN pass `canAssignRole(OPERATIONS)` then `requireCanGrant(OPERATIONS template incl trips:create)` fails (neither holds `trips:create`) → roster shows "Operations" but server rejects. | `permissions.ts:260`; `staff.ts:610-612,276`; `role-sheet.tsx` | Make `canAssignRole` also require holding the target role's needed keys, or add `trips:create` to MANAGER/ADMIN. |
| O13 | Open | `company:delete`, `bookings:checkin`, `terminals:geocapture`, (`bookings:cancel` partially) are **declared in the catalog but never enforced by any server gate** (`terminals:geocapture` client-only) — dead catalog surface. | `permissions.ts:37,62,82` | Wire server gates or remove keys. |
| O14 | Low | `settings.updateProfile` (self-PII) has **no `requirePermission`** (self-only writes — low risk but inconsistent with every other mutator). | `settings.ts:122` | Acceptable, or add a self-scoped gate. |
| O15 | Low | `storage.presignUpload` for `operator-profile-photo` accepts a client-supplied `staffId` (within-company avatar overwrite, singleton key). | `storage.ts:93-95` | Default/override `staffId` server-side. |
| O16 | Low | `operator.getOnboardingStatus` / `validateSlug` no key (onboarding read / global slug-registry enumeration). | `operator.ts:143,446` | Consider `company:view` on `getOnboardingStatus`. |

### Operator — dead / deprecated

| # | Status | Finding | Where | Proposed plan |
|---|---|---|---|---|
| O17 | Low | `getMyRole` deprecated but still prefetched (`staff/page.tsx:31`); `getPermissionCatalog` deprecated & unused; 3 deprecated settings mutators (`updateBank`/`revealBankAccount`/`setDefaultBankAccount`). | `staff.ts:131,940`; `settings.ts:240,354,465` | Migrate `getMyRole` → `getMyPermissions`; delete dead. |
| O18 | Info | 6 fleet/route component files are dead code (not imported): `fleet/{buses-table,bus-edit-modal,add-bus-drawer,delete-bus-dialog,seat-map-drawer}.tsx`, `routes/routes-table.tsx`. | `features/operator/components/` | Remove or wire. |
| O19 | Info | `init.ts:11-84` leftover debug/diagnostic auth logging (session-cookie decode, DB probes). | `trpc/init.ts` | Remove before prod. |

---

## Admin subsystem

### Admin — CRITICAL

| # | Status | Finding | Where | Proposed plan |
|---|---|---|---|---|
| A1 | **Open (CRITICAL)** | **The entire `admin.ts` router (45+ procedures: verifications, payouts/withdrawals, GMV/ledger, user-role, blog/content, dispatch, audit-read) is gated ONLY by `user.role === "ADMIN"`** — no `admin-staff:*` key, no `requireSuperAdmin`. The admin IAM catalog is decorative outside the Admin Staff screen. Any ADMIN user — including a SUSPENDED admin, or an ex-SUPER_ADMIN demoted to ADMIN post-transfer — keeps full access. | `trpc/routers/admin.ts` (all `adminProcedure`, no keys); `trpc/init.ts:218`; `app/[locale]/dashboard/admin/layout.tsx:23-27` | Wire `requireSuperAdmin`/`requireAdminAnyPermission` across `admin.ts`; block SUSPENDED in admin layout / init middleware. Highest-impact config gap. |
| A2 | **Open (CRITICAL, functional)** | **Admin invites are dead**: `createInvitation` emails a link to `/admin/invite` (no such route, no accept mutation, no `adminStaff.create`); admins can only be provisioned via `seed-admin-staff.ts`. The whole invitation lifecycle (list/cancel/resend) is unreachable-to-completion dead code. | `admin-staff.ts:701`; no `/admin/invite` route; `seed-admin-staff.ts` | Add `/admin/invite` accept flow + `adminStaff.create`; or document seed-only provisioning. |
| A3 | High | **Suspended/demoted admins keep dashboard access** — `updateStatus` deletes sessions + `adminStaffProcedure` blocks SUSPENDED *only on admin-staff*; suspension is a no-op for `admin.*` and the layout (role-only). | `admin-staff.ts:316-320`; init.ts; admin/layout.tsx | Extend SUSPENDED to layout + init middleware; gate admin.ts. |
| A4 | Medium | `resendInvitation` returns **raw invitation token** + full row + `newInviteUrl` (non-prod = raw token); contradicts the "never return inviteUrl" guard on `createInvitation`. | `admin-staff.ts:868-873` vs `737-745` | Do not return/show raw token; re-issue server-side only. |
| A5 | Medium | **`admin-staff:transfer` key is dead** (transfer implemented via `requireSuperAdmin`); `requireAdminAnyPermission`/`requireAdminAllPermissions` dead (`admin-authorize.ts:53,64`); `content:*`, `platform:*`, `verifications:*`, `users:*`, `audit:*` catalog keys unused by the dozens of admin procedures. | `admin-permissions.ts:104`; `admin.ts` | Wire keys; or prune catalog to the enforced surface. |
| A6 | Low-Med | **Client/server gate mismatches**: invite cancel/resend tied to `admin-staff:remove` but server = `admin-staff:invite`; transfer buttons shown to any `remove`-holder but server = SUPER_ADMIN only; `listStaff` returns phone/lastLoginAt/full permissions to any `admin-staff:read` holder; activity log prefetched un-gated (`audit:read`). | admin UI components + `admin-staff.ts` | Align keys per server; PII-minimize `listStaff`; gate activity on `audit:read`. |
| A7 | Low | `seed-admin-staff.ts` picks the first ADMIN as SUPER_ADMIN (nondeterministic `.sort`); no re-bootstrap if all SUPER_ADMIN rows removed — single-SUPER_ADMIN availability hazard. | `packages/db/scripts/seed-admin-staff.ts` | Deterministic selection; redundant bootstrap. |

### Verified-solid (admin)
- `admin-staff.ts` itself correctly gates on `admin-staff:*` + `requireAdminCanGrant` + `assertCanModifyAdminTarget` (hierarchy strict-greater-than) + `session.deleteMany` on suspend/remove. SUPER_ADMIN transfer gated by `requireSuperAdmin` + OTP (sha256, 10-min, 2-min throttle, single-use). SUPER_ADMIN protected from demote/remove; role change resets to template. **These are strong.** The failure is entirely the adjacent `admin.ts`/layout surface.

---

## Shared — pages / guards / schema

| # | Status | Finding | Where | Proposed plan |
|---|---|---|---|---|
| S1 | High | No **AdminRouteGuard** / AccessDenied; admin layout checks only `user.role === "ADMIN"` (no AdminStaff status/permissions/SUSPENDED). Admin staff page errors (no fallback) when a role-ADMIN has no AdminStaff row. | admin/layout.tsx; shared/04 | Add admin layout guard + AccessDenied. |
| S2 | Low-Med | `OperatorRouteGuard` is client-only and does **not** block SSR prefetch. `/operator/routes` prefetches `terminals.list` (needs `terminals:read`) — a `routes:read`-only user errors out instead of seeing AccessDenied. | route-guard.tsx:8-30; routes/page.tsx; terminals.ts:40 | Guard/limit prefetch to the route's actual permission. |
| S3 | Low | **No schema-level single-owner constraint** — only `@@unique([userId, companyId])`; two distinct `role=OWNER` rows allowed. | schema.prisma:606 | Add partial unique (owner role per company) or app-layer check at transfer/creation. |
| S4 | Low | Operator model **no `suspendedAt`/`removedAt`/`ownerUserId`**; `permissions String[]` (native array, not JSON). Ownership expressed only by `role=OWNER`. | schema.prisma:560-611 | Optional; document/adjust fields. |
| S5 | Low | Invitation tokens stored as unsalted sha256 of a random; column named `token` (not `tokenHash`); **no `emailVerifiedAt`** on either invitation model; `AdminStaffInvitation.status` is raw `String`, `StaffInvitation.status` uses the enum — inconsistent. | schema.prisma:707-729,1934-1958 | Consider `tokenHash` + `emailVerifiedAt`; align enum. |
| S6 | Info | Root init.ts debug/auth logging (cookie decode + DB probes). | trpc/init.ts | Remove before prod. |

---

## Recommended remediation order

1. **Admin CRITICAL:** wire permission gates + SUSPENDED-block across `admin.ts` and admin layout (A1/A3). Closest to a live breach.
2. Fix admin invite accept flow or document seed-only (A2); stop leaking the invite token (A4).
3. **Operator IDOR:** `storage.presignDownload` company-scope (O1).
4. **Operator revenue leak:** sub-gate `getDashboardMetrics` (O2).
5. **Check-in key alignment** so CONDUCTOR works (O7) + unify cancel key (O8).
6. Client leaks (O3-O6), transfer visibility (O10), invite-key consistency (O11), `resend` author check (O9).
7. Catalog hygiene: wire or drop dead keys (O12/O13) — incl. `company:delete`, `bookings:checkin`, `terminals:geocapture`.
8. Schema/pages: single-owner + route-guard prefetch + AdminRouteGuard (S1-S4).
9. Dead code + debug-logging cleanup (O17-O19, S6).

---

## Counts (re-audit)
- Operator: **42 catalog keys confirmed** · 9 roles · ~135 procedures audited across 3 files.
- Admin: **6 roles** · 14 admin-staff procedures gated correctly · **45+ admin.ts procedures with ZERO IAM gate** · 57-key admin catalog, of which only `admin-staff:read/update/remove/invite` + `audit:read` (1 proc) are enforced.
- Shared: pages/guards/Prisma model audit.
- Total new findings this pass: ~19 operator + 7 admin + 6 shared = **~32 deduplicated, severity-ranked above.**

*(This file is meant to stay small and actionable; the subsystem files `operator/0*`, `admin/0*`, `shared/0*` contain the full per-procedure tables.)*