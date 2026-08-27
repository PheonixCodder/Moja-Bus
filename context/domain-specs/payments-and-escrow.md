# Moja Ride Financial Platform - Canonical Specification

> **WARNING: This is the definitive, code-truth technical specification for the Moja Ride payment and ledger system. If any other documentation contradicts this document, THIS DOCUMENT IS CORRECT.**
> 
> **Goal:** After reading ONLY this document, an engineering team must be capable of rebuilding the complete payment system with extremely high fidelity WITHOUT EVER SEEING THE ORIGINAL CODEBASE.

## Table of Contents
1. Architecture Overview
2. Financial Philosophy
3. Design Principles
4. Money Flow & Accounting Principles
5. Double Entry Accounting Deep Dive
6. Chart of Accounts & Normal Balances
7. FinancialAccount & FinancialAccountSnapshot (Models)
8. FinancialTransaction & LedgerEntry (Models)
9. ExternalPayment, PaymentAttempt & PaymentEvent (Models)
10. HoldGroup, PricingSnapshot & WalletReservation (Models)
11. Booking & Refund (Models)
12. Database Invariants Catalogue
13. Concurrency, Race Conditions & Deadlock Prevention
14. Idempotency & Error Recovery
15. Every Transaction Type
16. Service: AccountingEngine
17. Service: FinancialAccountService
18. Service: PricingResolver
19. Service: PaymentService
20. Service: BookingConfirmationService
21. Service: Withdrawal Logic (operator.ts)
22. Cron: reconcile-payments
23. Cron: release-escrow
24. Cron: release-reservations
25. Cron: snapshot-accounts
26. Workflow: Passenger Booking (Paystack & Wallet)
27. Workflow: Escrow Release
28. Workflow: Operator Withdrawal
29. Workflow: Refund & Partial Refund
30. Business Rules & Formulas
31. Analytics & Metrics
32. Future Extensibility (Savings, Payroll, Loans, etc.)
33. End-to-End Scenarios

---

## 1. Architecture Overview
The Moja Ride platform processes third-party funds (passengers paying transport operators). The architecture is designed as a strict, immutable, double-entry financial ledger built on top of a relational database (PostgreSQL via Prisma).

### Key Architectural Tenets:
1. **Decoupling of Domain from Finance**: A `Booking` is purely a domain concept representing service delivery. It does not hold money. The financial state of the platform is strictly contained within `FinancialAccount`, `FinancialTransaction`, and `LedgerEntry`.
2. **Immutability**: Ledger entries are never updated or deleted. Financial corrections are made via compensating transactions (reversals).
3. **Double-Entry Constraint**: Every single financial event (booking, top-up, withdrawal, fee charge) must balance to zero. Total debits must equal total credits.
4. **Deterministic Concurrency**: Real-time financial systems suffer from database deadlocks when multiple transactions lock accounts in different orders. The architecture solves this by enforcing deterministic alphabetical sorting of Account IDs before acquiring `SELECT FOR UPDATE` locks.

## 2. Financial Philosophy
The platform acts as a marketplace. The money it touches is largely not its own.
- **Trust via Math**: The platform cannot accidentally create or destroy money. The `AccountingEngine` strictly throws errors if the equation `SUM(Debits) == SUM(Credits)` is not perfectly met down to the lowest currency unit (XOF).
- **Float vs Escrow**: When a passenger pays, the money enters the platform's bank (Paystack). At this point, the platform owes the operator. This creates a Liability. However, the service (the bus ride) has not yet been rendered. Therefore, the Liability is parked in an "Escrow" state (`reservedBalance`) until 24 hours after the bus arrives.
- **Precision**: All monetary amounts are stored as integers (BigInt) representing the lowest denomination of the currency (XOF). Floating-point math is strictly forbidden in the ledger.

## 3. Design Principles
- **No Orphaned Money**: If a checkout session expires right as the user completes the 3DSecure bank redirect, the system must not swallow the money. It credits the user's `PASSENGER_WALLET` instead.
- **Idempotency Over Everything**: Webhooks can be delivered multiple times. Network requests can timeout. Every ledger entry requires an `idempotencyKey` to ensure a transaction is processed exactly once.
- **Strict Boundaries**: External integrations (Paystack) can fail. The internal ledger must reflect the external truth. An `ExternalPayment` tracks the Paystack intent. Only when it succeeds does the system post the internal `FinancialTransaction`.

## 4. Money Flow & Accounting Principles
The Accounting Equation governs the entire platform:
`Assets = Liabilities + Equity + Revenue - Expenses`

- **Assets**: Money the platform owns or holds in bank accounts/gateways (e.g., Paystack Clearing).
- **Liabilities**: Money the platform owes to others (Operators, Passengers).
- **Revenue**: Money the platform earns (Commissions, Fees).
- **Expenses**: Money the platform pays to operate (Processor fees).

