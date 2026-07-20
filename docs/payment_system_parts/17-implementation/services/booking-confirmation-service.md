# Service: Booking Confirmation Service

[⬅️ Back to Services Overview](./README.md)

---

**File:** `apps/web/features/payments/services/booking-confirmation-service.ts`

The `BookingConfirmationService` is the ultimate orchestrator. It receives a successful payment event and translates it into physical `Booking` confirmations and complex `AccountingEngine` ledger entries.

## Responsibilities
- Transition `HoldGroup` and `Booking` statuses from `ACTIVE`/`PENDING_PAYMENT` to `CONFIRMED`.
- Release the `WalletReservation` if the user paid via Wallet.
- Execute the massive double-entry ledger posting to distribute the money.
- Handle edge cases like "Orphaned Payments" (where the user paid, but their hold expired before the webhook arrived).

## Deep Dive: `confirmFromPayment()`

When `charge.success` arrives, this method executes the following critical flow:

### 1. The Orphan Check
It loads the `HoldGroup`. 
- If `HoldGroup.status === CONFIRMED`, it returns early (Idempotency).
- If `HoldGroup.status === EXPIRED`, a severe edge case has occurred: the user paid, but took longer than 10 minutes, and the seats were released. 
  - **Action**: It branches to `rescueOrphanedPayment()`. It uses the `AccountingEngine` to debit the `PAYSTACK_CLEARING` account and credit the user's `PASSENGER_WALLET`. It does NOT confirm the bookings. The user keeps their money safely in their wallet.

### 2. The Transaction Boundary
It opens a `prisma.$transaction()`. Everything from here on must succeed or fail together.

### 3. Domain Updates
- Iterates over all `Booking` rows in the group. Updates `status = CONFIRMED`, `paymentStatus = PAID`.
- Sets `HoldGroup.status = CONFIRMED`.

### 4. Ledger Construction
It instantiates the `AccountingEngine("BOOKING")`.
Using the values from the immutable `PricingSnapshot`, it builds the ledger:

```typescript
// Debit the money arriving in Paystack
engine.addDebit({ accountId: systemClearing.id, amount: snapshot.chargeAmountXOF - paystackFee });

// Debit the expense for processing the card
engine.addDebit({ accountId: processorFeeAccount.id, amount: paystackFee });

// Credit the operator's escrow balance
engine.addCredit({ 
  accountId: operatorReceivable.id, 
  amount: snapshot.operatorNetXOF,
  reserveOnCredit: true // <--- CRITICAL: This locks the money in escrow
});

// Credit the platform's revenue
engine.addCredit({ accountId: commissionAccount.id, amount: snapshot.commissionXOF });
engine.addCredit({ accountId: convenienceFeeAccount.id, amount: snapshot.convenienceFeeXOF });
```

### 5. Execution
It calls `engine.commit(tx)`. The math is validated, the rows are locked deterministically, and the balances are updated.

### 6. Notifications
Outside the transaction boundary, it emits events that trigger SMS/Email confirmations to the passenger.
