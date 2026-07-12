# Progress Tracker

**Update this file after every completed feature.** Any agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

| Field | Value |
|-------|--------|
| **Phase** | Paystack Unified Treasury & Operator Withdrawals — Complete |
| **Last major milestone** | Paystack Unified Treasury Migration & Operator Withdrawals (2026-07-10) |
| **Web unit tests** | 47 passing (`pnpm test` in `apps/web`) |
| **Next priority** | Booking Ownership Hardening |

### What works end-to-end today

- **Passenger:** Search on `/` → book seats → per-seat passengers → **Paystack card/MoMo** → digital ticket + public `/tickets/[token]` page → dashboard bookings/tickets → Redesigned Passenger Dashboard
- **Operator:** Onboarding → fleet/routes/schedules → dispatch board → manifest (segment occupancy, check-in, QR scanner) → bookings list → Overview Dashboard → Redesigned Onboarding Flow
- **Auth:** Email/password, Google, OTP verify, password reset (passenger + operator)

### Known gaps (not blocking dev/demo)

- Mobile app: shell only, no passenger search/booking

---

## Milestone Log (newest first)

### Novu Administrative & Verification Workflow Integration (2026-07-11)

- [x] Implemented 9 new admin lifecycle workflows: `admin-operator-signup-pending`, `admin-bank-account-pending`, `admin-payout-failed`, `operator-bank-verified`, `operator-bank-rejected`, `operator-account-suspended`, `operator-account-restored`, `operator-withdrawal-resolved`, and `user-role-updated`.
- [x] Wired verification and documents upload notification triggers into `completeOnboarding` and `resubmitVerification` mutations in `operator.ts` TRPC router.
- [x] Wired operator bank accounts validation triggers into `addBankAccount` (operator), `verifyBankAccount` (admin), and `rejectBankAccount` (admin) mutations.
- [x] Wired operator suspension & restoration alerts into `suspendCompany` and `activateCompany` mutations in `admin.ts`.
- [x] Wired manual payout status resolution alerts into `resolveWithdrawal` (notifying operator of Settlement/Failure, and admins of Payout Errors).
- [x] Wired platform user role privilege changes into `updateUserRole` security alert triggers.
- [x] Resolved resolveWithdrawal transaction entry account mapping and TS compile narrowing bugs.
- [x] Verified full compilation and Next.js production build succeeds with **0 errors**.

### Novu Passenger & Operator Operational Workflow Integration (2026-07-11)

- [x] Implemented 6 new operator dispatch board workflows: `passenger-trip-delayed`, `passenger-trip-cancelled`, `passenger-trip-boarding`, `passenger-trip-gate-updated`, `operator-bus-assigned`, and `passenger-review-request`.
- [x] Implemented 5 new passenger lifecycle workflows: `passenger-hold-created`, `passenger-wallet-low-balance`, `passenger-review-submitted`, `passenger-profile-updated`, and `passenger-ticket-shared`.
- [x] Created `shareTicket` protected mutation in `booking.ts` TRPC router to enable digital ticket URL sharing with friends/guests.
- [x] Wired passenger triggers into `createHold` (holds), `confirmFromWallet` (insufficient balance), `submitReview` (reviews), `updatePreferences` (profile updates), and `shareTicket` (sharing).
- [x] Wired operator triggers into `delay`, `cancel`, `updateStatus` (boarding/completed), and `setGate` mutations in the `trips.ts` TRPC router.
- [x] Resolved strictNullChecks and session object differences (`ctx.user.fullName` -> `ctx.user.name` and terminal `cityRelation` null checks).
- [x] Verified full compilation and Next.js production build succeeds with **0 errors**.

### Novu Payment & Verification Workflow Integration (2026-07-11)

- [x] Restructured `workflows/` directory into concern subfolders: `auth/`, `staff/`, `payments/`, and `admin/` to support enterprise organization standards.
- [x] Implemented 9 new workflows for financial and admin operations: `passenger-booking-confirmed`, `passenger-booking-refunded`, `passenger-wallet-topup`, `operator-withdrawal-requested`, `operator-withdrawal-settled`, `operator-withdrawal-failed`, `operator-verification-approved`, `operator-verification-rejected`, and `admin-treasury-network-failure`.
- [x] Wired triggers into `booking-receipt-email.ts` (booking confirmed), `cancellation-service.ts` (booking refunded), `payment-service.ts` (wallet top-up, payout settlement & failure webhooks), `operator.ts` (withdrawal requests, api network failure alerts), and `admin.ts` (operator verification approval and rejection).
- [x] Resolved typecheck issues by replacing `user.name` references with `user.fullName` matching the PostgreSQL Prisma schema.
- [x] Verified full compilation and Next.js production build bundles cleanly with **0 errors**.

