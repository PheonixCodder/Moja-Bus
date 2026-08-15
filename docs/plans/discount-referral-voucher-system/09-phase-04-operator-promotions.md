# Phase 04 — Operator Promotions

**Status:** Partial (list/create/activate/coupon UI)  
**Depends on:** Phase 01–02  
**Unlocks:** Operator-funded growth without admin approval

## Goal

Operator staff with permission create company-scoped campaigns/codes for routes, schedules, trips; see costs; pause own campaigns. **No admin approval gate.**

## Permissions (add)

In `packages/schemas/src/permissions.ts`:
- `promotions:read`
- `promotions:create`
- `promotions:update`
- `promotions:pause`

Templates: OWNER, MANAGER get all; FINANCE gets read; AGENT none by default.

## tRPC

`discounts-operator.ts`:
- Same shape as admin but `companyId` forced from session
- `fundingType` locked to `OPERATOR` (operators cannot create PLATFORM-funded)
- Cannot edit another company’s campaign
- Can **opt in/out** of platform hybrid campaigns (`CampaignCompanyOptIn`)

## UI

Sidebar: **Growth → Promotions**
- List + create sheet/wizard
- Scope pickers reuse route/schedule/trip selectors from schedules ERP
- Budget + per-user cap controls
- Redemption table (passenger masked phone/name per privacy)

Revenue page: promo cost subsection (full analytics Phase 16).

## Guardrails

- Admin super-pause still wins (`pausedByAdminAt`)
- Code namespace: suggest prefix `COMPANYSLUG-` in UI; enforce unique globally
- Max active campaigns per company (platform setting, default e.g. 50)

## Acceptance criteria

- [ ] Operator publishes 15% route promo without admin
- [ ] Staff without permission gets 403
- [ ] Opt-in list for hybrid campaigns works
- [ ] Cannot set fundingType PLATFORM

## Out

- Checkout apply (Phase 05)
- Deep finance reports (Phase 16)
