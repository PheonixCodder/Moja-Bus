# 01 — Executive Summary

## Audit coverage

| Domain | Auditor | Files read (approx) | Findings |
|---|---|---|---|
| Operator + admin driver lifecycle | Deep agent + lead cross-check | ~30 files incl. drivers.ts (3,150 lines), assignment lib, all operator/admin views | 16 |
| Driver backend / registration / auth / status machine | Deep agent | drivers.ts full, schemas, Better Auth config, migrations | 15 (+P0) |
| Telemetry pipeline + Mapbox (3 surfaces) | Deep agent | server/*, ingest routes, scoring, deploy configs, both mobile map stacks, web maps | 19 |
| Passenger commerce / tickets / refunds / wallet / reviews / tracking | Deep agent | booking/payments/wallet/passenger routers, services, webhook routes, web+traveler screens | 16 |
| Notification fabric (Novu × outbox × subscribers × consumers) | Deep agent | all 46 workflows, every trigger site, process worker, both mobile Novu stacks | 16 |
| Security / IAM / crons / rate limits / env / deployment / tests | Deep agent | init.ts, RBAC engines, 14 cron routes × 2 schedule sources, Docker/compose/Caddy/CI, env files, test tree | 16 |

*(Per-domain counts are raw records; five defects were independently filed by two auditors each and are deduplicated in the consolidated catalog — 98 raw → 93 unique.)*

Cross-checks: prior-audit disposition verified finding-by-finding; QR payload chain traced across three surfaces; check-in family audited independently by two agents with convergent conclusions.

## What is genuinely solid (verified working)

- **Commercial core**: hold→quote→pay→webhook→confirm with layered over-sale defense (row locks + overlap queries + Serializable re-checks), HMAC-signed checkout quotes, SHA512-verified idempotent webhook, orphan-payment rescue, refund-sum invariant watchdog, escrow triple-protection release.
- **Remediation program landed**: all five prior P0s fixed and verified (telemetry identity, complete-run wiring, subscriber unification, exclusive-consent retry, earnings crash); crons fully scheduled on one fail-closed auth helper; assignment race safety = ordered FOR UPDATE locks + partial unique indexes with data-repair migration; DRIVER over-provisioning eliminated end-to-end; binding-confirm credential handoff shipped.
- **Security fabric**: disciplined tRPC procedure chain with per-request memoization; OWNER/SUPER_ADMIN implicit-all with grant-subset enforcement and hierarchy levels; narrow DRIVER template with zero ERP access for placeholders; AES-256-GCM bank storage w/ rotation + access audit; hashed single-use withdrawal 2FA; fail-closed cron auth everywhere.
- **Telemetry correctness**: authenticated ingest on both paths (stateless HMAC dispatch tokens, fail-closed in prod), shared strict validator, server-authoritative overspeed normalization, daily-capped penalty ledger in one transaction, serverless-safe HTTP persistence, honest flag-gated consumer UX.
- **Offer board**: provable salary privacy, anti-spam caps + DB backstop, rolling expiry with claim-guard cron, append-only negotiation audit, Seen chips, displaced-company notifications.

## The launch blockers (Gate 0 + Gate A)

| # | Finding | Why it blocks |
|---|---|---|
| **P0** | Migration tree can't reproduce the DB from git (enum drift + 5 untracked migration dirs) — fresh deploys reject every ON_TRIP/ON_DUTY write | Nothing else is testable on a clean environment; CI/deploy confidence zero |
| P1 | Driver scanner can't read issued QR codes (URL-wrapped token vs exact match) | Core boarding loop broken end-to-end |
| P1 | Check-in has no trip-assignment/tenancy binding; unpaid/cancelled boardable; tokens leak via manifest | Cross-company boarding + fraud surface |
| P1 | verifyPayment ownership hole — any user can claim another's hold via reference | Ticket theft |
| P1 | PAYSTACK refund channel reports COMPLETED while never refunding | Silent fund stranding, support liability |
| P1 | Cancelled/replaced/suspended runs strand drivers ON_TRIP forever (ghost buses; suspended drivers locked out mid-run) | Operational gridlock at scale |
| P1 | trip-cancelled + operator-delay notifications fail their own Zod schemas in prod | Flagship passenger notices are dead code |
| P1 | WS gateway hosted nowhere in prod; client futilely reconnects all trip | Real-time story is HTTP-only; expectation mismatch |
| P1 | Residual subscriber split: 8 security-relevant audiences lose in-app/push silently | Users miss suspension/payout/treasury alerts |
| P1 | CI deploys master with no tests/lint; 4 suites unwired; drivers/scoring/telemetry/assignment have ZERO tests | No regression protection for any fix above |

Plus the four `<div>` crashes in the registration wizard (Android) — the first screen every new driver touches.

## Recommended sequence

1. **Gate 0 (day 1):** commit migrations + enum repair + CI drift check; reconcile trackers. Nothing else verifies until a clean volume boots.
2. **Gate A (rest of week 1):** the nine remaining blockers + registration `<div>`s + full staging smoke (scan real QR, spoofed ping rejected, cancel notice received).
3. **Gate B (week 2):** the 30-item P2 batch, prioritized money-UX and notification-delivery items first.
4. **Gate C (weeks 3–4):** P3 sweep per catalog priorities.

Full evidence per finding: [11-findings-catalog-p0-p3.md](11-findings-catalog-p0-p3.md) → domain file → `file:line`.
