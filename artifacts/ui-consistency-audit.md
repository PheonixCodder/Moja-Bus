# UI Consistency & Data Contract Audit — Moja Ride
**Audit Date:** 2026-07-17  
**Scope:** Enterprise-grade, pre-production launch review of all UI ↔ Database/Backend contracts  
**Methodology:** Cross-referenced every UI string enum, account class, field reference, and status filter against the Prisma schema, tRPC routers, and service layer.

---

## Executive Summary

| Severity | Count | Status |
|----------|-------|--------|
| 🔴 Critical | 2 | Confirmed — producing $0 revenue on admin dashboard |
| 🟠 High | 2 | Confirmed — phantom filter returns no data, double-debit risk |
| 🟡 Medium | 2 | Confirmed — stale UI copy misleads admins |
| 🟢 Minor | 1 | Confirmed — UX oddity (intentional tradeoff) |

---

## 🔴 CRITICAL FINDINGS

### C-1: `getDashboardStats` uses non-existent `PLATFORM_FEES` account class

- **Severity:** Critical — Admin KPI dashboard shows $0 revenue permanently
- **Files:**
  - `apps/web/trpc/routers/admin.ts` (lines 2324, 2333, 2413)
  - `apps/web/features/admin/components/dashboard/dashboard-kpi-cards.tsx`
  - `apps/web/features/admin/views/admin-dashboard-view.tsx`
- **Database model:** `FinancialAccount.accountClass` (free-text column)
- **Root cause:** `getDashboardStats` queries Prisma using:
  ```ts
  account: { accountClass: "PLATFORM_FEES" }
  ```
  This performs a direct DB column match on `financial_account.accountClass`. However, the `FinancialAccountService` provisions platform revenue accounts with `accountClass: "COMMISSION_REVENUE"` and `"CONVENIENCE_FEE_REVENUE"`. The string `"PLATFORM_FEES"` is a **virtual alias** that only works in `payments.ts` (which has a special `if/else` branch that resolves it to the real account IDs). The admin stats query has no such branch — it passes the alias directly into Prisma, which returns 0 rows.
- **Impact:** 
  - `commission` = always 0 XOF on admin dashboard
  - `gmv` = only counts operator receivable credits, missing platform fees entirely
  - Revenue Trend chart = always flat zero for the platform revenue line
- **Fix:** Replace the three Prisma calls in `getDashboardStats` that use `accountClass: "PLATFORM_FEES"` with an `accountId: { in: [...] }` filter, pre-fetching the actual account IDs from `FinancialAccountService`:
  ```ts
  const [platformCommAcct, platformFeeAcct] = await Promise.all([
    accountService.getPlatformCommissionRevenueAccount(),
    accountService.getPlatformConvenienceFeeRevenueAccount(),
  ]);
  const platformAccountIds = [platformCommAcct.id, platformFeeAcct.id];
  // Then use:
  accountId: { in: platformAccountIds }
  ```

---

### C-2: `COMPLETED` is not a valid `TripStatus` but UI exposes it as a filter

- **Severity:** Critical — Trip filter option silently returns no results, confusing operators
- **Files:**
  - `apps/web/features/operator/views/operator-trips-view.tsx` (lines 1187, STATUS_FILTERS array)
  - `apps/web/features/admin/components/dispatch-trip-list.tsx` (lines 67–71, STATUS_CONFIG map)
  - `apps/web/features/admin/components/trip-audit-timeline.tsx` (lines 15, 66, STATUS_ORDER array)
- **Database model:**
  ```prisma
  enum TripStatus {
    SCHEDULED
    BOARDING
    DEPARTED
    ARRIVED    // ← "Arrived" is the terminal success state
    CANCELLED
    DELAYED
  }
  ```
  `COMPLETED` does **not exist** in `TripStatus`.
- **Root cause:** The UI was built assuming a `COMPLETED` state would be added to the trip lifecycle (e.g. after funds are released). This was never added to the schema. The operator trips view includes `{ value: "COMPLETED", label: "Completed" }` as a filter — selecting it runs `t.status === "COMPLETED"` which will never match any DB record.
- **Impact:**
  - Operator "Completed" trip filter always returns empty list
  - Admin `dispatch-trip-list.tsx` has a `STATUS_CONFIG["COMPLETED"]` entry that can never be reached
  - `trip-audit-timeline.tsx` includes `"COMPLETED"` in its STATUS_ORDER array and renders a "Completed" step that can never be "done" because the trip never reaches that status
