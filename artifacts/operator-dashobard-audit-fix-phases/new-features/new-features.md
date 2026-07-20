# New Features & Enhancements

**Audit Source:** `artifacts/operator-dashboard-complete-engineering-audit.md` (Section 7)  
**Total Missing Features:** 15  
**Priority:** Post-GA (except where they overlap with P1/P2 fixes)

This document outlines the 15 missing features identified in the audit. For each feature, we detail the side effects of its absence across the application and the proposed implementation plan to address those effects.

---

## F1 — Stuck escrow / failed refund queue (Ops Workbench)

### What Is Missing
There is no UI for operators or platform admins to view and manage escrow funds that are stuck (e.g., trips marked `ARRIVED` without `actualArrival`), or refunds that failed during processing (e.g., due to insufficient operator balance).

### Side Effects Across the App
- **Operator Withdrawals:** Funds remain locked in `reservedBalance` indefinitely. Operators cannot access their earned revenue and have no visibility into *why* it is stuck.
- **Support Burden:** Operators must call support to manually untangle stuck escrow or failed passenger refunds.
- **Accounting:** Ledger balances drift from actual payable reality.

### How to Fix & Address Side Effects
1. **Backend:** Create a `trpc.operator.getStuckOperations` procedure that queries for:
   - Trips where `status === "ARRIVED" && actualArrival === null` (older than 24h).
   - `FinancialTransaction` entries of type `CANCEL_NO_REFUND` or failed withdrawals in `PENDING` state.
2. **UI:** Add an "Ops Workbench" or "Action Required" tab to the Revenue or Dashboard view.
3. **Actions:** Provide one-click resolutions (e.g., "Force Set Arrival Time", "Retry Refund").

---

## F2 — Export bookings, ledger, payouts (CSV)

### What Is Missing
No CSV/Excel export functionality for bookings, revenue ledger, or withdrawal history. (Also tracked as L6).

### Side Effects Across the App
- **Accounting:** Operators cannot easily import Moja Ride financial data into their ERPs or accounting software (e.g., QuickBooks).
- **Manual Work:** Operators resort to taking screenshots or manually typing data into spreadsheets, increasing error rates.

### How to Fix & Address Side Effects
1. **Backend:** Add `exportBookings`, `exportLedger`, and `exportWithdrawals` tRPC endpoints (or standard Next.js API routes that return `text/csv` streams for better memory handling on large datasets).
2. **UI:** Add "Export CSV" buttons to `operator-bookings-view.tsx`, `operator-revenue-view.tsx`, and `operator-withdraw-view.tsx`.
3. **Side Effect Fix:** Ensures operators have full data portability, reducing support tickets for custom reports.

---

## F3 — Date-range controls on trips

### What Is Missing
The `nuqs` parsers for `startDate` and `endDate` exist in `trip-search-params.ts`, but there are no date-picker controls in the `operator-trips-view.tsx` UI to set them.

### Side Effects Across the App
- **Navigation:** Operators cannot easily filter trips by date range; they must paginate sequentially to find future or past trips.
- **URL State:** The URL can accept date parameters, but users cannot generate these URLs from the UI, making shareability useless.

### How to Fix & Address Side Effects
1. **UI:** Add a standard `DatePickerWithRange` component to the toolbar in `operator-trips-view.tsx`.
2. **State:** Wire the date picker to the `startDate` and `endDate` `nuqs` hooks.
3. **Side Effect Fix:** Operators can instantly jump to specific operational days.

---

## F4 — Route filter on schedules

### What Is Missing
The `routeId` parser exists in `schedule-search-params.ts`, but there is no dropdown to filter schedules by route in `operator-schedules-view.tsx`. (Also tracked as H18).

### Side Effects Across the App
- **Usability:** Large operators with dozens of routes have to scroll through all schedules to find the ones for a specific corridor.
- **URL State:** Deep linking to a specific route's schedules doesn't work via the UI.

### How to Fix & Address Side Effects
1. **Backend:** Ensure `trpc.routes.list` is available and slim enough for a dropdown.
2. **UI:** Add a "Filter by Route" combobox to the schedules view toolbar.
3. **State:** Wire it to the `routeId` `nuqs` hook.

---

## F5 — Status filter chips on bookings UI

### What Is Missing
The `status` and `tripId` parsers exist for bookings, but there are no UI controls to use them. (Also tracked as M9).

### Side Effects Across the App
- **Usability:** Operators cannot quickly filter for only `CONFIRMED` or `CANCELLED` bookings.
- **Cross-linking:** Clicking "View Bookings" from a specific trip doesn't automatically filter the bookings view to that trip because the UI ignores the `tripId` param.

### How to Fix & Address Side Effects
1. **UI:** Add status filter chips (All, Confirmed, Cancelled, Pending) to `operator-bookings-view.tsx`.
2. **UI:** Add a clearable "Trip ID: [X]" badge if the `tripId` param is present.
3. **Side Effect Fix:** Solves workflow disconnects between the Trips and Bookings pages.

---

## F6 — Audit trail UI for bank reveal, withdrawals, trip cancels

### What Is Missing
The `ActivityLog` DB model exists and captures some of these events, but there is no UI for operators or admins to view this log.

### Side Effects Across the App
- **Security:** If an unauthorized staff member cancels a trip or reveals bank details, the company owner has no visibility into who did it.
- **Accountability:** Disputes between staff members cannot be resolved without platform admin intervention (running SQL queries).

### How to Fix & Address Side Effects
1. **Backend:** Create `trpc.operator.getActivityLogs` with filtering by actor, action type, and date. Fix the JSON stringification issue (M19).
2. **UI:** Add an "Audit Logs" tab to the Settings or Staff page, visible only to `OWNER` and `ADMIN` roles.

---