### Normal Balances
- **Asset / Expense**: Normal balance is DEBIT. (Debits increase the balance, Credits decrease it).
- **Liability / Revenue / Equity**: Normal balance is CREDIT. (Credits increase the balance, Debits decrease it).

## 5. Double Entry Accounting Deep Dive

Let's dissect a standard Booking transaction where a passenger buys a ticket for 10,000 XOF.
- The operator charges 9,000 XOF.
- Moja Ride charges a 500 XOF commission (deducted from operator).
- Moja Ride charges a 500 XOF convenience fee (added to passenger).
- Total charged to passenger = 9,500 XOF.
- Paystack charges a 2% fee = 190 XOF.

**The Ledger Entries:**
1. **DEBIT** System Paystack Clearing: 9,310 XOF.
   - *Why?* This is our Asset account. The money physically landed in Paystack. We received 9,500 - 190 = 9,310. A debit increases an asset.
2. **DEBIT** Payment Processor Fee: 190 XOF.
   - *Why?* This is an Expense. We paid Paystack. A debit increases an expense.
3. **CREDIT** Operator Receivable: 8,500 XOF.
   - *Why?* This is a Liability. We owe the operator their cut (9,000 base - 500 commission). A credit increases a liability.
4. **CREDIT** Platform Commission: 500 XOF.
   - *Why?* This is Revenue. A credit increases revenue.
5. **CREDIT** Platform Convenience Fee: 500 XOF.
   - *Why?* This is Revenue. A credit increases revenue.

**Equation Check:**
Total Debits = 9,310 + 190 = 9,500
Total Credits = 8,500 + 500 + 500 = 9,500
*The transaction balances. The AccountingEngine will commit it.*

## 6. Chart of Accounts & Normal Balances

The platform dynamically seeds several core `FinancialAccount` records. These are defined by the `accountClass` string and linked to specific owners (`SYSTEM`, `PLATFORM`, `COMPANY`, `USER`).

### `PASSENGER_WALLET`
- **Purpose**: Holds passenger funds. When a passenger tops up their wallet, or an orphaned payment is rescued, the money lands here. It can be used to pay for future bookings.
- **Normal Balance**: CREDIT (Liability). The platform owes this money to the passenger.
- **Owner**: `USER`.
- **Created By**: Lazily created by `FinancialAccountService.getPassengerWalletAccount(userId)` if it doesn't exist.
- **Mutation Rules**: Can be credited via Top-ups/Refunds. Can be debited via Wallet Checkout.

### `PAYSTACK_CLEARING`
- **Purpose**: A system-level asset account representing funds physically held by Paystack on behalf of Moja Ride.
- **Normal Balance**: DEBIT (Asset).
- **Owner**: `SYSTEM`.
- **Created By**: Database seeding script.
- **Mutation Rules**: Credited when funds are transferred out of Paystack (e.g., Operator Withdrawals, Refunds). Debited when Paystack successfully processes an inbound charge.

### `OPERATOR_RECEIVABLE`
- **Purpose**: Holds funds owed to transport operators for ticket sales.
- **Normal Balance**: CREDIT (Liability).
- **Owner**: `COMPANY`.
- **Balances**: Uses `reservedBalance` for funds in escrow (pre-trip) and `availableBalance` for funds cleared for withdrawal.
- **Mutation Rules**: Credited by successful bookings (with `reserveOnCredit: true`). Debited by Escrow Release (decrements reserved, increments available) and Operator Withdrawals (decrements available).

### `PLATFORM_COMMISSION`
- **Purpose**: Tracks revenue earned from operator commissions.
- **Normal Balance**: CREDIT (Revenue).
- **Owner**: `PLATFORM`.
- **Mutation Rules**: Strictly credited upon successful bookings.

### `PLATFORM_CONVENIENCE_FEE`
- **Purpose**: Tracks revenue earned from passenger convenience fees.
- **Normal Balance**: CREDIT (Revenue).
- **Owner**: `PLATFORM`.
- **Mutation Rules**: Strictly credited upon Paystack checkouts. (Note: Wallet checkouts waive this fee, so no credit occurs).

### `PAYMENT_PROCESSOR_FEE`
- **Purpose**: Tracks the cost of moving money via Paystack (both inbound charges and outbound transfers).
- **Normal Balance**: DEBIT (Expense).
- **Owner**: `PLATFORM`.
- **Mutation Rules**: Debited during bookings and payouts. Credited if a fee is reversed.


## 7. FinancialAccount & FinancialAccountSnapshot (Models)

