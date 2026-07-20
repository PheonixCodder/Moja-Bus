# Audit Tracker — File Status & Findings Index

Last updated: 2026-07-20 (session 3 of audit — F-18 withdrawal 2FA/frequency enforced)
Last re-verified: 2026-07-20 (against `improvements` branch — F-07/F-07b/F-29/F-17/F-19/F-21/F-31/F-16/F-22/F-23/F-18/F-01/F-03/F-15 cross-checked against live code; see RE-VERIFICATION section below).

Legend: ✅ READ & analyzed · ⏳ PENDING

## A. FILES STATUS

### packages/db (services) — ALL READ (session 1)
| File | Lines | Status | Key finding refs |
|---|---|---|---|
| packages/db/src/index.ts | 48 | ✅ | Prisma client singleton |
| packages/db/src/services/AccountingEngine.ts | 281 | ✅ | F-01 amount-as-number, F-02 ≥1 entry, F-03 ledger idempotency opt-in, F-04 no post-assert |
| packages/db/src/services/FinancialAccountService.ts | 121 | ✅ | F-05 account-class drift |
| packages/db/src/services/SnapshotService.ts | 135 | ✅ | OK (UTC, idempotent upsert) |

### apps/web/features/payments — ALL READ
| File | Lines | Status | Notes |
|---|---|---|---|
| services/booking-confirmation-service.ts | 530 | ✅ | F-07 orphan rescue race, F-10 zero-net skip, F-07c guest (moot) |
| services/cancellation-service.ts | 393 | ✅ | refund ledger correct; F-24 ✅ no-snapshot commission now clawed back (defaultCommissionBps) |
| services/booking-receipt-email.ts | 99 | ✅ | OK (no PPI leak, no money math) |
| services/payment-service.ts | 690 | ✅ | F-07b transfer-failure dbl-credit, F-webhook-1/2/3, F-15 display-as-amount, F-20 topup dbl-credit |
| lib/pricing-resolver.ts | 140 | ✅ | OK (matches spec formula); F-11 ×100 |
| lib/resolve-hold-group.ts | 128 | ✅ | OK |
| lib/paystack-checkout.ts | 181 | ✅ | OK (UI only) |
| lib/booking-success-url.ts | 19 | ✅ | OK (internal redirect, no open-redirect) |
| providers/paystack-client.ts | 370 | ✅ | F-11 ×100, F-12 CI bank list, F-13 require(node:crypto), F-14 ÷100 |
| providers/paystack-provider.ts | 91 | ✅ | OK (thin wrapper) |
| registry.ts / types.ts / hooks/* / scripts/* | — | ✅ (scanned) | no money math/signature issues |

### apps/web/lib (money/config/refund/escrow/bank) — ALL READ
| File | Status | Notes |
|---|---|---|
| lib/money.ts | ✅ | OK (BigInt helpers); engine doesn't import it (F-01) |
| lib/cancel-trip-with-refunds.ts | ✅ | F-31 swallow failure → stranded passenger; guest moot (F-GUEST-RESOLVED) |
| lib/escrow-release.ts | ✅ | OK (last-seat residual) |
| lib/financial-calculations.ts | ✅ | F-26 ✅ DELETED 2026-07-20 (was DEAD + divergent: floor vs round, 6-type allowlist, 100M cap) |
| lib/platform-settings.ts | ✅ | OK (audit-logged); F-18 2FA/freq settings now enforced in requestWithdrawal |
| lib/cron-auth.ts | ✅ | OK (fail-closed) |
| lib/bank-crypto.ts | ✅ | OK (AES-256-GCM + rotation) |
| lib/bank-account.ts | ✅ | OK (mask/reveal) |
| lib/bank-access.ts | ✅ | F-22 ✅ now logged in admin.ts (both reveal sites call `logBankAccess`) |
| lib/trip-generator.ts / trip-status.ts | ✅ (scanned) | not money-core |

### apps/web/app/api (routes) — ALL READ (money-relevant)
| File | Status | Notes |
|---|---|---|
| api/webhooks/paystack/route.ts | ✅ | OK (HMAC 401 + nodejs runtime) |
| api/cron/release-escrow/route.ts | ✅ | OK (engine + idempotency + advisory lock + clearedAt re-check) |
| api/cron/reconcile-payments/route.ts | ✅ | F-29 synthetic event can double-reverse with webhook |
| api/cron/release-reservations/route.ts | ✅ | direct `financialAccount.update` (documented exception) now exactly-once via `releasedAt` claim guard (F-34 ✅ — concurrent + crash-safe) |
| api/cron/snapshot-accounts/route.ts | ✅ | OK |
| api/cron/generate-trips/route.ts | ✅ | auth OK (not money-core) |
| api/cron/publish-blogs/route.ts | ✅ | F-30 inline auth (fails closed in dev) |
| api/payments/verify/route.ts | ✅ | OK (internal redirect) |
| api/tickets/verify/route.ts | ✅ | OK |
| api/novu/route.ts | ✅ (scanned) | not money-core |
| api/auth/[...all]/route.ts | ✅ (scanned) | not money-core |
| api/trpc/[trpc]/route.ts | ✅ (scanned) | not money-core |

### apps/web/trpc/routers — MONEY-CRITICAL ALL READ; operational scanned
| File | Status | Priority |
|---|---|---|
| routers/operator.ts | ✅ | CRITICAL — requestWithdrawal F-17, bank gating ✅, 2FA+freq enforced F-18 ✅ |
| routers/admin.ts | ✅ | HIGH — resolveWithdrawal F-21 ✅ (fee reversal added), verifyBankAccount F-22/F-23, listLedgerEntries OK |
| routers/payments.ts | ✅ | HIGH — recordSettlement F-19, treasury OK |
| routers/wallet.ts | ✅ | HIGH — topUp F-20/F-11, getWalletBalance OK |
| routers/booking.ts | ✅ | HIGH — createHold F-16; assertHoldOwnedByUser enforced |
| routers/passenger.ts | ✅ (scanned) | MED |
| routers/trips.ts | ✅ (scanned) | MED — cancelTrip → cancelTripWithRefunds |
| routers/schedules.ts / staff.ts / search.ts / public.ts / invitation.ts / fleet.ts / routes.ts / terminals.ts / blog.ts | ⏳ (scanned via grep; no direct balance writes found) | LOW-MED |

### apps/web/features (wallet/operator-revenue/passenger UI) — READ (money-display)
- features/operator/components/revenue/* | ✅ | OK (use toSafeDisplayNumber/formatXOF)
- features/passenger/* (wallet view/card) | ✅ | F-27 walletId bug, F-28 toLocaleString
- features/booking/components/* | ✅ (scanned) | mostly UI

---

## RE-VERIFICATION (2026-07-20) — findings re-read against live `improvements` code

> Every open / "code-fixed, needs test" finding was re-read against the current source. The
> idempotency double-credit class is now RESOLVED IN CODE via `FinancialTransaction
> @@unique([externalPaymentId, type])` (schema:1420) + `externalPaymentId` stamped on every payout.

| ID | Prior | Re-verify (2026-07-20) | One-line evidence |
|---|---|---|---|
| F-16 | 🟠 HIGH | **RESOLVED (code, 2026-07-20)** | `createHold` now `SELECT … FOR UPDATE` on `Trip` → serializes holds per trip (atomic conflict-check + insert); `confirmFromPayment` adds cross-hold re-check — `booking-hold-service.ts:144-157`, `booking-confirmation-service.ts:89-126` |
| F-07 | 🟠 HIGH | **RESOLVED (code)** | rescue stamps `externalPaymentId: payment.id` → `ORPHANED_PAYMENT_RESCUE` collides on `@@unique` → exactly-once — `booking-confirmation-service.ts:482` |
| F-07b | 🟠 HIGH | **RESOLVED (code)** | `PAYOUT_REVERSAL` carries `externalPaymentId` (= `transfer.transferCode`) → cron synthetic + webhook collide on `@@unique` — `payment-service.ts:386,467` |
| F-29 | 🟠 HIGH | **RESOLVED (code)** | same as F-07b — reconcile cron reuses `handleWebhookEvent` — `reconcile-payments/route.ts:44-60` |
| F-17 | ✅ FIXED | **CONFIRMED FIXED** | idempotency key in metadata, dedup *inside* `FOR UPDATE` on operator acct — `operator.ts:2170-2186` |
| F-19 | 🟠→MED | **RESOLVED (code, 2026-07-20)** | `recordSettlement` now: idempotency key (metadata dedup inside `FOR UPDATE`) + `note` required + balance check inside lock — `payments.ts:300-375` |
| F-21 | 🟡 MED | **RESOLVED (code, 2026-07-20)** | Admin `resolveWithdrawal` FORCE_FAIL now also reverses the `PAYMENT_PROCESSOR_FEE` (mirrors webhook at `payment-service.ts:412-456`): finds the fee tx by `externalPaymentId`, posts `PAYOUT_FEE_REVERSAL`, marks it `REVERSED`. Double-reverse with webhook already prevented by `externalPaymentId` `@@unique`. | admin.ts:1191+ |
| F-22 | 🟡 MED | **RESOLVED (code, 2026-07-20)** | `admin.ts` now imports `logBankAccess` and calls it (`action: "VIEW_FULL"`) at both reveal sites — pending-bank verify flow (`admin.ts:~371`) and `verifyBankAccount` (`admin.ts:~893`) — mirroring operator reveals. |
| F-23 | 🟡 MED | **RESOLVED (code, 2026-07-20)** | `verifyBankAccount` now takes `SELECT … FOR UPDATE` on `company` at the start of the tx; sets `isDefault = !existingDefault` and, when true, `updateMany` clears other company defaults → exactly one default — `admin.ts:923-957` |
| F-18 | 🟡 MED | **RESOLVED (code, 2026-07-20)** | `requestWithdrawal` now enforces both controls when enabled: frequency limit (rejects if the company's latest non-failed `OPERATOR_PAYOUT` is within `withdrawal_frequency_hours`) and a single-use 2FA code (self-contained `withdrawal_2fa_challenge` store + `sendAuthOtp` delivery, hashed, constant-time compare, atomic consume). F-17 idempotency + Paystack reference=txId preserved. |
| F-31 | 🟡 MED | **ACCEPTED (user, 2026-07-20): log-only + ops runbook** | failure now logged as `CANCEL_WITHOUT_REFUND` + booking `CANCELLED`; no retry → passenger can stay stranded (decision: keep log-only, document runbook — report §9) — `cancel-trip-with-refunds.ts:128-139` |
| F-01 | 🟡 MED | **STILL OPEN** | engine uses `number` internally, doesn't import `lib/money.ts` — `AccountingEngine.ts:66-80` |
| F-03 | 🟡 MED | **RESOLVED (docs, 2026-07-20)** | ledger already falls back to `${transaction.id}-${seq}` when no explicit key; money-out callers F-17/F-19/F-21 now pass explicit `idempotencyKey` inside `FOR UPDATE` — `AccountingEngine.ts:262-264` |
| F-15 | 🟡 MED | **BENIGN (→🟢 LOW)** | `toSafeDisplayNumber` returns `number`; engine requires `number` — not a leak — `payment-service.ts:398/404` |
| F-12 | ✅ RESOLVED | **RESOLVED + live-verified** | CI bank filter; report §2/§5/§6 updated to match — `F-33` |

---

## B. FINDINGS INDEX (severity)
- 🔴 CRITICAL — loses real money / wrong charge / security hole
- 🟠 HIGH — money leak under realistic conditions / spec violation with financial impact
- 🟡 MEDIUM — edge-case leak / drift / robustness
- 🟢 LOW — style/drift/cosmetic

| ID | Severity | Title | File | Detail file |
|---|---|---|---|---|
| F-11 | ✅ RESOLVED | XOF ×100 VERIFIED OK — Paystack test mode: topup 1,000 XOF showed 1,000 on Paystack (no 100×). Paystack normalizes ×100. Fragility remains (F-14 ÷100 must stay in sync). | pricing-resolver / paystack-client | 06 |
| F-12 | ✅ RESOLVED (code + verified live 2026-07-20) | Paystack bank list returned Nigeria, not Côte d'Ivoire. Fixed: `paystackListBanks` now filters by `currency=XOF` (default app market CI); router + callers default to XOF. User confirmed CI banks now show. | paystack-client / payments.ts | 06 |
| F-16 | ✅ RESOLVED (code, 2026-07-20) | Over-sale (double-booking) race in createHold — fixed: `SELECT … FOR UPDATE` on `Trip` row serializes holds per trip (atomic conflict-check + insert); `confirmFromPayment` re-checks cross-hold. No hard `UNIQUE` (segments are ranges; non-overlapping segments valid via `segmentsOverlap`). | booking-hold-service / booking-confirmation-service | 03, 09 |
| F-17 | ✅ FIXED (code, needs live double-submit test) | requestWithdrawal had no idempotency key → duplicate payouts on double-submit. Fixed: client nonce `idempotencyKey` + race-safe dedup check INSIDE the `FOR UPDATE` lock on the operator account (returns existing tx, skips second Paystack payout). UI regenerates nonce per attempt. | operator.ts / operator-withdraw-view.tsx | 03 |
| F-33 | ✅ RESOLVED (live-verified + Option A applied) | **Verified live w/ test keys:** `GET /bank?currency=XOF` → 32 CI banks (type=bceao) ✅; `/bank/resolve` rejects XOF ("valid currencies: NGN, USD, GHS, KES") but code degraded gracefully; recipient `type` NOT required for XOF (all attempts failed only on dummy acct#). **Decision (user): Option A** — removed operator-side `paystackResolveAccount` from BANK onboarding + `addBankAccount`, deleted unused `resolveBankAccount` mutation. Admin recipient creation (admin.ts:369/892) is the authoritative Paystack gate and already surfaces errors to admin for rejection. **Remaining live check:** admin-approve a CI operator with a REAL account to confirm recipient creation succeeds. | operator.ts / admin.ts | 06 |
| F-20 | ✅ RESOLVED (docs — money-safe, no code change) | processTopUp double-credit: **money-safe** — `FinancialTransaction` `@@unique([externalPaymentId, type])` (schema:1420) makes TOP_UP exactly-once; a 2nd concurrent/duplicate delivery hits P2002 and rolls back. Real issue was unhandled P2002 → 500 on duplicate. Fixed: graceful P2002 handling (idempotent success, skip Novu). | payment-service | 03 |
| F-07 | ✅ RESOLVED (re-verified 2026-07-20: rescue stamps `externalPaymentId: payment.id` → `ORPHANED_PAYMENT_RESCUE` collides on `@@unique([externalPaymentId,type])` → exactly-once) | Orphan-rescue double wallet-credit race | booking-confirmation-service | 04 |
| F-07b | ✅ RESOLVED (re-verified 2026-07-20: `PAYOUT_REVERSAL` carries `externalPaymentId` → collides with webhook on `@@unique`) | Transfer-failure reversal double-credit race (cron + webhook) | payment-service / reconcile cron | 05, 03 |
| F-29 | ✅ RESOLVED (re-verified 2026-07-20: reconcile cron reuses `handleWebhookEvent`; shares `@@unique([externalPaymentId,type])` guard with webhook) | Reconcile cron synthetic transfer event can double-reverse with webhook | reconcile-payments/route.ts | 03 |
| F-19 | ✅ RESOLVED (code, 2026-07-20) | `recordSettlement` now has idempotency key + `FOR UPDATE` on operator account + mandatory `note` + in-tx balance check (mirrors `requestWithdrawal`). No double-settlement race. | payments.ts / payments-admin.ts | 03 |
| F-01 | ✅ ACCEPTED DIVERGENCE (docs, 2026-07-20) | Engine amounts are JS `number`, not `BigInt` — **user decision: keep `number` (safe today); document divergence** (see report §9) | AccountingEngine | 02 |
| F-03 | ✅ RESOLVED (docs — already satisfied, no code change) | Ledger idempotency opt-in (caller must pass key) | AccountingEngine | 02 |
| F-05 | ✅ RESOLVED (docs, 2026-07-20) | Account-class names drift from docs — **user decision: update docs to match code** (code names authoritative; report §9) | FinancialAccountService | 02 |
| F-13 | ✅ ACCEPTED (documented, 2026-07-20) | `require("node:crypto")` in paystack-client (Edge risk) — **user decision: document only** (webhook route is Node; report §9) | paystack-client | 06 |
| F-14 | ✅ ACCEPTED (documented, 2026-07-20) | Verify divides by 100 (symmetric w/ F-11) — **user decision: document only** (keep in sync with F-11; report §9) | paystack-client | 06 |
| F-15 | 🟢 LOW (re-verified BENIGN: `toSafeDisplayNumber` returns `number`; engine requires `number`) | Reversal reuses `toSafeDisplayNumber` as a ledger amount | payment-service | 03 |
| F-18 | ✅ RESOLVED (code, 2026-07-20) | Withdrawal 2FA & frequency settings now enforced in `requestWithdrawal` (self-contained 2FA challenge store + frequency window); F-17 idempotency + Paystack reference=txId preserved | operator.ts / lib/withdrawal-2fa.ts | 03 |
| F-21 | ✅ RESOLVED (code, 2026-07-20) | resolveWithdrawal FORCE_FAIL now reverses PAYMENT_PROCESSOR_FEE (no phantom fee debit); double-reverse with webhook already prevented by externalPaymentId @@unique | admin.ts / payment-service.ts | 03 |
| F-22 | ✅ RESOLVED (code, 2026-07-20) | Admin bank-number reveals not logged to bankAccessLog — now logged via `logBankAccess(..., "VIEW_FULL")` at both reveal sites (pending-bank verify + `verifyBankAccount`) | admin.ts | 03 |
| F-23 | ✅ RESOLVED (code, 2026-07-20) | Concurrent verifyBankAccount → two `isDefault` — now serialized via `SELECT … FOR UPDATE` on `company` at the start of the tx + `updateMany` clears other defaults when setting a new one | admin.ts | 03 |
| F-24 | ✅ RESOLVED (code, 2026-07-20) | Cancellation no-snapshot fallback now derives commission from `proportionalBase × defaultCommissionBps/10_000` (PlatformSettings) so commission is still clawed back; snapshot path unchanged | cancellation-service | 03, 09 |
| F-26 | ✅ RESOLVED (deleted, 2026-07-20) | financial-calculations.ts dead but divergent — **deleted** (zero importers confirmed) so it can never be wired in | financial-calculations | 03 |
| F-31 | 🟡 MED (ACCEPTED, 2026-07-20 — user decision: log-only + ops runbook; report §9) | cancelTripWithRefunds swallows refund failure → stranded passenger (failure now logged as `CANCEL_WITHOUT_REFUND` + booking `CANCELLED`; no retry, but accepted as documented) | cancel-trip-with-refunds | 09 |
| F-34 | ✅ RESOLVED (code, 2026-07-20) | release-reservations cron double-release + crash-recovery gap: balance release now gated on an atomic `releasedAt` flip (exactly-once across concurrent runs) and finds EXPIRED-not-released left by a crashed run; adds `releasedAt DateTime?` to `WalletReservation` + migration `20260720140000_add_wallet_reservation_released_at` | release-reservations/route.ts | 03 |
| F-32 | 🔴→✅ FIXED | `toSafeDisplayNumber` (lib/money.ts) threw for ALL BigInt inputs (`Number.isSafeInteger(bigint)` always false) → wallet/dashboard crashed for every user. Fixed: range check in BigInt space. Found via runtime test. | lib/money.ts | 03 |
| F-GUEST-RESOLVED | ✅ N/A | Guest-lose-fare on trip-cancel is moot (login required) | cancel-trip-with-refunds | 09 |
| F-04 | 🟢 LOW | Balance invariant not asserted post-update | AccountingEngine | 02 |
| F-02 | 🟢 LOW | validate() requires ≥1 entry not ≥2 | AccountingEngine | 02 |
| F-10 | 🟢 LOW | Zero-net bookings skip ledger entirely | booking-confirmation-service | 04 |
| F-27 | 🟢 LOW | passenger-wallet-view passes balance as walletId | passenger-wallet-view | 03, 09 |
| F-28 | 🟢 LOW | passenger wallet-card uses toLocaleString (no XOF helper) | wallet-card | 03, 09 |
| F-30 | 🟢 LOW | publish-blogs inline auth inconsistent (fails closed in dev) | publish-blogs/route.ts | 03 |
| F-07c | 🟢 LOW | Orphan rescue guest fallback (moot — no guest bookings) | booking-confirmation-service | 04 |

### OK / positive controls
- ✅ Double-entry Σ debit=credit enforced (AccountingEngine)
- ✅ Deadlock-prevention alphabetical lock sort
- ✅ Atomic balance materialization
- ✅ Lazy account upsert (immutable owner attrs)
- ✅ Card/wallet booking math balances; wallet waives convenience
- ✅ Pricing formula matches spec
- ✅ WebhookEvent dedup + processedAt-after-processing
- ✅ TopUp idempotency via externalPaymentId guard
- ✅ Payout reversal also reverses processor fee (webhook path)
- ✅ **No direct `financialAccount` writes in any router** (global 🔴 check PASSED)
- ✅ Operator cannot self-verify / self-redirect payouts (isVerified forced false)
- ✅ Bank encryption AES-256-GCM + key rotation; masked at client
- ✅ release-escrow cron concurrency-safe (engine + key + advisory lock + clearedAt re-check)
- ✅ cancellation-service: strong idempotency, convenience retained, commission clawed back, → wallet
- ✅ assertHoldOwnedByUser enforced in booking router (4 sites)
- ✅ All cron routes auth-protected (CRON_SECRET)
- ✅ processTopUp/confirm use stored amounts (no client inflation)
- ✅ F-webhook-2 RESOLVED: Paystack transfer `reference` = FinancialTransaction.id (set in requestWithdrawal)
- ✅ F-webhook-3 consistent: PAYSTACK_CLEARING credited at withdrawal
- ✅ F-11 RESOLVED via live Paystack test (1,000 XOF topup → showed 1,000 on Paystack; Paystack normalizes ×100)
- ✅ F-32 FIXED: toSafeDisplayNumber BigInt crash — wallet/dashboard now render for all balances
- ⚠️ ENV (not code): `initiateWalletTopUp` 500 was DB unreachable — Neon `ep-still-shadow-...pooler.c-9.us-east-1.aws.neon.tech` auto-paused. Bring DB up + retry; code path is correct.
