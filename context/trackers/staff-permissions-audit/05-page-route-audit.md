# 05 — Page & Route Audit (Guards, Sidebar, What a user sees)

Covers `apps/web/app/[locale]/dashboard/operator/**`, the `(dashboard)` layout, `proxy.ts` (middleware), the sidebar, and the failure UX.

---

## 1. Guard layers per request (recap)

1. **`proxy.ts`** — next-intl locale only. No auth, no roles.
2. **`(dashboard)/layout.tsx`** — `getServerSession()` → redirect if no session; redirect if `user.role ∉ {OPERATOR, ADMIN}`. **Admits every staff member** (all staff have `User.role === "OPERATOR"`). Prefetches ungated `getShellContext` + `getMyPermissions`.
3. **tRPC router `requirePermission`** — the real enforcement. A rejected server prefetch (RSC) or a client `useSuspenseQuery` throw propagates to `(dashboard)/error.tsx`.
4. **Client `can()`** — hides sidebar items & some action buttons only.

**There is NO explicit route-level permission guard anywhere.** No `redirect("/access-denied")`, no access-denied card, no empty state. Unauthorized access = raw error boundary.

---

## 2. The `(dashboard)/error.tsx` failure UX

When a staff member without the required permission opens any data page, the app shell (sidebar + header) still renders, then the content area is replaced by the error card: an alert icon, a title from the `operatorDashboard.error` i18n namespace, and **the raw TRPC message** (e.g. `Access denied: missing permission bookings:read`) plus a Retry button.

Implications:
- No data leaks (good), but the UX is a crash, not a friendly denial.
- The technical permission key is shown to end users.

---

## 3. Sidebar gating (`apps/web/features/operator/components/operator-sidebar.tsx`)

`NavSection` filters items: visible if no `permissions` or `item.permissions.some(key => can(key))`. `can` from `useStaffPermissions` (OWNER → true).

| Section | Item | Path | Permissions |
|---|---|---|---|
| Operations | Overview | `/dashboard/operator` | *(none — always visible)* |
| Operations | Dispatch Board | `/dashboard/operator/trips` | `trips:read` |
| Operations | Bookings | `/dashboard/operator/bookings` | `bookings:read` |
| Operations | Reviews | `/dashboard/operator/reviews` | `reviews:read` |
| Planning | Terminals | `/dashboard/operator/terminals` | `terminals:read` |
| Planning | Routes | `/dashboard/operator/routes` | `routes:read` |
| Planning | Schedules | `/dashboard/operator/schedules` | `schedules:read` |
| Fleet | Buses | `/dashboard/operator/fleet` | `fleet:read` |
| Financials | Revenue | `/dashboard/operator/revenue` | `revenue:view` |
| Financials | Withdrawals | `/dashboard/operator/withdraw` | `withdrawals:view` |
| Organization | Company | `/dashboard/operator/settings` | `company:view` |
| Organization | Staff | `/dashboard/operator/staff` | `staff:read` |
| Footer dropdown | **Settings** | `/dashboard/operator/settings` | **NOT GATED** ⚠️ |

Findings:
- **Sidebar gating is the only client-side route-visibility control, and it is bypassable by typing the URL.** The router still protects data, but the UX is the error boundary.
- **Footer "Settings" menu item is un-gated** — SUPPORT/OPERATIONS without `company:view` can click it and land on an error page.
- **Overview has no permission** but `getDashboardMetrics` requires `trips:read | bookings:read | company:view` → `reviews:read`-only or `fleet:read`-only staff crash on the home page.

---

## 4. Route-by-route table

> "Guard" column = what happens server-side. "Without permission →" = what the user experiences.

