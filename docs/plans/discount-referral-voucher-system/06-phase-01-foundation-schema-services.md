# Phase 01 — Foundation: Schema & Shared Packages

**Status:** In progress (foundation + surfaces landed; push schema delta for CreditLot PENDING)  
**Depends on:** nothing (first build phase)  
**Unlocks:** all later phases

## Goal

Land additive Prisma models, Zod schemas, and empty service module boundaries without changing checkout behavior yet.

## Scope

### In
- Prisma enums + models from `03-domain-model-schema.md`
- Nullable/new columns on `PricingSnapshot`
- Relations on `User`, `Company`, `HoldGroup`
- `packages/schemas` Zod for campaigns, coupons, vouchers, referral config
- Package module stubs: `apps/web/features/discounts/` (or `packages/discounts` if shared — **locked: keep services in `apps/web/features/discounts` with schemas in `packages/schemas`** like existing payments)
- Feature flag env: `DISCOUNTS_ENABLED=false` default
- Unit test scaffolding for schema parse only

### Out
- tRPC mutations that mutate money
- UI
- Changing `buildPricingBreakdown` behavior (optional types only)

## Work items

1. Author Prisma models; `db push` on dev
2. Export types from `@moja/db`
3. Create Zod schemas + permission keys stubs (keys wired in Phase 17; can add to catalog now)
4. Document account class string constants in payments/accounting constants file
5. Seed helper for local: sample platform campaign (inactive)

## Acceptance criteria

- [ ] `prisma generate` + web typecheck pass
- [ ] No change to production checkout totals with flag off
- [ ] Models queryable via Prisma Studio
- [ ] Schema docs in this folder match shipped fields (update 03 if drift)

## Risks

- Over-modeling FREE_SEAT before seat-level fares exist → keep benefit but implement as `baseFare × N` only
