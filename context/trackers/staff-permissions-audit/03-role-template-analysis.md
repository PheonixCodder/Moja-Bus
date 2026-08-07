# 03 — Role Template Analysis: Missing Roles & Wrong Templates

This file answers the audit's two explicit questions: **which roles are missing** and **which templates are wrong**, plus the design-level reasoning for each finding.

---

## 1. Roles that exist

`OWNER`, `ADMIN`, `MANAGER`, `OPERATIONS`, `FINANCE`, `SUPPORT` (enum `StaffRole`, `packages/schemas/src/permissions.ts:9-16`).

---

## 2. Missing roles

### 2.1 No read-only / viewer role (highest priority)
- **Why it matters:** SUPPORT is the lowest role and it already contains mutating permissions (`bookings:update`, `reviews:respond`). There is no way to grant someone view access to, say, revenue or the manifest without also giving them a write capability. This is the root cause of the pervasive "view-only staff see edit controls" problem across fleet/routes/terminals/revenue/withdraw/settings views.
- **Impact:** Any staff you trust to *look* can also *modify* (or must be granted `bookings:update` just to view bookings check-in flow — actually `bookings:read` suffices for viewing; but SUPPORT still gets `bookings:update` by default).

### 2.2 No DISPATCHER vs CONDUCTOR separation
- OPERATIONS conflates **dispatch** (`trips:update`, `trips:cancel`) with **boarding/check-in** (`bookings:update`) and **schedule/fare maintenance** (`schedules:read` + nothing else) and **route/fleet read**.
- SUPPORT conflates **ticketing/check-in** (`bookings:read/update`) with **schedule/trips visibility** and **review responses**.
- In a real bus operator: a dispatcher controls departure/arrival/delay/bus-assign (trips:update/cancel) and a conductor/ticketing agent handles check-in and cancellation of individual bookings. These are two people in the terminal; today they'd both be "OPERATIONS" or "SUPPORT" with overlapping powers.

### 2.3 No finance-payout role (FINANCE-ADMIN / TREASURY)
- FINANCE has `revenue:view` + `withdrawals:view` but **not** `withdrawals:create`. So the finance officer can see revenue and pending payouts but can never initiate the withdrawal they manage. Only OWNER/ADMIN can withdraw.
- Recommended: either add `withdrawals:create` to FINANCE, or add a `TREASURY` role with `revenue:view` + `withdrawals:view` + `withdrawals:create` (+ 2FA enforced — see note below).

### 2.4 No platform-level operator roles
- All roles are company-scoped via the `Operator` row. There is no company-wide "read-only auditor" and no cross-company platform-operator role. (The platform side uses `User.role === "ADMIN"` only.)

### 2.5 No granular settings roles
- Only `company:view` / `company:update` exist for the entire settings surface. There is no separation between:
  - **Profile editing** (personal data — arguably should be self-service for any staff member, currently gated by `company:update`).
  - **Bank/payout management** (high-privilege; today just `company:update`, so a company ADMIN — not just OWNER — can change the payout destination).
  - **Compliance docs** (view vs upload).
- Because everything collapses into `company:update`, FINANCE/MANAGER cannot manage their own profile (they lack `company:update`), yet the UI says "Everyone can manage their own profile".

---

## 3. Templates that are wrong (or inconsistent)

### 3.1 `trips:create` is dead weight
- ADMIN, MANAGER, OPERATIONS all include `trips:create`, but trips are generated from schedules (`schedules.regenerateTrips` / `reconcileFutureTrips`). `trips.create` exists for ad-hoc single-trip creation and is gated `trips:create` server-side, but **no template distinguishes it** from schedule-driven generation.
- **Concern:** schedule-driven trip creation happens under `schedules:update`, and schedule edits can cancel booked trips (see 3.5). A custom role with `schedules:update` but no `trips:cancel` can still indirectly cancel trips — see router findings.

### 3.2 FINANCE can see but never act on payouts
- FINANCE = `revenue:view`, `withdrawals:view`, `company:view`, `bookings:read`, `routes:read`, `reviews:read`. No `withdrawals:create`. If the product intent is "FINANCE manages payouts", add `withdrawals:create` (and enforce the existing `require2FAForWithdrawals` platform setting). If not, FINANCE is fine, but then document that only OWNER/ADMIN initiate payouts.

### 3.3 MANAGER cannot delete but can create/edit — asymmetric
- MANAGER has `routes:create/update`, `terminals:create/update`, `fleet:create/update`, `schedules:create/update`, but **no `*:delete`** for any of them. In practice a MANAGER builds the network but must ask an ADMIN/OWNER to remove a bus, terminal, route, or schedule.
- Either grant MANAGER `*:delete` (for the resources they manage) or accept the asymmetry — but note the UI shows delete buttons to MANAGER anyway (see 06), because the UI doesn't check `:delete` before rendering.

