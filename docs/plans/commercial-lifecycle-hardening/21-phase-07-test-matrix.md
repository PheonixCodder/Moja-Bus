# Phase 07 — Test matrix status

Automated Trace A–E and concurrency coverage accumulated in Phases 00–05.
This file is the Phase 07 release gate checklist for CI + staging.

| Scenario | Trace / ID | Automated | Location / notes |
|----------|------------|-----------|------------------|
| Wallet cancel | A / P0-1 | ✅ | `phase00-cancel-refund.test.ts` |
| Admin credit zero-cash | B / P0-5 | ✅ | `phase01-incentive-ledger.test.ts` |
| Pending-pay credits reappear | C / P1-17 | ✅ | `pending-pay-self-reservation.test.ts` |
| Multi-seat refund | D / P0-2 | ✅ | `phase00-cancel-refund.test.ts` |
| Delayed referral double INITIAL blocked | E / P0-6 | ✅ | `phase01-incentive-ledger.test.ts` |
| Trip cancel refund failure keeps entitlement | P0-3 | ✅ | phase00 / cancel-trip paths |
| Amount sync after refreeze | P1-2 | ✅ | checkout / hold tests |
| Hold expiry releases reservations | P1-1 | ✅ | `phase03-expire-hold.test.ts` |
| Occupancy mid-route reuse | P1-3 | ✅ | `max-path-occupancy.test.ts` |
| Concurrent budget last unit | P1-19 | ✅ | `budget-reserve-guard.test.ts` |
| Invalid voucher keeps coupon | P1-5 | ✅ | evaluate / promo tests |
| cancel-trip multi-seat + wallet seats | P3-8 | ✅ | phase00 / cancel-trip |
| Outbox enqueue idempotency / backoff | P2-2 | ✅ | `outbox/__tests__/outbox.test.ts` |

Staging smoke (manual): [20-phase-07-staging-smoke.md](./20-phase-07-staging-smoke.md)
