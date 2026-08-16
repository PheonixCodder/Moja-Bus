# Phase 03 — Hold & payment lifecycle

**Status:** Implemented (staging smoke Trace C / expire sweep / amount sync still ops)  
**Depends on:** Phase 00 (cancel safe); Phase 01 strongly preferred (credits funded)  
**Unlocks:** Correct pending-pay; no orphan reservations; reliable verify/reconcile  
**Findings:** P1-1, P1-2, P1-4, P1-7, P1-8, P1-10, P1-12, P1-16, P1-17, P1-18, P2-4, P2-19, P2-28, P2-29, P3-9

## Goal

Centralize hold terminal transitions so seats, hold groups, and **all incentive reservations** stay consistent; fix pending-pay self-reservation (Trace C); keep Paystack amounts in sync; harden callbacks and reconcile.

## Shipped (2026-08-16)

| Item | Location |
|------|----------|
| `expireOrReleaseHold` + `sweepExpiredHolds` | `features/payments/services/expire-or-release-hold.ts` |
| Cron `/api/cron/expire-holds` every 5m | `app/api/cron/expire-holds` + `vercel.json` |
| Reconcile every 10m + concurrency 5 + release via expire command | `reconcile-payments/route.ts` |
| `excludeHoldGroupId` on quote + pending PaymentTab | `quote-service`, `getCheckoutPricing`, `booking-details` |
| `refreezeHoldDiscounts` quotes with exclude-self | `quote-service.ts` |
| Checkout releases hold on hard confirm failure (keeps on Paystack cancel) | `booking-checkout-form.tsx` |
| Paystack re-init syncs `amountXOF` | `payment-service.ts` |
| Wallet confirm seat clash re-check | `booking-confirmation-service.ts` |
| Honest mobile-callback (no false “Payment Complete”) | `api/payments/mobile-callback` (D6: full verify+confirm still deferred for traveler booking) |
| `ExternalPayment.purpose` CHECKOUT \| TOP_UP | migration `20260816180000` + schema |
| WalletReservation decision | [15-wallet-reservation-decision.md](./15-wallet-reservation-decision.md) |
| `sweep-captures` scheduled | `vercel.json` every 6h |

## Scope

### In
- Idempotent `expireOrReleaseHold` command ✅
- Cron sweeper for expired holds ✅
- Wire reconcile failure + releaseHold through same command ✅
- `refreezeHoldDiscounts` / preview exclude current hold reservations (P1-17) ✅
- Client `releaseHold` on confirm failure (P1-18) ✅
- Sync `ExternalPayment.amountXOF` on re-init (P1-2) ✅
- Wallet confirm clash re-check (P1-16) ✅
- mobile-callback honest processing (P1-8) ✅ (verify+confirm deferred per D6)
- Reconcile schedule frequency + concurrency bound (P1-12) ✅
- Guest orphan: durable `RECONCILE_FAILED` PaymentEvent (P1-10) ✅
- `ExternalPayment.purpose` (P2-19) ✅
- PaymentAttempt close-out on expire (P2-28) ✅
- Top-up uses `purpose: TOP_UP` (P2-29 partial) ✅
- WalletReservation: document keep cron / no writers (P2-4) ✅
- Schedule `sweep-captures` (P3-9) ✅

### Out
- Occupancy algorithm (Phase 04)
- Full i18n (Phase 06)
- Paystack splits (non-goal)
- Traveler-app booking mobile verify+confirm (D6)

## Acceptance criteria

- [x] Soft-expired holds eventually release all incentive reservations without manual releaseHold
- [x] Trace C fixed in quote/refreeze/preview (exclude-self)
- [x] Paystack re-init updates amountXOF
- [x] Wallet confirm has clash re-check
- [x] mobile-callback does not lie about completion
- [x] Reconcile runs more than daily; hold expiry sweeper exists
- [x] ExternalPayment.purpose set for new rows
- [ ] Staging demos Trace C + amount sync + expire sweep

## Exit checklist

- [ ] Staging: Trace C + amount sync + expire sweep demos
- [x] Progress note updates for P1-17 / P1-1
