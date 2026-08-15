# Phase 06 — Passenger Web Checkout UI

**Status:** Partial (promo code + voucher + breakdown on checkout)  
**Depends on:** Phase 05  
**Unlocks:** Desktop passenger discount UX

## Goal

Pixel-quality checkout affordances on web search booking dialog.

## Primary surface

`apps/web/features/booking/components/booking-checkout-form.tsx`

### UX blocks
1. **Promo code** — input + Apply / Remove; status messages
2. **Auto savings** — banner “XOF saved with Early Bird” + optional Remove
3. **Voucher picker** — list active monetary vouchers (Phase 08 data; hide until then)
4. **Breakdown** — Fare, Discount, Service fee, Credits, Total
5. **Referral** — soft link “Have an invite code?” only if not yet attributed (Phase 10)

## Behavior

- Debounced/manual apply calls `getCheckoutPricing`
- Changing seats/passengers re-quotes
- Disable pay while pricing fetching
- Show funding-agnostic passenger copy (never “operator paid your discount” unless marketing wants)

## Account pages (minimal)

- `/dashboard` or passenger account: **My vouchers** placeholder linking Phase 08
- Booking success page: show discount line

## Acceptance criteria

- [ ] User applies platform % code and pays discounted Paystack amount
- [ ] Invalid code inline error (EN/FR keys)
- [ ] Auto-apply visible when eligible
- [ ] Removing code restores full price before pay
- [ ] Mobile responsive inside dialog

## Out

- Full referral dashboard (Phase 10)
- Native app (Phase 07)
