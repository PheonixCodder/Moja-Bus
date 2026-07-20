# Service: Payment Service

[⬅️ Back to Services Overview](./README.md)

---

**File:** `apps/web/features/payments/payment-service.ts`

The `PaymentService` is the primary interface between the internal platform and the external payment gateway (Paystack). It encapsulates all network boundaries, signature verification, and idempotency tracking for webhooks.

## Responsibilities
- Initiate payments (creating Checkout URLs).
- Verify webhook signatures using HMAC-SHA512.
- Protect the system from duplicate webhook deliveries via the `WebhookEvent` table.
- Route verified webhooks to the correct domain handlers (e.g., `BookingConfirmationService`).

## Core Methods

### `initializePayment(params)`
1. Calls Paystack API: `POST /transaction/initialize`.
2. Creates an `ExternalPayment` record with `status = PENDING`.
3. Stores the returned `reference` to link future webhooks.
4. Returns the checkout URL to the client.

### `handleWebhookEvent(provider, signature, rawBody)`
This is the most dangerous and heavily attacked endpoint in the system. It must be perfectly resilient.

1. **Security**: Verifies `signature` matches `crypto.createHmac('sha512', secret).update(rawBody).digest('hex')`. If it fails, throws 401 Unauthorized immediately.
2. **Idempotency Check**: Constructs `idempotencyKey = ${provider}:${event.type}:${event.reference}`.
3. Queries `WebhookEvent` for this key.
   - If it exists and `processedAt != null`, returns 200 OK (Safe duplicate).
   - If it exists and `processedAt == null`, throws 409 Conflict (Race condition, Paystack is sending the webhook twice simultaneously. We reject the second one to let the first finish).
4. **Registration**: Inserts the new `WebhookEvent` with `processedAt = null`.
5. **Routing**: Uses a `switch(event.type)` to route the payload:
   - `charge.success` -> calls `bookingConfirmationService.confirmFromPayment()`.
   - `transfer.success` -> Updates `FinancialTransaction` status to `SETTLED`.
   - `transfer.failed` -> Initiates a `PAYOUT_REVERSAL` via `AccountingEngine`.
6. **Completion**: Updates the `WebhookEvent` to set `processedAt = now()`.

## Failure Scenarios Handled
- **Network Timeout during API Call**: Paystack APIs can hang. The `ExternalPayment` is only created *after* we get a reference, or in a state where a failure won't lock user funds.
- **Webhook Storm**: Paystack sometimes delivers 5 webhooks for the exact same event at the exact same millisecond. The unique constraint on `idempotencyKey` in the database guarantees only 1 webhook survives the `INSERT` statement. The others crash and are safely ignored.
