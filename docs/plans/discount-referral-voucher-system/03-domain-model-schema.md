# 03 — Domain Model & Schema

## Design principles

1. **Campaign is the rule brain**; codes/vouchers are instruments that point at campaigns or carry their own monetary balance.
2. **Immutable redemption + snapshot** — never recompute historical discounts from live rules.
3. **Funding is explicit** on every campaign and copied onto every redemption.
4. **Multi-tenant** — `companyId` null = platform campaign; non-null = operator campaign.
5. **Data-driven limits** — creators set caps; platform sets global abuse ceilings.

## Enums (proposed)

```prisma
enum CampaignOwnerType {
  PLATFORM
  OPERATOR
}

enum CampaignFundingType {
  PLATFORM
  OPERATOR
  HYBRID
}

enum CampaignStatus {
  DRAFT
  SCHEDULED
  ACTIVE
  PAUSED
  EXHAUSTED // budget or global cap hit
  EXPIRED
  ARCHIVED
}

enum BenefitType {
  PERCENT_OFF
  FIXED_AMOUNT_OFF
  FREE_SEAT          // N seats free = 100% on cheapest N seats in hold
  WALLET_CREDIT_GRANT // grant credit lot (referral/loyalty), not checkout % off
}

enum InstrumentType {
  COUPON_CODE
  AUTO_PROMO
  MONETARY_VOUCHER
  CREDIT_LOT
}

enum VoucherSource {
  CANCELLATION
  MODIFICATION_DIFFERENCE
  MARKETING_GRANT
  GOODWILL
  REFERRAL_REWARD
  ADMIN_MANUAL
}

enum VoucherStatus {
  ACTIVE
  PARTIALLY_REDEEMED
  REDEEMED
  EXPIRED
  REVOKED
}

enum ReferralEdgeStatus {
  ATTRIBUTED       // code applied / signup linked
  QUALIFIED        // first paid booking confirmed
  REWARDED         // initial reward posted
  REJECTED_FRAUD
  EXPIRED
}

enum DiscountApplyTarget {
  TICKET_ONLY      // never fees
  ENTIRE_CHARGE    // ticket + convenience fee (monetary vouchers)
}
```

## Core models (proposed)

### DiscountCampaign

Parent offer.

Key fields:
- `id`, `ownerType`, `companyId?` (required if OPERATOR)
- `name`, `description`, `status`
- `fundingType`, `platformShareBps`, `operatorShareBps` (hybrid; sum 10000)
- `benefitType`, `percentBps?`, `amountXOF?`, `freeSeatCount?`
- `applyTarget` (default TICKET_ONLY for coupons; ENTIRE_CHARGE for monetary)
- Windows: `startsAt`, `endsAt`
- Scope JSON or child tables: cities, routes, schedules, trips, companies (for platform)
- Constraints: `minSubtotalXOF`, `minSeatCount`, `maxSeatCount`, `firstBookingOnly`, `newUserOnly`
- Caps: `maxRedemptionsGlobal`, `maxRedemptionsPerUser`, `maxRedemptionsPerPhone`, `maxDiscountPerBookingXOF`, `budgetXOF`, `budgetConsumedXOF`
- Stacking: `stackGroup`, `priority`, `isAutoApply`, `allowCombineWithCredit`
- Audit: `createdByUserId`, `pausedByAdminAt?`, `pauseReason?`

Indexes: status+window, companyId, stackGroup, isAutoApply.

### CouponCode

- `campaignId`, `code` (unique normalized uppercase), `isActive`
- Optional overrides: `maxRedemptions`, `expiresAt`, `assignedUserId?` (personal codes)
- `createdAt`

Unique: `code` globally (avoid cross-operator collisions; prefix operator codes e.g. `UTB-SUMMER`).

### MonetaryVoucher

- `userId`, `code?` (optional display)
- `source`, `status`
- `originalAmountXOF`, `remainingAmountXOF`
- `currency` default XOF
- `expiresAt`, `expiresOnFirstCompletedBooking`
- `sourceHoldGroupId?`, `sourceBookingId?`, `issuedByAdminId?`
- `campaignId?` (if marketing grant tied to campaign rules for scope)
- Scope overrides optional (null = platform-wide monetary)

