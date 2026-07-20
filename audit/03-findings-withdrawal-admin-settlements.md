# Findings — Withdrawals, Admin Settlements/Treasury, Wallet Top-up, Bank Encryption (Tier 1+3 routers & libs)

Files READ this session:
- apps/web/trpc/routers/operator.ts (requestWithdrawal 2171–2462; bank update 1044–1145)
- apps/web/trpc/routers/admin.ts (resolveWithdrawal 1143–1322; verifyBankAccount 860–977; listLedgerEntries 213; recordSettlement NOT here — see payments.ts)
- apps/web/trpc/routers/payments.ts (recordSettlement 300–346; getTreasuryOverview 254; exportOperatorLedger 270)
- apps/web/trpc/routers/wallet.ts (topUp 19–119; getWalletBalance 9)
- apps/web/app/api/webhooks/paystack/route.ts (HMAC + nodejs runtime)
- apps/web/app/api/cron/reconcile-payments/route.ts, release-escrow/route.ts, release-reservations/route.ts, snapshot-accounts/route.ts, payments/verify/route.ts, tickets/verify/route.ts, publish-blogs/route.ts, generate-trips/route.ts
- apps/web/lib/cron-auth.ts (shared + inline), escrow-release.ts, financial-calculations.ts, platform-settings.ts, bank-crypto.ts, bank-account.ts, bank-access.ts, money.ts
- apps/web/trpc/init.ts (procedure/auth model), lib/permissions/authorize.ts, packages/schemas/src/permissions.ts

---

## ✅ STRONG CONTROLS CONFIRMED (good news)

1. **No direct `financialAccount` balance writes in ANY router.** Grepped every router for
   `financialAccount.update/upsert/create` → zero hits. All balance movement goes through
   `AccountingEngine`. The ONLY direct balance write in the whole app is the documented
   `release-reservations` cron (wallet-reservation expiry) and the `release-escrow` cron which
   actually uses the engine. Global 🔴 checklist item PASSED. ✅

2. **Operator cannot self-verify / self-redirect payouts.** `operator.ts` bank update explicitly
   sets `isVerified: false, isDefault: false` (line ~93). Only `admin.verifyBankAccount`
   (adminProcedure) sets `isVerified: true` + creates the Paystack transfer recipient. So a rogue
   operator cannot point payouts at their own bank — an admin must verify. ✅ Strong control.

3. **Bank encryption is modern & correct.** `bank-crypto.ts` uses AES-256-GCM, random 12-byte IV,
   16-byte auth tag, `enc:v1:` prefix, base64 payload, with key-rotation support
   (`BANK_ENCRYPTION_KEY_PREVIOUS`). `prepareBankAccountStorage` encrypts at rest; `maskBankAccountForClient`
   masks before sending to the UI. No plaintext logging in the crypto layer. ✅

4. **`release-escrow` cron is concurrency-safe.** Uses `AccountingEngine("ESCROW_RELEASE", { idempotencyKey: ESCROW_RELEASE_${hgId}_${openIds} })`, a per-company `pg_advisory_xact_lock`, AND re-checks `clearedAt IS NULL FOR UPDATE` inside the tx (so a second concurrent run sees no open rows → no-op). Last-seat residual absorbed correctly via `computeEscrowReleaseNet`. ✅

5. **`processTopUp` / confirm use the STORED amount, not a client-supplied one.** Wallet credit is
   computed from `payment.amountXOF` / `payment.feesXOF` (set at ExternalPayment creation, not at
   confirm time). No client-amount-inflation vector. ✅

6. **All cron routes are auth-protected** by `CRON_SECRET` (shared `assertCronAuthorized` or
   equivalent inline checks). ✅

7. **`assertHoldOwnedByUser` is enforced** in the booking router (4 call sites) before passenger
   hold actions. ✅

---

## 🔴 / 🟠 CONCURRENCY & IDEMPOTENCY GAPS