- **Fix:** Either:
  - **(Recommended)** Rename `COMPLETED` filter to `ARRIVED` in the UI to match the actual terminal status
  - Or add `COMPLETED` to the `TripStatus` enum in schema and implement the transition logic

---

## 🟠 HIGH FINDINGS

### H-1: `activeTripsCount` on Admin Dashboard excludes `DELAYED` trips

- **Severity:** High — Operations monitoring undercounts active trips
- **File:** `apps/web/trpc/routers/admin.ts` (line 2390)
- **Current query:**
  ```ts
  ctx.prisma.trip.count({ where: { status: { in: ["BOARDING", "DEPARTED"] } } })
  ```
- **Issue:** `DELAYED` is a valid `TripStatus` for trips that are active/on the network but experiencing a delay. The admin dashboard "Active Trips" KPI card does not count delayed trips, causing the number to undercount actual operational activity.
- **Fix:** Update to:
  ```ts
  ctx.prisma.trip.count({ where: { status: { in: ["BOARDING", "DEPARTED", "DELAYED"] } } })
  ```

---

### H-2: `release-escrow` cron triggers on `departureDate < now` instead of `ARRIVED` status

- **Severity:** High — Funds may be released too early
- **File:** `apps/web/app/api/cron/release-escrow/route.ts` (lines 19–25)
- **Current logic:**
  ```ts
  trip: { departureDate: { lt: now } }
  ```
- **Issue:** The cron releases operator funds 24 hours after the scheduled departure date, regardless of whether the trip has actually arrived (`ARRIVED` status). A trip with a scheduled departure of 08:00 AM will have its funds eligible for release at 08:00 AM the next day, even if it was cancelled, never departed, or is still `DEPARTED` (in transit). This bypasses the semantic meaning of "escrow cleared after trip is completed."
- **Intended behavior:** Per the UI copy in `operator-withdraw-view.tsx` line 126: _"Clears 24 hours after trip completion."_ Trip "completion" semantically corresponds to `ARRIVED` status + 24h, not departure date + 24h.
- **Fix:** Add a filter for `trip.status === "ARRIVED"` or use `trip.actualArrival < 24h ago` as the trigger condition:
  ```ts
  trip: { 
    status: "ARRIVED",
    actualArrival: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) }
  }
  ```
  > **Note:** This also prevents releasing funds for `CANCELLED` trips where booking cancellations may not have been processed.

---

## 🟡 MEDIUM FINDINGS

### M-1: Admin Verification UI references "Paystack Subaccount" (obsolete architecture)

- **Severity:** Medium — Misleads admins about the current payment architecture
- **Files:**
  - `apps/web/app/dashboard/admin/verifications/page.tsx` (lines 11, 56)
  - `apps/web/features/admin/components/verification-details-decision.tsx` (lines 50, 63)
- **Stale copy:**
  - `"Approve to provision a dynamic Paystack split subaccount."`
  - `"Approvals require a default bank account mappings to generate Paystack subaccount IDs."`
- **Current architecture:** Per `docs/new_payment_system.md`, Moja Ride migrated from Paystack Split Subaccounts to a **central treasury** model. Operators are now registered as **Paystack Transfer Recipients** (for payouts), not Subaccounts. The approval flow now provisions a Moja internal ledger account, not a Paystack split.
- **Fix:** Update copy to:
  - `"Approve to activate the operator's internal ledger account and register them as a Paystack Transfer Recipient."`
  - Remove the "generate Paystack subaccount IDs" sentence entirely.

---

### M-2: "In Escrow" UI label misleads when escrow system is working correctly

- **Severity:** Medium — Correct behavior, but unclear UX communication
- **Files:**
  - `apps/web/features/operator/views/operator-withdraw-view.tsx` (line 115: `"In Escrow (Pending)"`, line 126: `"Clears 24 hours after trip completion"`)
  - `apps/web/features/passenger/components/balance-allocation.tsx` (line 51: `"Reserved / Escrow"`)
