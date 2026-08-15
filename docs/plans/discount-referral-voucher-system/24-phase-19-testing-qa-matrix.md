# Phase 19 — Testing & QA Matrix (working checklist)

**Status:** In progress (checklist drafted; execute before GA)  
**Depends on:** Feature phases intended for GA  
**Unlocks:** Phase 20 rollout

## Smoke (manual)

| # | Case | Pass? |
|---|------|-------|
| 1 | Flags off → checkout ignores codes; pricing unchanged | |
| 2 | `DISCOUNTS_ENABLED=true` → admin create campaign + coupon → activate | |
| 3 | Web checkout apply code → totals drop → Paystack charge matches | |
| 4 | Wallet checkout with discount + credits → ledger balances | |
| 5 | Auto-apply best campaign when no code | |
| 6 | Operator create promo → only their company | |
| 7 | Admin pause operator campaign → checkout rejects within seconds | |
| 8 | Cancel with VOUCHER channel → monetary voucher issued (+ Novu if configured) | |
| 9 | Apply referral → self-referral blocked | |
| 10 | Paid confirm → INITIAL credit PENDING → cron activates after delay | |
| 11 | Recurring credit on 2nd/3rd referee booking within window | |
| 12 | Hybrid funding → platformFunded + operatorFunded sum to ticket discount | |
| 13 | Zero-charge booking (credits cover all) confirms without Paystack | |
| 14 | FR locale shows discount strings (web + app) | |

## Automated

| Suite | Command | Pass? |
|-------|---------|-------|
| Schemas | `pnpm --filter @moja/schemas test` (or tsx discounts.test) | |
| Engine | `tsx --test apps/web/features/discounts/engine/__tests__/evaluate.test.ts` | |
| Promo ledger | `tsx --test apps/web/features/discounts/services/__tests__/promo-ledger.test.ts` | |

## Finance recon (staging)

1. Sum confirmed `DiscountRedemption.platformFundedXOF` ≈ promo expense ledger
2. Sum open voucher remaining ≈ voucher liability
3. No ACTIVE hold with reserved credits > remaining

## Novu workflows to create in dashboard

- `passenger-voucher-issued`
- `passenger-referral-attributed`
- `passenger-referral-reward`
- `operator-campaign-paused`
- `campaign-budget-exhausted`
- `passenger-voucher-expiring`
- `passenger-credit-expiring`

Update `passenger-booking-confirmed` payload to optionally show:
`ticketDiscountXOF`, `creditAppliedXOF`, `feeDiscountXOF`, `preDiscountSubtotalXOF`, `hasDiscount`


## Gate for Phase 20

- [ ] All smoke rows for GA scope checked
- [ ] Support runbook reviewed
- [ ] Legal FAQ/Terms not contradicted
