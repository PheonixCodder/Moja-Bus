# Progress Tracker

**Update this file after every completed feature.** Any agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

| Field | Value |
|-------|--------|
| **Phase** | Passenger Booking + Operator Operations (late MVP) |
| **Last major milestone** | Saved passengers + per-seat booking checkout (2026-07-04) |
| **Web unit tests** | 43 passing (`pnpm test` in `apps/web`) |
| **Next priority** | Real payment provider → dashboard polish → admin verification |

### What works end-to-end today

- **Passenger:** Search on `/` → book seats → per-seat passengers → mock pay → digital ticket + public `/tickets/[token]` page → dashboard bookings/tickets
- **Operator:** Onboarding → fleet/routes/schedules → dispatch board → manifest (segment occupancy, check-in, QR scanner) → bookings list
- **Auth:** Email/password, Google, OTP verify, password reset (passenger + operator)

### Known gaps (not blocking dev/demo)

- Mock payment only (no live Mobile Money / card)
- Passenger dashboard home stats hardcoded `"0"`
- `/dashboard/search` is a placeholder shell (real search lives on `/`)
- Operator revenue analytics placeholder
- No admin verification queue UI
- Mobile app: shell only, no passenger search/booking
- `trip.bookedSeats` DB column unused (occupancy derived from bookings)
- Pre-existing TypeScript noise in some operator views / `bank-crypto.ts` / `trip-generator.ts`

---

## Milestone Log (newest first)

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

- [x] Sprint 1: Email provider (Resend) + staff invitation emails
- [x] Sprint 2: S3 presigned uploads + DocumentType enum fix in Settings
- [x] Sprint 3: `updateCompany` partial updates + verification submit + terms persistence
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
- [ ] Redis caching layer
- [ ] `/dashboard/search` — still placeholder (should link to `/` or embed search)
- [ ] Mobile search UI

### Fleet Domain — COMPLETE (core)

- [x] Bus CRUD, seat layout templates, seat map editor
- [x] `operator-fleet-view` — list, add bus, seat preview
- [ ] Bus image upload
- [ ] Fleet analytics

### Routes & Schedules — COMPLETE (core)

- [x] Route CRUD + waypoints + map preview
- [x] Schedule CRUD + calendar + fare matrix + exceptions UI
- [x] `operator-routes-view`, `operator-schedules-view`
- [ ] Route analytics

### Operator Portal — MOSTLY COMPLETE

- [x] Single-page onboarding (`/dashboard/operator/onboarding`) with durable step state
- [x] Dashboard shell: fleet, routes, schedules, trips, terminals, staff, settings, bookings
- [x] Dispatch board (`operator-trips-view`) — manifest, segment occupancy, scanner
- [x] Staff management UI (`operator-staff-view`) — invite, roles, activity
- [x] Settings: company profile, documents, bank (encrypted), verification checklist
- [x] Terminals management (`operator-terminals-view`)
- [ ] Admin verification queue UI
- [ ] Revenue / analytics dashboard (KPIs placeholder)
- [ ] Verification email notifications (beyond Resend staff invites)

### Booking Domain — MOSTLY COMPLETE (web)

- [x] Trip selection via search → `/book/[offerId]`
- [x] Seat selection UI (`PassengerSeatMap`, multi-seat 1–6)
- [x] Per-seat passenger details (saved passengers + manual guest)
- [x] Hold mechanism (10 min), double-booking prevention (transaction + overlap)
- [x] Seat status: AVAILABLE / HELD / SOLD / BLOCKED (segment-aware)
- [x] Booking confirmation + success page
- [x] Mock payment integration
- [ ] Real payment gateway (Mobile Money, card)
- [ ] Refunds

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
- [ ] Dashboard home stats (wired to real counts)
- [ ] Profile / notification preferences
- [ ] Payment methods on file
- [ ] Digital wallet

### Payment Domain — PARTIAL

- [x] `Payment` model + provider registry + `initiatePayment` / `assertHoldPaid`
- [x] Mock provider (beta checkout)
- [x] Payment method selector UI (MTN/Orange/Wave/Card shown as coming soon)
- [ ] CinetPay / Wave / Orange Money / MTN MoMo live integration
- [ ] Webhooks / payment verification
- [ ] Refund processing

### Admin Domain — NOT STARTED

- [ ] Admin dashboard / verification queue
- [ ] Company approve/reject workflow UI
- [ ] Platform analytics
- [ ] Dispute resolution

### Review Domain — NOT STARTED

- [ ] `Review` model is stub only (no rating/content fields in use)

### Notification Domain — NOT STARTED

- [ ] Push (mobile), SMS, in-app notification center
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

### 1. Real payment provider (highest product impact)
Wire **one** live gateway first (recommend **CinetPay** or **Wave** for CI Mobile Money):
- Provider adapter behind existing `PaymentService` registry
- Webhook route for async confirmation
- Replace mock-only path in checkout success criteria
- Keep mock provider for local dev

### 2. Passenger dashboard polish (quick wins)
- Wire `dashboard-view.tsx` stats from `booking.listMyBookings` (upcoming count, ticket count)
- Redirect `/dashboard/search` → `/` or embed `SearchPageClient`
- Call `passenger.ensureProfile` on passenger layout mount (faster checkout defaults)

### 3. Operator revenue & analytics
- Basic KPIs: bookings today, revenue XOF (sum `farePaid`), occupancy rate
- Replace placeholder operator dashboard stats

### 4. Admin verification queue
- List `PENDING_VERIFICATION` companies + document review
- Approve/reject with reason → operator status transitions
- Unblocks real operator go-live

### 5. Booking ownership hardening
- Decide: keep silent phone lazy-claim vs explicit phone + OTP
- Document choice in `context/architecture.md`

### 6. Performance & hardening
- Redis cache for `search.search` (optional until traffic)
- Fix pre-existing TypeScript errors (`bank-crypto`, `trip-generator`, operator mutation types)
- E2E smoke test script for book → pay → ticket → operator check-in

### 7. Mobile passenger MVP
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

**Last updated:** 2026-07-04  
**Updated by:** Cursor agent (full tracker rewrite + saved passengers milestone)
