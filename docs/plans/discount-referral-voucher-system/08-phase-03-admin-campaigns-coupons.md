# Phase 03 — Admin Campaigns & Coupons

**Status:** Partial (list/create/activate/coupon + referral settings card)  
**Depends on:** Phase 01, Phase 02 (for validate-on-save rules)  
**Unlocks:** Platform growth ops; hybrid campaign definitions

## Goal

Admin can create, schedule, pause, archive platform (and hybrid) campaigns; mint coupon codes; view redemptions.

## tRPC

Router: `apps/web/trpc/routers/discounts-admin.ts` (or nest under `admin`)

Procedures (adminProcedure + new permission keys):
- `campaign.list|get|create|update|setStatus`
- `coupon.list|create|bulkCreate|deactivate`
- `redemption.list` (filter by campaign)
- `voucher.issueManual` (optional here or Phase 08)
- `referralProgram.get|update` (config only; full referral UI Phase 10)

## UI

Nav: **Marketing** section in `admin-sidebar.tsx`
- `/dashboard/admin/marketing/campaigns`
- `/dashboard/admin/marketing/campaigns/[id]`
- `/dashboard/admin/marketing/coupons`

Views:
- Campaign table: status, funding, window, redemptions, budget bar
- Campaign editor: benefit, scope, caps, stacking, hybrid shares, auto-apply toggle
- Coupon manager: generate single/bulk, export CSV, deactivate

Reuse shadcn patterns from admin inquiries / banners.

## Hybrid specifics

- `fundingType=HYBRID` requires share bps sum 10000
- Optional `requireOperatorOptIn` → uses `CampaignCompanyOptIn`
- Admin can force-include all operators (flag) for national campaigns

## Acceptance criteria

- [ ] Admin can publish ACTIVE platform percent coupon end-to-end (DB only; checkout later)
- [ ] Pause immediately excludes campaign from engine reads
- [ ] Audit log entry on create/pause (Phase 17 can deepen; minimal activity log now)
- [ ] EN/FR labels for admin nav (Phase 18 polish OK if keys exist)

## Out

- Operator UI (Phase 04)
- Passenger apply (Phase 05+)
