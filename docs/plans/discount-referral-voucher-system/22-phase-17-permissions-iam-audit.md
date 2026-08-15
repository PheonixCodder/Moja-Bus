# Phase 17 — Permissions, IAM & Audit

**Status:** Partial (permission keys + API guards + marketing activity audit on key mutations; fraud queue UI landed)  
**Depends on:** Phases 03–04 surfaces  
**Unlocks:** Safe staff access; compliance trail

## Operator permission keys

Added to `packages/schemas/src/permissions.ts` + role templates:
- `promotions:read|create|update|pause`

## Admin permission keys

Added to `admin-permissions.ts`:
- `marketing:campaigns:read|write`
- `marketing:coupons:write`
- `marketing:vouchers:issue`
- `marketing:referrals:write`
- `marketing:fraud:review`
- [ ] `platform:promo-financials:read` (optional dedicated key — currently covered by marketing:campaigns:read)

## Audit

- [ ] Log campaign create/update/pause/archive to activity systems
- [ ] Manual voucher issue/revoke audit entries
- [ ] Referral program config change audit
- [ ] Fraud actions audit

## Acceptance criteria

- [x] Unauthorized staff cannot mutate campaigns (API permission checks)
- [x] Super admin can pause any operator campaign (admin setCampaignStatus)
- [ ] Audit entries visible for issue/revoke voucher

## Out

- Approvals workflow (explicitly not required per decision #6)
