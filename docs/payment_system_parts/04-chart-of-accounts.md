# 04 - Chart of Accounts

[⬅️ Previous: 03 Accounting](./03-accounting.md) | [Back to README](./README.md) | [Next: 05 Database Models ➡️](./05-database/README.md)

---

## Introduction to the Chart

The "Chart of Accounts" is a standardized list of all the financial "buckets" used by the platform. In Moja Ride, accounts are not hardcoded columns; they are rows in the `FinancialAccount` table identified by their `accountClass`.

This data-driven approach allows the platform to add new financial products (like Savings, Loans, or Payroll) by simply introducing a new `accountClass` string, without requiring database schema migrations.

## Account Ownership

Every account has an owner. Ownership is polymorphic, defined by `ownerType` and `ownerId`.

- `SYSTEM`: Represents the Moja Ride platform itself at a global level (e.g., our Paystack integration). `ownerId` is usually `"SYSTEM"`.
- `PLATFORM`: Represents Moja Ride's corporate entity (e.g., for collecting revenue). `ownerId` is `"PLATFORM"`.
- `COMPANY`: Represents a Transport Operator. `ownerId` is the `Company.id`.
- `USER`: Represents an individual Passenger. `ownerId` is the `User.id`.

## The Standard Accounts

### 1. `PAYSTACK_CLEARING`
- **Category**: `ASSET` (Normal Balance: DEBIT)
- **Owner**: `SYSTEM`
- **Purpose**: Represents the actual money held in our Paystack merchant account.
- **When it increases**: A passenger pays via card.
- **When it decreases**: We issue a payout to an operator, or a refund to a card.

### 2. `OPERATOR_RECEIVABLE`
- **Category**: `LIABILITY` (Normal Balance: CREDIT)
- **Owner**: `COMPANY`
- **Purpose**: Represents money we owe to a specific transport operator for tickets sold.
- **Special Behavior**: This account heavily utilizes `reservedBalance` for escrow. When a ticket is sold, funds go into `reservedBalance`. After the trip completes, funds sweep into `availableBalance`.
- **When it increases**: A passenger buys a ticket for their bus.
- **When it decreases**: The operator withdraws money to their bank, or we refund a passenger due to cancellation.

### 3. `PASSENGER_WALLET`
- **Category**: `LIABILITY` (Normal Balance: CREDIT)
- **Owner**: `USER`
- **Purpose**: Represents digital funds a user has topped up or received from a refund.
- **When it increases**: A user completes a Top-Up via Paystack, or receives an orphaned payment rescue/refund.
- **When it decreases**: A user buys a ticket using their wallet balance.

### 4. `PLATFORM_COMMISSION`
- **Category**: `REVENUE` (Normal Balance: CREDIT)
- **Owner**: `PLATFORM`
- **Purpose**: Tracks the primary revenue stream: the percentage cut taken from operators.
- **When it increases**: A ticket is successfully booked.
- **When it decreases**: A ticket is refunded (the commission is clawed back).

### 5. `PLATFORM_CONVENIENCE_FEE`
- **Category**: `REVENUE` (Normal Balance: CREDIT)
- **Owner**: `PLATFORM`
- **Purpose**: Tracks revenue earned directly from passengers for using the gateway.
- **Special Behavior**: This fee is waived if the user pays via their `PASSENGER_WALLET`.
- **When it increases**: A user pays via Paystack.
- **When it decreases**: A ticket is refunded.

### 6. `PAYMENT_PROCESSOR_FEE`
- **Category**: `EXPENSE` (Normal Balance: DEBIT)
- **Owner**: `PLATFORM`
- **Purpose**: Tracks the cost of moving money via Paystack.
- **When it increases**: Paystack charges a % fee on an inbound charge, or a flat fee on an outbound transfer.
- **When it decreases**: An inbound charge is reversed, and Paystack refunds the processing fee.

---

[Next: 05 Database Models ➡️](./05-database/README.md)
