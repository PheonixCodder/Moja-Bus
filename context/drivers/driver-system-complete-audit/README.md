# Driver System — Complete Enterprise Audit

**Date:** 2026-08-26 · **Scope:** every driver-related surface in the monorepo, verified against code (not inherited from prior audits). Companion to (not a replacement of) `full-system-e2e-audit/` and `e2e-release-audit/`, whose remediation phases 00–38 are closed; this audit re-derives the CURRENT state end-to-end and adds new findings.

## Method

Read line-by-line: `packages/db/prisma/schema.prisma`, `apps/web/trpc/routers/{drivers,_app,init,admin(driver sections),trips(assignment)}.ts`, telemetry server stack (`apps/web/server/*`, `/api/v1/telemetry/ping`), operator drivers UI (roster/passport/marketplace/offers/fleet map), admin verification + marketplace hub, the full `apps/driver-app` surface (auth, wizard, preferences, trips/live/scanner/offers/profile/earnings, telemetry engine), passenger surfaces (`apps/traveler-app` incl. tracking screen, web `(passenger)` dashboard), storage purposes, crons, scoring/conflict/run-state libs.

## Module index

| # | File | Covers |
|---|---|---|
| 01 | `01-domain-model.md` | Every driver model/enum, invariants, strengths/weaknesses |
| 02 | `02-api-and-permissions.md` | Full tRPC procedure inventory + middleware/policy gates |
| 03 | `03-verification-approval.md` | How drivers are approved: admin hub + operator path |
| 04 | `04-operator-roster-hiring.md` | How operators add/edit/remove drivers; binding flows; confirmation semantics |
| 05 | `05-marketplace.md` | Listing model, discovery filters, public profiles, governance |
| 06 | `06-offers-board.md` | Offer lifecycle, counters, acceptance → affiliation |
| 07 | `07-dispatch-assignment-conflicts.md` | Assignment guards, conflict engine, urgent dispatch |
| 08 | `08-trip-execution-checkins.md` | Start/check-in/delay/complete, arrival parity |
| 09 | `09-shifts-status-earnings.md` | Status matrix, shift ledger, earnings placeholder |
| 10 | `10-telemetry-ingestion.md` | Ping pipeline end-to-end (HTTP prod path, dormant WS, validation/scoring) |
| 11 | `11-operator-fleet-map.md` | Live Fleet Telemetry Map deep dive |
| 12 | `12-passenger-tracking.md` | What passengers see; the live-tracking gap + fast path |
| 13 | `13-urban-vs-intercity.md` | Where the modes differ, where they don't |
| 14 | `14-documents-storage.md` | Who uploads which docs, private storage, read paths |
| 15 | `15-notifications-jobs.md` | Outbox fabric, Novu workflows, cron inventory |
| 16 | `16-security-posture.md` | IAM enforcement, tenancy, tokens, privacy |
| 17 | `17-gap-register.md` | Severity-ranked consolidated findings (1 blocker / 4 high / 12 medium / 9 low) |
| 18 | `18-driver-app.md` | Mobile app surface incl. wizard bug + boot gate |
| 19 | `19-phased-implementation-plan.md` | Findings → 7 shippable phases, easiest → hardest, with acceptance criteria |
| 20 | `20-phase2-execution-plan.md` | Phase 2 execution spec: locked rulings (D1/D3/D3b/D6), task order T1–T8, open ruling D8 (selfie bug) |

## Headline answers (the questions asked)

1. **How drivers are added** — three doors: operator add (`createDriver` with binding-confirm + credential handoff), self-registration wizard (`registerDriver`), marketplace offer acceptance (auto-affiliation). All converge on PENDING verification.
2. **How drivers are approved** — platform gate `verificationStatus=VERIFIED` set by owning operator (roster-scoped) or admin hub (governed, logged, notified); ≥1 compliance doc required; nightly licence-expiry flip; SUSPEND tears down run state on both surfaces.
3. **Route selection** — free-text route experience + base city + preferred contract type on the marketplace profile (driver-owned); dispatch assignment is operator-driven with conflict/licence engines; no structured route matching yet.
4. **Operator add + confirm** — instant roster membership via affiliation upsert; identity protected by masked binding-conflict dialogs; two-account ambiguity hard-stops.
5. **Marketplace** — auto-listed verified+available drivers; nuqs-persisted filters; featured cap 20; off-market redaction; salary never leaves driver surfaces.
6. **Offers** — full negotiation board (counter/counter-back/withdraw/expire ×3 enforcement layers) writing append-only audit events; acceptance auto-creates affiliations under one-exclusive rule.
7. **Documents** — four private R2 purposes under uploader namespace; presigned-at-render reads; operators upload licence photos at add-time, drivers upload everything at wizard-time.
8. **Fleet map** — real Leaflet map over the 10 s getLivePositions poll with freshness discipline; honest about polling; no WS/polyline/ETA by design until revival.
9. **Location tracking for passengers/operators** — ingestion is production-real (HTTP-only, tokenized, validated, scored); consumption is operator-poll only; passengers have a flag-gated honest stub + orphan map component. Gap register #6/#7 hold the fast path.
10. **Urban vs intercity** — derived from terminal geometry, snapshotted on trips, drives search/labels/intervals/dual-mode UI; NOT enforced between affiliation type and trip type (gap #3).

## Top actions if you fix only five things

1. `<div>` crash in wizard step 1 (#17.1).
2. Document inspector on operator passport (#17.2).
3. Verifications queue pagination (#17.4).
4. employmentType↔serviceType dispatch warning (#17.3).
5. Passenger tracking poll endpoint + wire the orphan map (#17.6).
