# Cron: Snapshot Accounts

[⬅️ Back to Crons Overview](./README.md)

---

**File:** `apps/web/app/api/cron/snapshot-accounts/route.ts`

The `snapshot-accounts` cron job is purely for analytics, auditing, and historical state reconstruction. It does not mutate any balances or execute any financial transactions.

## The Problem
A `FinancialAccount` row only stores the current balance at `NOW()`.
If an auditor or business analyst asks, "How much money was sitting in the system on the 1st of January last year?" it is extremely computationally expensive to figure that out. You would have to load every single `LedgerEntry` from the beginning of time up until Jan 1st and sum them together. As the platform grows, this query becomes impossible to run in real-time.

## The Solution
The platform takes point-in-time snapshots of every active `FinancialAccount` balance.

### Execution Schedule
- **Daily**: Runs every night at midnight UTC to capture the `DAILY` snapshot.
- **Weekly**: Runs every Monday at midnight UTC to capture the `WEEKLY` snapshot.
- **Monthly**: Runs on the 1st of every month at midnight UTC to capture the `MONTHLY` snapshot.

## Internal Algorithm
1. The cron determines the current period based on `now.getUTCDay()` and `now.getUTCDate()`.
2. It calls `SnapshotService.takeDaily()`, etc.
3. The service executes an `INSERT INTO "FinancialAccountSnapshot"` query, copying the `postedBalance`, `reservedBalance`, and `availableBalance` of every active account.

### Idempotency
The `FinancialAccountSnapshot` table has a unique index on `@@unique([accountId, period, snapshotDate])`.
If the cron is accidentally triggered twice on the same day, the database simply performs an `ON CONFLICT DO UPDATE` or throws a safe constraint error. It will never create duplicate snapshots for the same period.

## Business Value
These snapshots are the foundation for:
1. **Average Held Balance (Treasury Yields)**: Knowing exactly how much escrow money is sitting in our bank account over a 30-day period allows the finance team to calculate expected interest from the bank.
2. **Platform Liability Audits**: Quickly proving to regulators exactly how much we owed operators at the end of a fiscal quarter.
