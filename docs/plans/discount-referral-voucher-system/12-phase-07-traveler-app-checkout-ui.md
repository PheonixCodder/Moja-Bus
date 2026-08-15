# Phase 07 — Traveler App Checkout UI

**Status:** Partial (promo code + voucher + breakdown on passenger form)  
**Depends on:** Phase 05 (parallelizable with Phase 06)  
**Unlocks:** Mobile passenger parity

## Goal

Parity with web discount UX in Expo traveler app checkout.

## Primary surface

`apps/traveler-app/features/search/components/passenger-form-sheet.tsx`

Also:
- Resume pending checkout store must persist `code` / `voucherId`
- Booking detail resume pay must re-use frozen hold snapshot (no re-enter code)
- Home: optional “Rewards” entry later

## UX notes (RN)

- Use bottom sheet section for code apply
- Avoid layout thrash: pricing query with clear pending state
- Follow RN skills: Pressable, no leaked `&&` renders, expo-image if icons needed

## Acceptance criteria

- [ ] Same pricing outcomes as web for identical inputs
- [ ] Guest login resume restores intended code from pending-checkout
- [ ] Wallet + Paystack WebView paths both charge discounted amount
- [ ] EN/FR strings

## Out

- Referral share sheet polish can wait for Phase 10 but leave nav stub if needed
