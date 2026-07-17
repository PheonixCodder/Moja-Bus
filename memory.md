# Memory — Passenger Dashboard Redesign (Session 11 — Layout, Sidebar, & Base UI Conflict Fixes)

Last updated: 2026-07-13

## What was built

### Passenger Dashboard Redesign ✅
Rebuilt the passenger dashboard layout frame, sidebar navigation, and main overview landing page to match the exact design system, headers, charts, and component interfaces of the `best-dashboard-setup` reference:
- Overhauled `apps/web/app/dashboard/(passenger)/layout.tsx` to mount a sticky glassmorphic header (`h-12`, blur effects, borders) with an integrated `SidebarTrigger`, search dialog, and notification hubs. Removed the theme switcher (Sun icon) and resolved Novu Inbox clipping by stripping `overflow-hidden` from the header container.
- Overhauled `apps/web/features/dashboard/components/dashboard-sidebar.tsx` with unified header logos, proper grouping categories ("Dashboards" and "Account"), template-styled active links, support cards, and user dropdown account menus in the footer.
- Resolved the nested button hydration warning and Radix prop warnings by replacing `asChild` with `render` on `DropdownMenuTrigger` and `DropdownMenuItem`.
- Created a custom keyboard-bound `<SearchDialog />` component (`⌘K` / `Ctrl+K`) for quick dashboard navigation.
- Fixed snap-open animations on all Base UI popups/dialogs by defining custom variants (`data-open`, `data-closed`), theme keyframes (`enter`, `exit`), and transition utilities (`animate-in`, `fade-in-0`, `zoom-in-95`) in Tailwind CSS v4.
- Completely redesigned `apps/web/features/dashboard/views/dashboard-view.tsx` using a 2-column workspace layout containing:
  *   **Welcome Card**: Glassmorphism gradient panel with an integrated autocomplete **Quick Route Search Form** (`DashboardQuickSearch`) deep-linking straight to `/search`.
  *   **Live Boarding Pass Banner**: Renders at the top on travel days (departures within 24 hours) showing a check-in QR code, seat placement, and live departure countdown timer.
  *   **Premium Metric Cards**: Gradient-to-card backgrounds with active KPI statuses.
  *   **Timeline Recents List**: Vertical left-aligned nodes displaying routes, operators, transit times, and QR tickets.
  *   **Wallet Hub**: Card merging deposit inputs and ledger statement history showing the latest 3 transaction logs.
  *   **Saved Passengers**: Stored traveler contact list with initials, names, phone numbers, and label badges.
  *   **TravelStatsChart**: Custom Area Chart with pink linear gradients displaying monthly travel insights.
- Adjusted the "Search trips" neon green button styling and glows inside the Upcoming Trips panel (`SessionsPanel`) to match Moja's signature brand pink.
- Ensured 100% TS type safety with `pnpm --filter web typecheck`.


### Paystack Unified Treasury Migration & Operator Withdrawals ✅
A complete transition from automatic Paystack subaccount splits to a unified Moja Treasury model with self-serve operator withdrawals.

#### New Prisma Models & Fields (`packages/db/prisma/schema.prisma`)
- Added `paystackTransferRecipientCode` to `Company` and `BankAccount` models.
- Added `clearedAt` to `Booking` model to track when booking funds clear escrow.
- Added `minWithdrawalAmount` and `withdrawalFrequencyHours` to `PlatformSettings`.
- Dropped `paystackSubaccountCode` from the database.

#### Paystack Provider & Client Updates
- Refactored `paystack-client.ts` to implement `paystackCreateTransferRecipient`, `paystackInitiateTransfer`, and `paystackVerifyTransfer`.
- Removed subaccount splits from `paystack-provider.ts` and `payment-service.ts`.
- Switched operator verification flow in `admin.ts` to register bank accounts as Transfer Recipients instead of Subaccounts.

#### Operator Withdrawals Flow
- Created `operator.requestWithdrawal` TRPC endpoint which checks limits, verifies available balance, locks accounts (`SELECT ... FOR UPDATE`), creates ledger entries (`OPERATOR_PAYOUT`), and initiates Paystack transfers.
- Added `OperatorWithdrawView` and page `/dashboard/operator/withdraw` allowing operators to view available vs escrow (pending) balances, withdrawal history logs (with status codes and fees), and request bank transfers.
- Added "Withdrawals" tab to the operator sidebar under Financials.

#### Paystack Webhooks & Automated Reconciler
- Extended `PaymentService.handleWebhookEvent` to capture `transfer.success`, `transfer.failed`, and `transfer.reversed` Paystack events.
- Created `/api/cron/reconcile-payments` cron endpoint running every 5 minutes in `vercel.json`. It reconciles pending withdrawals and passenger wallet top-ups/bookings in parallel using `Promise.allSettled` to prevent timeouts.

