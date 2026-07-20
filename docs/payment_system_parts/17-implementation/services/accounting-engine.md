# Service: Accounting Engine

[⬅️ Back to Services Overview](./README.md)

---

**File:** `packages/db/src/services/AccountingEngine.ts`

The `AccountingEngine` is the sole authority for writing to the financial ledger. **Absolutely no other service is permitted to modify a `FinancialAccount` balance directly.**

## Responsibilities
- Validate the double-entry accounting equation (Debits == Credits).
- Prevent database deadlocks during high concurrency.
- Safely update `FinancialAccount` balances using raw SQL atomic queries.
- Write immutable `LedgerEntry` and `FinancialTransaction` records.

## Usage Example

```typescript
const engine = new AccountingEngine("BOOKING", { metadata: { userId } });

// Debit the Asset
engine.addDebit({
  accountId: paystackAccount.id,
  amount: 9500,
  sequenceNumber: 1,
});

// Credit the Liability
engine.addCredit({
  accountId: operatorAccount.id,
  amount: 9000,
  sequenceNumber: 2,
  reserveOnCredit: true, // Puts it in escrow
});

// Credit the Revenue
engine.addCredit({
  accountId: commissionAccount.id,
  amount: 500,
  sequenceNumber: 3,
});

// Commit within a Prisma Transaction
await engine.commit(tx);
```

## Deep Dive: `commit()`

The `commit()` method executes a highly orchestrated sequence to guarantee safety.

### 1. Mathematical Validation
It loops through all debits and credits, summing them into BigInts.
If `totalDebits !== totalCredits`, it throws `TransactionNotBalancedError`. The transaction halts.

### 2. Lock Ordering (Deadlock Prevention)
If two transactions try to lock the same accounts in different orders, PostgreSQL will deadlock.
To prevent this, the engine extracts all unique `accountId`s from the entries, and sorts them alphabetically (A-Z).

### 3. Acquiring the Lock
It executes a raw SQL query:
```sql
SELECT id FROM "financial_account" WHERE id IN ('acct_A', 'acct_B') FOR UPDATE
```
This forces Postgres to grant an exclusive row-level lock. Any other process trying to touch these accounts must wait. Because of Step 2, they always wait in the same order, making deadlocks mathematically impossible.

### 4. Writing the Ledger
It creates the `FinancialTransaction` and uses `createMany` to insert the `LedgerEntry` rows.

### 5. Updating Balances
It loops through the entries and updates the balances using relative increments in raw SQL to avoid read-modify-write bugs:

```sql
UPDATE "financial_account" 
SET "postedBalance" = "postedBalance" + ${amount}
-- (Logic for reservedBalance vs availableBalance is handled here based on reserveOnCredit flag)
WHERE id = ${accountId}
```

## Rollback Behavior
If any step fails (e.g., database timeout, or a unique constraint violation on `idempotencyKey`), the outer `prisma.$transaction` is aborted. The locks are released, and the database state remains pristine. No partial money movement is possible.