### `FinancialAccount`
The core ledger model. 
- **Business Meaning**: Represents a bucket of money in the double-entry system.
- **Lifecycle**: Created when an entity (User/Company) needs to hold or owe funds. Never deleted.
- **Fields**:
  - `ownerType` (Enum: `USER`, `COMPANY`, `PLATFORM`, `SYSTEM`): Polmorphic ownership.
  - `ownerId` (String): The ID of the owner.
  - `accountCategory` (Enum): `ASSET`, `LIABILITY`, `REVENUE`, `EXPENSE`. Defines how debits/credits affect the balance.
  - `accountClass` (String): The data-driven class (e.g., "PASSENGER_WALLET").
  - `postedBalance` (BigInt): The absolute truth of the account. Derived from `SUM(entries)`. Mutated ONLY by raw SQL inside `AccountingEngine.commit()`.
  - `reservedBalance` (BigInt): The portion of the `postedBalance` that is locked (e.g. in escrow).
  - `availableBalance` (BigInt): Materialized column. Must strictly equal `postedBalance - reservedBalance`.
- **Invariants**: 
  - Cannot have a negative `availableBalance` unless `allowNegativeBalance` is true.
  - `availableBalance` + `reservedBalance` must perfectly equal `postedBalance`.
- **Common Bugs**: Developers trying to update `postedBalance` via Prisma's `update()` instead of routing through `AccountingEngine`. This causes read-modify-write race conditions resulting in phantom money.

### `FinancialAccountSnapshot`
- **Business Meaning**: A historical point-in-time record of an account's balances for analytics and auditing.
- **Lifecycle**: Created by the `snapshot-accounts` cron job (Daily, Weekly, Monthly).
- **Fields**:
  - `period` (String): "DAILY", "WEEKLY", "MONTHLY".
  - `snapshotDate` (DateTime): The exact date the snapshot represents.
  - `postedBalance`, `reservedBalance`, `availableBalance`: Captured values.
- **Who writes it**: The `snapshot-accounts` cron job.
- **Future Extensibility**: Essential for calculating average held balance over time (for treasury yields/interest).


## 8. FinancialTransaction & LedgerEntry (Models)

### `FinancialTransaction`
- **Business Meaning**: Groups one or more `LedgerEntry` rows into an atomic business event.
- **Lifecycle**: Created during an event. Status moves from `CREATED` -> `POSTED` -> `SETTLED` (or `FAILED`/`REVERSED`).
- **Fields**:
  - `type` (String): e.g., "BOOKING", "OPERATOR_PAYOUT". Used for analytics to group money flows.
  - `status` (Enum): Transaction state.
  - `externalPaymentId` (String?): FK to `ExternalPayment`. Binds the internal ledger to the external gateway.
- **Invariants**: A transaction must have at least 2 Ledger Entries.

### `LedgerEntry`
- **Business Meaning**: A single line item in the ledger (a credit or a debit).
- **Fields**:
  - `side` (Enum): `DEBIT` or `CREDIT`.
  - `amount` (BigInt): Strictly positive integer representing the smallest currency unit.
  - `sequenceNumber` (Int): 1, 2, 3... Determines the order of the entries within the transaction.
  - `idempotencyKey` (String): Unique key to absolutely prevent double-posting.
- **Who writes it**: `AccountingEngine` strictly.


## 9. ExternalPayment, PaymentAttempt & PaymentEvent (Models)

### `ExternalPayment`
- **Business Meaning**: Represents an intent to move money in the real world (via Paystack). It acts as a buffer between the unpredictable external world and the strict internal ledger.
- **Lifecycle**: Initialized during checkout. Status goes `INITIALIZED` -> `PENDING` -> `SUCCESS` or `FAILED`.
- **Fields**:
  - `amountXOF` (Int): The amount requested from the gateway.
  - `paystackReference` (String?): The unique reference given to Paystack.
  - `holdGroupId` (String?): The shopping cart being paid for.
- **Invariants**: If status is `SUCCESS`, it must have an associated `FinancialTransaction`.

### `PaymentAttempt` & `PaymentEvent`
- **Purpose**: Tracks retries and webhooks. `PaymentEvent` stores the raw JSON payload from Paystack webhooks for audit and replay purposes.


## 10. HoldGroup, PricingSnapshot & WalletReservation (Models)

### `HoldGroup`
- **Business Meaning**: Represents a user's intent to buy specific seats. It locks inventory to prevent overbooking.
- **Lifecycle**: Created when a user clicks "Checkout". Expires in 10 minutes.
- **Fields**:
  - `holdExpiresAt` (DateTime): The exact millisecond the hold expires.
  - `status` (Enum): `ACTIVE`, `EXPIRED`, `CONFIRMED`.
- **Concurrency Implications**: Multiple users trying to hold the same seat will race. The system uses a Prisma unique index on `(tripId, seatId, status="HELD")` or similar application-level checking to ensure only one HoldGroup succeeds.

### `PricingSnapshot`
- **Business Meaning**: An immutable snapshot of the pricing math at the exact moment the `HoldGroup` was created.
- **Lifecycle**: Created alongside `HoldGroup`. Never deleted. Never updated (except for waiving convenience fees during wallet checkouts).
- **Fields**:
  - `commissionBps` (Int): Commission basis points at the time.
  - `convenienceFeeBps` (Int): Convenience fee at the time.
  - `chargeAmountXOF` (Int): What the user pays.
  - `operatorNetXOF` (Int): What the operator gets.
