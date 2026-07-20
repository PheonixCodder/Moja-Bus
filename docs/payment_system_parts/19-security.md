# 19 - Security

[⬅️ Back to README](./README.md)

---

Security in the financial platform is primarily focused on preventing tampering, fraud, and unauthorized extraction of capital.

## 1. Cryptographic Tampering Prevention

### Webhook Signatures
Paystack sends webhooks over the open internet. Anyone could theoretically POST a JSON payload to our `charge.success` endpoint claiming they paid 1,000,000 XOF, hoping our system confirms their ticket and credits their wallet.

**Defense:** `HMAC-SHA512`
Every webhook from Paystack includes a `x-paystack-signature` header.
The `PaymentService` reads the raw body of the request (as a Buffer, before JSON parsing mutates any whitespace) and computes:
```javascript
const expected = crypto.createHmac('sha512', PAYSTACK_SECRET).update(rawBody).digest('hex');
```
If `expected !== header`, the request is immediately rejected with HTTP 401. This guarantees that only a server holding the `PAYSTACK_SECRET` could have generated the payload.

### The Immutability Principle
Once a `PricingSnapshot` is created, its fields (`baseFareXOF`, `commissionBps`) are never updated. If a malicious user manages to intercept and modify the HTTP request to the `createHold` endpoint to claim the seat costs 1 XOF, the `PricingResolver` will ignore the client's assertion, recalculate it from the trusted database source, and lock the snapshot.

## 2. Fraud & Replay Attacks

### The Replay Attack
An attacker saves a legitimate `charge.success` webhook payload and POSTs it to our server 100 times, hoping we credit their wallet 100 times for a single payment.

**Defense:** The `idempotencyKey` in the `WebhookEvent` table. The first POST succeeds and creates a row with key `PAYSTACK:charge.success:12345`. The 99 subsequent POSTs crash at the database level due to the unique index on `idempotencyKey`. The attacker gets nothing.

## 3. Authorization & Permissions

### Operator Withdrawals
The `requestWithdrawal` tRPC endpoint executes a strict authorization check before touching the ledger.
```javascript
const operator = await ctx.prisma.operator.findUnique({
  where: { userId_companyId: { userId, companyId } }
});
if (operator?.role !== "OWNER") throw Forbidden;
```
Only the verified owner of a transport company can initiate a withdrawal. Dispatchers, drivers, and admins cannot withdraw funds.

### Admin Privileges
Administrative actions, such as forcing a full refund or reversing a stuck transaction, are protected by strict `User.role === 'ADMIN'` checks. Furthermore, all admin mutations require an explicit audit log entry (usually captured in the `description` or `metadata` of the `FinancialTransaction`).

## 4. Ledger Integrity

The most powerful security feature is the `AccountingEngine` itself.
Even if an attacker finds a zero-day RCE (Remote Code Execution) vulnerability and manages to execute code on the Node.js server, they cannot easily steal money.

To steal money, they would have to write a script that updates their `PASSENGER_WALLET` balance. If they use the `AccountingEngine`, they are forced to provide an offsetting Debit. If they debit `PAYSTACK_CLEARING`, the math balances, but they don't actually have the money. When they try to withdraw it, the platform will attempt to transfer money it doesn't have in Paystack, and Paystack will reject the transfer. The platform will then reconcile and reverse it.

To truly steal money, an attacker would have to compromise the database directly, bypass the `AccountingEngine`, and manually overwrite the `postedBalance` of their wallet using raw SQL, then initiate a withdrawal before an auditor notices the ledger equation is broken.
