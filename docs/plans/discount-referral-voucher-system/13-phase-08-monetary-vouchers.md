# Phase 08 — Monetary Vouchers

**Status:** Partial (issue/redeem paths + admin issue; UI thin)  
**Depends on:** Phase 01, Phase 05 (for redeem-at-hold)  
**Unlocks:** Cancellation bridge, marketing grants, FAQ monetary rules

## Goal

First-class `MonetaryVoucher` lifecycle: issue, list, reserve, redeem partially or fully, expire, revoke.

## Behaviors

- Partial redeem allowed (remaining balance)
- `applyTarget=ENTIRE_CHARGE` by default for monetary
- Non-transferable; no cash-out API
- Expiry job (cron/inngest/existing worker pattern — match repo jobs)
- Admin manual issue (goodwill)
- Marketing grant from campaign (`BenefitType` grant path or issue API)

## Passenger APIs

- `vouchers.listMine`
- `vouchers.get`
- Checkout already passes `monetaryVoucherId` (Phase 05)

## UI

- Web + app: “My vouchers” list (amount, expiry, source label)
- Checkout picker
- Admin: search user → issue voucher

## Acceptance criteria

- [ ] Issue 5,000 XOF voucher; booking 7,000 → pay 2,000; remaining 0 or partial as designed
- [ ] Partial: 10,000 voucher on 3,000 booking → remaining 7,000
- [ ] Expired voucher rejected
- [ ] Revoked voucher rejected
- [ ] Concurrent redemption locked

## Out

- Auto-create on cancel (Phase 09)
