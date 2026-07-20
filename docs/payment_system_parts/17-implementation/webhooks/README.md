# 09 - Webhooks (Overview)

[⬅️ Previous: 08 Crons](../08-crons/README.md) | [Back to README](../README.md) | [Next: 10 Concurrency ➡️](../10-concurrency.md)

---

Because the platform relies on external payment processors (Paystack), it operates asynchronously. When we ask Paystack to process a card, we do not hold an HTTP connection open waiting for the user to type their OTP. We close the connection and wait for Paystack to call us back via a Webhook.

Webhooks are fundamentally chaotic. They can arrive late, they can arrive twice at the same time, or they can never arrive.

### 📖 Key Mechanisms:

- **The Buffer**: `PaymentService.handleWebhookEvent()` is the central buffer. No webhook ever touches the `BookingConfirmationService` or `AccountingEngine` directly.
- **Idempotency Key**: Every webhook is assigned a unique `idempotencyKey` constructed from `provider:eventType:reference` and inserted into the `WebhookEvent` table.
- **Security**: The payload is verified using `HMAC-SHA512` signed by the Paystack secret key. If the signature doesn't match, the request is dropped.

### Expected Paystack Events:

#### `charge.success`
- Indicates a user's card was successfully debited.
- Routes to: `BookingConfirmationService.confirmFromPayment()`
- See also: [Orphan Rescue](../14-bookings.md#4-the-orphaned-payment-late-webhook)

#### `transfer.success`
- Indicates a withdrawal reached the operator's bank.
- Routes to: Updates `FinancialTransaction` status to `SETTLED`.

#### `transfer.failed` / `transfer.reversed`
- Indicates a withdrawal failed at the banking layer.
- Routes to: `AccountingEngine("PAYOUT_REVERSAL")`. Returns the operator's funds to `availableBalance`.

---

[Next: 10 Concurrency ➡️](../10-concurrency.md)
