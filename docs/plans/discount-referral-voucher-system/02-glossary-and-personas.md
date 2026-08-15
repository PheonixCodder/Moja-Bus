# 02 — Glossary & Personas

## Glossary

| Term | Meaning |
|------|---------|
| **Campaign** | Parent container for a commercial offer: funding, schedule, targeting, stacking group, budget |
| **Coupon / discount code** | String passengers type (or deep-link). Maps to a campaign benefit (% or fixed) |
| **Auto promo** | Campaign with no code; selected by auto-apply engine if eligible |
| **Monetary voucher** | XOF balance instrument (often from cancellation or goodwill). Not the same as `%` coupon |
| **Credit lot** | Spendable wallet-adjacent grant (referral/loyalty) with optional expiry and eligible scopes |
| **Referral code / link** | Passenger’s invite identity; creates attribution edge referee → referrer |
| **Referee** | New (or invited) user who used a referral |
| **Referrer** | User who invited others |
| **Funding party** | Who absorbs discount cost: `PLATFORM`, `OPERATOR`, or `HYBRID` |
| **Benefit type** | `PERCENT_OFF`, `FIXED_AMOUNT_OFF`, `FREE_SEAT` (maps to 100% on N seats), `WALLET_CREDIT_GRANT` |
| **PricingSnapshot freeze** | Immutable money math bound to `HoldGroup` at hold time |
| **Redemption** | Successful application of an instrument to a hold/booking |
| **Stack group** | Mutual-exclusion / allow-list key for combining instruments |
| **Budget** | Soft/hard cap on total discount XOF issued for a campaign |
| **Usage cap** | Global, per-user, per-phone, per-device limits |

## Distinguish carefully

| Concept | Is it money in wallet? | Affects ticket fare? | Entered as code? |
|---------|------------------------|----------------------|------------------|
| % / fixed coupon | No | Yes | Usually |
| Auto promo | No | Yes | No |
| Monetary voucher | Instrument; may mirror wallet UX | Can cover fare (+ fees if monetary) | Optional code or picker |
| Referral credit lot | Yes (credit) | Via payment, not “discount line” | No |
| Cancel voucher | Monetary voucher | Yes | Picker / auto |
| `PromoBanner` | No | No | N/A (marketing) |
| `FareType.PROMO` | No | Yes (schedule fare) | No — separate path |

## Passenger journeys

### A. Apply coupon at checkout
Search → seats → checkout → enter code → see new total → hold → pay → ticket shows “Promo applied”.

### B. Auto savings
Eligible early-bird campaign → checkout shows “Saved 1,000 XOF” without typing → can remove if policy allows.

### C. Cancel → voucher → rebook
Cancel eligible booking → receive 12-month voucher → next checkout → select voucher → pay remainder.

### D. Referral
Share link → friend signs up with code → friend completes paid booking → referrer gets credit lot → optionally recurring credits on friend’s later bookings (program rules).

### E. Stack wallet credit + coupon
Coupon reduces ticket → credit pays part of charge → Paystack/wallet for remainder.

## Operator journeys

### A. Flash sale on one route
Create campaign → scope route → 15% → date window → per-user 1 → publish → see redemptions.

### B. Trip-specific dump seats
Attach campaign to schedule/trip IDs → fixed 2,000 XOF off → budget 500,000 XOF → auto-pause at budget.

### C. Finance review
Revenue report: gross, discount funded by company, platform hybrid share, net.

## Admin journeys

### A. Platform welcome coupon
First-booking only → 10% → hybrid 50/50 with participating operators (or platform-funded only).

### B. Hybrid national holiday
Campaign with share bps → operators opt-in **or** auto-apply to all (policy flag).

### C. Trust action
Pause campaign, revoke code, claw back pending referral credits, ban referral ring.

## Information architecture (nav)

### Admin (new)
- Marketing → Campaigns
- Marketing → Coupons
- Marketing → Vouchers (issue / search)
- Growth → Referrals
- Financials → Promo liability (or tab under Ledger)

### Operator (new)
- Growth → Promotions (or Marketing → Promotions)
- Financials → Promo costs (section in Revenue)

### Passenger
- Checkout: code field + voucher picker + savings line
- Account: My vouchers / credits
- Account: Invite friends (referral)
- Booking detail: discount breakdown
