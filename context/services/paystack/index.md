# Paystack — Moja Ride Integration Guide

**Payment Gateway**: Paystack (https://paystack.com)  
**Package**: `@paystack/inlinejs` (web popup), `paystack-react-native` (mobile), custom `paystack-client.ts` (server-side API calls)  
**Environment**: Côte d'Ivoire — supports **Mobile Money** (MTN MoMo, Orange Money, Wave), **Bank Cards**, and **Bank Transfers**.

---

## Quick Reference

| Task | Documentation |
| :--- | :--- |
| Initializing a payment | [`docs/payments/accept-payments.md`](./docs/payments/accept-payments.md) |
| Verifying a payment | [`docs/payments/verify-payments.md`](./docs/payments/verify-payments.md) |
| Handling webhooks | [`docs/payments/webhooks.md`](./docs/payments/webhooks.md) |
| Initiating a refund | [`docs/payments/refunds.md`](./docs/payments/refunds.md) |
| Transferring funds to operators | [`docs/transfers/`](./docs/transfers/) |
| Bank account verification | [`docs/identity-verification/verify-account-number.md`](./docs/identity-verification/verify-account-number.md) |
| Mobile money channels (MTN/Orange/Wave) | [`docs/payments/payment-channels.md`](./docs/payments/payment-channels.md) |
| React Native integration | [`guides/react-native.md`](./guides/react-native.md) |
| Next.js integration | [`guides/nextjs.md`](./guides/nextjs.md) |
| Full API reference | [`apis/`](./apis/) |

---

## Key Patterns in Moja Ride

### Webhook Verification (REQUIRED)
All Paystack webhooks must be validated with a **timing-safe HMAC comparison** to prevent replay attacks:
```ts
// apps/web/lib/paystack-client.ts
import { timingSafeEqual, createHmac } from "node:crypto";

function verifyWebhookSignature(payload: string, sig: string): boolean {
  const expected = createHmac("sha512", process.env.PAYSTACK_SECRET_KEY!)
    .update(payload)
    .digest("hex");
  return timingSafeEqual(Buffer.from(sig), Buffer.from(expected));
}
```

### Payment Initialization Flow
1. Server creates a Paystack transaction via `POST /transaction/initialize`.
2. Client receives `authorization_url` and redirects (web) or opens inline popup (mobile).
3. Paystack sends webhook `charge.success` event to `/api/webhooks/paystack`.
4. Server verifies webhook signature then calls `verifyPayment` tRPC procedure.
5. `verifyPayment` asserts **ownership** (userId must match booking.userId) before marking booking as PAID.

### Refund Flow
1. Operator or platform triggers cancellation via tRPC.
2. `CancellationService` enqueues `PASSENGER_TRIP_CANCELLED` notice in outbox within the same `$transaction`.
3. Refund is initiated via `POST /refund` to Paystack — refund method set to `channel: "PAYSTACK"` only (not original channel).
4. Refund status is tracked via `paymentChannel` field — never maps to `COMPLETED` prematurely.

> [!CAUTION]
> Never use `$queryRawUnsafe` in payment-related Prisma queries. Always use typed Prisma Client methods or parameterized `$queryRaw` with template literals.
