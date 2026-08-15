# Phase 05 — Checkout Backend Integration

**Status:** Partial (hold/pricing/finalize wired; promo ledger posts on confirm)  
**Depends on:** Phase 01–02 (03/04 recommended so real campaigns exist)  
**Unlocks:** Web + mobile UX phases; money-correct holds

## Goal

Wire discounts into `getCheckoutPricing`, `createHold`, payment confirm, hold release — with snapshot freeze and ledger-ready amounts.

## API changes

### `payments.getCheckoutPricing` / `getHoldPricing`
Input add:
- `code?: string`
- `monetaryVoucherId?: string`
- `autoApply?: boolean` (default true)

Output add full breakdown fields from extended snapshot.

### `booking.createHold`
Same discount inputs; server re-evaluates (never trust client amounts). On success:
- Write `PricingSnapshot` with discount columns
- Write `DiscountRedemption` (PENDING/RESERVED)
- Soft-reserve voucher/credit; bump budget reservation

### Confirm paths
`confirmFromPayment` / `confirmFromWallet`:
- Finalize redemptions
- Ledger posts per `05`
- Support `chargeAmountXOF === 0`

### `releaseHold` / expire job
- Restore voucher/credit reserves
- Mark redemption CANCELLED
- Release budget

## Pricing resolver

Extend `buildPricingBreakdown` or add `buildDiscountedPricingBreakdown` used by hold service — **do not break** callers when discounts=0.

## Feature flag

If `DISCOUNTS_ENABLED=false`, ignore code inputs (or error clearly).

## Acceptance criteria

- [ ] Hold with valid code freezes discounted charge; Paystack gets discounted amount
- [ ] Invalid code → hold rejected or hold without discount per product choice — **locked: reject hold if code provided but invalid** (prevent surprises); preview already showed error
- [ ] Expired hold restores voucher remaining
- [ ] Concurrent two holds same one-time voucher: only one wins (row lock)
- [ ] Existing tests for non-discount checkout still pass

## Out

- UI for entering codes (Phases 06–07)
- Referral grants (Phase 10+)
