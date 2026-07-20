# Moja Ride — Payment System Enterprise-Readiness Report

*Exhaustive code audit of the money/ledger/booking/payout surface. Written for operators, finance,
and security reviewers. Plain language, with file/line pointers to `audit/02–09`.*

> **Scope read this audit:** accounting engine, payment & booking services, all Paystack
> integration, all money-moving tRPC routers (operator/admin/payments/wallet/booking/trips),
> every cron + webhook route, refund/cancellation logic, bank encryption, and the wallet/revenue UI.
> Lower-risk operational routers (schedules/staff/search/public/invitation/fleet/routes/terminals)
> were grep-scanned and showed **no direct balance writes** — see tracker `01`.

---

## 1. WHERE OUR FEES ARE CUT (who pays the platform, and how much)

For a normal **CARD** booking of base fare `B` (XOF) for one seat:

| Party | Pays / Receives | Math (defaults: commission 5%, convenience 2.5%) |
|---|---|---|
| Passenger | Pays | `B + convenience` where `convenience = round(B × 250/10000)`. B=10,000 → **10,250** |
| Operator | Receives (escrowed) | `B − commission` where `commission = round(B × 500/10000)`. → **9,500** |
| **Platform take** | Keeps | `commission (500) + convenience (250) = 750` per seat |
| Paystack | Fee | ~2% of charge, paid by **the platform** (debited to `PAYMENT_PROCESSOR_FEES`) |

So the platform's real margin ≈ `750 − paystackFee` (≈205 XOF on 10,250). **The platform absorbs the
Paystack fee** — it is never passed to passenger or operator. This is correct and matches the design doc.

For a **WALLET** booking: passenger pays only `B` (convenience **waived**), operator still pays
commission, **no** Paystack fee (internal). Wallet bookings are more profitable for the platform AND
cheaper for the passenger — the product actively incentivizes wallet funding.

**Other fee/margin levers:**
- **Operator withdrawal (payout):** a separate `PAYMENT_PROCESSOR_FEE` post records the outbound
  Paystack transfer fee (debited to expense, credited to clearing). ✅ Correct per spec 09-settlement.
- **Refunds:** the **convenience fee is kept** by the platform; only the base fare is returned to the
  passenger; the platform **commission is clawed back**. So a refund costs the platform only the
  convenience fee it had already collected. ✅ Correct per spec 15-refunds.
- **Operator settlements** (admin `recordSettlement`): only used for the operator→clearing leg; see risks in §5.

Ledger accounts (code names, which drift from the docs — see §4): `PAYSTACK_CLEARING` (float),
`OPERATOR_RECEIVABLE` (escrow+available), `PASSENGER_WALLET`, `COMMISSION_REVENUE`,
`CONVENIENCE_FEE_REVENUE`, `PAYMENT_PROCESSOR_FEES`, `OFFLINE_REFUND_PAYABLE`.

---

## 2. WHERE WE LOSE MONEY (confirmed code paths)

### 🔴 Catastrophic (verify immediately)
- **F-11 — XOF ×100 overcharge — ✅ RESOLVED (verified).** `pricing-resolver.toPaystackAmountXOF`
  multiplies by 100 and `paystack-client` sends that; verify divides by 100. Verified in Paystack test
  mode: a 1,000 XOF topup showed **1,000 XOF** on Paystack's payment page (not 100,000) → Paystack
  normalizes the ×100, so no overcharge. Affects bookings AND top-ups equally, both correct. Keep
  F-14 (÷100 on verify) in sync with any future change.
- **F-12 — Paystack bank list is Nigeria, not Côte d'Ivoire.** `paystackListBanks` omits CI from
  `supportedCountries`, so operators see Nigerian banks and cannot configure a valid CI payout account.
  **RESOLVED (code + live-verified 2026-07-20):** `paystackListBanks` now filters `currency=XOF` (default market = CI); CI banks return and operators can configure CI payouts. The operator-payout market is unblocked. ✅

