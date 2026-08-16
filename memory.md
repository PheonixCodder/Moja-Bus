# Memory — Moja Ride

Last updated: 2026-08-16 (schedule vouchers + zero-cash + cancel channels)

## Discount / referral / voucher

Audit: `docs/audits/discount-referral-voucher-system-audit-2026-08-15.md`  
Plan: `docs/plans/schedule-voucher-checkout-cancel-hardening.md`

### Sprint A–E (done earlier)
Growth loop, scopes, promo ceiling, promo credits catalog.

### Hardening (this session — implemented)
1. **Zero-cash / wallet payable** — `checkout-payable.ts`; wallet gate uses post-credit payable (not raw fare); `confirmFromWallet` allows payable=0 with promo legs
2. **Schedule-scoped cancellation vouchers** — `MonetaryVoucher.scheduleId` + `companyId`; issue on cancel; evaluate rejects mismatch; wallet/checkout show schedule; migration `20260816120000_voucher_schedule_scope`
3. **Operator cancel channels** — Wallet | Cash | Voucher on booking detail + manifest bulk/trip; shared channel; guests → cash
4. **Checked-in** — single cancel disabled; trip cancel **blocked** if any checked-in; bulk skips checked-in
5. **Pending pay** — `refreezeHoldDiscounts` + promo/voucher/credits UI on pending PaymentTab (parity with search)

### Apply before deploy
- `prisma migrate deploy` for voucher schedule columns

### Still open
- Traveler-app UI parity for pending pay / schedule voucher labels
- Phase 19 staging smoke + finance recon
- Novu marketing workflows

### Do not
- Commit secrets / service-account JSON / `google-services.json`
- Edit Cursor plan file `Discount Referral Plans-*.plan.md`
- Confuse promo credits with points
