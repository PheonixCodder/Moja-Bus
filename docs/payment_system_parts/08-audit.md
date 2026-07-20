# 08. Auditability: The Complete Financial Audit Chain

[⬅️ Back to README](./README.md)

---

A financial system without auditability is not a financial system — it is a spreadsheet. Auditability means being able to answer, for any financial event:

- **Who** initiated it?
- **What** exactly happened?
- **When** did each step occur?
- **Why** was it authorized?
- **How** was it executed?

And critically: **can we prove all of the above cryptographically?**

---

## 1. The Audit Chain Architecture

Every money movement in Moja Ride produces an immutable chain of evidence:

```
Actor Intent
    ↓
API Request (HTTP log)
    ↓
Business Object Created (Booking, ExternalPayment)
    ↓
External Event (Paystack Webhook)
    ↓
WebhookEvent Record (idempotency + timestamp)
    ↓
FinancialTransaction (the "why" and "authorization")
    ↓
LedgerEntry × N (the "what" — double-entry postings)
    ↓
FinancialAccount Balance Update (the "result")
```

Each step references the previous, forming a traceable chain from the original intent all the way to the final balance.

---

## 2. The `FinancialTransaction` as the Audit Document

The `FinancialTransaction` model is the primary audit document. Every row must contain:

| Field | Purpose | Example |
|---|---|---|
| `id` | Immutable UUID | `txn_abc123` |
| `type` | The business reason | `BOOKING`, `REFUND`, `OPERATOR_PAYOUT` |
| `description` | Human-readable narrative | `"Booking confirmed for Trip #T-9876, 2 seats, Row 5-6"` |
| `amount` | The total amount moved | `15000` (XOF) |
| `currency` | Always XOF | `XOF` |
| `status` | Lifecycle state | `POSTED`, `SETTLED`, `REVERSED` |
| `createdAt` | When the transaction was created | `2024-01-15T14:30:22Z` |
| `postedAt` | When it was committed to the ledger | `2024-01-15T14:30:22Z` |
| `initiatedBy` | The actor who caused this | User ID, `"system"`, `"cron:release-escrow"` |
| `externalPaymentId` | Link to gateway event (if any) | `ext_abc123` |

### The `description` Field

The `description` field must be human-readable and contain enough context for a non-technical auditor to understand what happened. **Never leave it blank.**

Good: `"Wallet topup via Paystack charge T92384912. Gross: 20000 XOF, Fee: 400 XOF, Net credited: 20000 XOF."`

Bad: `"topup"`

---

## 3. The `LedgerEntry` as the Cryptographic Proof

Each `FinancialTransaction` spawns multiple `LedgerEntry` rows. These are the mathematical proof of the transaction.

| Field | Purpose | Constraint |
|---|---|---|
| `id` | UUID | Primary Key |
| `transactionId` | Links to FinancialTransaction | Foreign Key, `NOT NULL` |
| `financialAccountId` | Which account was affected | Foreign Key, `NOT NULL` |
| `direction` | `DEBIT` or `CREDIT` | Enum, `NOT NULL` |
| `amount` | The amount of this posting | `> 0`, `NOT NULL` |
| `idempotencyKey` | Globally unique posting key | `UNIQUE INDEX` |
| `createdAt` | When this entry was posted | Immutable once set |

**The critical constraint: LedgerEntries are never modified or deleted.**

Once written, the only way to "undo" a ledger entry is to create a new, opposing transaction. This is the append-only principle.

### Verifying the Transaction

An auditor can verify any `FinancialTransaction` by:

```sql
SELECT 
  direction,
  SUM(amount) as total
FROM ledger_entry
WHERE "transactionId" = 'txn_abc123'
GROUP BY direction;
```

The result must always satisfy: `SUM(DEBIT) = SUM(CREDIT)`. If it doesn't, something is catastrophically wrong with the ledger.

---

## 4. The WebhookEvent as the External Proof

For every externally-triggered financial event (Paystack webhook), a `WebhookEvent` record is created:

| Field | Purpose |
|---|---|
| `id` | UUID |
| `provider` | `PAYSTACK` |
| `eventType` | `charge.success`, `transfer.success`, etc. |
| `reference` | Paystack's transaction reference |
| `idempotencyKey` | `${provider}:${eventType}:${reference}` (UNIQUE) |
| `payload` | The full raw JSON webhook payload |
| `receivedAt` | Timestamp |
| `processedAt` | When our system finished processing |
| `externalPaymentId` | Links to the ExternalPayment created/updated |

This record allows us to prove:
- The exact moment Paystack notified us
- The exact payload Paystack sent (raw, unmodified)
- That we processed it exactly once

---

## 5. Reconstructing the Full Audit Trail for an Operator Withdrawal

Here is the complete evidence chain for an operator withdrawal:

