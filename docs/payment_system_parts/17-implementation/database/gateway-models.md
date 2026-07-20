# Database: Gateway Models

[⬅️ Back to Database Overview](./README.md)

---

## 1. `ExternalPayment`

Acts as a buffer between external gateways (Paystack) and the internal ledger.

### Fields
- `id` (String, PK, CUID).
- `provider` (String): e.g., `"PAYSTACK"`.
- `type` (Enum: `CHARGE`, `TRANSFER`, `REFUND`): What kind of operation this is.
- `status` (Enum: `INITIALIZED`, `PENDING`, `SUCCESS`, `FAILED`, `REVERSED`).
- `amountXOF` (Int): The amount requested.
- `paystackReference` (String?): The unique reference given to/from Paystack.
- `holdGroupId` (String?): FK to `HoldGroup`. Connects the payment to the cart.
- `userId` (String?): FK to `User`. The person paying.
- `metadata` (JSONB?): e.g., channel, ip address.
- `createdAt` / `updatedAt` (DateTime).

### Indexes & Invariants
- **Unique Constraint**: `@@unique([provider, paystackReference])`. Paystack references must be globally unique per provider.
- **Invariant**: If `status` changes to `SUCCESS`, a `FinancialTransaction` MUST be created.

---

## 2. `PaymentAttempt`

Tracks retries if a user's card fails and they try another one.

### Fields
- `id` (String, PK, CUID).
- `externalPaymentId` (String): FK to `ExternalPayment`.
- `status` (Enum: `PENDING`, `SUCCESS`, `FAILED`).
- `errorMessage` (String?): The failure reason from the gateway.
- `createdAt` (DateTime).

---

## 3. `WebhookEvent`

Crucial for idempotency and asynchronous resilience.

### Fields
- `id` (String, PK, CUID).
- `provider` (String): `"PAYSTACK"`.
- `eventType` (String): e.g., `"charge.success"`, `"transfer.failed"`.
- `reference` (String): The provider's unique ID for the event.
- `idempotencyKey` (String): Constructed as `provider:eventType:reference`.
- `payload` (JSONB): The raw JSON payload from the provider.
- `processedAt` (DateTime?): When the internal system successfully handled it.
- `error` (String?): If processing failed, the stack trace.
- `createdAt` / `updatedAt` (DateTime).

### Concurrency Mechanism
The `idempotencyKey` has a strict unique index. If Paystack sends the same `charge.success` webhook twice (which happens frequently), the second `INSERT` attempt will crash at the database level with a unique constraint violation. The system catches this, realizes it's a duplicate, and safely returns 200 OK to Paystack without executing any financial logic.
