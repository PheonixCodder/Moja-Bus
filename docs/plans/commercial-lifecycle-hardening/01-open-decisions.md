# Locked decisions (2026-08-16)

Source: user confirmation in chat. Implementers must follow these; do not re-ask in PRs unless product changes.

| ID | Locked choice | Meaning in one line |
|----|---------------|---------------------|
| **D1** | **A — Wallet / cash / voucher only** | Cancel never auto-refunds Paystack card/MoMo in this program; use internal channels + honest labels. Paystack refund API = later follow-on if needed. |
| **D2** | **Subtotal only** | Convenience fee is **not** refunded. Document in passenger/operator copy. |
| **D3** | **B — `REFUND_PENDING` / disruption** | If trip cancel refund fails, booking does **not** become a normal cancelled-without-money ticket; it enters a disruption/refund-pending state with durable obligation + ops queue. |
| **D4** | **A — Baseline migration** | Additive migratable CREATE for missing discount/referral schema (IF NOT EXISTS / guards); safe cutover from `db push` envs. |
| **D5** | **Surgical quote** | Quote id/hash + reject stale; **not** a full PaymentIntent platform rewrite. |
| **D6** | **Defer traveler / mobile app** | Phase 06 is **web only**. Traveler-app parity = separate follow-up plan. |
| **D7** | **OUT** | Paystack split codes **not** in this program. Platform capture + ledger/escrow/payout remains the settlement model. |
| **D8** | **Minimal outbox now** | Phase 07: small outbox for confirm/cancel/refund/referral notifications. |

---

## D7 — Paystack splits — **LOCKED OUT**

Settled 2026-08-16: **out of scope**. App design remains platform Paystack capture + internal ledger/escrow/operator payout. Manual `validate-paystack-split.mjs` stays unused in production checkout.

---

## Where each locked decision applies

| ID | Phase | Concrete places in the product |
|----|-------|--------------------------------|
| D1 | **00** | Cancel channels, refund status labels, no call to Paystack refund API |
| D2 | **00** | Refund amount = ticket subtotal share only; UI “fee non-refundable” |
| D3 | **00** | `cancelTripWithRefunds`, new booking status, ops remediation queue, boarding rules |
| D4 | **02** | `packages/db` migrations / deploy |
| D5 | **04** | Checkout quote ↔ createHold ↔ confirm must share one server quote |
| D6 | **06** | Web i18n/privacy only; **no** `apps/traveler-app` work in this program |
| D7 | non-goal unless `in` | Paystack `initialize` + settlement model |
| D8 | **07** | Outbox table + worker for commercial Novu events |

---

## Historical options (reference only)

Full option tables that were offered before lock live in git history / earlier chat. Do not treat “recommended default” language as still open for D1–D6 or D8.