```
Step 1: Operator Intent
  → HTTP POST /api/trpc/operator.requestWithdrawal
  → Request body: { amount: 50000, currency: 'XOF' }
  → HTTP request log: { userId: 'op_123', ip: '197.x.x.x', timestamp: '...' }

Step 2: Business Validation
  → FinancialAccount: { id: 'acct_456', availableBalance: 50000 }
  → Validation: 50000 >= 50000 ✓

Step 3: Ledger Debit (Pessimistic Lock)
  → SELECT FOR UPDATE on FinancialAccount acct_456
  → FinancialTransaction: { id: 'txn_789', type: 'OPERATOR_PAYOUT', amount: 50000 }
  → LedgerEntry[0]: { direction: DEBIT, account: OPERATOR_RECEIVABLE, amount: 50000 }
  → LedgerEntry[1]: { direction: CREDIT, account: PAYSTACK_CLEARING, amount: 50000 }
  → FinancialAccount update: { availableBalance: 0 }
  → Commit

Step 4: External Payment Record
  → ExternalPayment: { id: 'ext_101', type: 'PAYOUT', status: PENDING, reference: 'TX-MOJ-789' }

Step 5: Paystack API Call
  → POST https://api.paystack.co/transfer
  → Payload: { amount: 5000000, recipient: 'RCP_op123', reason: 'Operator payout TX-MOJ-789' }
  → Response: { status: true, data: { transfer_code: 'TRF_xyz' } }

Step 6: Paystack Confirmation
  → Webhook: POST /api/webhooks/paystack
  → Body: { event: 'transfer.success', data: { reference: 'TX-MOJ-789' } }
  → WebhookEvent: { id: 'wh_202', eventType: 'transfer.success', idempotencyKey: 'PAYSTACK:transfer.success:TX-MOJ-789' }
  → ExternalPayment update: { status: SUCCESS }
  → FinancialTransaction update: { status: SETTLED }
```

An auditor with database access can reconstruct every step above from the permanent records.

---

## 6. Answering Audit Questions

### "Who approved this withdrawal?"

The `FinancialTransaction.initiatedBy` field contains the user ID. Cross-reference with the HTTP access log for the originating IP, session token, and full request body.

For admin-initiated transactions (e.g., manual adjustments):
- The `initiatedBy` is the admin's user ID
- The `description` must contain the reason
- (Future: a formal `AdminAuditLog` table should be implemented)

### "When exactly was this money moved?"

Three timestamps exist:
1. `ExternalPayment.createdAt` — When the intent was created
2. `FinancialTransaction.postedAt` — When the ledger was mutated (the legal moment of money movement in our system)
3. `ExternalPayment.updatedAt` (on `SUCCESS`) — When Paystack confirmed the external transfer

### "Why was a refund issued?"

The `FinancialTransaction.description` field for a `REFUND` transaction must contain:
- The booking ID(s) being refunded
- The reason for cancellation
- Who initiated the refund (passenger self-service, admin, operator cancel)

Example: `"REFUND for Booking BKG_abc123. Reason: Operator-cancelled trip TRP_xyz. Initiator: SYSTEM (cron:operator-cancel)"`

### "Was this transaction double-posted?"

Query `LedgerEntry.idempotencyKey`. If the same key appears twice in the database, a double-post occurred. This should be **impossible** due to the `UNIQUE INDEX`, but the query is the proof.

### "Prove the ledger has never been tampered with."

The append-only invariant means no `UPDATE` or `DELETE` should ever touch a `LedgerEntry`. To verify:
```sql
SELECT COUNT(*) FROM ledger_entry WHERE "updatedAt" != "createdAt";
```
This should always return 0. If not, the `updatedAt` field should not exist on `LedgerEntry` in the first place (it should be removed from the schema to prevent even the possibility of updates).

---

## 7. What the Audit System Does NOT Currently Track

These gaps exist and should be noted for future improvement:

| Missing | Impact | Recommended Fix |
|---|---|---|
| Admin-initiated manual adjustments | No formal approval workflow | Add `AdminAuditLog` table with 4-eyes approval |
| Schema migrations | No log of when balance columns were added | Track via git commit hash + timestamp |
| Account status changes (FROZEN, CLOSED) | No log of who froze an account | Add `AccountStatusChangeLog` |
| Configuration changes (pricing rules, fee percentages) | No log | Add `ConfigChangeLog` |
| Failed authentication attempts | No fraud log | Add `AuthAttemptLog` |

---

## 8. The Ledger as the Supreme Source of Truth

The ultimate audit principle: **if the ledger says it happened, it happened.**

The ledger is not a reporting view. It is not derived from business objects. Business objects (`Booking`, `ExternalPayment`) are the *input*; the `LedgerEntry` is the *permanent record*.

If a `Booking` row is accidentally deleted, the `LedgerEntry` still records that money moved for that booking. The booking can be reconstructed from the ledger. The ledger cannot be reconstructed from the booking.

This is why: **Never delete LedgerEntry rows. Never UPDATE LedgerEntry rows. Never allow any code path to write to LedgerEntry other than `AccountingEngine`.**

---

*See also: [04 - Ledger Philosophy](./04-ledger-philosophy.md) | [07 - Reconciliation](./07-reconciliation.md) | [10 - Concurrency](./10-concurrency.md)*
