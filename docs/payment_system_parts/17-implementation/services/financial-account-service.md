# Service: Financial Account Service

[⬅️ Back to Services Overview](./README.md)

---

**File:** `packages/db/src/services/FinancialAccountService.ts`

The `FinancialAccountService` is responsible for safely retrieving, and if necessary lazily creating, the foundational `FinancialAccount` rows.

## Responsibilities
- Ensure every entity (User, Company) has their respective accounts before a transaction occurs.
- Abstract the complex queries required to find specific account classes.
- Prevent duplicate account creation via atomic upserts or unique constraints.

## Key Methods

### `getSystemPaystackClearingAccount()`
- Retrieves the `PAYSTACK_CLEARING` asset account.
- Since this is a system account, it is expected to be seeded by the database migrations. If it does not exist, the service will throw a fatal error.

### `getOperatorReceivableAccount(companyId)`
- Retrieves the `OPERATOR_RECEIVABLE` liability account for a given `companyId`.
- **Lazy Creation**: If an operator has just been onboarded and has never received money, they might not have this row. The service will automatically execute a `create` query if `findUnique` returns null.
- **Concurrency Protection**: It relies on the `@@unique([ownerType, ownerId, accountClass, currency])` constraint in the database. If two concurrent requests try to create the account simultaneously, one will hit a unique constraint violation and retry or fail gracefully.

### `getPassengerWalletAccount(userId)`
- Retrieves the `PASSENGER_WALLET` liability account for a given `userId`.
- Uses identical lazy creation logic as the operator account.

## Performance Characteristics
Because these accounts are queried during critical high-traffic paths (like checkout and webhooks), they are indexed heavily. The lookups are O(1) on the database side via the unique constraints.
