# 13 — Operator Issue Fix Plan (2026-08-07)

> Companion to `12-consolidated-findings-2026-08-07.md` (operator section, O1–O19 + S2).
> Scope: **operator system only** (admin handled separately). Each item lists the precise fix.
> Status legend: `☐ Todo` `◐ In progress` `✓ Done` `— Deferred/No-op`.
> All file:line refs from the audit (2026-08-07); re-verified against current code during planning.

---

## Block 1 — Server-side security (CRITICAL/HIGH)

### O1 — CRITICAL: `storage.presignDownload` cross-company IDOR
- **Fix:** For non-ADMIN callers, resolve the caller's operator + `companyId`; add `companyId` (== caller company) to the doc `where`. Keep ADMIN path (admin may read across companies) but still require `financials:view`.
- **Files:** `apps/web/trpc/routers/storage.ts`.
- **Risk:** low; behavior change is strictly restrictive.
- **Status:** ✓ **Done** — `presignDownload` now bounds non-ADMIN doc lookup by `companyId` and adds a defense-in-depth `FORBIDDEN` check when `doc.companyId !== callerCompanyId`.

### O2 — HIGH: `operator.getDashboardMetrics` revenue leak to read-only roles
- **Find:** gated `requireAnyPermission([trips:read, bookings:read, company:view])` but returns `revenueTodayXOF` + booking feed (operator.ts:1613-1794). SUPPORT (trips:read+bookings:read) sees revenue without `revenue:view`.
- **Fix:** Sub-gate by section:
  - revenue figure rows → require `revenue:view` (return masked `null`/absent when absent).
  - booking/activity feed → require `bookings:read`.
  - Keep the entry any-of gate; compute sub-gated fields only when the caller holds the key.
- **Files:** `apps/web/trpc/routers/operator.ts` (`getDashboardMetrics`).
- **Status:** ✓ **Done** — revenue computation gated by `revenue:view` (returns `null` when absent); bookings/activity queries gated by `bookings:read` (returns `[]` when absent).

---

## Block 2 — Operator check-in / cancel key consistency

### O7 — `bookings:checkin` is dead: CONDUCTOR can't check in
- **Find:** catalog has `bookings:checkin`; CONDUCTOR template = `bookings:checkin` (no `bookings:update`). But `checkInBooking` / `bulkCheckInBookings` (operator.ts:1196,1222) and the manifest UI all gate on `bookings:update`. So a CONDUCTOR (and any checkin-granter) has NO working path.
- **Fix (D1):** align server + client check-in to accept `bookings:update` **OR** `bookings:checkin` (requireAnyPermission).
- **Status:** ✓ **Done** — server `checkInBooking`/`bulkCheckInBookings` use `requireAnyPermission(["bookings:update","bookings:checkin"])`; added `canAny()` to `useStaffPermissions`; trips + bookings views use `canAny(["bookings:update","bookings:checkin"])`.

### B8 — `cancel` gated inconsistently
- **Find:** `operator.cancelBooking`/`bulkCancelBookings` gate on `bookings:update` only (operator.ts:1201,1248); `payments.cancelBooking` gates on `bookings:update AND bookings:cancel` (payments.ts:110-118). Same destructive action, different keys.
- **Fix (D2):** unify — like `payments.cancelBooking`, require `bookings:update` **and** `bookings:cancel` in the operator router.
- **Files:** `apps/web/trpc/routers/operator.ts` + `booking-detail-drawer.tsx` client gate.
- **Status:** ✓ **Done** — `cancelBooking`/`bulkCancelBookings` now require both `bookings:update` AND `bookings:cancel`; client `booking-detail-drawer` gate updated to match.

### O13 — Dead catalog keys never enforced server-side
- `company:delete` (catalog:82, ADMIN template) — **no delete-company flow exists**; decide: implement/remove.
- `terminals:geocapture` — only client-gated; server `captures.ts` uses `terminals:update`. Decide: wire `terminals:geocapture` into `captures.` create/approve/reject, or keep `terminals:update`.
- `bookings:checkin` — folded into O7.
- **Status O13:** ✓ **Partially done** — captures create/approve/reject now use `requireAnyPermission(["terminals:update","terminals:geocapture"])` (client gate was `terminals:geocapture`); `company:delete` left in place (no delete-company flow; consistent with D3 "no template changes").

---

## Block 3 — Client gating + staff router fixes

### O9 — `resendInvitation` missing author/hierarchy/can-grant check
- **Fix:** mirror the `canCancel` predicate in `resendInvitation` (restrict to OWNER/ADMIN/inviter).
- **Files:** `apps/web/trpc/routers/staff.ts`.
- **Status:** ✓ **Done** — mirrors cancel's OWNER/ADMIN/inviter predicate.

### O14 — operator client UI leaks (add `can()` gates)
- O3 fleet view (only `fleet:read` gated; create/update/delete buttons visible to read-only).
- O4 Bookings "Export CSV" (no gate; server `revenue:export`).
- O5 Dashboard "Scan Check-In" (no gate; server `bookings:update`).
- O6 Settings: `company-profile-view` Save (no gate; server `company:profile:update`); `banking-view` edit gated on too-broad `can(...) || can("financials:view")` (server only honors `company:banking:update`).
- **Fix:** add correct `can()` guards; align `banking-view`.
- **Files:** `operator-fleet-view.tsx`, `operator-bookings-view.tsx`, `operator-dashboard-view.tsx`, `settings/.../company-profile-view.tsx`, `settings/.../banking-view.tsx`.
- **Status:** ✓ **Done** — O3 fleet: create (bus + bus type + custom layout) gated `fleet:create`, edit `fleet:update`, delete `fleet:delete`; O4 CSV button gated `revenue:export`; O5 Scan Check-In gated `canAny(bookings:update, bookings:checkin)`; O6 company-profile Save gated `company:profile:update`, banking-view `canManageBanking` narrowed to `company:banking:update`.

