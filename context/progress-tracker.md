# Progress Tracker

**Update this file after every completed feature.** Any agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

| Field | Value |
|-------|--------|
| **Phase** | Polish & Hardening (Phase 6) |
| **Last major milestone** | Payment System, Novu Integration & BigInt Migration (2026-07-11) |
| **Web unit tests** | 47 passing (`pnpm test` in `apps/web`) |
| **Next priority** | Booking Ownership Hardening & Production Prep |

### What works end-to-end today

- **Passenger:** Search on `/` → book seats → per-seat passengers → **Paystack card/MoMo/Wallet** → digital ticket + public `/tickets/[token]` page → dashboard bookings/tickets/wallet → Redesigned Passenger Dashboard → Receives Novu Notifications
- **Operator:** Onboarding → fleet/routes/schedules → dispatch board → manifest (segment occupancy, check-in, QR scanner) → bookings list → Overview Dashboard → Redesigned Onboarding Flow → Receives Novu Notifications → Requests Withdrawals via Wallet
- **Auth:** Email/password, Google, OTP verify, password reset (passenger + operator)
- **Admin:** Verifies companies, manages treasury (Novu Alerts on failure), manual settlements

### Known gaps (not blocking dev/demo)

- Mobile app: shell only, no passenger search/booking

---

## Milestone Log (newest first)

### Passenger Dashboard Redesign (2026-07-13)

- [x] Overhauled the passenger dashboard layout to integrate a sticky glassmorphic header (`backdrop-blur-md bg-background/50 sticky top-0 z-50 border-b`) with `SidebarTrigger`, custom Command Search Dialog (`⌘K`), and integrated `NotificationInbox`.
- [x] Redesigned the `DashboardSidebar` component matching the exact structures, grouping labels, support cards, active path link indicators, and ellipsis footer menus of `best-dashboard-setup`.
- [x] Resolved button nesting hydration error (`<button> cannot contain a nested <button>`) and Radix prop warnings by switching to the `render` prop on `DropdownMenuTrigger` and `DropdownMenuItem`.
- [x] Fixed snap-open animation issues on all Base UI popups/dialogs by defining custom variants (`data-open`, `data-closed`), keyframes, and transition utilities inside the Tailwind v4 globals stylesheet.
- [x] Resolved Novu Inbox popover clipping by removing `overflow-hidden` from the layout header and adding `z-9999` classes.
- [x] Completely redesigned the main overview page (`DashboardView`) using a 2-column workspace layout.
- [x] Query accurate ledger account balance from the database using FinancialAccountService.
- [x] Built the `TravelStatsChart` Client Component rendering monthly trip activity as a responsive, styled area chart.
- [x] Built the `WalletQuickDeposit` Client Component supporting card/mobile money top-ups via Paystack and rendering a 3-row mini ledger.
- [x] Built the `SavedCompanions` Component rendering a list of saved passenger contacts.
- [x] Built the `DashboardQuickSearch` Client Component embedding an autocomplete route finder inside the welcome panel.
- [x] Built the `LiveBoardingPass` Client Component rendering gate QR check-ins and departure countdowns on travel days.
- [x] Adjusted the Upcoming Trips (`SessionsPanel`) search button background and neon glow shadow to match Moja's signature brand pink.
- [x] Restructured recent bookings into a timeline displaying terminals, dates, operator details, and QR ticket buttons.
- [x] Verified full type safety on the `web` workspace.

### Payment System, Novu Integration & BigInt Migration (2026-07-11)


- [x] Implemented comprehensive Novu notification workflows (13 triggers) for Passenger, Operator, and Admin flows.
- [x] Integrated `escape-html` globally across all notification payloads to prevent XSS injection.
- [x] Completed the digital Wallet system (Top-ups via Paystack, Checkouts, Withdrawals) with robust transaction client context to prevent partial state on failures.
- [x] Migrated all financial Prisma schema columns to `BigInt` (replacing `Int`) for precise XOF calculations.
- [x] Hardened the `AccountingEngine` by explicitly verifying `Number.isSafeInteger(amount)` on ledger entries.
- [x] Fortified Paystack API integration with network timeouts (`AbortSignal`) and intelligent failure state management (reserving funds as `PENDING` rather than permanently settling during network faults).
- [x] Completed a full, systematic workspace-wide code review and fixed 37 individual edge cases (UI, types, database bounds).

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

### Passenger Domain — COMPLETE

- [x] Saved passengers (`/dashboard/passengers`, max 20, self profile auto-seed)
- [x] Booking history (`/dashboard/bookings`)
- [x] Ticket wallet (`/dashboard/tickets`)
- [x] Phone-based ownership + lazy claim for guest bookings
- [x] Dashboard home stats (wired to real counts)
- [x] Profile / notification preferences
- [x] Digital wallet and top-ups

### Payment Domain — COMPLETE

- [x] `Payment` model + provider registry + `initiatePayment` / `assertHoldPaid`
- [x] Paystack primary provider integration (initialize, verify, webhook)
- [x] Refunds API mapping through Paystack
- [x] Checkout UI and payment state handling
- [x] BigInt DB migration and arithmetic safety
- [x] Wallet checkout, top-ups, and operator withdrawals

### Admin Domain — MOSTLY COMPLETE

- [x] Admin dashboard / verification queue
- [x] Company approve/reject workflow UI
- [x] Platform settings and commission configurations
- [x] User and settlement management
- [ ] Dispute resolution
- [x] Platform analytics

### Review Domain — COMPLETE

- [x] `Review` model is stub only (no rating/content fields in use)

### Notification Domain — COMPLETE

- [x] Integrated Novu `@novu/node` SDK for robust multi-channel orchestration.
- [x] Passenger notifications: Booking confirmed, payment failed, refund processed, trip canceled, trip delayed.
- [x] Operator notifications: Booking received, withdrawal requested, withdrawal processed, withdrawal failed.
- [x] Admin notifications: New company verification, treasury network failure, operator settlement pending.
- [x] HTML escaping on all dynamic payload attributes.
- [x] Resend email for auth OTP + staff invitations

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
**Updated by:** Antigravity agent (Payment System, Novu Integration & BigInt Migration)