- **Why it exists**: If a platform admin changes the commission rate from 5% to 7% while a user is on the checkout screen, the user must still pay the 5% rate they were quoted. This model guarantees that mathematical stability.

### `WalletReservation`
- **Business Meaning**: When a user pays via their Wallet, the funds are instantly locked in a reservation before the booking is fully confirmed.
- **Lifecycle**: Created upon wallet checkout initiation. Either transitions to `CONSUMED` (funds deducted) or `EXPIRED` (funds returned to available).

## 11. Booking & Refund (Models)

### `Booking`
- **Business Meaning**: Represents a physical seat on a bus for a specific trip, bound to a passenger. It is purely an operations/inventory concept.
- **Why it's not financial**: Money cannot live in a booking because a booking can be cancelled, transferred, or partially fulfilled, but money must strictly obey double-entry rules.
- **Fields**:
  - `status` (Enum): `PENDING_PAYMENT`, `CONFIRMED`, `CANCELLED`, `EXPIRED`, `COMPLETED`.
  - `paymentStatus` (Enum): `UNPAID`, `PENDING`, `PAID`, `FAILED`, `REFUNDED`.
  - `farePaid` (Int): The literal amount of XOF paid for this seat.
  - `clearedAt` (DateTime?): Set by the `release-escrow` cron. Indicates the funds have moved from `reservedBalance` to `availableBalance` for the operator.
- **Invariants**: `clearedAt` can only be set if the Trip has arrived and 24 hours have passed.

### `Refund`
- **Business Meaning**: Represents a return of funds for a `Booking`.
- **Fields**:
  - `amountXOF` (Int): Amount returned.
  - `channel` (Enum): `WALLET`, `PAYSTACK`, `CASH`, `VOUCHER`.
  - `status` (Enum): `PENDING`, `PROCESSING`, `COMPLETED`, `FAILED`.
- **Who writes it**: `RefundService` or Admin Panel.


## 12. Database Invariants Catalogue

These rules must never be violated. A violation indicates a catastrophic platform failure requiring manual DBA intervention.

1. **The Double-Entry Axiom**: For every `FinancialTransaction` where `status` IN (`POSTED`, `SETTLED`), `SUM(amount WHERE side='DEBIT')` MUST EXACTLY EQUAL `SUM(amount WHERE side='CREDIT')`.
2. **The Gateway Mirror Axiom**: There must never exist an `ExternalPayment` with status `SUCCESS` that does not have a corresponding `FinancialTransaction` linked via `externalPaymentId`. (If this happens, it means we took the user's money but didn't give them a ticket or wallet funds).
3. **The Balance Truth Axiom**: For every `FinancialAccount`, `availableBalance + reservedBalance` MUST EXACTLY EQUAL `postedBalance`.
4. **The Negative Balance Constraint**: `availableBalance` MUST be >= 0 UNLESS `allowNegativeBalance` is explicitly true (usually only true for internal platform expense accounts).
5. **The Immutable Snapshot Axiom**: A `PricingSnapshot` must never change once an `ExternalPayment` is `PENDING`.
6. **The Deadlock Prevention Axiom**: Any service that acquires raw SQL row-locks on multiple accounts MUST sort the `accountId`s alphabetically first.


## 13. Concurrency, Race Conditions & Deadlock Prevention

### The Double-Checkout Race
- **Scenario**: A user clicks "Pay" twice very fast, or two webhook payloads arrive simultaneously for the exact same payment.
- **Prevention**: The `WebhookEvent` table enforces a strict unique constraint on `idempotencyKey = provider:eventType:reference`. The first transaction wins; the second hits a Unique Constraint Violation, is caught, and ignored safely.

### The Seat Double-Booking Race
- **Scenario**: User A and User B both select Seat #4 and click Checkout.
- **Prevention**: The system creates a `Booking` with status `HELD`. A Prisma unique constraint on `(tripId, seatId, status="HELD")` ensures the database rejects the second transaction immediately.

### The Double-Withdrawal Race (CRITICAL)
- **Scenario**: An operator has 50,000 XOF. They open two tabs and click "Withdraw 50,000" on both tabs at the exact same millisecond.
- **Naive Implementation**: Both reads see 50,000. Both write `balance = balance - 50000`. Balance is now -50,000. We lost 50,000 XOF.
- **Moja Ride Implementation**: The `requestWithdrawal` procedure explicitly executes: `SELECT "availableBalance" ... FOR UPDATE`. This grabs an exclusive row-level lock in Postgres. The second tab is forced to wait. The first tab commits, deducting the 50,000. The second tab's lock is released, it re-evaluates the balance, sees 0, and throws `TRPCError("Insufficient balance")`.