### 🟠 Real leaks under concurrency / failure
- **F-07 — Orphan-rescue double wallet credit.** A time-expired-but-still-`ACTIVE` hold + concurrent
  webhook and cron can credit the passenger's wallet **twice** (no ledger idempotency key + `EXPIRED`
  guard misses time-expired holds).
- **F-07b / F-29 — Payout reversal double credit.** The `transfer.failed` webhook guard is **outside**
  the transaction and posts `PAYOUT_REVERSAL` with **no idempotency key**; the `reconcile-payments`
  cron feeds a *synthetic* failed-transfer event that **bypasses the webhook dedup key**, so the cron
  and a real webhook can both reverse → operator availableBalance credited **twice** → platform loses
  the payout amount.
- **F-20 — Wallet top-up double credit — ✅ RESOLVED (docs, 2026-07-20).** `processTopUp` is already
  money-safe: `FinancialTransaction @@unique([externalPaymentId, type])` makes `TOP_UP` exactly-once;
  a 2nd concurrent/duplicate delivery hits P2002 and rolls back, and the prior unhandled P2002 → 500 was
  fixed earlier (graceful idempotent success, skip Novu). No code change required this session.
- **F-16 — Over-sale (double-booking).** `createHold`'s seat-conflict check is a non-locked
  read-then-insert, the `Booking` schema has **no** seat-exclusivity constraint, and `confirmFromPayment`
  doesn't re-check cross-hold-group seat ownership → two concurrent holds on one seat can both confirm.
  Two paying passengers, one seat → operator liability + trust damage.

