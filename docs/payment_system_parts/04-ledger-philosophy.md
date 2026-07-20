# 04. Ledger Philosophy

At the heart of the Moja Ride financial platform is a strictly enforced, append-only, double-entry ledger. This document explains the philosophy behind its design and why certain conventional database operations are strictly forbidden.

---

## 1. Trust via Math (Double-Entry)

Every time money moves, it must be tracked as a transfer from one bucket to another. Money cannot be created or destroyed, only moved.

This is enforced by the `AccountingEngine.validate()` method, which guarantees that for every `FinancialTransaction`:
**Σ Debits = Σ Credits**

If an operator's balance increases by 10,000 XOF, we must explicitly declare *where* that 10,000 XOF came from (e.g., the Paystack Clearing account). If the engine detects an imbalance of even 1 XOF, the entire transaction is rejected before it hits the database.

## 2. Immutable and Append-Only

The `LedgerEntry` and `FinancialTransaction` tables are **append-only**. 

### Why No UPDATE?
If an operator complains about a missing payout, and an engineer discovers a bug in the code, the engineer might be tempted to run an `UPDATE` query on the ledger to fix the balance. 

**This is strictly forbidden.**
Updating a ledger entry destroys history. It removes the evidence of what actually happened at that point in time. It invalidates past financial reports and makes reconciliation impossible.

### Why No DELETE?
Deleting a row from the ledger is equivalent to shredding bank statements. It destroys the audit trail.

### The Reversal Pattern
If a mistake occurs (e.g., a ticket was accidentally charged twice due to a system glitch), the only acceptable way to fix it is to issue a new, distinct `FinancialTransaction` of type `SYSTEM_CORRECTION` or `REVERSAL`.

This new transaction applies the exact opposite Debits and Credits of the original transaction, bringing the net balances back to zero while preserving the complete history of the mistake and its correction.

## 3. Materialized Caches over SUM() Queries

A common question is: *"Why do you store balances on the `FinancialAccount` model? Shouldn't you just `SUM(amount)` over the `LedgerEntry` table whenever you need the balance?"*

While running a `SUM()` query is technically the purest way to get a balance, it is computationally disastrous in a high-volume payment system.

1. **Performance**: Operators check their balances constantly. Running a massive SQL `SUM()` across millions of historical ledger rows for every dashboard refresh would crush the database.
2. **Concurrency**: When processing a withdrawal, we must immediately verify if the operator has sufficient funds. `SUM()` queries are slow and difficult to lock safely without locking the entire table.

Instead, the `FinancialAccount` model maintains `postedBalance`, `reservedBalance`, and `availableBalance` fields. These are **materialized caches**. 

The `AccountingEngine` uses an atomic `UPDATE ... SET balance = balance + delta` command within a strict transaction boundary to ensure these caches are always perfectly in sync with the underlying ledger entries.

## 4. Periodic Snapshots

Because balances change constantly, it is difficult to answer queries like: *"What was the total platform liability at exactly 11:59 PM on December 31st?"*

To solve this, the `SnapshotService` runs automated cron jobs (Daily, Weekly, Monthly) that execute a point-in-time `UPSERT` of every account's current balances into the `FinancialAccountSnapshot` table. 

This provides `O(1)` access to historical balances for analytics and month-end reconciliation without requiring the system to manually replay the ledger history.
