# 05 — Passenger Journey, Tracking & Reviews Audit

> Bookings → Tickets → Live Tracking → Reviews → Wallet/Refunds (web + traveler-app)

---

## Web Passenger Surfaces — **WIRED**

- `/dashboard/(passenger)/bookings` + `/tickets` render full views: list w/ hold countdown, Paystack + wallet checkout, promo refreeze, tickets grid → sheet with real QR (`react-qr-code` over `${APP_URL}/tickets/{token}` payload), print stylesheet, cancel/refund dialog gated on pre-departure time.
- Public shared-ticket pages resolve signed `pt.` tokens (HMAC, 1h TTL) or raw durable-token grace on both web and traveler.

## Traveler App — **WIRED**

- Bookings list with cache-seeding prefetch; detail with hold countdown and dual payment methods (PaystackWebView verification loop).
- Ticket sheet: identical QR semantics to web, token display, native OS share of the URL, cancel trigger.
- Auth-gated tabs via `useRequireAuth`; screen transitions animated.

## Booking Core (file map)

| Stage | Path | Notes |
|---|---|---|
| Hold | `booking.createHold` → `BookingHoldService` | outbox `passenger-hold-created` enqueued in-tx |
| Pay init/verify | `initiatePayment` / `verifyPayment` → `PaymentService` → `BookingConfirmationService` | idempotent hold claim ACTIVE→CONFIRMED; over-sale re-check |
| Webhook | `handleWebhookEvent` | HMAC verified at route entry; event dedupe by idempotency key |
| Wallet confirm | `checkoutWithWallet` → `confirmFromWallet` | `FOR UPDATE` wallet lock; ⚠️ plain insufficient-balance throw is silent (no low-balance notification on the common path) |
| Receipt | fire-and-forget → outbox → cron → Novu | `passenger-booking-confirmed` email+inApp |
| Boardable | ticket presentable iff CONFIRMED | scanner validates token server-side |

## Live Tracking Setup — **MISSING (simulation)**

**P1 — The flagship passenger feature is a mock.**
- "Track Live Bus" passes a **bookingId as `tripId`** into `traveler tracking/[tripId].tsx`, which ignores it except for a truncated label.
- The screen fakes telemetry positions, driver info, and ETA locally (`:22-72,137-154`).
- The **real pipeline** (driver WS ping → gateway rooms → Redis pub/sub → trip channel broadcast) has **no consumer client anywhere in the repo** — no traveler-side WS subscription exists.
- Even server-side, the WS gateway has no production deployment path (see [04](04-driver-trip-execution-telemetry.md)) and broadcasts currently have zero subscribers.
- Consequence: launch marketing must not promise live bus tracking until (a) WS hosting decision, (b) authenticated ingest, (c) a traveler consumer are built — or the button ships hidden behind a flag.

## Reviews Flow — **WIRED (traveler) / PARTIAL (web) / MISSING prompt**

- Multi-criteria submission (overall/driver/bus/punctuality + content) from the traveler review-sheet; one-per-booking enforced (`bookingId @unique`); Phase-13 semantics respected (only non-null driverRatings touch driver aggregates).
- Operator trip arrival (ARRIVED transition, `trips.ts:~1215`) triggers `passenger-review-request` (email+inApp+push).
- My-reviews listing with operator responses works on both surfaces.
- **Gaps**: web reviews offer no driverRating input (web cohort invisible in driver scores, P3); **no automatic post-trip review prompt on app launch** — only manual entry from a COMPLETED booking plus the push deep-link that currently depends on broken delivery (P2).

## Wallet, Refunds & Notifications

- Top-up confirmation notification reachable from both clients ✓.
- **Self-service cancellation sends nothing**: refund rows + wallet credits are written but no Novu/outbox call — the registered `passenger-booking-refunded` workflow has zero callers (P1). Operator-initiated trip cancellation *does* notify correctly.
- Refund amount shown on web always equals full fare while the service computes proportional seat-share minus non-refundable fee, possibly PENDING_FULFILMENT cash (P3 display bug).
- Low-balance alert fires only on a rare ledger-failure branch, not the common pre-check rejection (P2).

## Verified-Working Highlights

Hold→pay→confirm→ticket chain integrity · webhook signature + idempotency · over-sale defense · QR parity across surfaces · public ticket sharing with TTL tokens · one-review-per-booking invariant · referral/campaign/wallet-topup notification fan-out · dead-letter admin retry UI.
