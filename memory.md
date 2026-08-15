# Memory — Moja Ride

Last updated: 2026-08-15 (Sprint D polish)

## Discount / referral / voucher

Audit: `docs/audits/discount-referral-voucher-system-audit-2026-08-15.md`

### Sprint A (done)
Soft-fail quotes, coupon inventory, % create UX, `/r/[code]` invite landing, share URLs, pending applier, program status UX, public program query.

### Sprint B (done)
Redemption tables (admin/operator), invitee lists (web+app), welcome coupon mint, admin welcome-campaign picker, operator platform opt-in UI.

### Sprint C (done)
Device hash on `applyReferralCode`, rate-limit apply, campaign settings editor, bulk coupons, phone cap, max-3 promo vouchers on admin issue, abuse queue UX.

### Sprint D (done this session)
1. Passenger wallet promo panel — web `PromoIncentivesPanel` + traveler `PromoIncentives`; wallet page prefetches credits/vouchers
2. FAQ/Terms EN+FR: max 3 promotional vouchers; `/r/CODE` + pending invite honesty
3. `deviceHash` on `createHold` → `freezeDiscountOnHold` → `DiscountRedemption` (web checkout + traveler passenger form)
4. QA matrix Phase 19 expanded (post A–D cases); finance recon checklist `30-finance-recon-checklist.md`

### Still open (later)
- Schedule/trip scope pickers (route scopes shipped; schedule/trip IDs still API-only)
- PlatformSettings-backed voucher ceiling (constant for now)
- Signup optional referral field (mostly covered by pending applier)
- Points catalog — deferred until loop converts
- Execute Phase 19 smoke + finance recon on staging before GA

### Do not
- Commit secrets / service-account JSON / `google-services.json`
- Edit Cursor plan file `Discount Referral Plans-*.plan.md`