### Deadlock Prevention
- **Scenario**: Transaction A debits Account X and credits Account Y. Transaction B debits Account Y and credits Account X. 
  - Tx A locks X.
  - Tx B locks Y.
  - Tx A tries to lock Y (blocked by B).
  - Tx B tries to lock X (blocked by A).
  - DEADLOCK.
- **Moja Ride Implementation**: The `AccountingEngine` receives the list of all accounts involved. It extracts the unique IDs, sorts them alphabetically (`A-Z`), and then requests the `FOR UPDATE` locks in that exact sorted order. Therefore, Tx A and Tx B will both try to lock X first, then Y. No deadlock can ever occur.


## 14. Idempotency & Error Recovery

### Network Failures During Paystack Withdrawals
If `paystack.initiateTransfer()` throws a network timeout *after* we have already deducted the operator's balance, we have a problem. The operator lost their money, but didn't get a payout.
- **Recovery Strategy**: The `reconcile-payments/route.ts` cron job.
- **How it works**: It queries for all `OPERATOR_PAYOUT` transactions stuck in `POSTED` status for > 5 minutes. It explicitly queries Paystack's API for that transfer ID.
  - If Paystack says it failed or doesn't exist, the cron triggers a `PAYOUT_REVERSAL` transaction to return the funds.
  - If Paystack says it succeeded, the cron triggers a `transfer.success` event to move the transaction to `SETTLED`.

### Orphaned Payment Rescue
If a user pays on Paystack, but takes 15 minutes, their `HoldGroup` will have `EXPIRED` (limit 10 mins). When the `charge.success` webhook arrives, `BookingConfirmationService` notices the timeout.
- **Recovery Strategy**: It does NOT confirm the bookings. It opens an `AccountingEngine("ORPHANED_PAYMENT_RESCUE")` transaction, debits the clearing account, and credits the passenger's `PASSENGER_WALLET`. The user is shown a message that their money was safely placed in their wallet to try again.

## 15. Every Transaction Type

### `BOOKING`
- **Trigger**: Passenger successfully pays for a `HoldGroup` via Paystack.
- **Accounts Affected**: 
  - Debit `PAYSTACK_CLEARING`
  - Debit `PAYMENT_PROCESSOR_FEE`
  - Credit `OPERATOR_RECEIVABLE` (to `reservedBalance`)
  - Credit `PLATFORM_COMMISSION`
  - Credit `PLATFORM_CONVENIENCE_FEE`

### `WALLET_BOOKING`
- **Trigger**: Passenger successfully pays for a `HoldGroup` via their internal Wallet.
- **Accounts Affected**: 
  - Debit `PASSENGER_WALLET`
  - Credit `OPERATOR_RECEIVABLE` (to `reservedBalance`)
  - Credit `PLATFORM_COMMISSION`
  - *(Convenience fee is waived for wallet checkouts)*

### `TOP_UP`
- **Trigger**: Passenger adds funds to wallet via Paystack.
- **Accounts Affected**: 
  - Debit `PAYSTACK_CLEARING`
  - Debit `PAYMENT_PROCESSOR_FEE`
  - Credit `PASSENGER_WALLET`

### `OPERATOR_PAYOUT` (Withdrawal)
- **Trigger**: Operator clicks "Withdraw" from the dashboard.
- **Accounts Affected**: 
  - Debit `OPERATOR_RECEIVABLE` (from `availableBalance`)
  - Credit `PAYSTACK_CLEARING`
- **Status Transitions**: Created as `POSTED`. Transitions to `SETTLED` on `transfer.success` webhook.

### `PAYOUT_REVERSAL`
- **Trigger**: Paystack `transfer.failed` or `transfer.reversed` webhook.
- **Accounts Affected**: 
  - Debit `PAYSTACK_CLEARING`
  - Credit `OPERATOR_RECEIVABLE` (Exact inverse of `OPERATOR_PAYOUT`, restoring operator balance).

### `PAYMENT_PROCESSOR_FEE` (For Payouts)
- **Trigger**: Paystack charges a fee for the transfer.
- **Accounts Affected**: 
  - Debit `PAYMENT_PROCESSOR_FEE`
  - Credit `PAYSTACK_CLEARING`

### `ORPHANED_PAYMENT_RESCUE`
- **Trigger**: A Paystack payment succeeds, but the `HoldGroup` expired.
- **Accounts Affected**: 
  - Debit `PAYSTACK_CLEARING`
  - Debit `PAYMENT_PROCESSOR_FEE`
  - Credit `PASSENGER_WALLET`

### `REFUND`
- **Trigger**: Operator or Admin cancels a trip/booking.
- **Accounts Affected**: 
  - Debit `OPERATOR_RECEIVABLE` (from reserved if before escrow release, available if after).
  - Credit `PASSENGER_WALLET` (if wallet refund) OR Credit `PAYSTACK_CLEARING` (if refund to card).


