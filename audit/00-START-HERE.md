# Moja Ride — Payment System Code Audit (PERSISTED STATE)

> This folder is the durable record of an exhaustive, line-by-line audit of the Moja Ride
> financial/payment codebase, performed by reading the REAL code (not the docs).
> The docs (`docs/payment_system.md`, `docs/payment_system_parts/*`, `artifacts/payment_system_explanation.md`)
> describe the INTENDED system. This audit records the ACTUAL implementation and every divergence,
> money leak, passenger leverage point, and spec violation.

## Why this folder exists
The session context was about to be filled. Everything discovered so far is written here so the
audit can be resumed in a fresh session without re-reading already-covered files.

## HOW TO CONTINUE THIS AUDIT (read this in the next session)
1. Open `audit/01-tracker.md` — it has the status of every file (READ vs PENDING) and the findings index.
2. Open `audit/08-pending-files.md` — it lists exactly which files still need reading, grouped by area,
   with what to look for in each.
3. Open `audit/02-findings-*.md` and `audit/07-architecture-as-built.md` for what's already found.
4. Resume reading the PENDING files (start with the highest-risk: routers/operator.ts requestWithdrawal,
   API webhook + cron routes, cancellation-service, escrow-release, financial-calculations).
5. Append new findings to the appropriate `audit/02-findings-*.md` file (create new ones if needed).
6. Keep `audit/01-tracker.md` updated with READ/PENDING status and new findings.

## NEXT-SESSION PROMPT (paste this to resume)
```
Continue the Moja Ride payment-system code audit. Everything discovered so far is saved in
C:/Users/ubaid/OneDrive/Desktop/moja-buss/audit/ — read audit/01-tracker.md and
audit/08-pending-files.md FIRST to see what's done and what's left. Then keep reading the
PENDING files yourself (no subagents), append findings to audit/02-findings-*.md, and update
the tracker. The goal: exhaustively audit EVERY file that touches money/ledger/booking/payout
and produce a final enterprise-readiness report covering: (1) where fees are cut, (2) where we
lose money, (3) where the passenger has leverage, (4) every spec divergence, (5) every
concurrency/idempotency/security gap. Write findings in plain language like
artifacts/payment_system_explanation.md.
```

## PROGRESS SO FAR (as of this save)
- Files fully read & analyzed: 12 core files (DB services x4, payments services x3, payment lib x3,
  paystack-client, paystack-checkout). See `audit/01-tracker.md`.
- Files still PENDING: ~40+ files (API routes, all routers, cancellation/escrow libs, booking services,
  wallet/revenue feature UI, operator/admin withdrawal flows). See `audit/08-pending-files.md`.
- Critical open issues already confirmed in code:
  - **XOF amount ×100 (possible 100× overcharge)** — `pricing-resolver.toPaystackAmountXOF` multiplies by 100;
    Paystack verify divides by 100. Internally consistent BUT depends on Paystack's XOF interpretation.
    MUST verify against Paystack XOF docs / live test. See `audit/06-findings-paystack.md`.
  - **Paystack bank list returns Nigerian banks, not Côte d'Ivoire** — `paystackListBanks()` default hits
    `/bank` (Nigeria); CI not in supportedCountries. Breaks operator bank setup in the actual market.
  - **Orphan-rescue double-credit race** — no explicit ledger idempotency key + `EXPIRED` guard misses
    time-expired-but-ACTIVE holds; concurrent webhook+cron could credit passenger twice.
  - **Transfer-failure reversal double-credit race** — status guard is outside the tx; concurrent duplicate
    `transfer.failed` webhooks (Paystack sends duplicates) could reverse twice.
  - **Account-class drift** from docs (COMMISSION_REVENUE etc. vs PLATFORM_COMMISSION).
  - **Amounts are JS `number` not `BigInt`** inside AccountingEngine.
```
