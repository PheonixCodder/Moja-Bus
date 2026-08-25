# 13 — Phased Execution Plan (v2 Audit Remediation)

> **Source:** `11-findings-catalog-p0-p3.md` — **93 unique findings** (98 records, 5 cross-domain dups).
> **Rule:** one phase = one focused execution session, shippable and verifiable on its own. No phase mixes unrelated subsystems. Every phase lists the exact findings it closes (each of the 93 IDs appears in exactly ONE phase), files in scope, tasks, acceptance criteria, and a staging verification probe.
> **Ordering principle:** environment first (nothing verifies until a clean volume boots) → CI safety net (so every later fix lands with regression protection) → launch blockers → subsystem clusters (server before client where shared code is touched) → polish → hygiene sweeps last.

---

## Wave 1 — Foundation (must precede everything)

| Phase | File | Findings closed | Theme |
|---|---|---|---|
| 00 | `phase-00-db-reproducibility.md` | F-DV-01 (P0) | Migrations reproduce the DB; drift check in CI |
| 01 | `phase-01-ci-quality-gate.md` | F-IN-05, F-IN-06 (P1×2) | Tests + lint actually gate deploys |

## Wave 2 — Launch blockers (Gate A)

| Phase | File | Findings closed |
|---|---|---|
| 02 | `phase-02-scanner-ticket-parsing.md` | F-PS-03 ≡ F-DV-02 |
| 03 | `phase-03-check-in-authorization.md` | F-IN-01 ≡ F-DV-03 |
| 04 | `phase-04-payment-verify-ownership.md` | F-PS-01 |
| 05 | `phase-05-refund-channel-truth.md` | F-PS-02 |
| 06 | `phase-06-driver-run-state-lifecycle.md` | F-DV-04 |
| 07 | `phase-07-passenger-notice-schemas.md` | F-NF-01, F-NF-02 |
| 08 | `phase-08-subscriber-identity-completion.md` | F-NF-03 |
| 09 | `phase-09-realtime-transport-posture.md` | F-TM-01 ≡ F-IN-04, F-TM-10 |

## Wave 3 — Hardening clusters (P2)

| Phase | File | Findings closed |
|---|---|---|
| 10 | `phase-10-telemetry-client-resilience.md` | F-TM-04, F-TM-05, F-TM-06 |
| 11 | `phase-11-gateway-authz-fleet-channel.md` | F-TM-02, F-TM-03 ≡ F-IN-03 |
| 12 | `phase-12-driver-hud-ground-truth.md` | F-TM-11 |
| 13 | `phase-13-roster-management-completeness.md` | F-OP-02, F-OP-04 |
| 14 | `phase-14-dispatch-eligibility-gates.md` | F-OP-03, F-DV-12, F-DV-15, F-IN-02 ≡ F-OP-13 |
| 15 | `phase-15-registration-documents-pipeline.md` | F-DV-05 |
| 16 | `phase-16-driver-server-guardrails.md` | F-DV-06, F-DV-08, F-DV-10, F-NF-16 |
| 17 | `phase-17-delay-persistence-shift-ledger.md` | F-DV-09, F-DV-07 |
| 18 | `phase-18-traveler-money-ux.md` | F-PS-04, F-PS-05, F-PS-06 |
| 19 | `phase-19-review-integrity.md` | F-PS-07, F-PS-08, F-PS-09 |
| 20 | `phase-20-offer-notification-keys-ctas.md` | F-NF-04, F-NF-09, F-DV-13 |
| 21 | `phase-21-push-tap-routing-devices.md` | F-NF-05, F-NF-06 |
| 22 | `phase-22-notification-operations.md` | F-NF-07, F-NF-08, F-NF-10 |

## Wave 4 — Polish (P3)

| Phase | File | Findings closed |
|---|---|---|
| 23 | `phase-23-fleet-map-reality.md` | F-OP-01, F-TM-12 |
| 24 | `phase-24-offers-marketplace-polish.md` | F-OP-05, F-OP-06, F-OP-07, F-OP-08 |
| 25 | `phase-25-admin-governance-profile-privacy.md` | F-OP-09, F-OP-10 |
| 26 | `phase-26-recruitment-path-robustness.md` | F-OP-11, F-OP-12, F-OP-16 |
| 27 | `phase-27-roster-filters-query-hygiene.md` | F-OP-14, F-OP-15 |
| 28 | `phase-28-telemetry-state-validation-parity.md` | F-TM-07, F-TM-08, F-TM-09 |
| 29 | `phase-29-anomaly-observability-scoring.md` | F-TM-13, F-TM-14, F-TM-18 |
| 30 | `phase-30-mobile-map-compliance-cache.md` | F-TM-15, F-TM-16, F-TM-17, F-TM-19 |
| 31 | `phase-31-driver-app-data-honesty.md` | F-DV-11, F-DV-14 + 4 unnumbered observations |
| 32 | `phase-32-passenger-money-polish.md` | F-PS-13, F-PS-14, F-PS-15 |
| 33 | `phase-33-booking-taxonomy-guest-strategy.md` | F-PS-10, F-PS-11, F-PS-16 |
| 34 | `phase-34-notification-small-fixes.md` | F-NF-11, F-NF-12, F-NF-13, F-NF-14, F-NF-15 |
| 35 | `phase-35-web-security-headers-origins.md` | F-IN-08, F-IN-09, F-IN-10, F-IN-16 |
| 36 | `phase-36-config-crons-artifacts-hygiene.md` | F-IN-07, F-IN-11, F-IN-14 |
| 37 | `phase-37-money-path-misc-hardening.md` | F-IN-12, F-IN-13, F-IN-15 |
| 38 | `phase-38-i18n-leakage-sweep.md` | F-PS-12 + cross-app hardcoded-string inventory |

**Coverage check:** 93/93 finding IDs mapped to exactly one phase (duplicate-record pairs co-located in the same phase and closed together). 39 phases total: 2 foundation · 8 blocker · 13 hardening · 16 polish.

---

## Execution rules (enterprise quality bar)

1. **One session per phase.** If a phase grows beyond its listed scope mid-execution, stop and split — never ship a half-phase.
2. **Every phase ends green:** `pnpm turbo typecheck` + `pnpm turbo test` (after Phase 01 wires the runner) + biome on touched files.
3. **Every behavioral change ships with a test** in the same phase (unit for logic, contract test for notification payloads, integration for tRPC procedures where harness exists).
4. **Schema-touching phases** (00, 14, 15, 33) must include the migration in the same PR and pass the Phase-00 clean-volume rehearsal before merge.
5. **Decision-required phases** (05, 09, 22-F-NF-08, 33-F-PS-11) begin with the documented decision, ratified before implementation — see each file's "Decision" block.
6. **Staging probes:** each phase names its reproduction; the release checklist (`12-release-checklist.md`) consolidates them into Gate sign-offs.
7. Trackers (`context/progress-tracker.md` Milestone Log + this folder's phase checkboxes) update in the same session as the work.
