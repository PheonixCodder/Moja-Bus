# Implementation order and dependencies

## Dependency graph

```text
                    ┌─────────────┐
                    │ 00 Cancel $ │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ▼            ▼            ▼
        ┌──────────┐ ┌──────────┐ ┌──────────┐
        │01 Ledger │ │02 Migr.  │ │ (spike)  │
        │incentives│ │+ repair  │ │parallel  │
        └────┬─────┘ └────┬─────┘ └──────────┘
             │            │
             └─────┬──────┘
                   ▼
            ┌─────────────┐
            │ 03 Hold/pay │  ← includes P1-17 Trace C
            └──────┬──────┘
                   ▼
            ┌─────────────┐
            │ 04 Search/  │
            │ quote/conc. │
            └──────┬──────┘
                   ▼
            ┌─────────────┐
            │ 05 Ops/flags│
            │ abuse/FSM   │
            └──────┬──────┘
                   ▼
            ┌─────────────┐
            │ 06 UX/i18n  │
            │ (web only)  │
            └──────┬──────┘
                   ▼
            ┌─────────────┐
            │ 07 Outbox + │
            │ staging gate│
            └─────────────┘
```

## Parallelism allowed

| Parallel with | Work |
|---------------|------|
| 00 | Draft Phase 02 migration SQL (no apply) |
| 00–01 | Write failing tests for Traces A–E |
| 01 | Promo grant repair dry-run reports |
| 03 | vercel.json cron schedule PR (after command exists) |
| 05 | Flag decision table (docs only) while 04 codes |
| 06 | Message catalog extraction while 05 finishes |

## Suggested sprint slices (indicative)

| Sprint | Focus |
|--------|--------|
| S1 | Phase 00.1–00.5 (provenance, unique, trip fail, statuses) |
| S2 | Phase 00.6–00.7 + Phase 01.1–01.3 |
| S3 | Phase 01.4–01.6 + Phase 02 apply + repairs |
| S4 | Phase 03.1–03.4 (expire + Trace C + amount sync) |
| S5 | Phase 03.5–03.7 + Phase 04 |
| S6 | Phase 05 |
| S7 | Phase 06 web UX/i18n/privacy |
| S8 | Phase 07 gate |

Adjust to team capacity; do not reorder 00 before 01’s grant fix if zero-cash cancel depends on funded credits for test fixtures — cancel provenance itself does not require 01, but Trace B tests do.

## Definition of done per phase

1. Work items checked  
2. Acceptance criteria checked  
3. Tests listed in phase green  
4. Finding IDs in matrix marked fixed in progress log  
5. No new P0 introduced (regression suite)