#### Booking Checkout Wallet Payments & Bookings History Modal
- Added `confirmFromWallet` in `BookingConfirmationService` and `booking.checkoutWithWallet` TRPC mutation.
- Refactored `booking-checkout-form.tsx` to let passengers pay with internal wallet balances. Applies a zero convenience fee policy and confirms bookings instantly.
- Refactored `passenger-bookings-view.tsx` to open an interactive payment selector dialog, enabling travelers to resume holds in their history using their Moja Wallet Balance (with waived convenience fees) or Card/Mobile Money.
- Integrated `formatHeaderDate` inside `operator-trips-view.tsx` to prevent date discrepancy caused by double-timezone shifting on day headers.
- Upgraded the shared `TicketScanner` component to support both live camera scans and manual text entry, and embedded it on the Operator Dashboard page to replace the non-functional mock scanner.

## Architecture Decisions
- **Base UI Integration**: Standardized all dropdowns, inputs, dialogs, and select components to use `@base-ui/react` primitives. Render prop composition (`render={...}`) is used instead of Radix `asChild` to ensure compatibility.
- **Tailwind v4 Custom Variants**: Defined attributes like `data-open` and `data-closed` as custom theme variants in `globals.css` to allow animation styling in Base UI.
- **Single Treasury Model**: All checkouts and top-ups route to Moja's central Paystack balance. Operators are treated purely as transfer recipients, simplifying accounting and resolving split settlement failures.
- **Double-Entry Ledger Integrity**: Withdrawals, reversals, and wallet checkouts are structured ledger entries via `AccountingEngine` to ensure mathematical and financial alignment (Σ Debit == Σ Credit).
- **Concurrency Locks**: Available balance validation during withdrawals holds an explicit `FOR UPDATE` postgres lock to prevent race conditions (double-payouts).

## Current State
- Schema: Unified treasury migrations applied and verified in PostgreSQL. ✅
- Paystack Provider: Configured to support transfers, recipient generation, and transfer verification. ✅
- Operator Withdrawals: Self-serve withdrawal, balance checks, and withdrawal log history tables fully active. ✅
- Payout Webhooks & Cron Reconciler: Automated webhook processor and 5-min cron self-healer fully active. ✅
- Booking Checkout: Real-time wallet balance checks, toggle selection, and zero-fee checkout fully active. ✅
- Resumed Holds: Completed payment dialog modal on Bookings list page fully active. ✅
- UI Cleanups & Commission Oversight: Removed all stale subaccount and dynamic split config copy, and verified operator commission configurations for ledger tier compliance. ✅
- Novu Notification Integration & Sync: Framework setup, core workflows, and TRPC triggers fully synced to Novu Cloud. ✅
- Passenger Dashboard Layout Redesign: Redesigned sticky glassmorphic header, sidebar, support widgets, and profile dropdown footers. ✅
- Base UI Animation & Variant Fixes: Animations on all dialogs, popovers, and menus are fully operational. ✅
- TypeScript Compilation: achieves 100% type safety with **0 compile errors** on `web`. ✅

## Next Session Starts With
1. **Redesign Passenger Dashboard Page Content**: Refactor the internal content of the passenger overview page (`DashboardView` and `/dashboard/page.tsx`) to match the premium card metrics, performance charts, and booking grid tables of `best-dashboard-setup`.
2. **Booking Ownership Hardening:** Address anonymous passenger booking claim mechanisms (lazy-claim vs. explicit OTP verification).

***