### 3.4 MANAGER has staff:read but not staff:invite/update/remove
- MANAGER = `staff:read` only. Fine if MANAGER is a supervisor without hiring powers; but the staff page shows suspend/activate and edit controls to MANAGER in the UI (see 07) which then 403.

### 3.5 `bookings:update` doubles as "cancel with refunds"
- There is **no `bookings:cancel`** permission. `operator.cancelBooking` and `bulkCancelBookings` require only `bookings:update`. Consequences:
  - SUPPORT (who has `bookings:update`) can **cancel paid, refundable bookings** (refunds route to passenger wallet). That's a money-moving action for the lowest-tier role.
  - OPERATIONS (who also has `bookings:update`) likewise.
- Either add `bookings:cancel` (grant to OPERATIONS/ADMIN/OWNER, remove from SUPPORT) or deliberately accept SUPPORT as able to refund. Recommend the former.

### 3.6 No `revenue:export`-equivalent separation (minor)
- Exports ride on `revenue:view` and `bookings:read` — acceptable, but if CSV export of passenger PII should be restricted, add `revenue:export`.

### 3.7 OWNER template + permission matrix is invisible
- `ROLE_TEMPLATES.OWNER = []`, `getTemplatePermissions("OWNER") = all`. The UI matrix never renders for OWNER members (rows are locked), so an OWNER cannot see what they implicitly hold. Cosmetic.

### 3.8 Missing "settings" permission granularity (from 2.5)
- `updateProfile` and `updateCompany` both use `company:update`. Personal profile editing should not require a company-level permission. This is both a UX and a least-privilege issue.

---

## 4. Permission-to-page mapping sanity check

For each page the sidebar requires a `:read` key, and the routers require the matching `:read`. **Mismatches found:**

| Page | Sidebar requires | Router(s) require | Notes |
|---|---|---|---|
| Overview | *(always shown)* | `trips:read` **or** `bookings:read` **or** `company:view` (`getDashboardMetrics`) | **MISMATCH** — `reviews:read`-only or `fleet:read`-only staff see the link but the page crashes. |
| Bookings | `bookings:read` | `bookings:read` | OK |
| Trips (Dispatch Board) | `trips:read` | `trips:read` | OK |
| Fleet | `fleet:read` | `fleet:read` | OK |
| Routes | `routes:read` | `routes:read` **and** `terminals:read` (page prefetch also calls `terminals.list`) | **MISMATCH** — `routes:read` alone (sidebar-visible) crashes; needs `terminals:read` too. |
| Schedules | `schedules:read` | `schedules:read` | OK |
| Terminals | `terminals:read` | `terminals:read` **and** `routes:read` (page prefetch calls `routes.getCities`) | **MISMATCH** — `terminals:read` alone crashes. |
| Revenue | `revenue:view` | `revenue:view` | OK |
| Withdrawals | `withdrawals:view` | `revenue:view` + `withdrawals:view` + `company:view` (page prefetches all three) | **MISMATCH** — needs 3 keys, sidebar shows 1. |
| Reviews | `reviews:read` | `reviews:read` | OK |
| Staff | `staff:read` | `staff:read` | OK |
| Company (settings) | `company:view` | `company:view` (layout) | OK, but footer "Settings" link is ungated → broken for non-viewers. |

> Full page-level detail in [`05-page-route-audit.md`](./05-page-route-audit.md).

---

## 5. Recommended template adjustments (summary)

1. **Add `bookings:cancel`** key; remove it from SUPPORT; keep `bookings:update` as check-in only. (Or accept + document.)
2. **Add `withdrawals:create` to FINANCE** (or a new `TREASURY` role), with the platform 2FA flag as the gate.
3. **Add a read-only tier** (`VIEWER` role, or make SUPPORT read-only and add `TICKETING`). Ship `can()` gating across all views first.
4. **Grant MANAGER `*:delete`** for routes/terminals/fleet/schedules (resources they already create/edit), or hide delete buttons from MANAGER.
5. **Split personal profile editing** out of `company:update` (e.g. `profile:self-update` implicit for all members, not a stored key).
6. **Align page/sidebar gates**: make Overview not crash for read-only roles; make Withdraw require `withdrawals:view` (+ guard the payout form with `withdrawals:create`); stop routes/terminals pages from requiring the *other* resource's read.
7. **Remove `trips:create`** from templates if ad-hoc trip creation isn't productized, or keep it explicitly for ad-hoc creation only.

Detailed remediation in [`11-recommendations.md`](./11-recommendations.md).
