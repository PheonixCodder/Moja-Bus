# Sequence Diagrams: End-to-End System Flows

[⬅️ Back to README](./README.md)

---

These diagrams trace the complete chronological flow of interactions across all system boundaries: Client, Moja Ride Server, PostgreSQL Database, and the Paystack API.

Each diagram uses the following notation conventions:
- **`-->>` (dashed arrow)**: Asynchronous or return response
- **`->>`** (solid arrow): Synchronous call or event
- **`Note over`**: System-level operations (transactions, locks)
- **`alt`**: Branching paths

---

## 1. Successful Booking (Card Payment via Paystack)

The primary happy path: passenger pays by card, seats confirmed, accounting posted.

```mermaid
sequenceDiagram
    participant Client as Passenger Client
    participant Server as Moja Ride Server
    participant DB as PostgreSQL
    participant Paystack

    Client->>Server: POST /createHold {tripId, seatIds, passengers}
    Server->>DB: Check seat availability
    DB-->>Server: Seats available
    Server->>DB: INSERT HoldGroup {status: ACTIVE, expiresAt: T+10min}
    Server->>DB: INSERT Booking × N {status: PENDING_PAYMENT}
    Server->>DB: INSERT PricingSnapshot {fareBreakdown, snapshot}
    Server->>Paystack: POST /transaction/initialize {amount, email, reference}
    Paystack-->>Server: {authorization_url, reference: 'T-abc123'}
    Server->>DB: INSERT ExternalPayment {status: PENDING, reference: 'T-abc123'}
    Server-->>Client: {checkoutUrl: '...', reference: 'T-abc123'}

    Client->>Paystack: User enters card details + OTP
    Paystack-->>Client: Payment success page

    Note over Paystack,Server: Asynchronous webhook (within seconds)

    Paystack->>Server: POST /webhook {event: 'charge.success', reference: 'T-abc123'}
    Server->>Server: Verify HMAC-SHA512 signature
    Server->>DB: INSERT WebhookEvent {idempotencyKey: 'PAYSTACK:charge.success:T-abc123'}

    Note over Server,DB: TRANSACTION BOUNDARY START (prisma.$transaction)
    Server->>DB: SELECT HoldGroup FOR UPDATE
    DB-->>Server: {status: ACTIVE} (lock acquired)
    Server->>DB: UPDATE HoldGroup {status: CONFIRMED}
    Server->>DB: UPDATE Booking × N {status: CONFIRMED}
    Server->>DB: SELECT FinancialAccount × N FOR UPDATE (sorted by ID - deadlock prevention)
    Server->>DB: INSERT FinancialTransaction {type: 'BOOKING', amount: grossCharge}
    Server->>DB: INSERT LedgerEntry {DEBIT PAYSTACK_CLEARING, amount: grossCharge - fee}
    Server->>DB: INSERT LedgerEntry {DEBIT PAYMENT_PROCESSOR_FEE, amount: fee}
    Server->>DB: INSERT LedgerEntry {CREDIT OPERATOR_RECEIVABLE reservedBalance, amount: operatorNet}
    Server->>DB: INSERT LedgerEntry {CREDIT PLATFORM_COMMISSION, amount: commission}
    Server->>DB: INSERT LedgerEntry {CREDIT PLATFORM_CONVENIENCE_FEE, amount: convenienceFee}
    Server->>DB: UPDATE FinancialAccount PAYSTACK_CLEARING {postedBalance += net}
    Server->>DB: UPDATE FinancialAccount OPERATOR_RECEIVABLE {reservedBalance += net}
    Server->>DB: UPDATE FinancialAccount PLATFORM_COMMISSION {postedBalance += commission}
    Note over Server,DB: TRANSACTION BOUNDARY COMMIT (all or nothing)

    Server->>DB: UPDATE ExternalPayment {status: SUCCESS}
    Server-->>Paystack: HTTP 200 OK
    Server->>Client: Send ticket confirmation email/SMS
```

---

## 2. Wallet Booking (Internal Payment, No Gateway)

When the passenger pays entirely from their `PASSENGER_WALLET` balance. This flow bypasses Paystack entirely, resulting in sub-second confirmation.