### 🟡 Structural / contingent
- **F-17 — Withdrawal double-submit.** `requestWithdrawal` has no idempotency key; two valid
  balance-permitting withdrawals both succeed (operator's own funds, but violates exactly-once).
- **F-19 — `recordSettlement` no idempotency** → admin double-settlement (operator debited twice);
  plus it credits clearing with **no real bank transfer** and **no mandatory reason**.
- **F-24 — Cancellation no-snapshot fallback — ✅ RESOLVED (code, 2026-07-20).** When the pricing
  snapshot is missing, `CancellationService` now derives commission from `proportionalBase ×
  defaultCommissionBps / 10_000` (PlatformSettings) and claws it back, instead of skipping it. The
  snapshot path is unchanged.
- **F-31 — Trip-cancel swallows refund failure** → a passenger can be left with no refund and a
  cancelled trip (contingent on the insufficient-operator-balance path). **Decision pending (see §9).**
- **F-26 — `financial-calculations.ts` dead but divergent — ✅ RESOLVED (deleted, 2026-07-20).** The
  file (used `Math.floor` vs the live `Math.round`, a 6-type allowlist missing real types, a 100M cap)
  was confirmed to have zero importers and was deleted, so it can never be wired in.
- **Orphan rescue absorbs the Paystack fee** (platform eats the processing fee on abandoned checkouts)
  — intentional per spec, but a real cost.

---

## 3. WHERE THE PASSENGER HAS LEVERAGE

- **Wallet = closed-loop float.** Refunds go to `PASSENGER_WALLET` (not back to card). The passenger
  keeps usable balance inside the ecosystem and can re-book for free (no processor fee). The platform
  retains the capital. ✅ By design, but a float advantage to the platform.
- **Convenience fee waived for wallet** → passenger travels cheaper by pre-funding. Incentive toward
  wallet.
- **Instant refund to wallet** (no waiting on Paystack card refunds). Leverage: immediate access.
- **Escrow protects the passenger, not the operator.** Funds are locked until 24h after arrival, so a
  passenger can always get a refund if the trip fails; the operator is only paid after delivery. ✅
  Core trust mechanism, correctly implemented.
- **Cancellation keeps the convenience fee** — the passenger loses that sliver, but gets the base fare
  back. Predictable.
- **Over-sale (F-16)** is the biggest *passenger-harm* risk: a passenger could be sold a seat already
  promised to someone else. And **F-31** means a passenger whose refund throws is stranded with no
  money and no trip.
- **No guest checkout** (login required) — so the "guest loses fare" scenario does not apply; every
  booking is account-linked (validated with the user).

---

## 4. EVERY SPEC DIVERGENCE (docs vs code)

| # | Doc says | Code does | Ref |
|---|---|---|---|
| D-1 | Account classes `PLATFORM_COMMISSION`, `PLATFORM_CONVENIENCE_FEE`, `PAYMENT_PROCESSOR_FEE` | Code uses `COMMISSION_REVENUE`, `CONVENIENCE_FEE_REVENUE`, `PAYMENT_PROCESSOR_FEES` | F-05 — **user decision (2026-07-20): update docs to match code (D-1 closed, report §9)** |
| D-2 | Amounts are `BigInt` everywhere ("never coerce with Number()") | `AccountingEngine` uses JS `number` internally; does not import `lib/money.ts` | F-01 — **user decision (2026-07-20): accepted divergence, keep `number` (D-2 closed, report §9)** |
| D-3 | "a transaction must have ≥2 ledger entries" | Engine only requires ≥1 | F-02 |
| D-4 | Withdrawals require role `OWNER` | Gated by RBAC permission `withdrawals:create` (OWNER implicit-all; ADMIN-role operators and delegated staff can also, by default only OWNER/ADMIN-role get it). Destination is company-scoped, so blast radius limited. | operator.ts / authorize.ts |
| D-5 | Admin manual adjustments need a `reason` | `recordSettlement` takes only an optional `note`; `resolveWithdrawal` correctly requires `reason` | F-19 |
| D-6 | Withdrawals enforce 2FA + frequency limits | Settings `require_2fa_for_withdrawals` / `withdrawal_frequency_hours` now **enforced** in `requestWithdrawal` (F-18 ✅) | F-18 |
| D-7 | Commission computed (unspecified rounding) | Live `pricing-resolver` uses `Math.round`; dead `financial-calculations` uses `Math.floor` | F-26 |
| D-8 | Charge is whole XOF | Code sends `amount × 100` to Paystack; correct only if Paystack XOF is ×100-normalized (unverified) | F-11 |
| D-9 | Webhook idempotency key `${provider}:${eventType}:${reference}` | Key is `${event}:${reference}:${data.id}` (no `PAYSTACK:` prefix, appends Paystack id) | F-webhook-1 |
| D-10 | Some `17-implementation/` deep-dive files | Those files are 0-byte / do not exist (earlier scan) | — |

---

## 5. EVERY CONCURRENCY / IDEMPOTENCY / SECURITY GAP

### Concurrency & idempotency
| ID | Where | Gap | Severity |
|---|---|---|---|
| F-16 | createHold / confirmFromPayment | Non-locked seat-conflict check + no unique constraint + no cross-hold re-check → over-sale | 🟠 |
| F-07 | booking-confirmation rescueOrphanedPayment | No ledger idempotency key + `EXPIRED` guard misses time-expired holds | 🟠 |
| F-07b/F-29 | handleTransferWebhook + reconcile cron | Reversal guard outside tx, no key; cron synthetic event bypasses webhook dedup → double reversal | 🟠 |
| F-20 | processTopUp | No ledger key, guard outside tx → double wallet credit | 🟠 |
| F-17 | requestWithdrawal | No idempotency key / client nonce → duplicate payouts | 🟠 |
| F-19 | recordSettlement | No idempotency key → admin double-settlement | 🟠→MED |
| F-21 | resolveWithdrawal FORCE_FAIL | **RESOLVED (code, 2026-07-20)** — fee reversal added to admin FORCE_FAIL (mirrors webhook); double-reverse with webhook already prevented by `externalPaymentId` `@@unique` | ✅ |
| F-03 | AccountingEngine | Ledger idempotency **RESOLVED (docs, 2026-07-20)** — falls back to `tx.id-seq` when no key; F-17/F-19/F-21 pass explicit keys inside `FOR UPDATE` | ✅ |
| F-15 | handleTransferWebhook | Reversal amount sourced from display helper `toSafeDisplayNumber` | 🟡 |
| F-23 | verifyBankAccount | **RESOLVED (code, 2026-07-20)** — `FOR UPDATE` on company + `updateMany` clears other defaults → exactly one | ✅ |
| release-reservations cron | wallet reservation expiry | **RESOLVED (code, 2026-07-20)** — balance release now gated on an atomic `releasedAt` flip (`count === 1`) so it is exactly-once across concurrent runs; also recovers EXPIRED-not-released left by a crashed run. Adds `releasedAt DateTime?` to `WalletReservation` + migration `20260720140000_add_wallet_reservation_released_at`. | ✅ |

### Security
| ID | Where | Gap | Severity |
|---|---|---|---|
| F-12 | paystackListBanks | **RESOLVED** — now filters `currency=XOF`; CI banks return; live-verified 2026-07-20 | ✅ (was 🔴) |
| F-13 | paystack-client `require("node:crypto")` | **ACCEPTED (documented, 2026-07-20)** — Node-only; webhook route is Node (✅). User decision: document only (report §9) | 🟡 |
| CSRF | trpc/init.ts `csrfMiddleware` | Origin check skipped when `Origin` header absent; relies primarily on SameSite=Lax cookies (acceptable) | 🟡 |
| F-22 | admin.ts bank reveal | **RESOLVED (code, 2026-07-20)** — admin reveals now logged via `logBankAccess("VIEW_FULL")` at both sites | ✅ |
| F-18 | withdrawal 2FA/frequency | **RESOLVED (code, 2026-07-20)** — self-contained 2FA challenge + frequency window enforced in `requestWithdrawal` | ✅ |
| D-4 | withdrawal role | RBAC not strict OWNER; delegated staff *could* withdraw (but only to company bank) | 🟡 |
| ✅ POSITIVE | operator bank update | `isVerified` forced `false` — operators **cannot** self-verify/redirect payouts | — |
| ✅ POSITIVE | all routers | **No direct `financialAccount` balance writes** — every movement goes through the engine | — |
| ✅ POSITIVE | all cron routes | Protected by `CRON_SECRET` (fail-closed in prod) | — |
| ✅ POSITIVE | webhook | HMAC-SHA512 verified, returns 401 on mismatch, runs on Node runtime | — |
| ✅ POSITIVE | banking | AES-256-GCM + key rotation; masked at client; no plaintext logging in crypto layer | — |

---

## 6. ENTERPRISE READINESS VERDICT

**Production readiness (re-verified 2026-07-20 against the `improvements` branch):** the two 🔴 market-blockers are **both resolved** — F-11 (XOF ×100) was VERIFIED OK via live Paystack test, and **F-12 (CI bank list) is RESOLVED + live-verified** (CI banks now return; operators can configure CI payouts). F-32 (the `toSafeDisplayNumber` BigInt crash) was fixed during verification. The architecture (double-entry engine, deadlock-sort locking, escrow release, refund ledger, bank encryption, webhook HMAC, cron auth) is genuinely sound. **All HIGH money-correctness risks are now resolved:** F-16 (over-sale race, via `SELECT … FOR UPDATE` on `Trip`) and the full idempotency double-credit class (F-07, F-07b/F-29, F-17) via a `FinancialTransaction @@unique([externalPaymentId, type])` guard plus `externalPaymentId` stamped on every payout. See §7 for the full re-verification.

**Remaining work (all accepted/decided, no open money-correctness risk):** the P1 money-movement items (F-18 withdrawal 2FA/frequency, F-19 settlement idempotency+reason, F-21 admin FORCE_FAIL fee reversal, F-22 admin bank-reveal audit, F-23 `verifyBankAccount` default serialization) are **resolved in code**; the P2 items (F-03 ledger idempotency, F-20 top-up money-safety, F-24 no-snapshot commission clawback, F-26 dead-file deletion) are **resolved**; and F-01/F-05/F-31/F-13/F-14 are **user-decided divergences/documentation** (see §9) requiring no further code change. Low/benign findings (F-02, F-04, F-10, F-15, F-27, F-28, F-30) are accepted.

**Strong foundations:** the double-entry engine, deadlock-sort locking, escrow release, refund ledger,
bank encryption, webhook HMAC, and cron auth are genuinely well-built. The architecture is sound; the
previously-identified problem areas — (a) XOF amount handling (F-11, now verified), (b) missing
idempotency keys on money-out paths (F-17/F-19/F-20/F-21, now resolved), and (c) the double-booking
race (F-16, now resolved) — are all closed.

### Recommended fix order
1. **P0:** Verify/fix F-11 (XOF ×100) with a live Paystack test; fix F-12 (CI bank list).
2. **P0:** Add idempotency keys to `requestWithdrawal` (F-17), `processTopUp` (F-20),
   `handleTransferWebhook` reversal (F-07b/F-29), `recordSettlement` (F-19); move the reversal status
   guard *inside* the tx; share one `PAYOUT_REVERSE_${tx.id}` key across all reversal paths.
3. **P1:** Fix over-sale (F-16) — `SELECT … FOR UPDATE` in `createHold` + a deferred unique index /
   advisory lock on `(tripId, seatId, segment)`; re-check seat exclusivity at confirm.
4. **P1 — ✅ DONE: F-18/F-19/F-21/F-22** (withdrawal controls + admin settlement reason + admin FORCE_FAIL
   fee reversal + **admin bank reveals now audited** via `logBankAccess`).
5. **P2 — DONE this session (2026-07-20):** F-23 (serialize `verifyBankAccount` default), F-24 (no-snapshot
   commission clawback), F-26 (delete dead `financial-calculations.ts`), F-03 (idempotency — docs, already satisfied),
   F-20 (top-up — docs, already money-safe). **Still pending decision:** F-01 (BigInt migration),
   F-05 (account-class rename) — see §9. Low/benign: F-27/F-28 (passenger wallet UI), F-13/F-14 (paystack
   fragility), F-30 (publish-blogs inline auth).

### Files written this audit
- `audit/01-tracker.md` (status + full findings index)
- `audit/02-findings-accounting-and-services.md` (session 1)
- `audit/03-findings-withdrawal-admin-settlements.md` (this session)
- `audit/04-findings-booking-confirmation.md`, `05-findings-payment-service.md`,
  `06-findings-paystack.md`, `07-architecture-as-built.md` (session 1)
- `audit/09-findings-refunds-holds-ui.md` (this session)
- `audit/10-enterprise-readiness-report.md` (this file)

---

## 7. RE-VERIFICATION (2026-07-20) — cross-checked against live `improvements` code

Every open / "code-fixed, needs test" finding from §2–§5 was re-read against the current source
(not the docs). Results below. The single most important change since the original report: the
idempotency double-credit class **and** the over-sale race (F-16) are now **resolved in code**, not just designed. There are no open HIGH findings remaining.

### Resolved in code (re-verified)
| ID | What changed | Evidence |
|---|---|---|
| **F-07** | Orphan-rescue double wallet-credit — **resolved**. `rescueOrphanedPayment` now stamps `externalPaymentId: payment.id` on the `ORPHANED_PAYMENT_RESCUE` engine (`booking-confirmation-service.ts:482`). The `FinancialTransaction @@unique([externalPaymentId, type])` constraint (schema:1420) makes a second rescue a P2002 → exactly-once. The `status === "EXPIRED"` guard is now belt-and-suspenders. | `booking-confirmation-service.ts:452-528` |
| **F-07b / F-29** | Payout-reversal double-credit — **resolved**. `handleTransferWebhook` reversal uses `PAYOUT_REVERSAL` with `externalPaymentId` (= `transfer.transferCode`, stamped on `OPERATOR_PAYOUT` at `operator.ts:2262`). The reconcile cron feeds a *synthetic* `transfer.failed` event through the same `handleWebhookEvent`; both paths collide on `@@unique([externalPaymentId, type])` → exactly-once (P2002 caught at `payment-service.ts:467`). | `payment-service.ts:363-472`, `reconcile-payments/route.ts:44-60` |
| **F-17** | Withdrawal double-submit — **fix confirmed**. `idempotencyKey` lives in `metadata`; the dedup lookup (`operator.ts:2177`) runs *inside* the `FOR UPDATE` lock on the operator account (`:2170`). A duplicate returns the existing tx and skips the second Paystack payout. | `operator.ts:2111-2219` |
| **F-12** | CI bank list — **resolved + live-verified** (see §2). | `01-tracker.md` F-33 |
| **F-16** | Over-sale (double-booking) race in `createHold` — **resolved (code, 2026-07-20)**. `createHold` now acquires `SELECT … FOR UPDATE` on the `Trip` row at the top of its transaction, serializing all holds per trip so the seat-conflict check + booking insert are atomic. A concurrent hold blocks, then re-runs its check against the committed bookings and throws `CONFLICT`. A hard `UNIQUE(tripId, seatId)` was intentionally **not** used because segments are ranges (same seat on non-overlapping segments is valid, enforced via `segmentsOverlap`). `confirmFromPayment` also gained a defense-in-depth cross-hold re-check. | `booking-hold-service.ts:144-157`, `booking-confirmation-service.ts:89-126` |
| **F-19** | `recordSettlement` double-settlement — **fixed (code, 2026-07-20)**. Now stamps `idempotencyKey` (client nonce, uuid fallback) in `metadata`, dedups inside a `FOR UPDATE` lock on the operator account, requires `note` (mandatory justification — spec D-5), and performs the balance check *inside* the lock. An admin double-click now returns the existing `SETTLEMENT` instead of double-debiting the operator. | `payments.ts:300-375`, `payments-admin.ts:36-43` |
| **F-18** | Withdrawal 2FA & frequency — **resolved (code, 2026-07-20)**. `requestWithdrawal` now enforces both `PlatformSettings` controls when enabled: (1) **frequency limit** — rejects if the company's most recent non-failed `OPERATOR_PAYOUT` (`POSTED`/`SETTLED`/`PENDING`) is within `withdrawal_frequency_hours` (queried via `metadata.path(["companyId"])`; `companyId` is now stamped on every payout, mirroring the F-17 `idempotencyKey` pattern); (2) **2FA** — a single-use code issued via a new `requestWithdrawalChallenge` mutation, delivered through the existing `sendAuthOtp` channel (Novu `auth-otp` in prod, console in dev), stored **hashed** in a new self-contained `withdrawal_2fa_challenge` table, verified with a constant-time compare and **atomically consumed** (one use). The 2FA gate runs *before* the F-17 lock/payout, so a replayed request fails at the gate and the idempotency + `reference=txId` behaviour is preserved. Better Auth's `emailOTP` enum could not be extended (confirmed with the Better Auth agent), so the gate is deliberately isolated from auth internals. | `operator.ts` (`getWithdrawalControls`, `requestWithdrawalChallenge`, `requestWithdrawal`), `lib/withdrawal-2fa.ts`, `operator-withdraw-view.tsx`, `withdrawal_2fa_challenge` migration |
| **F-21** | Admin `resolveWithdrawal` FORCE_FAIL fee reversal — **resolved (code, 2026-07-20)**. The admin manual-fail path now also reverses the `PAYMENT_PROCESSOR_FEE` recorded at payout time (mirrors the webhook reversal in `payment-service.ts:412-456`): it finds the fee tx by `externalPaymentId`, posts a `PAYOUT_FEE_REVERSAL` (same `externalPaymentId`, so it collides on `@@unique` if re-run → exactly-once), and marks the fee tx `REVERSED`. The double-reverse-with-webhook concern was already closed by `PAYOUT_REVERSAL` carrying `externalPaymentId`. No more phantom fee debit on manual fails. | `admin.ts:1191-1281`, `payment-service.ts:412-456` |
| **F-22** | Admin bank-number reveals now **logged** — **resolved (code, 2026-07-20)**. `admin.ts` now imports `logBankAccess` and calls it (`action: "VIEW_FULL"`) at both plaintext reveal sites: the pending-bank company-verify flow (~`admin.ts:371`) and `verifyBankAccount` (~`admin.ts:893`). This mirrors how operator reveals are already audited, so every full bank-number disclosure (admin or operator) lands in `bankAccessLog`. | `admin.ts:370-378, 886-894`, `lib/bank-access.ts` |
| **F-23** | Concurrent `verifyBankAccount` → two `isDefault` — **resolved (code, 2026-07-20)**. The verification `$transaction` now takes `SELECT … FOR UPDATE` on the `company` row at the start (serializes verifications per company), sets `isDefault = !existingDefault`, and when true issues `bankAccount.updateMany({ where: { companyId, id: { not: bankAccountId }, isDefault: true }, data: { isDefault: false } })` so exactly one default remains. | `admin.ts:923-957` |
| **F-24** | Cancellation no-snapshot commission under-collection — **resolved (code, 2026-07-20)**. When `holdGroup.pricingSnapshot` is null, `CancellationService` reads `PlatformSettings.defaultCommissionBps` (fallback 500) and derives `commission = round(proportionalBase × bps / 10_000)`, reducing `proportionalOperatorNet` by it. The commission is now clawed back (`proportionalBase − proportionalOperatorNet`) instead of being skipped, and the ledger stays balanced (debits = `proportionalBase` = `refundAmountXOF`). The existing snapshot path is untouched. | `cancellation-service.ts:79-95, 110-134` |
| **F-26** | `financial-calculations.ts` dead but divergent — **resolved (deleted, 2026-07-20)**. The file was confirmed to have zero importers (grep across `apps/web` + `packages` returned nothing) and was removed. The latent trap (it used `Math.floor` vs the live `Math.round`, a 6-type allowlist missing real types, a 100M cap) can no longer be wired in by a future dev. | `lib/financial-calculations.ts` (deleted) |
| **F-03** | Ledger idempotency opt-in — **resolved (docs, 2026-07-20)**. `AccountingEngine.recordTransaction` already falls back to `${transaction.id}-${sequenceNumber}` when no explicit key is supplied (`AccountingEngine.ts:262-264`), so it is never un-keyed. The money-out callers that matter (F-17 withdrawal, F-19 settlement, F-21 admin fail) now pass an explicit `idempotencyKey` *inside* their `FOR UPDATE` lock, giving exactly-once. No code change required. | `AccountingEngine.ts:262-264`, `operator.ts`, `payments.ts`, `admin.ts` |
| **F-20** | `processTopUp` double-credit — **resolved (docs, 2026-07-20)**. Already money-safe: `FinancialTransaction @@unique([externalPaymentId, type])` (schema:1420) makes `TOP_UP` exactly-once; a 2nd concurrent/duplicate delivery hits P2002 and rolls back. The prior unhandled P2002 → 500 was fixed earlier (graceful idempotent success, skip Novu). No code change required this session. | `payment-service.ts:600-604` |
| **F-34** | release-reservations cron double-release + crash-recovery gap — **resolved (code, 2026-07-20)**. `apps/web/app/api/cron/release-reservations/route.ts` now (1) flips ACTIVE→EXPIRED idempotently, then (2) releases only reservations claimed via an atomic `releasedAt` flip (`updateMany` where `releasedAt: null`, `count === 1`), so two concurrent cron runs cannot both release the same reservation; Prisma `increment`/`decrement` keep same-account updates atomic. It also recovers reservations left `EXPIRED`-but-`releasedAt: null` by a crashed run. Adds `releasedAt DateTime?` to `WalletReservation` + migration `20260720140000_add_wallet_reservation_released_at`. | `release-reservations/route.ts`, `WalletReservation` (schema) |

### Accepted divergence / documented (user decision, 2026-07-20 — see §9)
| ID | Severity | Status |
|---|---|---|
| **F-01** | 🟡 MED | **Accepted divergence (user, 2026-07-20).** `AccountingEngine` keeps JS `number` (safe today — XOF amounts are small integers; `addDebit`/`addCredit` require `Number.isSafeInteger`). Spec D-2 closed. Revisit only if a precision bug surfaces. |

### Improved but not fully resolved
| ID | Status | Note |
|---|---|---|
| **F-31** | 🟡 MED (improved) | `cancelTripWithRefunds` no longer *silently* swallows a refund failure: it writes a `CANCEL_WITHOUT_REFUND` ledger entry (`cancel-trip-with-refunds.ts:133`) and marks the booking `CANCELLED` (`:128`). But there is still **no retry/escalation**, so a passenger can remain stranded (no money, no trip) until manual intervention. |

### Re-classified
| ID | Change | Reason |
|---|---|---|
| **F-15** | 🟡 MED → 🟢 LOW (benign) | `toSafeDisplayNumber` returns a `number`; `AccountingEngine.addDebit/addCredit` *require* a `number`. Using it as the reversal amount (`payment-service.ts:398/404`, `admin.ts:1227/1233`) is functionally correct, not a leak. The original "display helper as ledger amount" framing was a mischaracterization. |
| **F-16** | ✅ RESOLVED (code, 2026-07-20) | Over-sale race fixed via `SELECT … FOR UPDATE` on `Trip` in `createHold` + a confirm-side cross-hold re-check. **No open HIGH findings remain.** |

### Recommended next action (re-prioritized, 2026-07-20)
1. **P0 — ✅ DONE: F-16 (over-sale) fixed (2026-07-20).** `createHold` now locks the `Trip` row with `FOR UPDATE` + `confirmFromPayment` re-checks cross-hold. The only open HIGH is closed.
2. **P1 — ✅ ALL DONE:** F-19 (idempotency + `FOR UPDATE` + mandatory `note` + in-tx balance check), F-18 (withdrawal 2FA + frequency), F-21 (admin FORCE_FAIL fee reversal), **F-22** (admin bank reveals audited), **F-23** (`verifyBankAccount` default serialized).
3. **P2 — ✅ DONE this session:** F-03 (idempotency, docs — already satisfied), F-20 (top-up, docs — money-safe), F-24 (no-snapshot commission clawback, code), F-26 (dead file deleted). **Decided (§9, all user-approved recommended options, no code change):** F-01 (documented divergence), F-05 (update docs to match code), F-31 (log-only + ops runbook), F-13/F-14 (documented fragility).

---

## 9. DECISIONS — USER RESOLVED (2026-07-20)

The following were surfaced as large/risky migrations or product decisions. The user chose the
**recommended** option for each — they become **documented decisions, no code change this session**:

| ID | Type | Decision (user, 2026-07-20) | Implication |
|---|---|---|---|
| **F-01** | Large migration | **Leave as documented divergence.** Keep `number` in `AccountingEngine` (safe today — XOF amounts are small integers). Revisit only if a precision bug surfaces. | No migration. Spec D-2 divergence is now accepted/closed. |
| **F-05** | Widespread rename | **Update docs to match code.** The code names (`COMMISSION_REVENUE`, `CONVENIENCE_FEE_REVENUE`, `PAYMENT_PROCESSOR_FEES`) are authoritative; the spec will be corrected. | No rename. Spec D-1 divergence closed via doc fix. |
| **F-31** | Product decision | **Leave log-only + ops runbook.** Keep `CANCEL_WITHOUT_REFUND` + `CANCELLED` behavior; add an ops runbook for manual retry/escalation. | No new feature this session; failure remains caught + audited. |
| **F-13** | Fragility note | **Document only.** Webhook route is Node (✅); note the `node:crypto` Edge dependency. | No guard added; documented as a future-Edge risk. |
| **F-14** | Fragility note | **Document only.** Keep ÷100 in sync with F-11 (×100). | No guard added; documented. |

Low/benign findings (F-02, F-04, F-10, F-15, F-27, F-28, F-30) are accepted or out of scope for
this session unless explicitly requested.

