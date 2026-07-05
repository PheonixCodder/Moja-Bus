# Memory — Moja Ride Saved Passengers + Per-Seat Booking

Last updated: 2026-07-04

## What was built

**Schema**
- `SavedPassenger` model under `PassengerProfile` in `packages/db/prisma/schema.prisma`
- `Booking.holdGroupId` (multi-seat checkout grouping) and `Booking.savedPassengerId` (optional FK)
- Prisma client generated; DB pushed

**API**
- `packages/schemas/src/passenger.ts` — saved passenger CRUD + seat passenger input schemas
- `packages/types/src/passenger.ts` — `SavedPassengerDTO`, list/ensure result types
- `apps/web/features/passenger/services/saved-passenger-service.ts` — CRUD, ensure profile + self seed, `resolveSeatPassenger`
- `apps/web/trpc/routers/passenger.ts` — `listSaved`, `createSaved`, `updateSaved`, `deleteSaved`, `ensureProfile`
- `apps/web/features/booking/lib/hold-group.ts` — `holdGroupWhere`, `bookingSummaryGroupKey` (legacy fallback)

**Booking refactor**
- `createHold` now takes `passengers: [{ seatId, savedPassengerId? | passenger? }]` (max 6)
- `BookingHoldService`, `PaymentService`, `BookingReadService` use `holdGroupId` with legacy phone fallback
- `PassengerBookingSeat` includes per-seat `passengerName` / `passengerPhone`

**UI**
- `/dashboard/passengers` — `SavedPassengersView` (add/edit/delete saved contacts)
- Sidebar nav: Passengers
- `booking-checkout-form.tsx` — per-seat passenger assignment, apply-to-all shortcut, guest manual entry

**Tests**
- `features/booking/lib/__tests__/hold-group.test.ts` — 4 new tests; 43 total passing in `apps/web`

## Decisions made

- Snapshot `passengerName` / `passengerPhone` on each `Booking` at hold time (never read live `SavedPassenger` on tickets)
- `holdGroupId` on every new hold; legacy bookings still group by `tripId + holdExpiresAt + passengerPhone`
- Self passenger auto-created from `User.fullName` + `User.phone` on first profile access; not deletable
- Max 20 saved passengers per account; cannot delete if referenced by past bookings

## Current state

**Working:** Saved passenger CRUD, per-seat checkout, hold confirm/release/payment grouping, booking list grouping by `holdGroupId`, passengers dashboard page.

**Partial:** Manual end-to-end smoke of 2-seat booking with different passengers not run in this session.

**Pre-existing:** Typecheck noise in operator views, `bank-crypto.ts`, `trip-generator.ts` (unchanged).

## Next session starts with

1. **Real payment provider** — pick CinetPay or Wave; wire adapter + webhook behind existing `PaymentService`
2. **Dashboard polish** — wire home stats, fix `/dashboard/search` placeholder
3. **Admin verification queue** — unblock real operator go-live
4. `context/progress-tracker.md` fully rewritten (2026-07-04) to match actual state

## Open questions

- Explicit phone+OTP claim vs silent lazy claim (unchanged)
- Deprecate `trip.bookedSeats` column (unchanged)
