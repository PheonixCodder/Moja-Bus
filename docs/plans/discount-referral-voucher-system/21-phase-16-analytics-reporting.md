# Phase 16 — Analytics & Reporting

**Status:** Partial (summary + campaign performance + CSV export; charts/aging buckets later)  
**Depends on:** Redemptions flowing (Phases 05+), referral edges (10–11)  
**Unlocks:** Operator/admin commercial insight

## Admin reports

- [x] Marketing summary cards (redemptions, platform expense, voucher liability, referral funnel, abuse 7d)
- [x] Per-campaign performance (`campaignPerformance`)
- [x] CSV export of finalized redemptions (`exportRedemptionsCsv`)
- [x] Voucher liability aging buckets (0–30, 30–90, 90–365, 365+)
- [ ] Full referral funnel charts
- [ ] Top abused codes detail table

## Operator reports

- [x] Promotions summary (cost vs redemptions)
- [ ] Redemptions by route/trip
- [ ] Budget burn charts
- [ ] Hybrid opt-in campaign performance

## Implementation

- tRPC aggregate queries + CSV export (done for admin redemptions)
- Materialized daily summary table if needed (`CampaignDailyStats`) — add only if live queries slow
- Charts reuse existing revenue dashboard components — not started

## Acceptance criteria

- [x] Admin can open campaign panel and see redemption count + funded amounts
- [x] Operator summary scoped to own company
- [x] CSV export for finance (admin)
- [ ] Staging recon: redemption totals ≈ ledger promo expense ± rounding

## Out

- External BI warehouse sync