### O10 — Transfer Ownership visible to non-OWNERs
- **Fix:** only show Transfer for an OWNER-role caller (server gate stays `requireOwner`).
- **Files:** `staff-member-row.tsx`, `operator-staff-view.tsx`.
- **Status:** ✓ **Done** — split the transfer menu item (now gated on `callerRole === "OWNER"`) from the remove item (gated on `canDelete`/`staff:remove`).

### O11 — Invite cancel/resend client gate on wrong key
- **Fix:** change client to gate on `can("staff:invite")`.
- **Files:** `staff-invitation-card.tsx`, `staff-invitations-section.tsx`, `operator-staff-view.tsx`.
- **Status:** ✓ **Done** — `StaffInvitationsSection` `canDelete` prop changed from `staff:remove` to `staff:invite` in `operator-staff-view.tsx`.

### O12 — `requireCanGrant` contradicts `ASSIGNABLE_ROLES` for `trips:create`
- **Fix (D3):** OPERATIONS becomes non-assignable by MANAGER/ADMIN (who lack `trips:create`). Removed OPERATIONS from `ASSIGNABLE_ROLES.ADMIN` and `ASSIGNABLE_ROLES.MANAGER`; aligned web `staff-hierarchy.test.ts` + schemas tests (schema test already asserted the desired `!canAssignRole("MANAGER","OPERATIONS")`).
- **Files:** `packages/schemas/src/permissions.ts` (+ tests), `apps/web/.../staff-hierarchy.test.ts`.
- **Status:** ✓ **Done** (narrow fix — did NOT blanket-restrict all templates, which would have broken ADMIN→CONDUCTOR etc.).

---

## Block 4 — Gradation / dead code

### O14 — `settings.updateProfile` no permission gate
- **Find:** self-PII update with no gate (settings.ts:122); self-scoped so low risk but inconsistent.
- **Fix:** document as acceptable (no change) OR add a self-scoped guard. Default: **no change** (self-only).

### O15 — `storage.presignUpload` honors client `staffId` for `operator-profile-photo`
- **Fix:** server-default/override `staffId` to the caller's own id (don't trust client). Low severity.
- **Files:** `apps/web/trpc/routers/storage.ts`.
- **Status:** ✓ **Done** — `presignUpload` now always forces `keyContext.staffId = operator.id` for `operator-profile-photo`, ignoring any client-supplied value.

### O16 — `getOnboardingStatus` / `validateSlug` no key
- **Fix:** add `company:view` to `getOnboardingStatus`; leave `validateSlug` (harmless read).
- **Files:** `apps/web/trpc/routers/operator.ts`.
- **Status:** — **No-op (deferred):** `getOnboardingStatus` uses `operatorProcedure` (no company ctx) and is called unconditionally by the dashboard for all operator roles; gating on `company:view` would 403 the whole dashboard for staff without `company:view`. Endpoint is self-scoped and data is masked. `validateSlug` left as-is (harmless read).

### O17 — deprecated / dead routers
- `getMyRole` deprecated but still prefetched (`staff/page.tsx:31`); `getPermissionCatalog` (`staff.ts:940`) & 3 deprecated settings mutators (`settings.ts:240,354,465`) unused.
- **Fix (D4):** migrate `getMyRole`→`getMyPermissions`, remove the 4 dead endpoints.
- **Status:** ✓ **Done** — removed `getMyRole` + `getPermissionCatalog` (staff.ts), removed `updateBank`/`revealBankAccount`/`setDefaultBankAccount` (operator/settings.ts, dropped unused `revealBankAccountNumber` import), migrated `staff/page.tsx` prefetch to `getMyPermissions`.

### O18 — 6 dead fleet/route components (no import). Remove.
- **Status:** ✓ **Done** — removed `fleet/{buses-table,bus-edit-modal,add-bus-drawer,delete-bus-dialog,seat-map-drawer}.tsx` and `routes/routes-table.tsx`.
### O19 — `init.ts` debug auth logging. Remove before prod.
- **Status:** ✓ **Done** — removed verbose session/token debug logging (raw cookie + token values, direct-DB lookups) from `trpc/init.ts`, kept error logging.

### S2 — (shared, operator-relevant) `OperatorRouteGuard` doesn't gate SSR prefetch; `/operator/routes` prefetches `terminals.list` → `routes:read`-only user errors out.
- **Status:** ✓ **Done** — removed the `terminals.list` SSR prefetch; the client routes view now uses a plain `useQuery` gated on `can("routes:create") || can("routes:update")`.

---

## Execution order
1. O1 (CRITICAL IDOR) → O2 (dashboard leak) → O7/A (check-in) → B8 (cancel unify) → O9 (resend) — server core.
2. C3–C6 client leaks + O10/O11 client alignment.
3. O13/O12/O15/O16 — remaining server keys + catalog decisions.
4. O17/O18/O19 + S2 cleanup.
5. Verify: web `tsc --noEmit` clean, run web suite, biome on touched files.

**Decision points (D1–D4) flagged above — your call needed before I implement Block 2 and parts of Block 4.**