### 🟠 F-16 — Double-booking (over-sale) race in `createHold`
- `booking-hold-service.createHold` checks for seat conflicts with a **plain `findMany` inside the
  transaction but WITHOUT `FOR UPDATE`** (lines 145–184). Two concurrent hold requests for the same
  seat both read "no conflict" (neither has inserted yet) and both insert `PENDING_PAYMENT` bookings.
- The `Booking` model has **NO unique/partial constraint** preventing two active bookings on the
  same `(tripId, seatId, segment)`. Indexes are non-unique (`@@index([tripId, seatId, status])`, etc.).
- `confirmFromPayment` only claims per-**holdGroup** (`holdGroup.updateMany({where:{id,status:"ACTIVE"}})`);
  it does **NOT re-verify that the seat isn't already confirmed by a different hold group**. So two
  concurrent holds on seat 12 can BOTH be confirmed → two paying passengers, one seat (over-sale).
- Impact: an operator is liable for two tickets on one seat. Requires concurrent request timing, but
  the blast radius is severe (real money + trust damage).
- Fix: add `SELECT ... FOR UPDATE` on the conflicting bookings in `createHold` (or a deferred unique
  index / advisory lock on `(tripId, seatId, segment)`), and re-check seat exclusivity at confirm.

### 🟠 F-17 — `requestWithdrawal` has no idempotency key / no client nonce → duplicate payouts
- `operator.ts requestWithdrawal` posts `OPERATOR_PAYOUT` with **no `idempotencyKey`** and no
  client-supplied request id. The `SELECT availableBalance FOR UPDATE` + balance check is INSIDE the
  tx, so it correctly prevents over-withdrawal / negative balance concurrently (the row lock blocks
  Tx2 until Tx1 commits). BUT if two identical withdrawals are submitted and the balance permits both
  (e.g. 10,000 available, two ×5,000 clicks), **both succeed** — the second is not blocked because the
  first only reduced the balance by 5,000, still ≥ 5,000.
- Money impact: the operator's OWN funds are moved to their OWN bank twice (not a platform loss), but
  it violates the spec's exactly-once money-out rule and can over-withdraw an operator's intended amount.
- Note: the Paystack `reference` IS correctly set to the `FinancialTransaction.id` (`txId`) — so the
  transfer webhook lookup (F-webhook-2) works. ✅ And the compensating `OPERATOR_PAYOUT_REVERSAL` on
  definitive rejection DOES carry `idempotencyKey: PAYOUT_REVERSE_${txId}` ✅. Only the primary payout
  lacks a dedup key.
- Fix: require/accept a client idempotency token; on duplicate `(companyId, token, recent window)`
  return the existing transaction.

### 🟠 F-20 — `processTopUp` double-credits the passenger wallet under concurrency
- `payment-service.processTopUp` posts `TOP_UP` with `externalPaymentId: payment.id` but **no
  `idempotencyKey`**. Its dedup guard (`findUnique({where:{externalPaymentId, type:"TOP_UP"}})`) runs
  OUTSIDE the `$transaction`. `processTopUp` is reachable from BOTH the Paystack webhook
  (`handleWebhookEvent`) AND the manual callback (`verifyAndConfirm`). Two concurrent calls for the same
  reference both pass the guard, both commit → passenger wallet credited **twice** from one real charge
  = real platform loss (wallet is spendable/withdrawable).
- Fix: pass `idempotencyKey: TOPUP_${payment.id}` to the engine (the externalPaymentId guard should be
  inside the tx or backed by a unique key).

### 🟠 F-29 — Reconcile cron can double-reverse a payout with the webhook (extends F-07b)
- `reconcile-payments` builds a **synthetic** `transfer.failed`/`transfer.reversed` event with
  `reference: tx.id` and `data.id: result.id` (the Paystack transfer id) and feeds it to
  `handleWebhookEvent`. The outer webhook dedup key is `${event}:${reference}:${data.id}`.
