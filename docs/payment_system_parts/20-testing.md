# 20 - Testing Strategy

[⬅️ Back to README](./README.md)

---

Testing a financial ledger requires significantly more rigor than standard CRUD application testing. The test suite focuses heavily on race conditions, mathematical invariants, and database rollbacks.

## 1. Property-Based Mathematical Testing

Unit tests for the `PricingResolver` and `AccountingEngine` do not just test static inputs (e.g., "1000 + 50 = 1050"). They use property-based testing principles.
- Tests generate thousands of random `baseFareXOF` amounts, `commissionBps` percentages, and `seatCount` numbers.
- They assert that across all iterations:
  - `ChargeAmountXOF === OperatorNetXOF + CommissionXOF + ConvenienceFeeXOF`.
  - No fractional XOF is ever produced.
  - The results are always integers.

## 2. Concurrency (Race Condition) Testing

The most critical tests in the system are the race condition tests. These are integration tests that run against a real Postgres database (using Docker or a local test DB).

### The Double-Withdrawal Test
1. Seed an operator with exactly 10,000 XOF in `availableBalance`.
2. Spawn two parallel `Promise` chains that simultaneously call `requestWithdrawal(10000)`.
3. Use `Promise.allSettled()` to await both.
4. **Assertion**: Exactly one promise MUST succeed. Exactly one promise MUST fail with an "Insufficient balance" error.
5. **Assertion**: The database `availableBalance` MUST be exactly 0.
6. **Assertion**: The database `postedBalance` MUST be exactly 0.

If this test ever fails, the build pipeline halts immediately. The platform cannot be deployed.

### The Deadlock Test
1. Seed Account A and Account B.
2. Spawn Transaction 1: Transfers 100 from A to B.
3. Spawn Transaction 2: Transfers 100 from B to A simultaneously.
4. **Assertion**: Both transactions must succeed (or one may retry if explicitly programmed to do so upon serialization failure, but Postgres must NOT throw a `deadlock detected` fatal error). The lock sorting algorithm in `AccountingEngine` guarantees this.

## 3. Database Rollback Testing

Tests verify that the `AccountingEngine` properly rolls back if an error occurs mid-transaction.
1. Create an `AccountingEngine` instance.
2. Add a valid Debit.
3. Add a Credit that intentionally violates a database constraint (e.g., points to a non-existent `accountId`).
4. Execute `commit(tx)`.
5. Expect the commit to throw.
6. **Assertion**: Query the Debit account. Its balance MUST NOT have changed. The transaction must have completely rolled back.

## 4. Webhook Replay Testing

Integration tests simulate Paystack by POSTing massive JSON payloads to the local webhook endpoint.
1. Send `charge.success`. Expect HTTP 200 and a Ledger post.
2. Send the exact same `charge.success` again. Expect HTTP 200, but assert that ZERO new `LedgerEntry` rows were created. (Idempotency check).
3. Send a payload with an invalid `x-paystack-signature`. Expect HTTP 401.

## 5. Cron Verification

The crons are tested by manipulating time.
1. Seed a booking that arrived yesterday.
2. Manually invoke the `release-escrow` function.
3. **Assertion**: The booking's funds moved from `reservedBalance` to `availableBalance`.
4. Invoke the `release-escrow` function again.
5. **Assertion**: The balances did not move a second time. (Idempotency check).