```mermaid
sequenceDiagram
    participant Client as Passenger Client
    participant Server as Moja Ride Server
    participant DB as PostgreSQL

    Client->>Server: POST /createHold {tripId, seatIds}
    Server->>DB: INSERT HoldGroup, Bookings, PricingSnapshot
    Server->>DB: Check PASSENGER_WALLET.availableBalance
    DB-->>Server: 25000 XOF available (>= 20000 required)
    Server->>DB: INSERT WalletReservation {amount: 20000, status: ACTIVE}
    Server->>DB: UPDATE PASSENGER_WALLET {availableBalance -= 20000, reservedBalance += 20000}
    Server-->>Client: {sessionReady: true, paymentMethod: 'WALLET'}

    Client->>Server: POST /confirmWalletBooking {holdGroupId}

    Note over Server,DB: TRANSACTION BOUNDARY START
    Server->>DB: SELECT HoldGroup FOR UPDATE
    DB-->>Server: {status: ACTIVE} (lock acquired)
    Server->>DB: SELECT WalletReservation FOR UPDATE
    DB-->>Server: {status: ACTIVE, amount: 20000}
    Server->>DB: UPDATE HoldGroup {status: CONFIRMED}
    Server->>DB: UPDATE Booking × N {status: CONFIRMED}
    Server->>DB: SELECT FinancialAccount × N FOR UPDATE (sorted by ID)
    Server->>DB: INSERT FinancialTransaction {type: 'WALLET_BOOKING', amount: 20000}
    Server->>DB: INSERT LedgerEntry {DEBIT PASSENGER_WALLET reservedBalance, amount: 20000}
    Server->>DB: INSERT LedgerEntry {CREDIT OPERATOR_RECEIVABLE reservedBalance, amount: operatorNet}
    Server->>DB: INSERT LedgerEntry {CREDIT PLATFORM_COMMISSION, amount: commission}
    Server->>DB: UPDATE FinancialAccount PASSENGER_WALLET {reservedBalance -= 20000, postedBalance -= 20000}
    Server->>DB: UPDATE FinancialAccount OPERATOR_RECEIVABLE {reservedBalance += operatorNet}
    Server->>DB: UPDATE WalletReservation {status: CONSUMED}
    Note over Server,DB: TRANSACTION BOUNDARY COMMIT

    Server-->>Client: HTTP 200 {tickets: [...]} (instant confirmation)
```

---

## 3. Operator Withdrawal (Pessimistic Locking)

The withdrawal flow, including the critical lock-before-debit ordering that prevents double-spends.

```mermaid
sequenceDiagram
    participant Operator
    participant Server as Moja Ride Server
    participant DB as PostgreSQL
    participant Paystack

    Operator->>Server: POST /requestWithdrawal {amount: 50000}
    Server->>DB: Check operator company status (not SUSPENDED)

    Note over Server,DB: TRANSACTION BOUNDARY START
    Server->>DB: SELECT availableBalance FROM financial_account WHERE id=X FOR UPDATE
    DB-->>Server: {availableBalance: 50000} (exclusive lock acquired; concurrent requests wait here)
    Server->>Server: Validate: 50000 >= 50000 AND 50000 >= MINIMUM_WITHDRAWAL
    Server->>DB: INSERT FinancialTransaction {type: 'OPERATOR_PAYOUT', status: 'CREATED'}
    Server->>DB: INSERT LedgerEntry {DEBIT OPERATOR_RECEIVABLE, amount: 50000}
    Server->>DB: INSERT LedgerEntry {CREDIT PAYSTACK_CLEARING, amount: 50000}
    Server->>DB: UPDATE FinancialAccount {availableBalance -= 50000}
    Server->>DB: INSERT ExternalPayment {type: PAYOUT, status: PENDING, reference: 'TX-MOJ-123'}
    Note over Server,DB: TRANSACTION BOUNDARY COMMIT (lock released)

    Server->>Paystack: POST /transfer {amount: 5000000, recipient: 'RCP_abc', reference: 'TX-MOJ-123'}

    alt Transfer Accepted by Paystack
        Paystack-->>Server: {status: true, data: {transfer_code: 'TRF_xyz'}}
        Server-->>Operator: HTTP 200 {message: 'Transfer initiated'}

        Note over Paystack,Server: Asynchronous webhook (minutes to hours)
        Paystack->>Server: POST /webhook {event: 'transfer.success', reference: 'TX-MOJ-123'}
        Server->>DB: UPDATE ExternalPayment {status: SUCCESS}
        Server->>DB: UPDATE FinancialTransaction {status: SETTLED}
        Server-->>Paystack: HTTP 200 OK

    else Transfer Rejected by Paystack (HTTP 4xx/5xx)
        Paystack-->>Server: Error response
        Note over Server,DB: COMPENSATING TRANSACTION
        Server->>DB: INSERT FinancialTransaction {type: 'PAYOUT_REVERSAL'}
        Server->>DB: INSERT LedgerEntry {DEBIT PAYSTACK_CLEARING, amount: 50000}
        Server->>DB: INSERT LedgerEntry {CREDIT OPERATOR_RECEIVABLE availableBalance, amount: 50000}
        Server->>DB: UPDATE FinancialAccount {availableBalance += 50000}
        Server->>DB: UPDATE ExternalPayment {status: FAILED}
        Server-->>Operator: HTTP 422 {error: 'Transfer failed. Funds restored.'}
    end
```

