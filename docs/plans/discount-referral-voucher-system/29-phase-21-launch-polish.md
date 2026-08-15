# Phase 21 — Launch Polish

**Status:** Done  
**Depends on:** Phases 10–20 core surfaces landed  
**Unlocks:** Softer UX + legal honesty before GA; does not block flag-on smoke

## Goal

Ship the remaining polish items called out after Phase 20 readiness:

1. Referral funnel charts (admin + clearer passenger progress)
2. Marketing blast opt-in respect (campaign-start notifications only to opted-in users)
3. Traveler-app referral screen (parity with web `/dashboard/referrals`)
4. Formal Terms alignment for stacking, promo credits, and referrals

## Work items

### 21.1 Referral funnel charts

- Admin marketing summary: visual funnel (attributed → qualified → rewarded) from existing `referralFunnel`
- Passenger referrals page: simple progress bars for the three counts
- Optional: operator promotions summary already has cost cards — leave as-is unless time

### 21.2 Marketing blast opt-in

- Code-first Novu workflow `passenger-campaign-starting` (non-critical; preference-respecting)
- Service that selects `PassengerProfile.marketingOptIn = true` and triggers with safe batching
- Admin action on platform campaign activate (or explicit “Notify opted-in”) — transactional voucher/referral messages remain critical/readOnly and ignore marketing opt-out

### 21.3 Traveler-app referrals

- Screen under profile/settings: show code, copy share link, apply code, stats
- i18n EN/FR under traveler locales
- Gate UX when referral program is inactive (API errors when program `isActive` is false)

### 21.4 Terms / legal alignment

- Update Terms §4.4–4.6 (EN+FR) so copy matches shipped stacking: one promo code (or auto campaign), one monetary voucher, and promo credits may combine when rules allow; % coupons do not cut convenience fee
- Add short §4.7 Referral program: delayed credits, non-transferable, no cash-out, abuse rights
- Keep FAQ in sync (already partially updated in Phase 18)

## Acceptance criteria

- [x] Admin campaigns page shows referral funnel visualization
- [x] Passenger web referrals page shows progress bars
- [x] Activating / notifying a campaign only emails opted-in passengers for marketing blasts
- [x] Traveler app has a referrals screen reachable from settings
- [x] Terms EN+FR do not contradict checkout stacking or referral credit behavior

## Out

- Influencer marketplace, SMS invites, gift-card purchase (see Phase 27)
- Full BI charts library beyond simple CSS/bar funnel
