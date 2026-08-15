# Phase 02 — Discount Evaluation Engine

**Status:** Done (engine + unit tests)  
**Depends on:** Phase 01  
**Unlocks:** Admin/Operator CRUD validation, checkout integration, auto-apply

## Goal

Pure, thoroughly tested **eligibility + quote** engine: given context + optional code, return deterministic discount breakdown without writing redemptions.

## Module

`apps/web/features/discounts/engine/`

Suggested files:
- `types.ts` — `EvalContext`, `QuoteResult`, `RejectionReason`
- `eligibility.ts` — campaign filters
- `benefits.ts` — percent/fixed/free-seat math
- `stacking.ts` — stack groups + FAQ defaults
- `auto-apply.ts` — best candidate
- `evaluate.ts` — façade
- `__tests__/*` — matrix fixtures

## API (in-process)

```ts
evaluateCheckoutDiscounts(input: {
  ctx: EvalContext
  code?: string
  autoApply: boolean
  monetaryVoucherId?: string
}): QuoteResult
```

`QuoteResult` includes selected instruments, amounts, funding split preview, human-readable reject reasons (i18n keys).

## Work items

1. Implement eligibility rules from campaign fields
2. Implement stacking defaults from `04`
3. Budget check as **soft** (read `budgetConsumedXOF`; hard reserve in Phase 05)
4. Load campaigns via repository interface (Prisma impl)
5. Property/unit tests: ties, caps, first-booking, scope misses, expired, paused

## Acceptance criteria

- [ ] 30+ unit tests covering mechanics in decision #4
- [ ] Deterministic ties documented
- [ ] No DB writes in evaluate path
- [ ] Engine usable from tRPC later without UI

## Out

- Creating campaigns (Phase 03/04)
- Hold freezing (Phase 05)
