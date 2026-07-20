# 10 - Concurrency & Race Conditions

[⬅️ Back to README](./README.md)

---

A financial platform is only as strong as its concurrency controls. Real-time distributed systems process thousands of requests per second. If two requests attempt to mutate the exact same financial account at the exact same millisecond, the platform risks creating or destroying money.

Moja Ride relies strictly on **Pessimistic Locking** at the database row level to enforce sequential consistency.

## The Threat Vector: Read-Modify-Write

Consider a naive implementation for an operator withdrawal:

```javascript
// BAD CODE
const account = await prisma.financialAccount.findUnique({ id });
if (account.availableBalance >= 50000) {
  await paystack.transfer();
  await prisma.financialAccount.update({
    where: { id },
    data: { availableBalance: account.availableBalance - 50000 }
  });
}
```

If the operator opens two tabs and clicks Withdraw at the exact same time, both `findUnique` calls will read the same initial balance. Both will pass the `if` check. Both will overwrite the balance with `initial - 50000`. The operator receives 100,000 but the balance is only deducted by 50,000. 

## Strategy 1: Relative Updates (Atomic)
The first layer of defense is ensuring the database performs the math, not the application layer.

```javascript
// BETTER CODE
await prisma.financialAccount.update({
  where: { id },
  data: { availableBalance: { decrement: 50000 } }
});
```
This solves the overwrite problem, but it introduces a new one: It could push the `availableBalance` below 0 because the `if` check was still subject to a race condition.

## Strategy 2: Pessimistic Locking (`FOR UPDATE`)
The ultimate defense is used inside the `AccountingEngine` and critical workflows like `operator.ts`.

It acquires an exclusive lock on the row *before* reading the balance.

```sql
SELECT "availableBalance" FROM "financial_account" WHERE id = '123' FOR UPDATE
```
When Request A executes this, Postgres locks row '123'. When Request B executes this exactly 1 millisecond later, Postgres forces Request B's TCP connection to freeze and wait.
Request A finishes its math, commits its transaction, and releases the lock. Request B unfreezes, reads the newly updated balance, realizes it is now 0, and throws an "Insufficient funds" error.

## The Deadlock Threat

Pessimistic locking introduces the risk of Deadlocks.

Imagine Transaction A involves Account X and Account Y.
Transaction B involves Account Y and Account X.

- Transaction A locks X.
- Transaction B locks Y.
- Transaction A tries to lock Y, but it's held by B. It waits.
- Transaction B tries to lock X, but it's held by A. It waits.
- **Deadlock.** Postgres eventually kills one of the queries to break the tie, resulting in a failed transaction.

### Deadlock Prevention Algorithm
Moja Ride makes deadlocks mathematically impossible by enforcing a strict **Lock Ordering Algorithm** inside the `AccountingEngine`.

Before executing `SELECT ... FOR UPDATE`, the engine collects the IDs of every account involved in the transaction. It deduplicates the IDs, and then sorts them alphabetically (`Array.prototype.sort()`).

It then requests the locks in that sorted order.
Because both Transaction A and Transaction B sort the IDs, they will both attempt to lock Account X *first*. 
Transaction A gets X. Transaction B waits for X. Transaction A gets Y. Transaction A finishes. Transaction B gets X, gets Y, and finishes.

**Zero deadlocks. Zero race conditions. Perfect consistency.**
