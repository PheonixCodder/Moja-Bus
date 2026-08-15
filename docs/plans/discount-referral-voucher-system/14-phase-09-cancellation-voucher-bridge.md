# Phase 09 — Cancellation → Voucher Bridge

**Status:** Partial (VOUCHER cancel channel + issueCancellationVoucher hook)  
**Depends on:** Phase 08 + existing `cancellation-service.ts`  
**Unlocks:** FAQ/Terms honesty for cancel vouchers

## Goal

Replace “VOUCHER channel label without instrument” with real 12-month monetary voucher issuance on eligible cancellations/modifications.

## Current state

- `RefundChannel.VOUCHER` exists
- Cancel clawback ledger paths exist
- FAQ promises voucher = ticket − cancel fee, 12 months, non-refundable cash

## Work items

1. On cancel confirm with voucher channel: create `MonetaryVoucher` (`source=CANCELLATION`, TTL 12 months)
2. Amount = policy (existing fee schedule) — wire to remaining refundable XOF
3. Modification cheaper fare → `MODIFICATION_DIFFERENCE` voucher (if modification flow exists; if not, stub + ticket for follow-up)
4. Notify passenger (Phase 15 can polish; send minimal email/in-app now if hooks exist)
5. Update operator/admin cancel UI copy: “Voucher issued”
6. Align FAQ only if fee math differs (Phase 18)

## Acceptance criteria

- [ ] Cancel eligible booking → voucher appears in My vouchers with correct amount
- [ ] Voucher redeemable on next booking
- [ ] Ledger: liability matches voucher remaining
- [ ] Paystack cash refund path unchanged when channel=PAYSTACK
- [ ] Wallet cancel path: decide **locked default:** prefer voucher instrument for VOUCHER channel; WALLET channel still credits PASSENGER_WALLET

## Risks

- Double benefit if both wallet credit and voucher issued — enforce single channel
