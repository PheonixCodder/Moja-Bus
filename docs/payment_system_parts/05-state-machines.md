# 05. State Machines

Everything financial in Moja Ride is a state transition. This document outlines the lifecycle of the core operational models using state machine diagrams.

---

## 1. ExternalPayment

The `ExternalPayment` model tracks communication intent with a third-party gateway (like Paystack). It maps directly to the `PaymentRecordStatus` enum.

```mermaid
stateDiagram-v2
    [*] --> INITIALIZED: User clicks "Pay"
    INITIALIZED --> PENDING: Sent to Paystack
    
    PENDING --> SUCCESS: charge.success webhook
    PENDING --> FAILED: charge.failed webhook
    
    SUCCESS --> DISPUTED: charge.dispute.create webhook
    SUCCESS --> REFUNDED: Manual Admin Refund via Dashboard
    
    DISPUTED --> SUCCESS: Dispute won
    DISPUTED --> REFUNDED: Dispute lost
```

## 2. FinancialTransaction

The `FinancialTransaction` model represents a completed or pending atomic movement of money on the Moja Ride ledger. It maps to the `TransactionStatus` enum.

```mermaid
stateDiagram-v2
    [*] --> CREATED: Engine initialized
    CREATED --> PENDING: Awaiting external confirmation
    
    CREATED --> POSTED: Immediate Ledger Commit
    PENDING --> POSTED: Webhook confirmed
    
    POSTED --> SETTLED: Reconciled with bank statements
    
    POSTED --> REVERSED: A REVERSAL transaction was appended
    PENDING --> FAILED: External confirmation failed
    PENDING --> VOIDED: Cancelled before execution
```

*Note: In the current implementation, most transactions skip `PENDING` and go directly to `POSTED` inside an atomic Prisma transaction block.*

## 3. Booking

The `Booking` model tracks the operational state of a ticket. It maps to the `BookingStatus` enum.

```mermaid
stateDiagram-v2
    [*] --> PENDING_PAYMENT: HoldGroup created
    
    PENDING_PAYMENT --> EXPIRED: Hold expires (10 mins)
    PENDING_PAYMENT --> CONFIRMED: Payment SUCCESS
    
    CONFIRMED --> CANCELLED: Passenger cancels before departure
    CONFIRMED --> CANCELLED: Operator cancels trip
    
    CONFIRMED --> COMPLETED: passenger boards / trip finishes
    
    %% Refunds are tracked separately via paymentStatus
```

*Note on Payments: A Booking also maintains a `paymentStatus` field (`UNPAID` -> `PAID` -> `REFUNDED`).*

## 4. WalletReservation

The `WalletReservation` model locks funds in a user's wallet while they are at checkout, preventing double-spending.

```mermaid
stateDiagram-v2
    [*] --> ACTIVE: User enters checkout with Wallet
    
    ACTIVE --> CONSUMED: Checkout succeeds (Ledger POSTED)
    ACTIVE --> EXPIRED: Checkout times out (Cron sweeps)
    ACTIVE --> CANCELLED: User clicks "Cancel" / Payment fails
```

## 5. HoldGroup

The `HoldGroup` manages the temporary locking of physical bus seats across multiple bookings during checkout.

```mermaid
stateDiagram-v2
    [*] --> ACTIVE: Checkout initiated
    
    ACTIVE --> EXPIRED: 10 minutes elapse without payment
    ACTIVE --> CONFIRMED: Payment SUCCESS
    ACTIVE --> CANCELLED: All seats refunded
```