## 16. Service: AccountingEngine

**File:** `packages/db/src/services/AccountingEngine.ts`
**Responsibilities**: Build and commit double-entry ledgers safely. Guarantee zero money creation.
**Inputs**: `transactionType` (e.g., "BOOKING"), `metadata`.
**Outputs**: Inserted `FinancialTransaction` and `LedgerEntry` array.
**Internal Algorithm**:
1. Maintains internal arrays of `debits` and `credits`.
2. `addDebit(entry)` / `addCredit(entry)` tracks running totals using BigInt.
3. `commit(tx)`:
   a. Calls `validate()` -> Throws if `totalDebits !== totalCredits`.
   b. Extracts unique `accountId`s from entries. Sorts them `A-Z`.
   c. **CRITICAL**: Executes `SELECT id FROM financial_account WHERE id IN (...) FOR UPDATE`.
   d. Inserts the `FinancialTransaction` and all `LedgerEntry` records.
   e. Updates `FinancialAccount` balances using atomic raw SQL `UPDATE ... SET postedBalance = postedBalance + X ...`
   f. If `reserveOnCredit` is true for an entry, it increments `reservedBalance` instead of `availableBalance`.
**Time Complexity**: O(N log N) for sorting account IDs + O(N) for DB writes (where N is number of unique accounts involved).


## 17. Service: FinancialAccountService

**File:** `packages/db/src/services/FinancialAccountService.ts`
**Responsibilities**: Lazily create and fetch accounts. Ensure standard accounts exist.
**Methods**:
- `getOperatorReceivableAccount(companyId)`: Fetches or creates `OPERATOR_RECEIVABLE` for a company.
- `getPassengerWalletAccount(userId)`: Fetches or creates `PASSENGER_WALLET` for a user.
- `getSystemPaystackClearingAccount()`: Fetches the singleton Paystack clearing account.
**Database Reads**: `findUnique` on `FinancialAccount`.
**Database Writes**: `create` if missing.


## 18. Service: PricingResolver

**File:** `apps/web/features/payments/lib/pricing-resolver.ts`
**Responsibilities**: Calculate immutable `PricingSnapshot`s for checkouts.
**Internal Algorithm**:
1. Receive `baseFareXOF`, `seatCount`, `distanceKm`.
2. Query `CommissionDistanceTier` where `minDistanceKm <= distanceKm < maxDistanceKm`.
3. Query `PlatformSettings` for `defaultConvenienceFeeBps`.
4. Calculate `subtotalBaseXOF = baseFareXOF * seatCount`.
5. Calculate `convenienceFeeXOF = round(subtotal * convenienceFeeBps / 10000)`.
6. Calculate `commissionXOF = round(subtotal * commissionBps / 10000)`.
7. Calculate `chargeAmountXOF = subtotal + convenienceFeeXOF`.
8. Calculate `operatorNetXOF = subtotal - commissionXOF`.
**Rollback Behavior**: Pure calculation function, no rollbacks needed.


## 19. Service: PaymentService & Webhook Processor

**File:** `apps/web/features/payments/payment-service.ts`
**Responsibilities**: Interface with Paystack, verify signatures, dispatch webhooks to internal services.
**Webhook Logic**:
1. Extract Paystack signature. Hash payload with secret. Reject if mismatch.
2. Query `WebhookEvent` table for `idempotencyKey = event:reference`.
3. If exists and `processedAt != null`, return 200 OK immediately (Duplicate).
4. If exists and `processedAt == null`, throw error (Race condition in progress).
5. Insert `WebhookEvent` with `processedAt = null`.
6. Switch on `event`:
   - `charge.success`: Call `BookingConfirmationService.confirmFromPayment()`.
   - `transfer.success`: Update `FinancialTransaction` status to `SETTLED`.
   - `transfer.failed` / `transfer.reversed`: Create `PAYOUT_REVERSAL` transaction.
7. Update `WebhookEvent` to set `processedAt = now()`.


## 20. Service: BookingConfirmationService

**File:** `apps/web/features/payments/services/booking-confirmation-service.ts`
**Responsibilities**: Move bookings from HELD to CONFIRMED and post the ledger.
**Method:** `confirmFromPayment()`
**Step-by-step execution**:
1. Load `HoldGroup`. If `CONFIRMED`, return success.
2. Assert `HoldGroup.payment` is `SUCCESS`.
3. **Orphan Rescue Check**: If `HoldGroup` is `EXPIRED` (time > 10 mins), branch to `rescueOrphanedPayment()`. Do NOT confirm bookings.
4. Open `prisma.$transaction`.
5. Iterate `holdGroup.bookings`: Update status to `CONFIRMED`, `paymentStatus` to `PAID`, clear `holdExpiresAt`.
6. Update `HoldGroup` status to `CONFIRMED`.
7. Initialize `AccountingEngine("BOOKING")`.
8. `engine.addDebit` to Paystack clearing (net of Paystack fees).
9. `engine.addDebit` to Payment Processor Fee (the Paystack fee).
10. `engine.addCredit` to operator (`reserveOnCredit: true`).
11. `engine.addCredit` to commission and convenience fee accounts.
12. `engine.commit(tx)`.
13. Return success.


