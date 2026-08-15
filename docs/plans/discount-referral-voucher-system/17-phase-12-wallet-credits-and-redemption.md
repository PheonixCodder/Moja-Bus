# Phase 12 — Wallet Credits & Redemption at Checkout

**Status:** Partial (credit lots applied at checkout; spend path via freeze)  
**Depends on:** Phase 05, CreditLot model (Phase 01), grants from Phase 11 or admin  
**Unlocks:** Decision #3 currency “both”

## Goal

Passengers spend `PROMO_CREDITS` / `CreditLot` remaining toward `chargeAmount`, combined with coupon/voucher per stacking rules.

## Rules

- Credits apply **after** ticket discounts and fee computation (see `04`)
- FIFO expiry: soonest `expiresAt` lots first
- Cannot transfer
- Show separate line “Credits” in UI
- Interaction with PASSENGER_WALLET cash: **locked order** — discounts → fees → promo credits → cash wallet → Paystack

## APIs

- `credits.listMine`
- Checkout inputs: `useCredits: boolean` (default true) or `creditAmountXOF` cap

## Ledger

On confirm: consume lots + post accounting; on hold: reserve lots like wallet reservations (`WalletReservation` pattern reuse if possible).

## Acceptance criteria

- [ ] Credit + coupon booking charges Paystack only remainder
- [ ] Full cover → zero-charge confirm
- [ ] Hold expire releases credit reservation
- [ ] Expired lots skipped

## Out

- Converting cash wallet ↔ promo credits
