# Non-goals and do-not-regress

## Non-goals (this program)

Unless an open decision overrides:

1. **New campaign types / growth experiments** — pause until Phase 00–01 (+ Trace C) land.
2. **Paystack subaccount split codes in production** (P2-6) — **OUT (D7 locked 2026-08-16)**. Keep manual validation script only. Platform capture + ledger/escrow/payout remains the model.
3. **Traveler / Expo app parity** — deferred (D6); file a follow-up plan later.
4. **Full PaymentIntent / Quote platform rewrite** — surgical quoteId in Phase 04 only (D5).
5. **Loyalty points system** — promo credits ≠ points; do not conflate in UI.
6. **Platform-wide Novu redesign** — only commercial outbox in Phase 07 (D8).
7. **Deleting historical CANCEL_WITHOUT_REFUND rows** — inventory and remediate, do not silent rewrite history.
8. **Changing commission economics** beyond fixing voucher liability / grant funding correctness.
9. **Committing secrets** / service-account JSON / `google-services.json`.
10. **Paystack original-instrument refunds** — deferred (D1=A); possible later Phase 00b.

## Do not regress (confirmed strengths)

From the compound audit — preserve and add regression tests where missing:

- Trip `FOR UPDATE` + segment overlap conflict at `createHold`
- Paystack amount verify + webhook HMAC + webhook idempotency
- Hold confirmation claim / duplicate confirm P2002 handling
- Wallet `FOR UPDATE` on confirm; checkout-payable helpers for zero-cash
- Schedule-scoped cancellation voucher match when schedule+company set
- Operator cancel channels WALLET/CASH/VOUCHER + guest→cash + checked-in guards
- Hybrid campaign funding bps split
- Credit lot FIFO by expiry
- Referral recurring caps + cron PENDING→ACTIVE claim
- Existing unique constraints on snapshots, payment refs, coupon/referral codes, ledger entry idempotency

## Related plans (do not confuse)

| Doc | Role |
|-----|------|
| `docs/plans/discount-referral-voucher-system/` | Original **build** of incentives |
| `docs/plans/schedule-voucher-checkout-cancel-hardening.md` | Earlier hardening notes |
| `docs/plans/commercial-lifecycle-hardening/` (**this**) | **Repair** program for audit findings |
| `docs/commercial-lifecycle-audit/` | Bug catalog — assessment only |

## Progress logging

When a phase ships, add a short entry to `context/progress-tracker.md` (or this folder `PROGRESS.md`) listing:

- Phase id  
- PRs  
- Finding IDs closed  
- Open decision values used (D1–D8)