## 21. Service: Withdrawal Logic (operator.ts)

**File:** `apps/web/trpc/routers/operator.ts` (Procedure: `requestWithdrawal`)
**Responsibilities**: Initiate Paystack transfers safely.
**Step-by-step execution**:
1. Assert caller is `OWNER`.
2. Assert amount >= `minWithdrawalAmount`.
3. Open `prisma.$transaction`.
4. **CRITICAL**: Execute `SELECT "availableBalance" FROM financial_account WHERE id = ? FOR UPDATE`.
5. Assert `availableBalance >= amount`.
6. Initialize `AccountingEngine("OPERATOR_PAYOUT")`.
7. Debit `OPERATOR_RECEIVABLE` (amount). Credit `PAYSTACK_CLEARING` (amount).
8. `engine.commit(tx)`. (Operator balance is now explicitly deducted).
9. Close transaction.
10. Out-of-band: Call `paystack.initiateTransfer()`.
11. Update `FinancialTransaction` with the returned Paystack reference.

## 22. Cron: reconcile-payments

**File:** `apps/web/app/api/cron/reconcile-payments/route.ts`
**Execution:** Runs periodically (e.g. every 5 minutes).
**Responsibilities**: Catch missing Paystack webhooks and fix stuck transactions.
**Internal Algorithm**:
1. **Withdrawals**: Queries `OPERATOR_PAYOUT` transactions with `status` IN `['CREATED', 'POSTED']` older than 5 minutes.
   - For each, calls `paystackVerifyTransfer(tx.id)`.
   - If Paystack says it succeeded/failed, it synthetically triggers `paymentService.handleWebhookEvent()` with the correct simulated payload.
2. **Charges**: Queries `ExternalPayment` where `status == 'PENDING'` older than 5 minutes.
   - For each, calls `paymentService.handleWebhookEvent()` simulating a `charge.success` (which internally does a verification call to Paystack).


## 23. Cron: release-escrow

**File:** `apps/web/app/api/cron/release-escrow/route.ts`
**Execution:** Runs daily.
**Auth:** Fail-closed via `assertCronAuthorized` (Bearer `CRON_SECRET`) in all environments.
**Responsibilities**: Sweep funds from `reservedBalance` to `availableBalance` after a trip completes, with a ledger journal.
**Business Rule**: Funds are released 24 hours after `actualArrival`.
**Internal Algorithm**:
1. Queries `CONFIRMED` bookings where `clearedAt == null` and `trip.actualArrival < (now - 24h)`.
2. Groups by `HoldGroup` and `CompanyId`.
3. Checks for partial refunds (e.g., user booked 3 seats, but 1 was `CANCELLED`).
4. **Math**: Uses `computeEscrowReleaseNet` — fails closed when booking snapshot is missing (no gross `farePaid` fallback).
   - `standardNet = round(snapshot.operatorNetXOF / snapshot.seatCount)`.
   - If releasing the final seat of a group, `net = snapshot.operatorNetXOF - (alreadyReleasedCount * standardNet)`.
5. In a `$transaction` with row locks:
   - Posts an `ESCROW_RELEASE` journal: debit + credit the same `OPERATOR_RECEIVABLE` with `releaseFromReserve` on the debit (net posted 0; reserved → available).
   - AccountingEngine enforces reserved solvency when `releaseFromReserve` is set.
   - Sets `clearedAt = now()` **after** the journal succeeds (idempotent on re-run).
6. CASH/VOUCHER cancellations claw back operator net to an offline refund payable account (not a silent balance mutation).


## 24. Cron: release-reservations

**File:** `apps/web/app/api/cron/release-reservations/route.ts`
**Responsibilities**: Clean up expired `WalletReservation` records.
**Scenario**: User starts a wallet checkout, we reserve funds, but they never complete it.
**Algorithm**:
1. Find `WalletReservation` where `expiresAt < now()` and `status = ACTIVE`.
2. `$transaction`: Update `status = EXPIRED`.
3. Decrement `reservedBalance` and increment `availableBalance` on the `PASSENGER_WALLET`.


## 25. Cron: snapshot-accounts

**File:** `apps/web/app/api/cron/snapshot-accounts/route.ts`
**Execution**: Daily, Weekly (Mondays), Monthly (1st).
**Responsibilities**: Write historical snapshots of all balances to `FinancialAccountSnapshot`.
**Why**: Needed for "Average Held Balance" and "Money Retention" analytics without having to replay the entire ledger history dynamically.