---

## 4. Booking Cancellation & Refund

A passenger cancels their booking before the trip. Funds return to their wallet.

```mermaid
sequenceDiagram
    participant Client as Passenger Client
    participant Server as Moja Ride Server
    participant DB as PostgreSQL

    Client->>Server: POST /cancelBooking {bookingId}
    Server->>DB: SELECT Booking {status: CONFIRMED, paymentStatus: PAID}
    DB-->>Server: Booking data

    Server->>Server: Calculate refund amount (fare - non-refundable fees)
    Server->>DB: SELECT PricingSnapshot for this HoldGroup

    Note over Server,DB: TRANSACTION BOUNDARY START
    Server->>DB: SELECT FinancialAccount × 3 FOR UPDATE (OPERATOR_RECEIVABLE, PLATFORM_COMMISSION, PASSENGER_WALLET - sorted by ID)
    Server->>DB: INSERT FinancialTransaction {type: 'REFUND', amount: refundAmount}
    Server->>DB: INSERT LedgerEntry {DEBIT OPERATOR_RECEIVABLE from reservedBalance, amount: operatorNet}
    Server->>DB: INSERT LedgerEntry {DEBIT PLATFORM_COMMISSION, amount: commission}
    Server->>DB: INSERT LedgerEntry {CREDIT PASSENGER_WALLET availableBalance, amount: refundAmount}
    Server->>DB: UPDATE FinancialAccount OPERATOR_RECEIVABLE {reservedBalance -= operatorNet}
    Server->>DB: UPDATE FinancialAccount PLATFORM_COMMISSION {postedBalance -= commission}
    Server->>DB: UPDATE FinancialAccount PASSENGER_WALLET {availableBalance += refundAmount}
    Server->>DB: UPDATE Booking {status: CANCELLED, paymentStatus: REFUNDED}
    Note over Server,DB: TRANSACTION BOUNDARY COMMIT

    Server-->>Client: HTTP 200 {refundAmount: 18000, creditsTo: 'WALLET'}
    Server->>Client: Send refund confirmation email/SMS
```

---

## 5. Escrow Release (Automated Cron)

24 hours after trip arrival, escrowed funds become available for operator withdrawal.

```mermaid
sequenceDiagram
    participant Cron as release-escrow cron
    participant DB as PostgreSQL

    Cron->>DB: SELECT bookings WHERE status=CONFIRMED AND clearedAt IS NULL AND trip.actualArrival < NOW()-24h LIMIT 500
    DB-->>Cron: [list of 500 bookings]

    Cron->>Cron: Group bookings by holdGroupId

    loop For each HoldGroup
        Cron->>DB: SELECT PricingSnapshot for HoldGroup
        Cron->>Cron: Calculate netToRelease per seat (with rounding correction for last seat)
    end

    Cron->>Cron: Aggregate totalNet per companyId

    Note over Cron,DB: TRANSACTION BOUNDARY START
    loop For each Company in batch
        Cron->>DB: UPDATE FinancialAccount OPERATOR_RECEIVABLE {reservedBalance -= totalNet, availableBalance += totalNet}
    end
    Cron->>DB: UPDATE Booking SET clearedAt = NOW() WHERE id IN (batchIds)
    Note over Cron,DB: TRANSACTION BOUNDARY COMMIT

    Note over Cron: If commit fails, clearedAt is never set. Next cron run picks up same bookings. Fully idempotent.
```

---

## 6. Reconcile-Payments Cron (Orphan Recovery)

The cron that catches all missed webhooks and recovers stuck transactions.

