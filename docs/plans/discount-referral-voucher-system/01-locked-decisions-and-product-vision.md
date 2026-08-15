# 01 — Locked Decisions & Product Vision

## Vision

Moja Ride should let **the platform** grow the marketplace (acquisition, retention, seasonal campaigns) and let **each operator** compete on price without leaving the ERP — while passengers get a simple, trustworthy “apply code / auto savings / referral credit” experience that never breaks the double-entry ledger.

This is not a bolt-on “promo code field.” It is a **commercial incentives subsystem** with first-class instruments (campaigns, coupons, vouchers, referral edges, credit lots), evaluation rules, cost attribution, and reporting.

## Product goals

1. **Passenger trust** — FAQ/Terms voucher rules become real behavior.
2. **Operator growth tools** — create trip/route/company promos in minutes, see cost impact on revenue.
3. **Platform growth tools** — marketplace-wide and hybrid-funded campaigns; pause anything abusive.
4. **Financial correctness** — every discount has a funding party (or split); settlements remain explainable.
5. **Referral flywheel** — invite → first booking → recurring referrer credits (config-capped).
6. **Flexibility** — rule engine supports industry patterns without schema rewrites per campaign.

## Non-goals (launch)

- Selling physical gift cards in retail stores
- Points catalog / tier badges (wallet credits only for loyalty-like rewards)
- ML yield management replacing operator `Fare` rows
- Cross-border multi-currency promotions
- Partner travel-agency portal redemption (API hooks may be reserved; UI deferred)

## Success metrics

### Passenger
- % checkouts with discount/voucher/credit applied
- Referral invite → signup → first paid booking conversion
- Support tickets about “code not working” (should trend down after Phase 14)

### Operator
- Active campaigns per company
- Incremental bookings attributed to operator promos (vs control windows)
- Promo cost as % of gross ticket sales (dashboard)

### Platform
- CAC via referral vs paid ads (when ads exist)
- Platform promo liability outstanding vs redeemed
- Fraud block rate / reversed referral rewards

## Personas & jobs-to-be-done

| Persona | Job |
|---------|-----|
| New passenger | Use welcome/referral coupon; understand expiry |
| Returning passenger | Apply cancel voucher or wallet credit; see auto savings |
| Referrer | Share link; track invites; earn recurring credits |
| Operator owner/marketing staff | Launch route flash sale; cap budget; pause |
| Operator finance | See promo cost vs commission/net |
| Platform growth admin | Launch hybrid campaign; target first-booking users |
| Platform finance | Reconcile promo liability and hybrid shares |
| Platform trust & safety | Freeze codes, users, referral rings |

## Capability map (what “complete” means)

```
Instruments
  ├── DiscountCampaign (rules + funding)
  ├── CouponCode (human-entered or auto)
  ├── VoucherLot (monetary XOF, expiry, source)
  ├── ReferralProgram + ReferralEdge
  └── CreditLot (wallet-adjacent spendable balance with rules)

Evaluation
  ├── Eligibility (who/when/where/what)
  ├── Stacking policy
  ├── Auto-apply optimizer
  └── Freeze into PricingSnapshot

Money
  ├── Cost share (platform / operator / hybrid)
  ├── Ledger posts
  └── Settlement & reports

Surfaces
  ├── Admin
  ├── Operator
  └── Passenger web + traveler-app
```

## Alignment with existing FAQ/Terms (must implement)

From `faq.ts` / `terms.ts`:

| Rule | Implementation implication |
|------|----------------------------|
| Max one voucher **or** discount code per booking | Stacking policy default |
| Monetary vouchers apply to entire cart | Can offset fees after ticket discount? FAQ says monetary → entire cart; discount codes → ticket only |
| Discount/free-trip vouchers → ticket price only | Never reduce convenience fee via % coupon |
| Discount codes valid 3 months from issue (default) | Campaign/code `expiresAt`; overridable per instrument |
| Cancellation vouchers valid 12 months | Phase 9 default TTL |
| Marketing free vouchers expire after first completed booking | `expiresOnFirstCompletedBooking` flag |
| Non-transferable; no cash refund of vouchers | No P2P transfer API; redeem-only |
| Promo campaigns: max 3 promotional vouchers per person | Global abuse policy config |
| Codes activated within 48h of booking confirmation email | Referral/reward grant delay or “pending until confirm + optional delay” |

Where FAQ conflicts with better UX, **change FAQ in Phase 18** only after product sign-off — do not silently diverge.
