# Phase 05 — Refund Channel Truthfulness

> **Closes:** F-PS-02 (P1) · Evidence: `06-passenger-commerce-tickets.md` trace 3 + F-PS-02.
> `cancellation-policy.ts:3-7` (PAYSTACK→COMPLETED), `cancellation-service.ts:185-199` (`paystackRefundId: null`), `:302-359` (OFFLINE_REFUND_PAYABLE liability), `offline-refund-fulfilment.ts:17-21` (OWED queue filters CASH only), grep: zero refund API in `paystack-client.ts`.

## Decision (RATIFIED 2026-08-23)
**Option B executed — removal arm.** Product money model: money only enters via passengers and leaves via operator/platform payouts; refunds are (1) instant Moja-wallet credit or (2) manual operator settlement. Paystack auto-refunds contradict the model, so the PAYSTACK channel is no longer creatable (`isCreatableRefundChannel` guard in `cancellation-service.ts`; `canPassengerSelfCancelWithChannel` → WALLET only). No refund API, webhooks, or sweeper needed — statuses are fully synchronous. DB check: zero historical PAYSTACK refund rows, so no data-fix migration required.

Additional fixes shipped with this phase:
- ZERO_CASH settlements (fully promo-covered confirms) now cancel the booking WITHOUT minting a phantom refund obligation/ledger legs/notice.
- Web passenger cancel dialog: dead CASH toggle removed (API always rejected it) — wallet-only.
- Passenger refund notices now carry the true channel (was hardcoded PAYSTACK→"CASH").

## Tasks
- [x] Execute the ratified option (removal arm; guard + policy narrowing).
- [x] OWED queue review — stays CASH-only by design: PAYSTACK rows can no longer be created, WALLET is instant. Queue filter is now correct as-is.
- [x] Tests: channel matrix — WALLET instant credit COMPLETED; PAYSTACK rejected at policy + service layers; CASH PENDING_FULFILMENT queued; ZERO_CASH mints no obligation. (`phase00-cancel-refund.test.ts` 15/15; full web suite 378/378.)
- [x] Update traveler/web cancel dialogs if channel availability changes (web dialog wallet-only; traveler already WALLET-only, untouched pending Phase 18 quote rework).

## Acceptance criteria
~~No code path can produce a COMPLETED refund without real settlement; staging card refund visibly lands on the Paystack dashboard (Option A) or the channel is unreachable by passengers (Option B).~~ **Option B satisfied:** channel unreachable by passengers AND server-side (policy + service guard); WALLET refunds settle instantly and honestly.

## Verification
Staging probe pending: passenger cancel → wallet credited instantly with correct notice; `payments.cancelBooking` with `channel:"PAYSTACK"` → BAD_REQUEST; operator CASH cancel → row sits in admin offline-refunds queue until marked paid; refund-invariant watchdog silent.

## Dependencies
After Phase 04 (same payments cluster). Pairs with Phase 32 polish (timing-safe compare lives nearby).