### Novu Framework & Workflow Trigger Implementation (2026-07-10)

- [x] Installed Novu, React Email, and `zod-to-json-schema` dependencies in `apps/web`.
- [x] Implemented code-first Bridge Endpoint route handler at [`app/api/novu/route.ts`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/app/api/novu/route.ts).
- [x] Created five core authentication and invitation workflows: `auth-otp`, `operator-signup-otp`, `operator-staff-invite`, `staff-acceptance-alert`, and `operator-welcome`.
- [x] refactored Better Auth dispatch hook in [`lib/auth-email.ts`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/lib/auth-email.ts) to trigger unified `auth-otp` with DB phone number fallback.
- [x] Integrated workflow triggers in `operator` and `staff` TRPC routers with robust fallback routes.
- [x] Verified full production packaging build succeeds with **0 errors**.

### Centralized Ticket Scanner Upgrade (2026-07-10)

- [x] Upgraded shared [`ticket-scanner.tsx`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/operator/components/ticket-scanner.tsx) to support both **Camera Scan** (via `html5-qrcode`) and **Enter Manually** inputs using interactive tabs.
- [x] Replaced the mock animated check-in Dialog in [`operator-dashboard-view.tsx`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/operator/views/operator-dashboard-view.tsx) with the unified `<TicketScanner>` component.
- [x] Verified full type safety of the entire `web` workspace via `pnpm typecheck` with **0 errors**.

### Operator Dispatch Board Timezone Fix (2026-07-10)

- [x] Added `formatHeaderDate` inside [`operator-trips-view.tsx`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/operator/views/operator-trips-view.tsx) to parse `YYYY-MM-DD` grouping keys as local dates.
- [x] Fixed date discrepancy between day headers (which double-shifted) and trip cards (which single-shifted).
- [x] Verified full type safety of the entire `web` workspace via `pnpm typecheck` with **0 errors**.

### Passenger Bookings Completed Payment Selector Dialog (2026-07-10)

- [x] Refactored [`passenger-bookings-view.tsx`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/booking/views/passenger-bookings-view.tsx) to launch a complete payment modal instead of opening Paystack inline popups directly.
- [x] Enabled payment selector inside the modal, allowing passengers to check out holds from history using their Moja Wallet Balance (with waived convenience fees) or Card/Mobile Money.
- [x] Verified full type safety of the entire `web` workspace via `pnpm typecheck` with **0 errors**.

### Decommissioned Split Config UI Cleanups (2026-07-10)

- [x] Cleaned up verification dialog button labels and details inside [`admin-verification-view.tsx`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/admin/views/admin-verification-view.tsx) to use Paystack Transfer Recipient terminology.
- [x] Cleaned up welcome card description inside [`admin-dashboard-view.tsx`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/admin/views/admin-dashboard-view.tsx) to refer to "activating company accounts."
- [x] Verified full type safety of the entire `web` workspace via `pnpm typecheck` with **0 errors**.

### Booking Checkout Wallet Payment (2026-07-10)

- [x] Added `confirmFromWallet` method to [`booking-confirmation-service.ts`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/payments/services/booking-confirmation-service.ts) to execute double-entry ledger transactions for wallet bookings.
- [x] Added `checkoutWithWallet` mutation inside [`booking.ts`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/trpc/routers/booking.ts).
- [x] Refactored [`booking-checkout-form.tsx`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/booking/components/booking-checkout-form.tsx) to query wallet balance, support toggling payment method, apply zero convenience fees, and confirm bookings instantly.
- [x] Verified full type safety of the entire `web` workspace via `pnpm typecheck` with **0 errors**.

### Automated Payment Reconciliation Cron Job (2026-07-10)

- [x] Added `paystackVerifyTransfer` helper inside [`paystack-client.ts`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/payments/providers/paystack-client.ts).
- [x] Created `/api/cron/reconcile-payments` cron endpoint using `Promise.allSettled` to reconcile payouts and charges in parallel.
- [x] Registered the cron route in [`vercel.json`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/vercel.json) to trigger every 5 minutes.
- [x] Verified full type safety of the entire `web` workspace via `pnpm typecheck` with **0 errors**.

