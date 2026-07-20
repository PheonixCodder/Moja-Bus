# State Machines

[⬅️ Back to README](./README.md)

---

Many entities in the platform behave as finite state machines. Moving between states triggers specific business logic.

## 1. `Booking` Status

- **`PENDING_PAYMENT`**: The seat is held. The user is currently checking out.
- **`CONFIRMED`**: The payment succeeded. The seat is fully owned by the user.
- **`EXPIRED`**: The user did not pay within 10 minutes. The seat is returned to inventory.
- **`CANCELLED`**: The user or operator cancelled the trip. Triggers the Refund workflow.
- **`COMPLETED`**: The trip physically arrived, and the funds have been cleared from escrow.

## 2. `HoldGroup` Status

- **`ACTIVE`**: User is on the checkout page. (Expires after 10 mins).
- **`CONFIRMED`**: Payment succeeded. All child bookings are confirmed.
- **`EXPIRED`**: The 10-minute timer ran out.
  - *Invalid Transition*: Cannot go from `EXPIRED` to `CONFIRMED`. If a payment arrives now, it must trigger Orphan Rescue.

## 3. `FinancialTransaction` Status

- **`CREATED`**: Initialized in memory, before math validation.
- **`POSTED`**: Math validated, row locks acquired, database committed. Ledger is fully updated.
- **`SETTLED`**: The external world (e.g., Paystack) has verified the transaction completed.
- **`FAILED`**: The external world rejected the transaction (e.g., bad bank account).
- **`REVERSED`**: A compensating transaction was issued to undo this transaction.

## 4. `ExternalPayment` Status

- **`INITIALIZED`**: We asked Paystack for a checkout URL.
- **`PENDING`**: User is on the Paystack page entering card details.
- **`SUCCESS`**: Webhook arrived confirming payment.
- **`FAILED`**: Webhook arrived indicating card declined.

## 5. `WalletReservation` Status

- **`ACTIVE`**: Funds are locked in `reservedBalance`.
- **`CONSUMED`**: Funds were successfully spent to buy a ticket.
- **`EXPIRED`**: User abandoned the checkout. Funds returned to `availableBalance`.
- **`CANCELLED`**: Same as expired, but manually triggered by a system failure.
