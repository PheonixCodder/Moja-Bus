# Database: Ledger Models

[⬅️ Back to Database Overview](./README.md)

---

## 1. `FinancialAccount`

The absolute core of the platform. This table tracks the balances for every entity in the system.

### Fields
- `id` (String, PK, CUID): The unique identifier.
- `ownerType` (Enum: `USER`, `COMPANY`, `PLATFORM`, `SYSTEM`): Defines what kind of entity owns this account.
- `ownerId` (String, Index): The ID of the owner. This is typically a foreign key to `User.id` or `Company.id`, but enforced logically rather than physically in the DB because it is polymorphic.
- `accountCategory` (Enum: `ASSET`, `LIABILITY`, `REVENUE`, `EXPENSE`): Dictates the normal balance behavior (Debit vs Credit).
- `accountClass` (String): The programmatic identifier (e.g., `PASSENGER_WALLET`).
- `postedBalance` (BigInt): The absolute, mathematical sum of all ledger entries. **Default: 0**.
- `reservedBalance` (BigInt): The portion of the balance locked in escrow. **Default: 0**.
- `availableBalance` (BigInt): A materialized column. Must strictly equal `postedBalance - reservedBalance`. **Default: 0**.
- `allowNegativeBalance` (Boolean): If true, `availableBalance` can drop below 0. Usually only true for internal Expense accounts (like `PAYMENT_PROCESSOR_FEE`). **Default: false**.
- `isActive` (Boolean): Soft deletion flag. **Default: true**.
- `currency` (String): The ISO currency code. **Default: "XOF"**.
- `createdAt` / `updatedAt` (DateTime).

### Indexes & Constraints
- **Unique Constraint**: `@@unique([ownerType, ownerId, accountClass, currency])`. This guarantees a user can only have exactly one wallet per currency.
- **Check Constraint (Logical)**: Code enforces `availableBalance >= 0` when `allowNegativeBalance = false`.

### Migration Implications
Because balances are `BigInt`, they map to 64-bit integers in Postgres. This allows tracking trillions of XOF without floating-point precision loss. Never alter these to `Decimal` or `Float`.

---

## 2. `FinancialTransaction`

Groups multiple ledger entries into a single atomic business event.

### Fields
- `id` (String, PK, CUID).
- `type` (String): The business event (e.g., `BOOKING`, `OPERATOR_PAYOUT`, `REFUND`).
- `status` (Enum: `CREATED`, `POSTED`, `SETTLED`, `FAILED`, `REVERSED`):
  - `CREATED`: Pre-commit.
  - `POSTED`: Math is valid, committed to DB, but real-world settlement pending.
  - `SETTLED`: Fully reconciled (e.g., Paystack transfer succeeded).
- `externalPaymentId` (String?): FK to `ExternalPayment`. Binds the internal ledger to Paystack.
- `description` (String?): Human-readable context.
- `metadata` (JSONB?): Arbitrary JSON (e.g., the User ID who requested the withdrawal).
- `createdAt` / `updatedAt` (DateTime).

### Relations
- `entries`: One-to-Many with `LedgerEntry`.
- `externalPayment`: BelongsTo `ExternalPayment`.

---

## 3. `LedgerEntry`

A single line item in the double-entry ledger.

### Fields
- `id` (String, PK, CUID).
- `transactionId` (String): FK to `FinancialTransaction`.
- `accountId` (String): FK to `FinancialAccount`.
- `side` (Enum: `DEBIT`, `CREDIT`).
- `amount` (BigInt): The amount in XOF. **Must be positive**.
- `sequenceNumber` (Int): Determines the order (1, 2, 3...) within the transaction.
- `idempotencyKey` (String): **CRITICAL**. Unique key to prevent double-posting the exact same line item.
- `createdAt` (DateTime).

### Invariants
- `amount` must always be > 0. A negative debit is mathematically a credit, but the system strictly forbids negative numbers in this column to prevent auditing confusion.

---

## 4. `FinancialAccountSnapshot`

Historical tracking of balances.

### Fields
- `id` (String, PK, CUID).
- `accountId` (String): FK to `FinancialAccount`.
- `period` (String): `DAILY`, `WEEKLY`, `MONTHLY`.
- `snapshotDate` (DateTime): The exact date this represents.
- `postedBalance` / `reservedBalance` / `availableBalance` (BigInt): The captured state.
- `createdAt` (DateTime).

### Indexes
- **Unique Constraint**: `@@unique([accountId, period, snapshotDate])`. Ensures cron jobs are idempotent. If the cron runs twice in one day, the database simply rejects or upserts the second attempt.