### Admin Payout Monitoring Queue (Withdrawals Queue) (2026-07-10)

- [x] Added `listAllWithdrawals` and `resolveWithdrawal` procedures to admin TRPC router.
- [x] Implemented double-entry manual resolution logic in `resolveWithdrawal` (force-completes or commits ledger reversal `PAYOUT_REVERSAL` to fail).
- [x] Created client-side [`admin-withdrawals-view.tsx`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/admin/views/admin-withdrawals-view.tsx) view with status filters, pending volume statistics, and resolution modals.
- [x] Created route wrapper page at [`apps/web/app/dashboard/admin/withdrawals/page.tsx`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/app/dashboard/admin/withdrawals/page.tsx).
- [x] Added Withdrawal Queue link to [`admin-sidebar.tsx`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/admin/components/admin-sidebar.tsx).
- [x] Verified full type safety of the entire `web` workspace via `pnpm typecheck` with **0 errors**.

### Admin Settlements & Ledger Auditor Redesign (2026-07-10)

- [x] Added `getTreasuryOverview` query procedure to payments TRPC router.
- [x] Updated `listLedgerEntries` query to support filtering by account class (`OPERATOR_RECEIVABLE`, `PAYSTACK_CLEARING`, `PLATFORM_FEES`).
- [x] Added live Platform Treasury Overview cards displaying clearing and revenue balances in [`admin-settlements-view.tsx`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/admin/views/admin-settlements-view.tsx).
- [x] Rebranded all manual record settlement controls to **Emergency Offline Settlement** with important warning notices.
- [x] Integrated an account class selector in the Ledger Auditor tab to filter transaction logs dynamically.
- [x] Verified full type safety of the entire `web` workspace via `pnpm typecheck` with **0 errors**.

### Operator Payout Settings & Payout History Table (2026-07-10)

- [x] Added `listWithdrawals` query procedure to operator TRPC router.
- [x] Implemented paginated `Withdrawal History Table` inside `/dashboard/operator/withdraw` (`operator-withdraw-view.tsx`) displaying date, status, gross payout, Paystack transfer fee, and net settled amount.
- [x] Added `Withdrawal Settlement Notice` card and updated split payout descriptions in [`operator-settings-view.tsx`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/operator/views/operator-settings-view.tsx).
- [x] Verified full type safety of the entire `web` workspace via `pnpm typecheck` with **0 errors**.

### Passenger Wallet Page Redesign & Backend Integration (2026-07-10)

- [x] Added `getWalletBalance`, `getWalletLedger`, and `initiateWalletTopUp` TRPC functions to passenger router.
- [x] Created client-side view component `PassengerWalletView` displaying live Available/Reserved balance cards, dynamic transaction histories, and a Paystack Top-Up dialog.
- [x] Implemented a verification banner that polls balance status in the background when a Paystack top-up is pending.
- [x] Verified full type safety of the entire `web` workspace via `pnpm typecheck` with **0 errors**.

### Paystack Unified Treasury Migration & Operator Withdrawals (2026-07-10)

