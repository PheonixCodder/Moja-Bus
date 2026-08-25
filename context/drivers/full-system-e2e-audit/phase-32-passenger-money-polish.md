# Phase 32 — Passenger Money Polish

> **Closes:** F-PS-13, F-PS-14, F-PS-15 · Evidence: `06-passenger-commerce-tickets.md`.
> **⚠️ F-PS-13 binding half CLOSED EARLY in Phase 04 (2026-08-23):** `verifyWalletTopUp` → `verifyTopUpForUser` with `userId` stamped in ExternalPayment metadata at both initiation sites (passenger.ts + wallet.ts); legacy unstamped rows fail closed on the user path. **Remaining for this phase: timing-safe webhook compare only** (the reference-binding task below is done).
> Webhook compare not timing-safe (`paystack-client.ts:148`) while pt./quote tokens do it right; `verifyWalletTopUp` unbound to caller (`passenger.ts:774-782`, `payment-service.ts:261-287`); hold-created/receipt/trip-cancelled notices enqueued post-commit best-effort (`booking.ts:120-148`, `booking-confirmation-service.ts:316-320`, `cancel-trip-with-refunds.ts:225-284`); raw durable bearer token printed under QR (`ticket-sheet.tsx:152-154`).

## Objective
Money-path cryptography matches the project's own best practice, notifications inherit the atomic pattern where feasible, and permanent credentials stop rendering on screen.

## Tasks
- [ ] `timingSafeEqual` for webhook signature compare.
- [ ] Bind top-up reference → userId at initiation; assert on verify.
- [ ] Move hold-created / receipt / trip-cancelled enqueue INSIDE their transactions (pattern proven by `enqueueBookingRefunded` at `cancellation-service.ts:208`).
- [ ] Traveler ticket sheet shows booking reference instead of raw token beneath the QR.

## Acceptance criteria
Signature compare constant-time; third parties cannot force-verify another user's top-up side effects; crash between business commit and notification impossible for these three events; token absent from sheet UI.
