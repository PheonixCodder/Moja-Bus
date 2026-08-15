# 04 — Pricing, Stacking & Auto-Apply

## Current baseline (must remain valid)

From `pricing-resolver.ts` / `12-pricing.md`:

```
subtotalBase = baseFare × seats
convenienceFee = round(subtotalBase × convenienceFeeBps / 10000)
commission = round(subtotalBase × commissionBps / 10000)
charge = subtotalBase + convenienceFee
operatorNet = subtotalBase − commission
platformGross = commission + convenienceFee
```

Wallet pay today waives convenience fee.

## Extended pipeline (locked)

```
1. preDiscountSubtotal = baseFare × seats
2. Evaluate instruments → select set S (stacking rules)
3. ticketDiscount = sum of ticket-targeted discounts in S (capped)
4. postDiscountSubtotal = max(0, preDiscountSubtotal − ticketDiscount)
5. convenienceFeeBps effective:
     - wallet cash path may still waive fee (existing perk)
     - else fee = round(postDiscountSubtotal × bps / 10000)
6. feeDiscount = monetary voucher portion applied to fees (if applyTarget ENTIRE_CHARGE)
7. provisionalCharge = postDiscountSubtotal + convenienceFee − feeDiscount
8. creditApplied = min(available credits, provisionalCharge)  // PROMO_CREDITS then optional wallet
9. chargeAmount = provisionalCharge − creditApplied
10. commission base depends on funding (below)
11. Freeze all into PricingSnapshot + DiscountRedemption rows
```

### Commission & operator net by funding

Let `D = ticketDiscount`.

| Funding | Commission base | Operator net (ticket side) | Who funds D |
|---------|-----------------|----------------------------|-------------|
| OPERATOR | `postDiscountSubtotal` | `postDiscountSubtotal − commission` | Operator (implicitly) |
| PLATFORM | `preDiscountSubtotal` | `preDiscountSubtotal − commission` (operator kept whole) | Platform promo liability = D |
| HYBRID | Commission on `preDiscountSubtotal` | Operator net = pre − commission − operatorFundedShare | Split D by share bps |

Hybrid amounts:
```
platformFundedXOF = round(D × platformShareBps / 10000)
operatorFundedXOF = D − platformFundedXOF
operatorNet = preDiscountSubtotal − commission − operatorFundedXOF
```

Platform gross must still balance with ledger posts (see `05`).

### Caps inside benefit calc

- PERCENT: `min(round(pre × percentBps/10000), maxDiscountPerBookingXOF?)`
- FIXED: `min(amountXOF × applicableSeatsLogic, pre, maxDiscountPerBookingXOF?)`
- FREE_SEAT: value of cheapest N seats in the hold (need seat fares; today uniform baseFare — use `baseFare × N`)

Never let ticketDiscount > preDiscountSubtotal.

## Stacking policy (defaults)

**Hard defaults (FAQ-aligned):**
1. At most **one** of: coupon code, auto %/fixed promo, monetary voucher **as ticket discounter**.
2. Exception: monetary voucher / credits may cover **remaining charge** after a ticket discount if campaign `allowCombineWithCredit` and instrument type is monetary/credit — modeled as payment, not second “promo code”.
3. Two coupon codes: never.
4. Referral welcome coupon counts as the one coupon.
5. If auto promo and user enters a code: **code wins** if eligible; else keep auto (show comparison).

### Stack groups

Campaigns declare `stackGroup` string. Engine:
- Same group → mutually exclusive (keep highest `priority`, then highest discount XOF)
- Special group `CREDIT` / `VOUCHER_PAY` → payment-like, combinable

## Auto-apply algorithm

Input: user, offer (company, route, trip, seats, subtotal), active AUTO campaigns.

```
candidates = filter eligible(campaign, context)
candidates = exclude those requiring code
best = max by (ticketDiscountXOF, priority, endsAt soonest)
return best
```

Deterministic tie-break documented in code + unit tests.

Preview endpoint returns:
- `autoApplied` campaign summary
- `alternatives` (optional, admin flag)
- `userCodeResult` if code provided
- `finalBreakdown`

## Evaluation context (eligibility inputs)

- `userId`, account age, `completedBookingCount`
- `companyId`, `routeId`, `scheduleId`, `tripId`, `fromStop`, `toStop`
- `seatCount`, `subtotalXOF`, `travelDate`
- `phone` (passenger primary), device fingerprint hash (mobile/web)
- Now vs campaign window
- Prior redemptions (user/phone/device/campaign)

## When evaluation runs

| Moment | Behavior |
|--------|----------|
| `getCheckoutPricing` | Soft eval; no redemption write |
| `createHold` | Hard eval + freeze + reserve voucher/credit + increment budget soft-reserve |
| Hold expire/cancel | Release reservations; restore voucher remaining |
| Payment confirm | Finalize redemption; consume budget; grant referral qualify |

## Idempotency

Redemption unique on `(holdGroupId, instrumentType)` for primary ticket instrument; credits separate row. Re-pay same hold must not double-consume.

## Fee waiver interaction

If wallet cash payment waives fee **and** credits applied: document order — prefer: apply ticket discount → compute fee → apply credits to charge → if payment method WALLET_CASH and policy says waive fee, fee=0 before credits. Unit-test matrix in Phase 19.