- [x] Migrated database schema to remove split subaccounts in favor of a central Moja Treasury. Added `clearedAt` for escrow clearing and withdrawal limits to `PlatformSettings`.
- [x] Refactored `paystack-client.ts` and `payment-service.ts` to route all customer checkout and top-up funds directly to Moja's central Paystack account.
- [x] Configured automatic operator bank validation to register operators as Paystack Transfer Recipients instead of Subaccounts.
- [x] Implemented operator withdrawal TRPC endpoint (`operator.requestWithdrawal`) with double-entry ledger bookkeeping (DEBIT Operator Receivable Liability account, CREDIT System Clearing Asset account) via `AccountingEngine`. Integrated row-level `SELECT ... FOR UPDATE` locking to prevent race conditions/double-spending.
- [x] Created operator self-serve withdrawal view `/dashboard/operator/withdraw` featuring Available vs Escrow balance display and payout request form.
- [x] Implemented Paystack transfer webhook event handlers for `transfer.success`, `transfer.failed`, and `transfer.reversed` to automatically settle payouts or reverse them (restoring the operator's ledger balance via `AccountingEngine` double-entry reversing entries).
- [x] Renamed and cleaned up all remaining references of `paystackSubaccountCode` to `paystackTransferRecipientCode`.
- [x] Created UI/UX refactoring report at `docs/ui_refactoring.md`.
- [x] Verified full type safety of the entire `web` workspace via `pnpm typecheck` with **0 errors**.

### Financial Core — Phase 6 Monitoring (2026-07-10)

- [x] Created `SnapshotService` (`packages/db/src/services/SnapshotService.ts`) with `take()`, `takeDaily()`, `takeWeekly()`, `takeMonthly()`, `getLatest()`, and `getTimeSeries()` — all idempotent via upsert on `@@unique([accountId, period, snapshotDate])`.
- [x] Exported `SnapshotService` from `@moja/db`.
- [x] Created `/api/cron/snapshot-accounts` route — runs DAILY every day, WEEKLY on Mondays, MONTHLY on the 1st.
- [x] Registered cron in `vercel.json` at `0 0 * * *` (midnight UTC).
- [x] Added `operator.getSnapshotTimeSeries` tRPC procedure for balance history charts.
- [x] Added `operator.getAccountSnapshot` tRPC procedure for live + last-snapshot balance cards.
- [x] TypeScript type check: **0 errors**.

### Financial Core — Phase 5 Schema Cleanup (2026-07-10)

- [x] Removed `LedgerEntryType` enum from schema.
- [x] Removed `LedgerSourceType` enum from schema.
- [x] Removed `OperatorLedgerEntry` model from schema.
- [x] Removed back-relations from `Company`, `HoldGroup`, `ExternalPayment`.
- [x] Migration `20260710104709_drop_operator_ledger_entry` applied — `DROP TABLE operator_ledger_entry`, `DROP TYPE "LedgerEntryType"`, `DROP TYPE "LedgerSourceType"`.
- [x] Prisma Client regenerated — removed types no longer exist in generated code.
- [x] TypeScript type check: **0 errors**.

### Financial Core — Phase 4 Cutover (2026-07-10)

- [x] Switched `payments.listLedgerEntries` to read from `LedgerEntry` (new Financial Core) — returns data in existing shape for frontend compatibility.
- [x] Switched `payments.exportOperatorLedger` to use `FinancialAccountService.postedBalance` + `LedgerEntry` rows.
- [x] Switched `payments.recordSettlement` to write via `AccountingEngine` (SETTLEMENT transaction, double-entry) instead of `OperatorLedgerEntry.create`.
- [x] Removed `OperatorLedgerService` class (deleted `operator-ledger-service.ts`). Zero remaining references outside migration scripts.
- [x] `BookingConfirmationService` now idempotency-checks against `FinancialTransaction` instead of legacy `OperatorLedgerEntry`; also removed parallel legacy write.
- [x] `CancellationService` refund now writes exclusively via `AccountingEngine` (REFUND transaction).
- [x] `operator.ts` `getFinancialReport` recentLedger and refund queries fully use new Financial Core.
- [x] `AccountingEngine` extended with `metadata` support (stored in `FinancialTransaction.metadata`).
- [x] TypeScript type-check: **0 errors** after all changes.

### Passenger & Operator Onboarding Redesigns (2026-07-09)

- [x] Redesigned the passenger dashboard layout, tickets view, settings profile, and wired stats.
- [x] Overhauled the operator onboarding multi-step form flow, branding steps, and status verification checks.

### Operator Overview Dashboard Redesign & TS Error Resolutions (2026-07-09)

- [x] Overhauled the Operator root `/dashboard` Overview page with a premium, responsive layout.
- [x] Implemented and wired `getDashboardMetrics` tRPC query returning live operational statistics (Revenue, Bookings, occupancy rate, and active fleet counts).
- [x] Built the Today's departures Dispatch board and Live booking activity stream sections.
- [x] Created an interactive Ticket verification and Boarding check-in dialog modal with support for ticket tokens and booking reference fallback lookup.
- [x] Resolved all TypeScript compiler errors across the workspace, achieving 100% type safety on both `web` and `app` packages.

### Real Operator Revenue Analytics (2026-07-08)

- [x] Defined and implemented `getRevenueAnalytics` tRPC procedure aggregating real bookings and dynamic pricing snapshots.
- [x] Built the `RevenueKpiCards` showing Total Revenue, Total Bookings, Avg Booking Value, and Avg Occupancy.
- [x] Created `RevenueChart` to visualize aggregated XOF daily revenue using Recharts.
- [x] Implemented `RevenueLedgerTable` to list line-item bookings and `TopRoutesTable` to sort routes by booking volume.
- [x] Integrated `nuqs` for robust URL-based date range state management (`from` / `to`).
- [x] Added `error.tsx` in `(dashboard)` to elegantly trap missing operator/company initialization errors avoiding full-page SSR crashes.
- [x] Removed placeholder operator dashboard revenue components and replaced with real connected UI.

### Paystack Bank Routing & Refund System Integration (2026-07-07)

- [x] Refactored Settlement bank list logic in `paystack-client.ts` to dynamically fetch banks matching the active Paystack Merchant Secret Key's country (Ghana, Nigeria, Kenya) instead of hardcoding Côte d'Ivoire.
- [x] Built graceful fallback for account holder name resolution via Paystack's verify API; if resolution fails or returns Currency/Region error, it prompts the operator for a manual name entry instead of failing completely.
- [x] Refactored `CancellationService.cancelBooking` to secure authorization checks across Passenger, Operator, and Admin roles.
- [x] Fully integrated Paystack Refund API (`PaystackProvider.refund`) to execute refunds on original payment methods.
- [x] Enforced base ticket price refunding, keeping platform passenger convenience fees non-refundable.
- [x] Built automated local mock refunding logic to simulate successful transactions when checkout runs under MOCK provider.
- [x] Added visual Cancel Booking & Refund modal dialogs to both Passenger Ticket Detail view and Operator Booking Drawer.
- [x] Fixed React button-in-button render prop warning on operator bookings view.

### Landing Page UI & Search Autocomplete Fixes (2026-07-06)

- [x] Removed Deals link, updated Contact to point to `/contact`.
- [x] Redesigned Explore popover: 2-column list of 10 popular routes with clean typography and hover transitions, pre-populating with today's date parameter.
- [x] Enabled search bar autocomplete to submit typed name strings as query parameters directly.
- [x] Added server-side name-resiliency to resolve city name strings to CUIDs inside `locationsRouter.getCityDetails` and `searchRouter.search` (matching accents/symbols automatically).
- [x] Replaced the mock popular routes section with a premium value propositions grid (`HomeFeatures`) detailing Seat Selection, Mobile Money, SMS/QR boarding, and Verified Operators. Deleted the old routes file.
- [x] Redesigned operator list (`HomeOperatorsClient`) with a professional directory layout featuring asymmetrical card lines, gold ratings tags, premium initials placeholders, and slide-in hover arrow links.
- [x] Overhauled the "How it Works" section (`HomeHowItWorks`) into a responsive curve timeline: shows a horizontal layout with dashed connector lines on desktop, which collapses into a left-aligned vertical stepper with vertical connector lines on mobile. Features layered number badges (`01`-`05`) and animated circles that zoom their icons when hovered.
- [x] Overhauled Call to Action (`HomeCta`) to replicate the reference sweeping card structure on brand pink background, displaying app screenshots side-by-side inside clean borderless card frames.
- [x] Standardized homepage layout backgrounds (alternating `bg-white` and `bg-slate-50` with uniform `py-32` vertical paddings) and section headings (Montserrat `font-extrabold` and `fontSize: clamp(2rem, 4vw, 2.75rem)`).
- [x] Created `<PublicPageShell />` component and refactored all public sub-pages (`about`, `contact`, `help`, `operators`, `privacy`, `terms`) to use the new standardized hero shell.

### Paystack Payments + HoldGroup Aggregate (2026-07-05)

- [x] `HoldGroup`, `PricingSnapshot`, `Payment` 1:1, `PaymentAttempt`, `PaymentEvent`, `WebhookEvent`
- [x] `PlatformSettings` + `CommissionDistanceTier` (admin distance bands by `Route.distanceKm`)
- [x] `OperatorLedgerEntry` (append-only) + `Refund`; settlement export + manual payout API
- [x] Pricing: 5% commission + 2.5% convenience fee (admin-configurable, distance tiers)
- [x] `PaymentService` + Paystack Initialize/Verify/Webhook; `BookingConfirmationService` (idempotent)
- [x] Checkout: Paystack popup with redirect fallback; resume payment from dashboard pending tab
- [x] Email receipt on confirmation; cancellation (cash/voucher) with ledger debit
- [x] `Company.paystackSubaccountCode` for v2 per-operator split at Initialize
- [x] `pricing-resolver.test.ts`; validate-paystack-split.mjs manual test script
- [x] Paystack test-mode split + refund validation (run script before v2 go-live)
- [x] Admin UI for commission tiers + settlement

### Saved Passengers + Per-Seat Booking (2026-07-04)

- [x] `SavedPassenger` model + `Booking.holdGroupId` / `savedPassengerId` (Prisma)
- [x] `passenger` tRPC: `listSaved`, `createSaved`, `updateSaved`, `deleteSaved`, `ensureProfile`
- [x] `createHold` per-seat passengers; confirm/release/payment group by `holdGroupId`
- [x] `/dashboard/passengers` — saved contacts CRUD UI + sidebar link
- [x] Checkout: per-seat saved passenger picker, apply-to-all, guest manual entry
- [x] Booking list/cards show per-seat passenger names for multi-seat groups
- [x] `hold-group.test.ts` + legacy phone-grouping fallback for old bookings

### Trip Manifest Segments + Scanner + Flicker Fix (2026-07-04)

- [x] `trip-segments.ts` — consecutive segment builder, overlap occupancy, per-segment seat status
- [x] Manifest drawer: per-segment occupancy bars + `SegmentSeatGrid` (compact read-only)
- [x] Trip cards show live `_count.bookings` passengers (not stale `trip.bookedSeats`)
- [x] `trips.list` includes booking count for dispatch cards
- [x] Manifest `useQuery` for `trips.get` — no flicker refetch loop
- [x] `TicketScanner` — stable DOM id, layout-effect timing, disabled while loading
- [x] 8 unit tests for segment overlap logic

### Operator Booking Operations — Phase 3.5 (2026-07-03)

- [x] `OperatorBookingService` + `operator.listBookings`, `getBooking`, `checkInBooking`
- [x] Company-scoped check-in with optional `tripId` guard; idempotent re-check-in
- [x] Manifest drawer: check-in stats, manual check-in, QR scanner
- [x] `/dashboard/operator/bookings` — Today / Upcoming / Past + search
- [x] `trips.get` booking segment includes (origin/destination stops)
- [x] `parse-ticket-token` + operator booking service unit tests

### Passenger Dashboard + QR Ticket Fix (2026-07-03)

- [x] Phone-based booking access + lazy claim (`normalize-phone`, `booking-read-service`)
- [x] `userId` attached on `confirmBooking` when logged in
- [x] `/dashboard/bookings` and `/dashboard/tickets` wired (upcoming / pending / past)
- [x] `PassengerTripCard`, `passenger-bookings-view`, `passenger-tickets-view`
- [x] Public ticket page `/tickets/[token]` + browser redirect from verify API
- [x] QR payload points to `/tickets/{token}` (not verify JSON URL)

### Passenger Booking Phase 2 (2026-07-03)

- [x] `TripSummaryCard` on book page
- [x] Multi-seat selection via `?passengers=` (1–6) search → checkout
- [x] `listMyBookings`, `getBooking`, `getTicket`, `getTicketByToken`
- [x] `DigitalTicketCard`, ticket detail view, verify API route
- [x] Payment abstraction: `Payment` model, `initiatePayment`, method selector, mock provider

### Passenger Booking Flow — Web MVP (2026-07-03)

- [x] `booking` tRPC: `getTripDetails`, `getSeatAvailability`, `createHold`, `confirmBooking`, `releaseHold`
- [x] Segment-aware seat availability (shared overlap logic with search)
- [x] `PassengerSeatMap` (grid matches Prisma seat model)
- [x] `/book/[offerId]` + success page; `OfferCard` links from search
- [x] Mock payment confirm flow; `segment-overlap` unit tests

### Operator Beta Hardening (2026-07-03)

- [x] Wave 1: Honest verification/status UI, Abidjan trip generator tests, schedule fare UX
- [x] Wave 1: Onboarding auth guard, Suspense hydration, back-nav confirm
- [x] Wave 2: Bank AES-256-GCM encryption, masked API, `revealBankAccount`, `BankAccessLog`
- [x] Wave 3: Schedule exceptions API + UI, atomic route waypoints, activity logging
- [x] Wave 4: Fleet filter/KPI, sidebar triggers, parallel terminal prefetches, `z.any()` cleanup (partial)

### Audit Remediation (Production Blockers)

- [x] Create **Seat Layout Builder** (drag-and-drop grid interface for defining custom seating)
- [x] Update **Add Vehicle Modal** to consume both platform and custom layout templates
- [x] Setup "Layouts" tab in Fleet view for operators to manage their configurations submit + terms persistence
- [x] Sprint 4: Suspense boundaries + staff RBAC + delete/ownership guards
- [x] Sprint 5: Route edit UI + `isTerminal` bookable terminal filter

---

## Domain Status

### Foundation — COMPLETE

- [x] Monorepo (Turbo + pnpm), shared packages (`@moja/ui`, `@moja/db`, `@moja/schemas`, `@moja/types`, `@moja/config`, `@moja/theme`)
- [x] Better Auth: email/password, Google, OTP verify, password reset, sessions
- [x] Web app shell (Next.js 16 App Router), operator + passenger dashboard layouts
- [x] Mobile app shell (Expo Router) — auth shell only
- [x] Context documentation (`context/*`, `memory.md`, workspace rules)

### Platform Data Layer — COMPLETE

- [x] 35 CI cities seeded (`City` model, hubs, regions)
- [x] Bus types + seat layout templates (platform defaults)
- [x] `CompanyLocation` terminals (`isTerminal`, `cityId` FK)
- [x] tRPC: `routes.cities`, `fleet.busTypes`, `fleet.layouts`, `routes.terminals`

### Operations Backend — COMPLETE

- [x] Trip generator (14-day rolling, calendar + exceptions, `TripStop` / `TripSeat`)
- [x] `ServiceCalendar` + `ServiceException` (holidays, cancel, extra service)
- [x] Fare matrix (segment, seat class, XOF, fare types)
- [x] `trips` API: list, get, assignBus, delay, cancel, updateStatus

### Search Domain — MOSTLY COMPLETE (web)

- [x] `search.search` tRPC + `SearchService` + `TripSearchReadRepository`
- [x] Segment-aware offers, filters (operators, amenities, time, max price), sort, pagination
- [x] **Web UI on `/`:** hero, form, city autocomplete, filters sidebar, results, `OfferCard` → book
- [x] nuqs URL state for search params
- [ ] Mobile search UI

### Fleet Domain — COMPLETE (core)

- [x] Bus CRUD, seat layout templates, seat map editor
- [x] `operator-fleet-view` — list, add bus, seat preview
- [x] Fleet analytics

### Routes & Schedules — COMPLETE (core)

- [x] Route CRUD + waypoints + map preview
- [x] Schedule CRUD + calendar + fare matrix + exceptions UI
- [x] `operator-routes-view`, `operator-schedules-view`
- [x] Route analytics

### Operator Portal — MOSTLY COMPLETE

- [x] Single-page onboarding (`/dashboard/operator/onboarding`) with durable step state
- [x] Dashboard shell: fleet, routes, schedules, trips, terminals, staff, settings, bookings
- [x] Dispatch board (`operator-trips-view`) — manifest, segment occupancy, scanner
- [x] Staff management UI (`operator-staff-view`) — invite, roles, activity
- [x] Settings: company profile, documents, bank (encrypted), verification checklist
- [x] Terminals management (`operator-terminals-view`)
- [x] Revenue / analytics dashboard (KPIs, Charts, Ledger, Top Routes)
- [x] Admin verification queue UI
- [ ] Verification email notifications (beyond Resend staff invites)

### Booking Domain — MOSTLY COMPLETE (web)

- [x] Trip selection via search → `/book/[offerId]`
- [x] Seat selection UI (`PassengerSeatMap`, multi-seat 1–6)
- [x] Per-seat passenger details (saved passengers + manual guest)
- [x] Hold mechanism (10 min), double-booking prevention (transaction + overlap)
- [x] Seat status: AVAILABLE / HELD / SOLD / BLOCKED (segment-aware)
- [x] Booking confirmation + success page
- [x] Real payment integration via Paystack
- [x] Refunds

### Ticket System — COMPLETE (web)

- [x] Digital tickets with QR (`DigitalTicketCard`, `ticketToken`)
- [x] Public human-readable ticket `/tickets/[token]`
- [x] Operator check-in via QR scanner + manual button
- [x] Ticket verify API (JSON for scanners, HTML redirect for browsers)
- [ ] Offline ticket storage (mobile)

### Passenger Domain — PARTIAL

- [x] Saved passengers (`/dashboard/passengers`, max 20, self profile auto-seed)
- [x] Booking history (`/dashboard/bookings`)
- [x] Ticket wallet (`/dashboard/tickets`)
- [x] Phone-based ownership + lazy claim for guest bookings
- [x] Dashboard home stats (wired to real counts)
- [x] Profile / notification preferences
- [ ] Payment methods on file
- [ ] Digital wallet

### Payment Domain — MOSTLY COMPLETE

- [x] `Payment` model + provider registry + `initiatePayment` / `assertHoldPaid`
- [x] Paystack primary provider integration (initialize, verify, webhook)
- [x] Refunds API mapping through Paystack
- [x] Checkout UI and payment state handling

### Admin Domain — MOSTLY COMPLETE

- [x] Admin dashboard / verification queue
- [x] Company approve/reject workflow UI
- [x] Platform settings and commission configurations
- [x] User and settlement management
- [ ] Dispute resolution
- [x] Platform analytics

### Review Domain — COMPLETE

- [x] `Review` model is stub only (no rating/content fields in use)

### Notification Domain — MOSTLY COMPLETE (Core Infrastructure)

- [x] Restructured concern-based folder structure (auth, staff, payments, admin)
- [x] Auth & Staff workflows (unified OTP, business pre-verification, invite email, accept alerts, onboarding guides)
- [x] Payments & Withdrawals workflows (confirmed receipts, wallet topups, operator requests, settlements, failure alerts, admin treasury failures)
- [x] Operator verification status approval and rejection workflows
- [ ] Mobile app push notification gateway integration

### Mobile App — MINIMAL

- [x] Expo shell + auth flows
- [ ] Passenger search, booking, tickets
- [ ] Offline ticket access

---

## tRPC Router Inventory

| Router | Status | Notes |
|--------|--------|-------|
| `search` | Live | Trip discovery |
| `booking` | Live | Hold, pay, tickets, my bookings |
| `passenger` | Live | Saved passengers |
| `trips` | Live | Operator dispatch + manifest |
| `operator` | Live | Onboarding, company, verification, bookings |
| `fleet` | Live | Buses, layouts, types |
| `routes` | Live | Routes, cities, terminals |
| `schedules` | Live | Schedules, fares, exceptions |
| `staff` | Live | Team management |
| `terminals` | Live | Terminal CRUD |
| `locations` | Live | City details for search UI |
| `invitation` | Live | Staff invite accept flow |

---

## Decision Log (unchanged)

### Product
1. **Moja Ride** — CI intercity bus marketplace + operator ERP
2. Commission-based revenue; Mobile Money primary payment target
3. Apps: Passenger Web (live), Operator Portal (live), Mobile (shell), Admin (planned)
4. QR digital tickets with offline access goal on mobile

### Technical
1. Monorepo: Turbo + pnpm
2. Web: Next.js 16, tRPC, Prisma, PostgreSQL, Better Auth, Tailwind 4 + shadcn
3. Mobile: Expo SDK 56 + NativeWind
4. Segment occupancy derived from bookings — **not** `trip.bookedSeats`
5. Booking snapshots: `passengerName` / `passengerPhone` on each `Booking` row at hold time
6. Multi-seat holds grouped by `holdGroupId` (legacy: phone + trip + expiry)

### Deferred (v2+)
Agent app, driver app, multi-country, cargo, subscriptions, loyalty, public API

---

## Recommended Next Steps (priority order)

### 1. Booking ownership hardening
- Decide: keep silent phone lazy-claim vs explicit phone + OTP
- Document choice in `context/architecture.md`

### 2. Performance & hardening
- Redis cache for `search.search` (optional until traffic)
- E2E smoke test script for book → pay → ticket → operator check-in

### 3. Mobile passenger MVP
- Port search + booking flow to Expo (reuse tRPC client)
- Offline ticket storage

---

## Blockers & Risks

| Risk | Mitigation |
|------|------------|
| Payment gateway API complexity | Start with one provider; mock stays for dev |
| Seat race conditions | Already using DB transactions + overlap checks |
| Operator adoption | Admin verification + clear onboarding ROI |
| Stale progress docs | Update this file after each milestone |

---

## Success Criteria (MVP)

| Metric | Target | Current |
|--------|--------|---------|
| Operators onboarded | 5+ | Dev/staging only |
| Registered passengers | 100+ | Not tracked |
| Completed bookings | 100+ | Dev testing |
| Booking success rate | 90%+ | Not measured |
| Unit tests (web) | Green | 43 passing |

---

## How to Use This File

1. **Before starting work** — read Current Status + Recommended Next Steps
2. **After completing a feature** — add a dated milestone block at the top of Milestone Log
3. **Update domain checkboxes** when a whole area moves forward
4. **When blocked** — add to Blockers & Risks
5. **End of session** — run `/remember save` and sync this file

**Last updated:** 2026-07-11  
**Updated by:** Antigravity agent (Novu Payment & Verification Integration)
