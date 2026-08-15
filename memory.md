# Memory — Moja Ride

Last updated: 2026-08-15 (Sprint E scopes / ceiling / credits catalog)

## Discount / referral / voucher

Audit: `docs/audits/discount-referral-voucher-system-audit-2026-08-15.md`

### Sprint A–D (done)
Growth loop usable: soft-fail quotes, coupons, `/r/CODE`, pending applier, redemptions, invitees, welcome coupon, device hash, rate limits, campaign settings, abuse queue, wallet promo panel, hold deviceHash, Phase 19 + finance recon docs.

### Sprint E (done this session)
1. **Schedule/trip scope pickers** — `listScopeSchedules` / `listScopeTrips` on admin + operator; `CampaignSettingsEditor` cascade route→schedule→trip; full `scopes` on save
2. **PlatformSettings voucher ceiling** — `maxPromotionalVouchersPerUser`; `getPromoPolicy`; admin settings UI + audit; FAQ/Terms use published limit
3. **Promo credits catalog (not points)** — admin `grantCredit` + lookup; `WALLET_CREDIT_GRANT` create (admin); `claimCreditGrant`; wallet claim + pending/available/source labels (web + traveler)

### Still open (later)
- Signup optional referral field (mostly covered by pending applier)
- Execute Phase 19 smoke + finance recon on staging before GA
- Novu marketing workflows still listed in Phase 19

### Do not
- Commit secrets / service-account JSON / `google-services.json`
- Edit Cursor plan file `Discount Referral Plans-*.plan.md`
- Confuse promo credits with points
