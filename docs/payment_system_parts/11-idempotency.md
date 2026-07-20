# 11 - Idempotency

[⬅️ Back to README](./README.md)

---

In distributed financial systems, failures are inevitable. Network requests timeout, clients retry, and external APIs send duplicate webhooks. 

Idempotency is the property that a given operation can be applied multiple times without changing the result beyond the initial application.

If an operator clicks "Withdraw" and the network times out, they will click it again. If the system is not idempotent, they will withdraw twice. Moja Ride implements strict idempotency across all entry points.

## Layer 1: The Gateway (Webhooks)

Webhooks are the primary source of duplicate requests. Paystack guarantees "at least once" delivery, which means they frequently deliver the exact same event multiple times.

### Mechanism: The `idempotencyKey`
1. When a webhook arrives, the `PaymentService` extracts the event details.
2. It concatenates them: `${provider}:${eventType}:${reference}` (e.g., `PAYSTACK:charge.success:T92384912`).
3. It attempts to insert a row into the `WebhookEvent` table using this key.
4. The database has a `UNIQUE INDEX` on `idempotencyKey`.
5. If it's a duplicate, the database throws a Unique Constraint Error. The system catches this, returns HTTP 200 OK, and stops processing.
6. The underlying `BookingConfirmationService` is completely shielded from duplicate triggers.

## Layer 2: The Core Ledger

If a bug in the application layer somehow bypasses the Webhook protections and attempts to post the exact same transaction twice, the `AccountingEngine` provides the ultimate safety net.

### Mechanism: `LedgerEntry.idempotencyKey`
Every `LedgerEntry` requires a unique string identifier. For example, when confirming a booking, the debit entry's key might be `BOOKING_DEBIT_${paystackReference}`.

Because the `LedgerEntry` table enforces uniqueness on this key, the `AccountingEngine.commit()` will fail at the database level if a duplicate ledger post is attempted.

## Layer 3: Domain Safeties

Many domain objects implement basic state machine rules that act as soft idempotency checks.

- **Booking Confirmations**: In `BookingConfirmationService.confirmFromPayment()`, the first step is checking `if (holdGroup.status === 'CONFIRMED') return success;`. If it's already confirmed, it safely ignores the request without attempting to run the ledger math.
- **Refunds**: A `Refund` record is created before the math executes. If a user clicks "Refund" twice, the second request will query the database, see that `paymentStatus === 'REFUNDED'`, and reject the operation.

## Front-End Responsibilities

While the backend is impenetrable, the UI is still responsible for preventing user confusion:
- Disabling submit buttons immediately upon click.
- Showing loading spinners during network transit.
- Passing UUID idempotency headers to the API if required by specific endpoints.