- `handleTransferWebhook` has its status guard OUTSIDE the tx and posts `PAYOUT_REVERSAL` with **no
  idempotency key**. If this synthetic cron event races with a real `transfer.failed` webhook
  (both see `status` still POSTED/CREATED), both reverse → operator availableBalance credited twice →
  platform loses the payout amount.
- Confirmed the requestWithdrawal reversal uses `PAYOUT_REVERSE_${txId}` (idempotent) but the
  webhook/cron reversal uses `PAYOUT_REVERSAL` with NO key — the two paths don't share a key, so no
  uniqueness collision protects them.
- Fix: move the webhook status guard inside the tx (re-check after lock) OR add
  `idempotencyKey: PAYOUT_REVERSE_${tx.id}` (shared with the requestWithdrawal path) + catch P2002.

---

## 🟡 MEDIUM

### F-18 — Withdrawal 2FA & frequency controls are declared but NEVER enforced
- `platform-settings.ts` defines `require_2fa_for_withdrawals` and `withdrawal_frequency_hours` and
  `PlatformSettingsManager` validates/stores them. But `requestWithdrawal` (operator.ts) never reads
  either. Grepped the whole app: these two keys are referenced ONLY inside `platform-settings.ts`
  itself. So the platform advertises 2FA-on-withdrawals and withdrawal rate-limiting that do not exist.
- Impact: a security control that exists on paper but is a no-op. Lower blast radius (withdrawals still
  require auth + balance check), but a real governance/audit gap.

### F-19 — `recordSettlement` (admin) is unsafe: no idempotency, no mandatory reason, no real transfer
- `payments.ts recordSettlement` posts `SETTLEMENT` (DEBIT operator, CREDIT clearing) with **no
  `idempotencyKey`** → admin double-click → operator debited twice. 🔴-class if triggered.