```mermaid
sequenceDiagram
    participant Cron as reconcile-payments cron
    participant DB as PostgreSQL
    participant Paystack

    Note over Cron: Phase 1: Inbound Charge Reconciliation
    Cron->>DB: SELECT ExternalPayment WHERE status=PENDING AND createdAt < 5min ago
    DB-->>Cron: [list of stale pending payments]

    loop For each stale payment
        Cron->>Paystack: GET /transaction/verify/:reference
        Paystack-->>Cron: {status: 'success'} OR {status: 'failed'}

        alt Paystack says SUCCESS
            Cron->>DB: SELECT HoldGroup for this payment
            alt HoldGroup is ACTIVE (seats still available)
                Cron->>Cron: Trigger BookingConfirmationService.confirmFromPayment()
            else HoldGroup is EXPIRED
                Cron->>Cron: Trigger BookingConfirmationService.rescueOrphanedPayment()
                Note over Cron: ORPHANED_PAYMENT_RESCUE transaction posted. Money credited to PASSENGER_WALLET.
            end
        else Paystack says FAILED or ABANDONED
            Cron->>DB: UPDATE ExternalPayment {status: FAILED}
            Cron->>DB: UPDATE HoldGroup {status: EXPIRED} (if not already)
        end
    end

    Note over Cron: Phase 2: Outbound Transfer Reconciliation
    Cron->>DB: SELECT FinancialTransaction WHERE type=OPERATOR_PAYOUT AND status IN [CREATED,POSTED] AND createdAt < 5min ago
    DB-->>Cron: [list of stale payouts]

    loop For each stale payout
        Cron->>Paystack: GET /transfer/verify/:reference
        Paystack-->>Cron: {status: 'success'} OR {status: 'failed'}

        alt Paystack says SUCCESS
            Cron->>DB: UPDATE ExternalPayment {status: SUCCESS}
            Cron->>DB: UPDATE FinancialTransaction {status: SETTLED}
        else Paystack says FAILED or REVERSED
            Cron->>Cron: Execute PAYOUT_REVERSAL transaction
            Note over Cron: Operator availableBalance restored
        end
    end
```

---

## 7. Wallet Top-Up

A passenger adds money to their wallet via a Paystack card charge.

```mermaid
sequenceDiagram
    participant Client as Passenger Client
    participant Server as Moja Ride Server
    participant DB as PostgreSQL
    participant Paystack

    Client->>Server: POST /wallet/topup {amount: 20000}
    Server->>Paystack: POST /transaction/initialize {amount: 2000000, reference: 'TOPUP-usr-xyz-001'}
    Paystack-->>Server: {authorization_url, reference}
    Server->>DB: INSERT ExternalPayment {type: TOPUP, status: PENDING, reference: 'TOPUP-usr-xyz-001'}
    Server-->>Client: {checkoutUrl}

    Client->>Paystack: User completes payment
    Paystack-->>Client: Success redirect

    Paystack->>Server: POST /webhook {event: 'charge.success', reference: 'TOPUP-usr-xyz-001'}
    Server->>Server: Verify HMAC-SHA512
    Server->>DB: INSERT WebhookEvent {idempotencyKey}

    Note over Server,DB: TRANSACTION BOUNDARY START
    Server->>DB: SELECT FinancialAccount × 2 FOR UPDATE (PAYSTACK_CLEARING, PASSENGER_WALLET - sorted by ID)
    Server->>DB: INSERT FinancialTransaction {type: 'TOP_UP', amount: 20000}
    Server->>DB: INSERT LedgerEntry {DEBIT PAYSTACK_CLEARING, amount: 19600} (20000 - 400 fee)
    Server->>DB: INSERT LedgerEntry {DEBIT PAYMENT_PROCESSOR_FEE, amount: 400}
    Server->>DB: INSERT LedgerEntry {CREDIT PASSENGER_WALLET, amount: 20000} (full gross amount)
    Server->>DB: UPDATE FinancialAccount PAYSTACK_CLEARING {postedBalance += 19600}
    Server->>DB: UPDATE FinancialAccount PASSENGER_WALLET {availableBalance += 20000, postedBalance += 20000}
    Note over Server,DB: TRANSACTION BOUNDARY COMMIT

    Server->>DB: UPDATE ExternalPayment {status: SUCCESS}
    Server-->>Paystack: HTTP 200 OK
    Server->>Client: Push notification: "20,000 XOF added to your wallet"
```

---

*See also: [10 - Concurrency](./10-concurrency.md) | [11 - Idempotency](./11-idempotency.md) | [05 - State Machines](./05-state-machines.md)*
