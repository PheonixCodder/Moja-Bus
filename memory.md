# Memory — Moja Ride

Last updated: 2026-08-15 (Sprint C ops completeness)

## Discount / referral / voucher

Audit: `docs/audits/discount-referral-voucher-system-audit-2026-08-15.md`

### Sprint A (done)
Soft-fail quotes, coupon inventory, % create UX, `/r/[code]` invite landing, share URLs, pending applier, program status UX, public program query.

### Sprint B (done)
Redemption tables (admin/operator), invitee lists (web+app), welcome coupon mint, admin welcome-campaign picker, operator platform opt-in UI.

### Sprint C (done this session)
1. Device hash on all `applyReferralCode` clients (web + traveler app)
2. Rate-limit referral apply (10 / 15 min / user)
3. Campaign settings editor: dates, caps, budget, auto-apply, hybrid shares, require opt-in, route scopes — admin + operator
4. Bulk coupon generate UI + operator `bulkCreateCoupons` API
5. Engine phone cap (`maxRedemptionsPerPhone`) wired through loader + eligibility
6. FAQ promotional voucher ceiling (max 3 active) on admin issue
7. Abuse queue: user links, human summary (no raw JSON), pause campaign action

### Still open (Sprint D+)
- Device hash also on checkout redemption (optional deeper abuse)
- Signup optional referral field (partially covered by pending applier)
- Credits wallet section using `listMyCredits` UI
- Schedule/trip scope pickers (route scopes shipped; schedule/trip IDs still API-only)
- PlatformSettings-backed voucher ceiling (constant for now)
- Honest Terms/FAQ/i18n; QA matrix Phase 19; finance recon
- Points catalog — deferred until loop converts

### Do not
- Commit secrets / service-account JSON
- Edit Cursor plan file `Discount Referral Plans-*.plan.md`
