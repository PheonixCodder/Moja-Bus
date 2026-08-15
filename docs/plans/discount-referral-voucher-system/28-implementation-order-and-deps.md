# 28 — Implementation Order & Suggested Sprints

## Critical path (first passenger value)

```
01 Schema → 02 Engine → 05 Checkout API → 06 Web UI (and/or 07 App)
```

Parallel after 01–02: **03 Admin** and **04 Operator** so campaigns exist before enabling checkout flag.

## Suggested sprint packing (adjust to team size)

| Sprint | Phases | Outcome |
|--------|--------|---------|
| S1 | 01, 02 | Schema + engine tested |
| S2 | 03, 04 | Admin + operator can create campaigns |
| S3 | 05, 06 | Web discounted checkout live (flagged) |
| S4 | 07, 13 | Mobile parity + auto-apply UX |
| S5 | 08, 09 | Monetary + cancel vouchers |
| S6 | 10, 11, 12 | Referrals + recurring credits + spend |
| S7 | 14, 15 | Fraud + notifications |
| S8 | 16, 17, 18 | Reports, IAM, legal/i18n |
| S9 | 19, 20 | QA gate + GA rollout |
| S10 | 21 | Launch polish (charts, opt-in blasts, app referrals, Terms) |

## Dependency matrix

| Phase | Hard deps |
|-------|-----------|
| 01 | — |
| 02 | 01 |
| 03 | 01, 02 |
| 04 | 01, 02 |
| 05 | 01, 02 |
| 06 | 05 |
| 07 | 05 |
| 08 | 01, 05 |
| 09 | 08 |
| 10 | 01, 03 (welcome campaign), 05 |
| 11 | 10, 12-or-parallel credits model |
| 12 | 05, 01 |
| 13 | 05, 06/07, 02 |
| 14 | 05, 10 |
| 15 | 08, 10, 11 |
| 16 | 05, 03/04 |
| 17 | 03, 04 |
| 18 | 06, 07, 09, 10 |
| 19 | all feature phases intended for GA |
| 20 | 19 |
| 21 | 10, 15, 16, 18 (polish on top of shipped surfaces) |

## Definition of Done (every phase)

1. Acceptance criteria checked in the phase markdown
2. Typecheck + relevant tests green
3. Feature flag behavior documented
4. `context/progress-tracker.md` bullet updated
5. No secrets in plan/code samples

## Who implements what (skill routing)

| Area | Follow |
|------|--------|
| Schema/Prisma | prisma-client-api / db push practice |
| Pricing/ledger | existing payment docs + AccountingEngine |
| Web UI | shadcn + vercel-react-best-practices |
| Mobile | vercel-react-native-skills + NativeWind |
| AuthZ | existing permissions catalogs |
| Notifications | novu-* skills |
| URL invite params | nuqs on web |

## Start tomorrow

Open [06-phase-01-foundation-schema-services.md](./06-phase-01-foundation-schema-services.md) and implement schema only — do not jump to UI.