### CreditLot

Wallet-adjacent grant with rules (referral recurring, loyalty).

- `userId`, `amountXOF`, `remainingXOF`
- `source` (`REFERRAL`, `LOYALTY`, `ADMIN`, `PROMO_GRANT`)
- `expiresAt?`
- `referralEdgeId?`
- `status`
- Ledger link: posting creates/credits `PASSENGER_WALLET` **or** dedicated `PROMO_CREDITS` account class — **choose `PROMO_CREDITS`** so cash top-ups stay distinct; checkout spends credits first per policy.

**Locked default:** use account class `PROMO_CREDITS` (liability) separate from `PASSENGER_WALLET` cash, but present unified “Credits” UX. Cancellation monetary vouchers can either be `MonetaryVoucher` rows only, or also mirror into `PROMO_CREDITS`. Prefer **MonetaryVoucher as source of truth for cancel vouchers**; CreditLot for referral/loyalty.

### ReferralProgram

Singleton or versioned config:
- `isActive`
- `refereeCouponCampaignId?` (welcome coupon)
- `referrerCreditAmountXOF` (initial)
- `recurringCreditAmountXOF`
- `recurringMaxBookings` / `recurringWindowDays`
- `requirePaidConfirmedBooking`
- `rewardDelayHours` (FAQ 48h → default 48)
- `selfReferralBlock`, `sameDeviceBlock`, `samePhoneBlock`

### ReferralCode

- `userId` unique, `code` unique, `createdAt`

### ReferralEdge

- `referrerUserId`, `refereeUserId` unique
- `referralCodeId`, `status`
- `attributedAt`, `qualifiedAt`, `rewardedAt`
- `firstHoldGroupId?`, `fraudFlags` JSON

### DiscountRedemption

Immutable apply record:
- `holdGroupId`, `userId`
- `instrumentType`, `campaignId?`, `couponCodeId?`, `voucherId?`, `creditLotId?`
- Amounts: `ticketDiscountXOF`, `feeDiscountXOF`, `creditAppliedXOF`
- Funding snapshot: `fundingType`, `platformFundedXOF`, `operatorFundedXOF`, `companyId?`
- `snapshotJson` (full eval result)

### PricingSnapshot extensions

Add columns (keep old rows null-safe):
- `ticketDiscountXOF`
- `feeDiscountXOF`
- `creditAppliedXOF`
- `preDiscountSubtotalXOF`
- `postDiscountSubtotalXOF`
- `chargeAmountXOF` (already exists — becomes post-discount + fees - credits)
- `platformPromoFundedXOF`
- `operatorPromoFundedXOF`
- `discountBreakdownJson`

Recompute formulas documented in `04-pricing-stacking-auto-apply.md`.

### Optional scope tables

Prefer normalized for query performance:
- `CampaignRouteScope(campaignId, routeId)`
- `CampaignTripScope(campaignId, tripId)`
- `CampaignScheduleScope(campaignId, scheduleId)`
- `CampaignCompanyOptIn(campaignId, companyId, status)` for hybrid platform campaigns requiring opt-in

## Relations to existing models

- `HoldGroup` 1—1 `PricingSnapshot`; 1—n `DiscountRedemption`
- `User` 1—n vouchers, credit lots, referral code, edges
- `Company` 1—n campaigns
- `Booking.farePaid` — keep as **pre-discount base per seat** OR store both `fareQuoted` and `fareEffective`; **locked:** keep `farePaid` as amount attributable to seat for operator ops, add `discountXOF` on booking or derive from hold snapshot (prefer derive; avoid divergent per-seat discount splits unless FREE_SEAT)

## Migration strategy

Project uses **`prisma db push`** (no migrations dir). Phase 1: additive models + nullable snapshot columns; backfill not required for new columns (0 default).

## What we explicitly do NOT overload

- Do not put coupon math into `PromoBanner`
- Do not use `RefundChannel.VOUCHER` as the voucher ledger (keep as refund routing enum; link issuance in cancel service)
- Do not treat `FareType.PROMO` as coupon (schedule pricing remains separate; may later feed auto-apply as “fare already promo” badge only)