- **Current behavior:** The escrow system IS correctly implemented:
  - At booking confirmation, `AccountingEngine` credits the operator account with `reserveOnCredit: true`, which puts funds into `reservedBalance` (not `availableBalance`)
  - The `release-escrow` cron decrements `reservedBalance` and increments `availableBalance` after departure
  - The UI computes `escrowBalance = postedBalance - availableBalance` which is correct
- **Issue:** For **new operators with 0 bookings**, `escrowBalance = 0 - 0 = 0`, and the "In Escrow" card shows 0 XOF. New operators seeing this may think the feature is broken.
- **Secondary issue:** `BalanceAllocation` in the passenger wallet always shows `reservedBalance` from `getWalletBalance`. Passenger wallets do NOT use the `reserveOnCredit` mechanism (only operator accounts do). The `reservedBalance` on passenger wallets is always 0, making the "Reserved / Escrow" section permanently empty and misleading.
- **Fix:** 
  - For operator withdrawal view: The escrow logic is correct, only minor copy improvement needed.
  - For passenger `BalanceAllocation`: Hide the "Reserved / Escrow" row entirely since `reservedBalance` is permanently 0 for passenger wallets.

---

## 🟢 MINOR FINDINGS

### MI-1: `DELAYED` trips excluded from Admin "Active Trips" count — intentional or oversight?

- **Severity:** Minor / Design question (tracked under H-1 above)
- The Admin Platform Health widget shows "Active Trips" = `BOARDING | DEPARTED` only. Whether `DELAYED` should be included depends on operational definition. Recommend clarifying with product.

---

## Confirmed-OK Areas (No Issues Found)

| Area | Status | Notes |
|------|--------|-------|
| `BusinessType` enum | ✅ OK | All 6 values match schema |
| `StaffRole` enum | ✅ OK | All 6 values match schema |
| `BookingStatus` enum | ✅ OK | `PENDING_PAYMENT`, `CONFIRMED`, `CANCELLED`, `EXPIRED`, `COMPLETED` all match schema |
| `CompanyStatus` enum | ✅ OK | `DRAFT`, `PENDING_VERIFICATION`, `VERIFIED`, `ACTIVE`, `SUSPENDED`, `REJECTED` all used correctly |
| `OnboardingStatus` | ✅ OK | `NOT_STARTED`, `IN_PROGRESS`, `COMPLETED` used correctly (different from TripStatus) |
| `BankAccount.isVerified` | ✅ OK | Field exists in schema, used correctly |
| `Operator.isVerified` | ✅ OK | Field exists in schema, used correctly |
| `PlatformSettings` bps conversion | ✅ OK | UI correctly divides by 100 to display as %, multiplies by 100 to submit |
| `farePaid` field | ✅ OK | `Int` in schema, used as number in UI without BigInt issues |
| `OperatorStatus` enum | ✅ OK | `ACTIVE`, `INACTIVE`, `SUSPENDED` used correctly |
| `escrowBalance` calculation | ✅ OK | `postedBalance - availableBalance` is correct after verifying `AccountingEngine` |
| Payment confirmation double-entry | ✅ OK | `reserveOnCredit: true` correctly routes operator credits to `reservedBalance` |
| Convenience fee waiver for wallet | ✅ OK | Frontend and backend both skip convenience fee on wallet checkouts |
| Commission bps → admin settings | ✅ OK | `defaultCommissionBps / 100` → display, `× 100` → submit |
| `PLATFORM_FEES` in ledger viewer | ✅ OK | `payments.ts` has special branch that resolves virtual alias to real account IDs |

---

## Remediation Priority Matrix

| ID | Issue | Effort | Priority |
|----|-------|--------|----------|
| C-1 | Fix `getDashboardStats` to use real account IDs | Low (3 queries) | P0 — Fix immediately |
| C-2 | Rename `COMPLETED` filter to `ARRIVED` in UI | Low (4 files) | P0 — Silent data bug |
| H-1 | Add `DELAYED` to `activeTripsCount` filter | Trivial (1 line) | P1 |
| H-2 | Fix escrow release cron to use `ARRIVED` status | Medium | P1 — Financial risk |
| M-1 | Update "Subaccount" copy to "Transfer Recipient" | Trivial (3 strings) | P2 |
| M-2 | Hide passenger `BalanceAllocation` reserved row | Low | P2 |