## Session 12 — Architectural Overview & System Onboarding (2026-07-14) ✅
- Analyzed the codebase and documentation to draft a complete system guide mapping how passengers, operators, admins, payments, bookings, schedules, routes, and notifications behave in the app.
- Generated the comprehensive architecture guide artifact [moja_architecture_overview.md](file:///C:/Users/ubaid/.gemini/antigravity-cli/brain/a833c1fd-cda1-4a2a-8b8a-2555651645dc/moja_architecture_overview.md).
- Performed a disgustingly deep review of the Admin Verification/Queue flow.

## Session 13 — Admin Verifications Queue Page Redesign (2026-07-14) ✅
- Redesigned and refactored the Platform Admin Verifications Queue page (`/dashboard/admin/verifications`).
- Migrated singular folder `verification/` to plural `verifications/` directory.
- Created `adminListCompaniesSchema` validation schema in `packages/schemas` and `listCompaniesForVerification` tRPC API router procedure inside `apps/web/trpc/routers/admin.ts` with pagination, case-insensitive search, and status selection parameters.
- Reorganized components under `features/admin/components` and `views` enforcing the "single component per file" constraint:
  *   `verifications-table.tsx`: Renders the scrollable React Table.
  *   `verifications-columns.tsx`: Maps company details, representative contacts, KYC checklists, and status badges.
  *   `verifications-pagination.tsx`: Custom pagination page indices and limit dropdown.
  *   `verifications-approve-dialog.tsx`: Modals to map settlement bank details and confirm verification.
  *   `verifications-reject-dialog.tsx`: Modals to write rejection reasons.
  *   `admin-verifications-view.tsx`: Central view coordinator.
- Created `features/admin/lib/search-params.ts` to sync search inputs and filters to browser URL strings using `nuqs`.
- Created `features/admin/lib/schemas.ts` to validate client-side modal forms.
- Verified compilation builds successfully with 0 TypeScript compiler errors.

## Session 14 — Admin Verification Details Page (2026-07-14) ✅
- Implemented dynamic detail page `/dashboard/admin/verifications/[companyId]`.
- Created `adminGetCompanySchema` and `adminUpdateVerificationChecklistSchema` inside `@moja/schemas` and implemented `getCompanyForVerification` and `updateCompanyVerificationChecklist` procedures in `apps/web/trpc/routers/admin.ts`.
- Integrated `tab` URL parameter binding using `nuqs` to switch between overview details and historical timelines.
- Built reusable single-file components under `features/admin/components`:
  *   `verification-details-header.tsx`: Renders operator metadata profile card.
  *   `verification-details-documents.tsx`: Lists uploaded legal document certificates.
  *   `verification-details-banks.tsx`: Lists payout settlement bank details.
  *   `verification-details-checklist.tsx`: Connects checkboxes to checklist toggle mutations saving progress instantly.
  *   `verification-details-decision.tsx`: Action panel displaying reviewer logs, status badges, and approvals/rejections.
  *   `verification-details-timeline.tsx`: Renders audit history of admin actions.
  *   `admin-verification-details-view.tsx`: Core details view layout.
- Verified compilation passes successfully with **0 compiler errors**.

## Session 15 — Financial Ledger Page (2026-07-14) ✅
- Implemented the Double-Entry Ledger sheet dashboard under `/dashboard/admin/financials/ledger`.
- Added `adminListLedgerEntriesSchema` inside `@moja/schemas` and implemented `listLedgerEntries` query procedure in `apps/web/trpc/routers/admin.ts`.
- Resolved polymorphic account owner names (passengers or operator companies) in bulk within the tRPC query, and added global sum aggregations for Debit and Credit totals.
- Configured search param Cache `ledgerSearchParams` in `features/admin/lib/search-params.ts` to sync search fields (`q`, `side`, `type`, `page`, `pageSize`) via `nuqs`.
- Built modular single-file components under `features/admin/components`:
  *   `ledger-columns.tsx`: Configured table cell structures, styled Credit (green) and Debit (red) markers, and currency formatters.
  *   `ledger-table.tsx`: Renders the React Table body.
  *   `ledger-filters.tsx`: Search text bar and side/type selection drop downs.
  *   `ledger-kpi-cards.tsx`: Summary cards for Debit/Credit totals, record counts, and an integrity balanced check banner.
  *   `ledger-pagination.tsx`: Page selectors.
  *   `admin-ledger-view.tsx`: Core coordinating dashboard view.
- Added a "Financial Ledger" link to [admin-sidebar.tsx](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/admin/components/admin-sidebar.tsx#L122).
- Verified Next.js compilation succeeds with **0 compile errors**.
- Created reusable `DashboardHeader` component under `features/admin/components/dashboard-header.tsx` to standardize sidebar trigger buttons, vertical separator lines, and dynamic breadcrumbs with anchor routing across pages.
- Integrated `DashboardHeader` into the Ledger page, Verifications list page, and Operator Details page, and verified that typecheck compiles successfully with 0 errors.

## Session 16 — Settlement Audit Page Relocation (2026-07-14) ✅
- Relocated and redesigned the Platform Settlements page from `/dashboard/admin/settlements` to `/dashboard/admin/financials/settlements`.
- Mapped URL search state variables (`tab`, `class`, `company`, `page`) inside `features/admin/lib/search-params.ts` via `nuqs`.
- Refactored the monolithic view controller into reusable single-file components under `features/admin/components`:
  *   `settlements-kpi-cards.tsx`: Summary cards for clearing totals and platform revenue.
  *   `settlements-columns.tsx`: Configured column renderers for ledger entry auditing and operator payout actions.
  *   `settlements-table.tsx`: Renders the React Table body.
  *   `settlements-dialog.tsx`: Cash payout manual recording form.
  *   `admin-settlements-view.tsx`: Core settlements view orchestrator.
- Integrated the new reusable `<DashboardHeader />` breadcrumbs and sidebar trigger layout.
- Deleted the old monolithic route page `/dashboard/admin/settlements/page.tsx` and updated the sidebar link inside `admin-sidebar.tsx`.
- Verified Next.js compilation compiles successfully with **0 compile errors**.








