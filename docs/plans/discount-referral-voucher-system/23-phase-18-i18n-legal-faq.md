# Phase 18 — i18n, Legal & FAQ Alignment

**Status:** Partial (checkout + error catalogs EN/FR; FAQ updated; receipt line polish remaining)  
**Depends on:** Passenger/admin/operator copy existing from earlier phases  
**Unlocks:** Launch readiness for CI bilingual market

## Goal

Every string EN+FR; FAQ/Terms match real system behavior.

## Work items

1. [x] Message catalogs: web `discounts.*` + traveler `booking` promo keys
2. [x] FAQ vouchers/credits/referral copy aligned with stacking rules
3. [x] Booking receipts/emails: discount lines in Novu payload
4. [ ] Operator/admin FR completeness for marketing UI chrome
5. [ ] Legal review checklist for non-transferable vouchers, no cash refund

## Acceptance criteria

- [x] Passenger promo strings available in FR locale catalogs
- [x] FAQ voucher section matches shipped stacking/credits behavior
- [ ] Terms §4.4–4.6 not contradicted by app behavior (manual legal pass)

## Product possibilities to confirm in copy

- Credits vs vouchers naming in FR (“avoir” vs “crédit promo”) — using “avoir” for monetary vouchers
- Referral program disclosure (amounts, caps, delay)
