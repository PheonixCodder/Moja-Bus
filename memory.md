# Memory — Moja Ride Operator + Passenger (Accumulative)

Last updated: 2026-07-04

---

## Session A — Operator Booking Ops + Passenger Dashboard Fix

### What was built

**Operator Booking Operations (Phase 3.5)**
- `apps/web/features/operator/services/operator-booking-service.ts` — `listBookings`, `getBooking`, `checkInBooking` with company scoping and optional `tripId` guard.
- `packages/schemas/src/operator-bookings.ts` — input schemas for operator booking procedures.
- `packages/types/src/booking.ts` — operator booking DTOs (`OperatorBookingListItem`, `OperatorBookingDetail`, `OperatorCheckInResult`, etc.).
- `apps/web/trpc/routers/operator.ts` — `listBookings`, `getBooking`, `checkInBooking` procedures.
- `apps/web/trpc/routers/trips.ts` — `trips.get` extended with booking origin/destination trip stops for manifest context.
- `apps/web/features/operator/views/operator-bookings-view.tsx` — operator bookings list with Today/Upcoming/Past filters and search.
- `apps/web/app/dashboard/(operator)/bookings/page.tsx` — operator bookings page + sidebar nav entry.
- `apps/web/features/operator/lib/parse-ticket-token.ts` — extracts token from plain cuid, `/tickets/{token}`, or `/api/tickets/verify?token=...`.
- Unit tests: `features/operator/lib/__tests__/parse-ticket-token.test.ts`, `features/operator/services/__tests__/operator-booking-service.test.ts`.

**Public digital ticket page (QR fix)**
- `apps/web/app/tickets/[token]/page.tsx` + `PublicTicketView` — human-readable boarding ticket page.
- `apps/web/features/booking/services/booking-read-service.ts` — `qrPayload` now points to `/tickets/{ticketToken}` (not verify API).
- `apps/web/app/api/tickets/verify/route.ts` — redirects browsers (`Accept: text/html`) to ticket page; returns JSON for API clients.

**Passenger dashboard fix + redesign**
- `apps/web/features/booking/lib/normalize-phone.ts` — `normalizePhone`, `phonesMatch` (digits + last-10 fallback).
- `apps/web/features/booking/services/booking-hold-service.ts` — `confirmBooking(holdId, userId?)` sets `userId` when logged in at payment.
- `apps/web/features/booking/services/booking-read-service.ts` — phone-based access + lazy claim for unlinked bookings.
- `apps/web/features/booking/components/passenger-trip-card.tsx`, `passenger-bookings-view.tsx`, `passenger-tickets-view.tsx`, `ticket-detail-view.tsx`.
- Passenger pages switched to `useQuery` (not `useSuspenseQuery`) for tab filters.

### Decisions (Session A)

- **Booking ownership**: Attach `userId` on `confirmBooking` when session exists; lazy-claim unlinked bookings when account phone matches `passengerPhone`.
- **Phone matching**: Strip non-digits; exact match or last-10-digit suffix match.
- **QR payload**: Always encode public ticket URL `/tickets/{ticketToken}` — never the verify API URL.
- **Operator scanner**: Scans QR, verifies ticket, records check-in (`checkedInAt`) via `checkInBooking`.
- **Navigation**: Use `Link` + `buttonVariants` instead of `Button render={<Link />}` patterns.

### Problems solved (Session A)

- Empty `/dashboard/bookings` and `/dashboard/tickets` — fixed with phone-based access + lazy claim + `userId` on confirm.
- QR code showed JSON — fixed with public ticket page and browser redirect on verify route.
- `parseTicketToken` bug on `/api/tickets/verify` — fixed.
- Tab switching errors on passenger views — switched to `useQuery`.
- Ticket detail hard 404 — prefetch best-effort; client handles not-found.

---

## Session B — Trip Manifest Segments + Scanner + Flicker Fix

### What was built

- `apps/web/features/booking/lib/trip-segments.ts` — consecutive segment builder, overlap helpers, per-segment occupancy/seat status (`buildConsecutiveSegments`, `countSegmentOccupancy`, `getSegmentSeatStatus`, etc.).
- `apps/web/features/booking/lib/__tests__/trip-segments.test.ts` — 8 unit tests for segment overlap logic.
- `apps/web/trpc/routers/trips.ts` — `trips.list` includes `_count.bookings` for active passengers (CONFIRMED + non-expired PENDING_PAYMENT).
- `apps/web/features/operator/views/operator-trips-view.tsx`:
  - Per-segment occupancy bars + `SegmentSeatGrid` in manifest (replaces single `0/24` bar + global seat map).
  - Trip cards show `{n} passengers` only (removed `SeatFillBar` with stale `bookedSeats`).
  - `ManifestDrawer` uses `useQuery` for `trips.get` — no flicker refetch loop.
  - Removed `onTripUpdate` prop and load-time list invalidation cycle.
