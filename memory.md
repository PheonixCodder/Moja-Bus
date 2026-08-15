# Memory — Moja Ride

Last updated: 2026-08-15

## Discount / referral / voucher system

### Always-on (done)
- Removed env kill switches (`DISCOUNTS_*`, `REFERRALS_*`, `CANCEL_VOUCHERS_*`, `AUTO_APPLY_*`) and `lib/flags.ts`
- Ops controls: campaign status + referral program `isActive`
- Typecheck clean (turbo); `web` Next.js build clean

### Phase 21 polish (done)
- Referral funnel bars, marketing opt-in blast, traveler `/referrals`, Terms §4.4–4.8

### Still human / GA
1. Sync Novu bridge / confirm workflows
2. Walk QA matrix + finance recon

### Do not
- Commit secrets / service-account JSON
- Edit Cursor plan file `Discount Referral Plans-*.plan.md`
