# Finance recon checklist (staging)

**Purpose:** Catch promo expense / voucher liability drift before GA.  
**When:** After meaningful discount traffic on staging (or weekly pre-launch).  
**Owner:** Ops / finance + eng on-call.

## 1. Promo expense vs redemptions

1. Take a date window (e.g. last 7 days UTC).
2. Sum confirmed `DiscountRedemption.platformFundedXOF` where status is the confirmed/consumed state used in production.
3. Sum operator-funded portion (`operatorFundedXOF`) for the same window if hybrid campaigns ran.
4. Compare to promo expense ledger / settlement exports for the same window.
5. **Pass:** totals match within rounding (≤ 1 XOF per redemption aggregate, or documented FX/rounding policy).
6. **Fail:** investigate hold freezes never confirmed, double-confirm, or pause-after-redeem races.

## 2. Open voucher liability

1. Sum `remainingAmountXOF` (or equivalent) for vouchers in usable statuses (ACTIVE / ISSUED — match schema enums).
2. Exclude expired and fully consumed vouchers.
3. Compare to “voucher liability” report or wallet-adjacent liability view if present.
4. **Pass:** open remaining ≈ reported liability.
5. Spot-check: cancellation vouchers vs promotional (marketing / goodwill / admin / referral welcome) — ceiling from `PlatformSettings.maxPromotionalVouchersPerUser` applies only to promotional.

## 3. Credit lots integrity (promo credits liability)

1. Sum `CreditLot.remainingXOF` for statuses ACTIVE / PARTIALLY_REDEEMED (and PENDING amount if treating pending as liability).
2. Compare to promo credit liability view / finance export if present.
3. No ACTIVE hold with `reservedXOF` on a credit lot greater than `remainingXOF`.
4. Sum of `reservedXOF` across lots ≈ sum of open holds that froze credits.
5. PENDING referral INITIAL credits exist only for attributed referrals awaiting activation cron.
6. `PROMO_GRANT` lots from claim codes should match coupon redemption counts for `WALLET_CREDIT_GRANT` campaigns.

## 4. Abuse / ops sanity (quick)

1. Rate-limited referral apply does not create orphan attributions.
2. Paused campaigns produce no new redemptions after pause (allow brief cache lag if documented).
3. Redemption list filters by company for operators (no cross-tenant rows).

## Sign-off

| Check | Window | Result | Notes |
|-------|--------|--------|-------|
| Promo expense | | | |
| Voucher liability | | | |
| Credit reserves | | | |
| Abuse sanity | | | |

Signed: _____________ Date: _____________
