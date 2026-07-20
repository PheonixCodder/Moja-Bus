# Mathematical & Database Invariants

[⬅️ Back to README](./README.md)

---

An "Invariant" is a rule that must NEVER be violated under any circumstance. If an invariant is broken, it indicates a catastrophic failure of the platform's logic, requiring immediate halting of services and manual DBA intervention.

## 1. The Double-Entry Axiom
For every `FinancialTransaction` where `status` is IN (`'POSTED'`, `'SETTLED'`):
```sql
SUM(amount WHERE side = 'DEBIT') == SUM(amount WHERE side = 'CREDIT')
```
*Enforced by*: `AccountingEngine.validate()`

## 2. The Balance Truth Axiom
For every single row in the `FinancialAccount` table:
```sql
availableBalance + reservedBalance == postedBalance
```
*Enforced by*: The `AccountingEngine` strictly mutates `postedBalance` alongside either `availableBalance` or `reservedBalance` in unison during atomic updates.

## 3. The Non-Negative Axiom
For every single row in the `FinancialAccount` table where `allowNegativeBalance = false`:
```sql
availableBalance >= 0
AND reservedBalance >= 0
```
*Enforced by*: `CHECK` constraints on the database (or application-level assertions in `AccountingEngine`).

## 4. The Gateway Mirror Axiom
There must NEVER exist an `ExternalPayment` with status `SUCCESS` that does not have a corresponding `FinancialTransaction` linked via `externalPaymentId`.
*Enforced by*: The `BookingConfirmationService` wraps the ledger post inside the exact same `prisma.$transaction` that marks the payment as successfully handled.

## 5. The Pricing Immutability Axiom
A `PricingSnapshot` must never be updated once it is created.
*Enforced by*: The application code lacks any `update()` methods for this model. It is insert-only.

## 6. The Idempotency Axiom
There must NEVER exist two `WebhookEvent` rows with the same `idempotencyKey`, and there must NEVER exist two `LedgerEntry` rows with the same `idempotencyKey`.
*Enforced by*: Postgres `UNIQUE INDEX` at the schema level.

## 7. The Lock Ordering Axiom
Any service that acquires multiple `SELECT FOR UPDATE` locks simultaneously MUST sort the `accountId`s alphabetically before executing the query.
*Enforced by*: `AccountingEngine.commit()` uses `Array.prototype.sort()` on the extracted IDs to prevent deadlocks.
