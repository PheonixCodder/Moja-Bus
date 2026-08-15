# Phase 19 — Testing & QA Matrix (working checklist)

**Status:** Updated after Sprints A–D (2026-08-15) — execute before GA  
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

## Post–Sprint A–D growth loop

| # | Case | Pass? |
|---|------|-------|
| 15 | Invalid promo on preview soft-fails; hold with `strict: true` still rejects | |
| 16 | Admin/operator campaign coupons panel shows inventory for ACTIVE campaign | |
| 17 | Create form: percent entered as %; activate guidance visible | |
| 18 | `/r/CODE` invite landing; `/?ref=CODE` redirects to `/r/CODE` | |
| 19 | Share URL is `/r/CODE` (web + traveler app) | |
| 20 | After login, pending referral applies once (`PendingReferralApplier`) | |
| 21 | Inactive referral program: share/apply UX disabled with clear copy | |
| 22 | Admin redemptions table shows full PII; operator view masks passenger | |
| 23 | Passenger invitee list (web + app) matches attributed referrals | |
| 24 | Welcome coupon mint when `refereeCouponCampaignId` ACTIVE → code on apply | |
| 25 | `deviceHash` sent on `applyReferralCode` and on `createHold` discount freeze | |
| 26 | Referral apply rate limit: 11th attempt / 15 min fails | |
| 27 | Campaign settings: dates, caps, budget, auto-apply, hybrid, route scopes | |
| 28 | Bulk coupon create (admin + operator) | |
| 29 | Phone cap (`maxRedemptionsPerPhone`) blocks extra redemptions | |
| 30 | Admin issue refuses 4th active promotional voucher (max 3) | |
| 31 | Abuse queue: summary (no raw JSON), user links, pause campaign | |
| 32 | Wallet shows promo credits + vouchers (web + traveler app) | |
| 33 | FAQ/Terms: max 3 promos + `/r/CODE` referral reality (EN + FR) | |

## Automated

| Suite | Command | Pass? |
|-------|---------|-------|
| Schemas | `pnpm --filter @moja/schemas test` (or tsx discounts.test) | |
| Engine | `tsx --test apps/web/features/discounts/engine/__tests__/evaluate.test.ts` | |
| Promo ledger | `tsx --test apps/web/features/discounts/services/__tests__/promo-ledger.test.ts` | |

## Finance recon

See `30-finance-recon-checklist.md` for the staging recon steps.

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
- [ ] Post–Sprint A–D rows for shipped surfaces checked
- [ ] Support runbook reviewed
- [ ] Legal FAQ/Terms not contradicted
- [ ] Finance recon checklist run on staging