## 26. Workflow: Passenger Booking (Paystack)

**Sequence**:
1. `Client` -> `TRPC (createHold)`: Reserves seats.
2. `TRPC` -> `PricingResolver`: Creates `PricingSnapshot`.
3. `TRPC` -> `PaymentService`: Calls Paystack API, creates `ExternalPayment`.
4. `TRPC` -> `Client`: Returns Paystack Checkout URL.
5. `Client` -> `Paystack`: User enters card.
6. `Paystack` -> `Webhook Processor`: Delivers `charge.success`.
7. `Webhook Processor` -> `BookingConfirmationService`: Confirms bookings, writes Ledger, commits.
8. `BookingConfirmationService` -> `NotificationService`: Sends SMS/Email.

**Failure Branches**: 
- If user closes browser before paying: `HoldGroup` expires after 10 mins. `release-reservations` (if wallet) or next seat query reclaims the seats.
- If Paystack webhook fails: `reconcile-payments` cron will catch it 5 minutes later.


## 27. Workflow: Operator Withdrawal

**Sequence**:
1. `Operator` -> `TRPC (requestWithdrawal)`: Requests 50,000 XOF.
2. `TRPC` -> `Database`: `SELECT FOR UPDATE` locks account.
3. `TRPC` -> `AccountingEngine`: Debits `OPERATOR_RECEIVABLE`, Credits `PAYSTACK_CLEARING`. Commits DB.
4. `TRPC` -> `Paystack API`: Calls `transfer`.
5. `Paystack` -> `Webhook Processor`: Delivers `transfer.success` hours later.
6. `Webhook Processor`: Marks `FinancialTransaction` as `SETTLED`.

**Failure Branches**:
- If Paystack rejects transfer immediately (e.g. bad bank code): `TRPC` catches it, executes a compensating `PAYOUT_REVERSAL` ledger entry immediately, returns error to user.
- If Paystack webhook says `transfer.failed` days later: Webhook processor creates `PAYOUT_REVERSAL` transaction to return funds.


## 30. Business Rules & Formulas

### Commission Formula
`Commission = round((BaseFare * SeatCount) * CommissionBps / 10000)`
- *Precision*: Rounded to nearest integer. No floating points stored.
- *Edge Case*: If multiple seats, subtotal is calculated *before* commission application to prevent 1 XOF rounding drift across seats.

### Minimum Withdrawal
- *Rule*: Defined in `PlatformSettings.minWithdrawalAmount` (Default: 5000 XOF).

### Escrow Clearance Rule
- *Rule*: Escrow is held for exactly 24 hours post-arrival. This ensures passengers have a window to file complaints (e.g. bus never showed up) before the operator can withdraw the funds.


## 31. Analytics & Metrics

The ledger architecture mathematically enables:
- **Platform Liabilities**: `SUM(availableBalance) + SUM(reservedBalance)` across all non-system accounts.
- **Cash Conversion Cycle**: Time between `BOOKING` (money received) and `OPERATOR_PAYOUT` (money leaving).
- **Processor Fee Ratio**: `SUM(Amount in PAYMENT_PROCESSOR_FEE) / SUM(Amount in BOOKING)`.
- **Withdrawal Latency**: Time between `OPERATOR_PAYOUT` creation and `SETTLED` status.


## 32. Future Extensibility (Savings, Payroll, Loans, etc.)

Because money is stored in `FinancialAccount` rows mapped by `accountClass` rather than hardcoded `User.balance` columns, the platform can infinitely expand:
- **Savings / Virtual Accounts**: An operator can open a "Maintenance Fund". This is just a new `FinancialAccount` row. A `SettlementPolicy` can intercept 5% of all `BOOKING` credits and route them to this virtual account.
- **Loans**: The platform issues a loan by creating a `LOAN_RECEIVABLE` asset. It debits `LOAN_RECEIVABLE` and credits `OPERATOR_RECEIVABLE`. The operator withdraws the cash. Future ticket sales are intercepted to credit `LOAN_RECEIVABLE` until the balance is 0.


## 33. End-to-End Scenarios

### Scenario: The Orphan Rescue
1. User holds a 10,000 XOF ticket. Expiry is 12:00.
2. User enters OTP on their bank page. Bank is slow.
3. At 12:02, bank approves. Paystack charges the card.
4. At 12:03, Paystack webhook arrives.
5. `BookingConfirmationService` sees `HoldGroup` is `EXPIRED`.
6. It cannot confirm the ticket (someone else might have bought it at 12:01).
7. It posts `ORPHANED_PAYMENT_RESCUE` to the ledger.
8. The 10,000 XOF is placed in the user's `PASSENGER_WALLET`.
9. The user is notified they can use their wallet balance to try again. 
10. *Platform Integrity preserved: We did not steal the money, nor did we double-book a seat.*

<!-- GOAL_COMPLETE -->
