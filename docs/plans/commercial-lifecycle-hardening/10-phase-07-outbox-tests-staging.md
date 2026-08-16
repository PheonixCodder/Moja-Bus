# Phase 07 — Outbox, tests, staging gate

**Status:** Implemented (outbox + admin + docs; staging smoke pending sign-off)  
**Depends on:** Phases 00–06 functionally complete (tests accumulate earlier; this phase is the release gate)  
**Unlocks:** Production-ready commercial lifecycle confidence  
**Findings:** P2-2, P2-6*, P3-8 (completion), all remaining test gaps, staging recon  
**Notes:** [20-staging-smoke](./20-phase-07-staging-smoke.md) · [21-test-matrix](./21-phase-07-test-matrix.md)

\* P2-6 splits: **OUT** (D7 locked) — see [12-non-goals](./12-non-goals-and-do-not-regress.md).

## Goal

Durable notification delivery for commercial events, complete automated coverage for Traces A–E and concurrency, and a staging smoke + finance recon gate before calling the program done.

## Scope

### In
- Minimal transactional outbox for confirm / cancel / refund / referral / trip-cancel notices (D8)
- Worker/cron with idempotency + retry + ops visibility of failures
- Full test matrix expansion
- Staging smoke script/checklist
- Finance recon runbook execution
- Explicit non-goal confirmation for Paystack splits (D7)

### Out
- Platform-wide Novu redesign
- New campaign types / growth features

## Work items

### 07.1 — Outbox (P2-2)
1. Table: `OutboxMessage` (type, payload, status, attempts, nextAttemptAt, idempotencyKey).
2. Write in same DB transaction as confirm/cancel/referral enqueue.
3. Worker delivers via Novu; backoff; dead-letter list in admin.
4. Cover: booking confirmed, refund/cancel, referral reward, trip cancelled, hold created (optional).

### 07.2 — Test matrix (must pass)
| Scenario | Trace / ID |
|----------|------------|
| Wallet cancel | A / P0-1 |
| Admin credit zero-cash | B / P0-5 |
| Pending-pay credits reappear | C / P1-17 |
| Multi-seat refund | D / P0-2 |
| Delayed referral double INITIAL blocked | E / P0-6 |
| Trip cancel refund failure keeps entitlement | P0-3 |
| Amount sync after refreeze | P1-2 |
| Hold expiry releases reservations | P1-1 |
| Occupancy mid-route reuse | P1-3 |
| Concurrent budget last unit | P1-19 |
| Invalid voucher keeps coupon | P1-5 |
| cancel-trip multi-seat + wallet seats | P3-8 |

### 07.3 — Staging smoke checklist
1. Multi-seat Paystack book → cancel each seat → trip cancel another trip
2. Wallet + zero-cash book → cancel all channels
3. Claim credit full cover
4. Delayed referral two bookings before cron
5. Pending-pay abandon → reopen → pay with credits
6. FR locale book path
7. Mobile callback / verify paths
8. Run SQL recon from audit 07 + 12; zero unexpected rows

### 07.4 — Splits (D7)
1. If out: document in non-goals; leave validate script.
2. If in: separate sub-phase with CIV Paystack config — do not mix with outbox.

### 07.5 — Program close
1. Update `docs/commercial-lifecycle-audit` progress or `context/progress-tracker.md`
2. Mark each finding fixed/wontfix/deferred with link to PR
3. Memory: next work is growth features only after gate green

## Acceptance criteria

- [x] Outbox delivers with retry; failed messages visible to ops
- [x] All Trace A–E automated tests green in CI (see [21](./21-phase-07-test-matrix.md))
- [ ] Staging smoke checklist completed and filed ([20](./20-phase-07-staging-smoke.md))
- [ ] Recon SQL shows no P0 drift classes (or owned exceptions)
- [x] Finding coverage matrix closed or explicitly deferred (P2-6 = wontfix/D7)

## Risks

- Flaky Paystack sandbox — use recorded fixtures where possible
- Outbox backlog if Novu down — alert via admin dead-letter list

## Exit checklist

- [ ] Go/no-go signed by eng + ops
- [x] This plan folder status → Implemented (awaiting staging gate)
