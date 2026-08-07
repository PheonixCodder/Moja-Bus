# Staff System & Permissions Audit

> **Scope:** Complete audit of the operator staff system — roles, permission templates, per-action/per-page authorization, sidebar gating, staff management, invitations, and settings.
> **Generated:** 2026-08-06 · **Auditor:** opencode (deep audit)
> **Code areas covered:** `packages/db/prisma/schema.prisma`, `packages/schemas/src/` (esp. `permissions.ts`, `operator.ts`), `apps/web/trpc/routers/` (all routers), `apps/web/lib/permissions/` (`authorize.ts`, `staff-hierarchy.ts`), `apps/web/app/[locale]/dashboard/operator/**`, `apps/web/features/operator/**`.

---

## How to read this report

| File | Content |
|---|---|
| [`01-iam-architecture.md`](./01-iam-architecture.md) | How the whole IAM system works: permission catalog, roles, hierarchy, the 3 guard layers, effective-permission model. Read this first. |
| [`02-permission-catalog.md`](./02-permission-catalog.md) | The full permission catalog (31 keys) + the role templates + a per-role × permission matrix. |
| [`03-role-template-analysis.md`](./03-role-template-analysis.md) | **Which roles are missing and which templates are wrong** — the template-level findings. |
| [`04-router-guard-audit.md`](./04-router-guard-audit.md) | Every tRPC procedure and the exact permission it requires (server-side truth). |
| [`05-page-route-audit.md`](./05-page-route-audit.md) | Every operator page: guard layers, sidebar nav gating, and what a user without the read permission sees. |
| [`06-action-gating-audit.md`](./06-action-gating-audit.md) | View-level gating of every create/edit/delete/cancel/check-in/withdraw action (client side). |
| [`07-staff-management-audit.md`](./07-staff-management-audit.md) | Deep dive on the Staff page: invite, role edit, permission editor, suspend, remove, transfer, activity log. |
| [`08-settings-audit.md`](./08-settings-audit.md) | Deep dive on Settings: company/personal/banking/compliance/notifications, incl. the `financials:view` bug. |
| [`09-flows.md`](./09-flows.md) | End-to-end flows: staff invite → accept, role change, permission grant, suspend, ownership transfer, side effects. |
| [`10-consolidated-findings.md`](./10-consolidated-findings.md) | **All gaps & inconsistencies** consolidated, ranked by severity (CRITICAL / HIGH / MEDIUM / LOW). |
| [`11-recommendations.md`](./11-recommendations.md) | Prioritized, concrete remediation plan following production/enterprise patterns. |

---

## Executive summary

### What is good
- **Server-side enforcement is solid.** Every operator data mutation/query in the feature routers is gated through `requirePermission(ctx, "<key>")` in `apps/web/lib/permissions/authorize.ts:43`. An OWNER bypass, platform-ADMIN bypass, and SUSPENDED-block are centralized in `operatorHasPermission` (`authorize.ts:34`).
- **Ownership transfer** is hardened with an OTP (`staff.requestTransferOtp` / `staff.transferOwnership`, `trpc/routers/staff.ts:388-551`).
- **Privilege retention is prevented**: role changes always reset permissions to the target role template (`staff.ts:273-275`), and invitation acceptance copies `invitation.permissions` onto the operator record.
- **Grant confinement**: `requireCanGrant` (`authorize.ts:75`) stops a caller from granting permissions they don't hold; the client permission matrix hides non-grantable keys.
- The sidebar (`operator-sidebar.tsx`) hides nav items per permission, and the permission catalog is a single source of truth in `packages/schemas/src/permissions.ts`.

### What is broken (headline items)
1. **No explicit route-level guard on any page.** Every page relies on the router's `requirePermission` throwing, which surfaces as a raw `error.tsx` crash — not an "access denied" state. Any staff member (e.g. SUPPORT) can type any operator URL and hit an error boundary with a leaked technical message. (`05-page-route-audit.md`)
2. **Settings edit UI is not gated client-side at all.** A `company:view`-only staff sees full edit forms/upload/delete controls everywhere; only the server 403s on submit. (`08-settings-audit.md`)
3. **`financials:view` gate is a ghost key.** `settings-sidebar.tsx:38` gates the Financials tab on `perms.includes("financials:view")`, but that key does **not** exist in the catalog — the tab is effectively OWNER-only, blocking FINANCE staff who are server-authorized (`listBankAccounts` = `company:view`). (`08-settings-audit.md`)
4. **6 of 11 views have zero client-side `can()` gating** (Fleet, Routes, Terminals, Revenue, Withdraw, Dashboard) — add/edit/delete/withdraw buttons are shown to view-only staff. (`06-action-gating-audit.md`)
5. **Suspend/activate is shown without any permission check** on the staff page; `canModify` (computed server-side) is never consumed by the UI. (`07-staff-management-audit.md`)
6. **Unguarded onboarding mutations**: `operator.saveOnboardingStep` (writes company + **bank account + Paystack recipient**), `operator.completeOnboarding`, `operator.resubmitVerification`, `operator.reopenOnboardingStep` have **no permission key** — only company membership. (`04-router-guard-audit.md`)
7. **`bookings:update` is used for destructive cancels** (`operator.cancelBooking`, `bulkCancelBookings`) and **schedule edits can cancel booked trips** without `trips:cancel`. (`04-router-guard-audit.md`)
8. **Overview mismatch**: the sidebar shows Overview to everyone, but `operator.getDashboardMetrics` requires `trips:read | bookings:read | company:view`, so a `reviews:read`-only staff gets a crash on the home page. (`05-page-route-audit.md`)
9. **`AccessDeniedCard` is dead code** — defined, never used. (`06-action-gating-audit.md`)
10. **Client/server role-model divergence**: platform `ADMIN` bypass exists server-side but is invisible client-side; OPERATIONS/FINANCE/SUPPORT role sheets fall back to leaking all 5 non-owner roles as assignable.

### Missing roles (high-level)
- There is **no role below SUPPORT** (e.g. no viewer-only "READ ONLY" or "INSPECTOR"/"AUDITOR" role), yet SUPPORT itself is the de-facto read+check-in role.
- There is **no explicit "DISPATCHER" / "CONDUCTOR"** separation — dispatch (trips:update) and boarding (bookings:update) are lumped into OPERATIONS and SUPPORT respectively.
- There is **no account/ledger "FINANCE-ADMIN"** separation — FINANCE has `revenue:view` + `withdrawals:view` but **not** `withdrawals:create`, so a finance officer can view revenue but never request the payouts they manage.
- There is no **read-only variant of each template** (no `:read`-only tier), which is why view-only staff see edit controls.
- There is no per-resource **"OWNER/ADMIN exclusive"** gating key for bank reveal, ownership transfer, or settings beyond role checks.
- Full analysis in [`03-role-template-analysis.md`](./03-role-template-analysis.md).

---

### Counts
- 31 permission keys, 8 groups (Routes, Terminals, Fleet, Schedules, Trips, Bookings, Financials, Staff, Company, Reviews — 10 groups in `PERMISSION_META`).
- 6 staff roles (`OWNER`, `ADMIN`, `MANAGER`, `OPERATIONS`, `FINANCE`, `SUPPORT`).
- ~135 tRPC procedures audited (of which ~60 operator-company-scoped).
- 19 operator routes/pages audited (11 data pages + settings tree + onboarding/welcome).
- 12 operator views audited (5 gated, 6 un-gated, 1 N/A).