- `apps/web/features/operator/components/ticket-scanner.tsx` — stable container id (`ticket-scanner-view`), `useLayoutEffect` + `requestAnimationFrame`, `onScan` via ref, `disabled` prop while trip loads.
- `apps/web/package.json` — test script includes `trip-segments.test.ts`.

### Decisions (Session B)

- **Do not maintain `trip.bookedSeats`**: Multi-stop routes need segment-aware occupancy; derive from bookings + `segmentsOverlap` (same as passenger booking/search). Column left untouched in DB.
- **Trip cards**: Show `{n} passengers` from `_count.bookings`; full segment breakdown only in manifest drawer.
- **Manifest segments**: One bar + seat map per consecutive stop pair (A→B, B→C); A→C ticket marks seat on all overlapping segments; held = non-expired `PENDING_PAYMENT`.
- **Manifest data loading**: `useQuery` for `trips.get`; invalidate list + get on mutations only; subtle header spinner on background refetch (not full-screen reload).

### Problems solved (Session B)

- **Scanner `HTML Element with id=... not found`**: `html5-qrcode` started before Radix Dialog mounted container; fixed with stable id and layout-effect timing.
- **Manifest flicker loop**: `onTripUpdate` in load effect → invalidate list → new callback → effect re-ran → spinner; replaced with `useQuery`.
- **0/24 seats on dispatch cards**: UI read stale `trip.bookedSeats` (never updated on booking); replaced with live `_count.bookings` and segment UI in manifest.

### Investigation notes (Session B — pre-implementation)

Root causes identified before fix:
1. Scanner: DOM timing + unstable `onScan` callback re-starting camera.
2. Flicker: unstable `handleTripUpdate` in `useEffect` deps causing refetch loop.
3. Occupancy: `createHold` / `confirmBooking` never update `trip.bookedSeats`; passenger search already uses dynamic `getSegmentOccupancy` instead.

---

## Reference — Scan ticket flow (documented this session)

**Scan ticket** in trip manifest = operator check-in via QR:
1. Camera decodes QR (public ticket URL or raw token).
2. `parseTicketToken` normalizes to `ticketToken`.
3. `operator.checkInBooking` validates: same company, same trip, status `CONFIRMED`.
4. Sets `checkedInAt` (idempotent if already checked in).
5. Same API as manual **Check in** button on passenger row.

---

## Reference — Seat map layouts (documented this session)

- **Fleet drawer** (`SeatMapPreview`) and **passenger booking** (`PassengerSeatMap`): **same layout** — column letters, row numbers, `2.5rem` cells, entrance door footer, shared grid structure via `seat-grid.ts` (passenger) or inline equivalent (fleet).
- **Trip manifest** (`SegmentSeatGrid` in `operator-trips-view.tsx`): **different** — compact `w-7 h-7` read-only grid per segment; not the full bus layout.

---

## Current state (combined)

**Working:**
- Operator manifest drawer: per-segment occupancy, check-in, QR scanner, passenger list.
- Operator bookings list at `/dashboard/operator/bookings`.
- Dispatch board: passenger count on trip cards; segment breakdown in manifest.
- Public ticket page at `/tickets/[token]`; passenger dashboard bookings/tickets with phone-based ownership.
- Ticket scanner opens reliably; manifest no longer flickers on load.
- **39 unit tests passing** in `apps/web` (`pnpm test`).

**Partial / not done:**
- `trip.bookedSeats` DB column still unused (intentionally not maintained).
- Dashboard home (`dashboard-view.tsx`) still shows hardcoded `"0"` stats.
- Per-seat passenger name/phone forms for multi-pax groups.
- Real payment provider still mock (CinetPay / Wave / Orange Money planned).
- Trip manifest seat map is segment-scoped compact grid, not unified with `PassengerSeatMap` / `SeatMapPreview` component (potential future refactor).

**Known pre-existing typecheck noise**: `bank-crypto.ts`, `trip-generator.ts`, `operator.ts`, `routes.ts`, etc.

---

## Next session starts with

1. **Smoke-test dispatch board**: multi-stop trip → open manifest → verify segment bars differ (e.g. A→B vs B→C); scan ticket QR; confirm check-in updates passenger list.
2. Confirm trip cards show correct passenger count after new bookings.
3. Smoke-test passenger dashboard: phone-matched account sees bookings/tickets; QR lands on `/tickets/{token}`.
4. Optional: wire dashboard home stats to `booking.listMyBookings`.
5. Optional: unify `SegmentSeatGrid` with shared `PassengerSeatMap` / `SeatMapPreview` if desired.
6. Longer term: real payment provider behind existing adapter registry.

---

## Open questions

- Deprecate or backfill `trip.bookedSeats` column?
- Should phone-claim be explicit (phone + OTP) instead of silent lazy claim?
- Per-seat passenger forms: one contact per seat or lead passenger + seat labels only?
- Dashboard home stats: upcoming only, or upcoming + pending payment?
- Unify trip manifest segment seat maps with canonical `PassengerSeatMap` layout?