## F7 — Preferred bus health warning

### What Is Missing
When a schedule has no `preferredBusId` or the assigned bus becomes inactive, the schedule silently stops generating trips. (Also tracked as H13).

### Side Effects Across the App
- **Inventory Drought:** Trips are not created. The route disappears from search.
- **Revenue Loss:** Passengers cannot book, causing direct financial loss to the operator.

### How to Fix & Address Side Effects
1. **UI:** In `operator-schedules-view.tsx`, compute the health of the schedule. If `preferredBusId === null` or the bus is not `ACTIVE`, display a prominent red "⚠️ Configuration Error: No valid preferred bus" badge.
2. **Backend/Notifications:** Trigger a Novu alert to company admins when a schedule fails generation due to bus issues.

---

## F8 — Reconcile schedule button after route edits

### What Is Missing
If an operator edits a route (e.g., adds a waypoint), existing schedules and their future trips are not automatically reconciled to include the new waypoint.

### Side Effects Across the App
- **Data Inconsistency:** Future trips generated before the edit lack the new stop. Passengers cannot book from/to the new waypoint on those specific days.
- **Usability:** Operators must manually cancel and recreate trips or wait 14 days for the new generation window to pick up the changes.

### How to Fix & Address Side Effects
1. **Backend:** Expose a `trpc.schedules.reconcile` endpoint that calls the `reconcileFutureTrips` helper.
2. **UI:** After a route update, prompt the user: "Update existing future trips to match this new route?" and provide a button to trigger the reconciliation.
### Side Effects Across the App
- **How will the pricing for those specific segments change:** For each router when we create a schedule we price the segments in a trip but how will we manage the pricing of these segments now


---

## F10 — Occupancy heatmaps / no-show rates

### What Is Missing
Check-in functionality exists, but the resulting data (`boardedAt`) is never analyzed or displayed. (Relates to M5).

### Side Effects Across the App
- **Operational Blindness:** Operators cannot identify historically under-performing trips or high no-show routes.
- **Revenue Optimization:** Without load factor data, operators cannot optimize pricing or bus sizes.

### How to Fix & Address Side Effects
1. **Backend:** Ensure `boardedAt` is written (M5). Create analytics queries calculating `(boarded / capacity) * 100` per route/schedule.
2. **UI:** Add an "Occupancy" chart to the Revenue or Dashboard view, showing load factors over time.

---

## F11 — Dual-control large CASH refunds

### What Is Missing
Any staff member with `trips:cancel` or `bookings:update` can process massive CASH refunds instantly, with no secondary approval required.

### Side Effects Across the App
- **Fraud Risk:** A rogue staff member can cancel a full bus (simulating CASH refunds) and pocket the cash from the till, leaving the operator with the ledger liability.
- **Mistakes:** Accidental mass cancellations cannot be intercepted.

### How to Fix & Address Side Effects
1. **Backend:** Introduce a `PENDING_APPROVAL` status for refunds exceeding a configurable threshold (e.g., 50,000 XOF).
2. **UI:** Add an "Approvals" inbox for `OWNER` / `ADMIN` roles to review and authorize large offline refunds.

---

## F12 — Step-up auth for bank reveal / large withdrawals

### What Is Missing
Bank details can be revealed, and withdrawals requested, simply by having an active session with the right permissions. (Tracked as M17).

### Side Effects Across the App
- **Account Takeover Risk:** An unlocked, unattended computer allows a malicious actor to view bank details or request payouts.

### How to Fix & Address Side Effects
1. **Backend:** Identify how we are handling auth otp's in `apps\web\app\(auth)` and I think it's integrated with novu so write a new or use an existing novy workflow for email otps on sensitive `operator.ts` procedures.
2. **UI:** Implement a verification modal that intercepts these actions.

---

## F13 — Search: price lock / offer version after login resume

### What Is Missing
When a user searches, is redirected to login, and returns to complete the booking, the price is not revalidated against the current DB state. (Tracked as M28).

### Side Effects Across the App
- **Financial Loss:** If the operator raised the fare during the user's login flow, the user books at the stale, lower price.

### How to Fix & Address Side Effects
1. **Backend:** When fetching a booking offer by ID, re-run the pricing logic based on current DB fares.
2. **UI:** If the new price differs from the stored offer price, show a prominent "Price Updated" alert and require the user to explicitly accept the new price before initiating payment.

---

## F14 — Mark no-show / boardedAt workflow

### What Is Missing
Operators can scan tickets to check in, but there is no workflow to explicitly mark a passenger as a "No-Show" at departure time.

### Side Effects Across the App
- **Inventory:** If a passenger doesn't show up, their seat remains `CONFIRMED` in the system, preventing walk-up sales of that seat.
- **Analytics:** Cannot accurately track no-show rates.

### How to Fix & Address Side Effects
1. **Backend:** Add `trpc.operator.markNoShow` which updates the booking status to `NO_SHOW` (a new status, or a flag) and frees the seat for assignment.
2. **UI:** Add a "Mark No-Show" button in the manifest drawer for unboarded passengers once the trip status changes to `BOARDING` or `DELAYED`.

---

## F15 — Company verification status on withdraw

### What Is Missing
The withdrawal page does not prominently display if the company's KYC/verification or bank Paystack recipient setup is incomplete.

### Side Effects Across the App
- **UX Frustration:** Operators request withdrawals, and the transfers fail on the backend due to missing KYC, but the UI doesn't explain why.

### How to Fix & Address Side Effects
1. **Backend:** `trpc.operator.getBank` should return a comprehensive `canWithdraw` boolean with a `reason` (e.g., "Missing KYC", "Bank unverified").
2. **UI:** Disable the withdraw button and display a banner with the exact steps required to unlock payouts. (Overlaps with C8 / L14).