| # | Route | Page | Server guard | Client guard | Data query (perm) | Without permission → |
|---|---|---|---|---|---|---|
| 1 | `/dashboard/operator` | `(dashboard)/page.tsx` → `OperatorDashboardView` | Implicit via prefetch `getDashboardMetrics` (`trips:read\|\|bookings:read\|\|company:view`) | none | `getOnboardingStatus` (none) + `getDashboardMetrics` | **Error page** (FORBIDDEN from prefetch) |
| 2 | `/dashboard/operator/bookings` | `bookings/page.tsx` → `OperatorBookingsView` | Implicit via prefetch `listBookings` (`bookings:read`) | `can("bookings:update")` gates check-in/scanner only | `listBookings` (read), `exportBookingsCsv` (read) | **Error page** |
| 3 | `/dashboard/operator/trips` | `trips/page.tsx` → `OperatorTripsView` | Implicit via prefetch `trips.list` (`trips:read`) | `can("trips:update"/"trips:cancel"/"bookings:update"/"fleet:read")` gates buttons | `trips.list`, `statusCounts` (read) | **Error page** |
| 4 | `/dashboard/operator/fleet` | `fleet/page.tsx` → `OperatorFleetView` | **NO server prefetch** (deliberate) | **NONE** — no `useStaffPermissions` in view | `fleet.getBuses` etc. (read) fire client-side | **Error page** (client throw → error boundary) |
| 5 | `/dashboard/operator/routes` | `routes/page.tsx` → `OperatorRoutesView` | Implicit via prefetch `routes.list` (`routes:read`) **+ `terminals.list` (`terminals:read`)** | **NONE** | `routes.list` (read), `terminals.list` (read) | **Error page** — needs BOTH reads |
| 6 | `/dashboard/operator/schedules` | `schedules/page.tsx` → `OperatorSchedulesView` | Implicit via prefetch `schedules.list` (`schedules:read`) | `can("schedules:create"/"update"/"delete")` gates buttons | `schedules.list` (read) | **Error page** |
| 7 | `/dashboard/operator/terminals` | `terminals/page.tsx` → `OperatorTerminalsView` | Implicit via prefetch `terminals.list` (`terminals:read`) **+ `routes.getCities` (`routes:read`)** | **NONE** | `terminals.list` (read), `routes.getCities` (routes:read OR terminals:read) | **Error page** — needs terminals:read + routes:read |
| 8 | `/dashboard/operator/revenue` | `revenue/page.tsx` → `OperatorRevenueView` | Implicit via prefetch `getRevenueAnalytics` + `getAccountSnapshot` (`revenue:view`) | **NONE** | analytics/snapshot/ledger (view) | **Error page** |
| 9 | `/dashboard/operator/withdraw` | `withdraw/page.tsx` → `OperatorWithdrawView` | Implicit via prefetch `getAccountSnapshot` (`revenue:view`) + `listWithdrawals` (`withdrawals:view`); client also needs `getSettings` (`company:view`) | **NONE** | snapshot (revenue:view), listWithdrawals (withdrawals:view), getSettings (company:view), getWithdrawalControls (none), requestWithdrawal (withdrawals:create) | **Error page** — needs 3 keys to fully load |
| 10 | `/dashboard/operator/reviews` | `reviews/page.tsx` → `OperatorReviewsView` | Implicit via prefetch `listReviews` (`reviews:read`) | `can("reviews:respond")` gates respond box | `listReviews` (read), `respondToReview` (respond) | **Error page** |
| 11 | `/dashboard/operator/staff` | `staff/page.tsx` → `OperatorStaffView` | Implicit via prefetch `listStaff` + `listInvitations` + `getActivityLog` (`staff:read`) | `can("staff:invite"/"staff:update")` gates actions | staff queries (read) | **Error page** |
| 12 | `/dashboard/operator/settings` | `settings/page.tsx` | `redirect("/settings/company")` — no guard | — | — | Redirect |
| 13 | `/dashboard/operator/settings/company` | `company/page.tsx` → `CompanyProfileView` | Implicit via **settings layout** prefetch `getSettings` (`company:view`) | none (no `can()` anywhere in settings) | `getSettings` (view), `updateCompany` (update) | **Error page** |
| 14 | `/settings/personal` | `personal/page.tsx` → `PersonalProfileView` | Same layout gate (`company:view`) | none | `getSettings` (view), `updateProfile` (update) | **Error page** |
| 15 | `/settings/compliance` | `compliance/page.tsx` → `ComplianceView` | Same layout gate (`company:view`) | none | `getSettings`, `addDocument`/`deleteDocument` (update), `storage.presignUpload` (update), `storage.presignDownload` (membership) | **Error page** |
| 16 | `/settings/banking` | `banking/page.tsx` → `BankingView` | Layout gate (`company:view`) + own prefetch `listBankAccounts` (`company:view`) | none | `listBankAccounts` (view), `payments.listBanks` (public) | **Error page** |
| 17 | `/settings/notifications` | `notifications/page.tsx` → `NotificationPreferences` | Layout gate (`company:view`) — its own query is public | none | `public.getNotificationToken` (none) | **Error page** (layout still throws) |
| 18 | `/dashboard/operator/onboarding` | `onboarding/page.tsx` → `OperatorOnboardingView` | Role-only (OPERATOR/ADMIN) + `getOnboardingStatus` (none) | — | onboarding (none) | Renders for any operator |
| 19 | `/dashboard/operator/welcome` | `welcome/page.tsx` | Auth-only + `getOnboardingStatus` (none) | — | onboarding (none) | Renders for any operator |

---

## 5. Minimal permissions to render each page without an error

| Page | Required permission(s) |
|---|---|
| Overview | `trips:read` OR `bookings:read` OR `company:view` |
| Bookings | `bookings:read` |
| Trips | `trips:read` |
| Fleet | `fleet:read` |
| Routes | `routes:read` **AND** `terminals:read` |
| Schedules | `schedules:read` |
| Terminals | `terminals:read` **AND** `routes:read` |
| Revenue | `revenue:view` |
| Withdraw | `revenue:view` **AND** `withdrawals:view` **AND** `company:view` |
| Reviews | `reviews:read` |
| Staff | `staff:read` |
| Settings/* | `company:view` |
| Onboarding / Welcome | none (any OPERATOR/ADMIN role) |

> ⚠️ Routes/Terminals pages cross-require the other resource's read even though the sidebar gates them on their own read. Withdraw requires three keys though the sidebar shows one.

---

## 6. Page-level findings

| # | Finding | Severity |
|---|---|---|
| P1 | **No explicit route-level guard on any page**; unauthorized access = raw `error.tsx` crash, not an access-denied state | MEDIUM (UX) |
| P2 | **Routes/Terminals pages require the other resource's read** → sidebar-visible users still crash | MEDIUM |
| P3 | **Withdraw requires 3 permissions** (`revenue:view` + `withdrawals:view` + `company:view`) vs sidebar's `withdrawals:view` | MEDIUM |
| P4 | **Overview crashes for read-only roles** (`reviews:read`/`fleet:read` only) though sidebar always shows it | HIGH |
| P5 | Footer **"Settings" dropdown item is ungated** — second entry point into a `company:view`-gated tree | MEDIUM |
| P6 | Fleet page avoids prefetch for SUPPORT but the **client view still crashes** (no `can("fleet:read")`); its code comment is misleading | LOW |
| P7 | Settings tree uniformly gated by `company:view` via layout, including the public Notifications page | INFO |
| P8 | No `loading.tsx` in the operator tree (minor) | LOW |

Continue to [`06-action-gating-audit.md`](./06-action-gating-audit.md).