- Takes only an **optional `note`** — unlike `resolveWithdrawal` (mandatory `reason`) and
  `PlatformSettingsManager.setSetting` (mandatory `changeReason`). Violates spec 08-audit ("admin manual
  adjustments need reason").
- Credits `PAYSTACK_CLEARING` but does **NOT initiate or record a real Paystack bank transfer** (unlike
  `requestWithdrawal`, which calls Paystack + reconciles). So a "settlement" moves operator money into
  the platform float with no actual payout step → orphaned settlement unless an out-of-band process
  sweeps clearing→bank. Asymmetric and risky.

### F-21 — `resolveWithdrawal` FORCE_FAIL weaknesses (extends F-07b)
- `FORCE_FAIL` posts `PAYOUT_REVERSAL` with **no idempotency key** and does **NOT reverse the
  `PAYMENT_PROCESSOR_FEE`** (unlike the webhook path, which reverses the fee per "Fix #4"). So an
  admin-failed payout leaves a phantom processor-fee debit.
- Its status guard IS inside the tx (better than the webhook) → same-path double-reverse is prevented,
  but it can still double-reverse with a concurrent `transfer.failed` webhook (no shared key).
- `FORCE_COMPLETE` flips status → SETTLED without verifying the actual Paystack transfer succeeded —
  relies on admin diligence; could mask a real failure and strand operator funds in clearing.

### F-22 — Admin bank-number reveals are NOT logged (backwards audit)
- `logBankAccess` (bank-access.ts → `bankAccessLog`) is wired into operator self-service
  (operator.ts, 5 sites). But `admin.ts` reveals plaintext bank numbers via `revealBankAccountNumber`
  at lines 363 and 886 and **does not call `logBankAccess`** (admin.ts doesn't even import it).
- So the broadest-access role (ADMIN) has LESS PPI-access auditing than operators. `verifyBankAccount`
  writes a generic `activityLog` (VERIFY_COMPANY) that does not record that the plaintext number was
  revealed/decrypted.

### F-23 — Concurrent `verifyBankAccount` can create two `isDefault` accounts
- `isDefault = !existingDefault` is computed inside the tx but from a non-locked read. Two concurrent
  verifications of a company's first two accounts → both see no default → both set `isDefault: true`.
- Low $ impact (withdrawal uses `findFirst` so only one is honored), but a data-integrity bug. A unique
  partial index or atomic claim would prevent it.

### F-24 — Cancellation no-snapshot fallback mis-handles commission
- `cancellation-service` (no snapshot): sets `proportionalBase = proportionalOperatorNet = farePaid`.
  Because `farePaid` = **base fare** (not incl. convenience), the passenger refund is actually correct
  (base fare back, convenience kept). BUT `commissionAmount = refundAmountXOF - proportionalOperatorNet
  = 0`, so the platform commission is **not clawed back** and the operator receivable is over-debited by
  the commission portion. Net: platform under-collects commission on refunded seats when the snapshot is
  missing. Contingent on missing snapshot (rare, but the code explicitly falls back here).

### F-26 — `financial-calculations.ts` is dead but divergent (latent trap)
- Grepped: `FinancialTransactionPattern`, `validateFinancialAmount`, `CommissionCalculator`,
  `SettlementValidator` are referenced NOWHERE outside their own file. Meanwhile they contradict the
  live system: `CommissionCalculator.calculateCommission` uses `Math.floor` (live `pricing-resolver`
  uses `Math.round` → would under-collect commission), `validateTransactionType` only allows 6 hard-coded
  tx types (live types like `OPERATOR_PAYOUT`, `ESCROW_RELEASE` would throw), and a 100M XOF cap would
  wrongly reject large legitimate amounts. A future dev wiring this in would silently lose money.

### F-15 — Reversal reuses a display helper as a ledger amount
- `handleTransferWebhook` builds reversal entries with `amount: toSafeDisplayNumber(entry.amount)`.
  `toSafeDisplayNumber` is a DISPLAY helper (BigInt→number, throws above 2^53). It works today (XOF
  magnitudes are safe) but feeding a display-formatted value back into money math is philosophically
  wrong and would throw (breaking the reversal + leaving payout stuck) if an amount ever exceeded
  Number.MAX_SAFE_INTEGER. Use `toXOFBigInt(entry.amount)` instead.

---

## 🟢 LOW

### F-27 — Passenger wallet view passes balance as `walletId` (copy-paste bug)
- `passenger-wallet-view.tsx:116`: `walletId={balance.postedBalance ? balance.postedBalance.toString() : ""}`.
  A balance (bigint-as-string) is passed where the wallet **account id** is expected (comment even says
  "Mocked placeholder mapping"). Display/data bug; not a money leak but likely shows wrong data.

### F-28 — Passenger wallet-card uses `availableBalance.toLocaleString()`
- `wallet-card.tsx:51` formats a BigInt with `.toLocaleString()` and no XOF label/helper. Functional
  (BigInt has toLocaleString) but inconsistent with the operator revenue UI which correctly uses
  `toSafeDisplayNumber`/`formatXOF`. Cosmetic.

### F-30 — `publish-blogs` cron uses inline auth (fails closed even in dev)
- Unlike the shared `assertCronAuthorized` (which allows in dev without CRON_SECRET), `publish-blogs`
  inlines `if (!cronSecret || authHeader !== Bearer ${cronSecret}) → 401`, so it blocks in dev without a
  secret. Fails closed (safe) but inconsistent with the other crons. Not a vuln.

---

## Money-flow notes for the final report (withdrawals & settlements)
- `requestWithdrawal`: DEBIT OPERATOR_RECEIVABLE (available, not reserved) → CREDIT PAYSTACK_CLEARING;
  separate `PAYMENT_PROCESSOR_FEE` post for the outbound transfer fee; Paystack `reference = txId`.
- `resolveWithdrawal` FORCE_COMPLETE = status→SETTLED (no new ledger entry, correct). FORCE_FAIL =
  PAYOUT_REVERSAL (operator credited back, clearing debited).
- `recordSettlement` = manual DEBIT operator → CREDIT clearing, no real bank transfer, no idempotency.
- Operator payable bank is COMPANY-scoped (default verified account) — withdrawal cannot target an
  attacker-controlled account (good), and operators cannot self-verify banks (good).
