# 01 - Architecture

[⬅️ Previous: 00 Overview](./00-overview.md) | [Back to README](./README.md) | [Next: 02 Financial Philosophy ➡️](./02-financial-philosophy.md)

---

## Architectural Philosophy: Domain Decoupling

The most critical architectural decision in the Moja Ride platform is the strict separation between **Domain concepts** (Trips, Bookings, Seats, Vehicles) and **Financial concepts** (Accounts, Transactions, Ledgers).

### Why decouple?
If a `Booking` model directly manages money (e.g., a `refund()` function modifies a `Booking.refundedAmount` column), the system becomes highly brittle. A booking might be transferred to another user, cancelled, or split. If the money is tied directly to the booking row, auditing the money becomes impossible as the booking mutates over time.

By decoupling, the Domain models represent the *physical* reality of the transport network, while the Financial models represent the *immutable* reality of the money. 

## The Three Pillars

The architecture is built on three distinct pillars:

### 1. The Core Ledger (The Source of Truth)
Located in `packages/db/src/services/AccountingEngine.ts` and the Prisma schema.
This layer is entirely agnostic to Paystack, Bookings, or Transport. It only knows about double-entry accounting. It ensures that money balances perfectly. 
- Models: `FinancialAccount`, `FinancialTransaction`, `LedgerEntry`.

### 2. The Domain Adapter (The Orchestrator)
Located in `apps/web/features/payments/services/booking-confirmation-service.ts`.
This layer acts as the bridge. It understands both the business domain ("A user wants a seat on a bus") and the financial domain ("We need to debit the clearing account and credit the operator").
- Models: `HoldGroup`, `PricingSnapshot`, `Booking`.

### 3. The Gateway Layer (The External World)
Located in `apps/web/features/payments/payment-service.ts` and `apps/web/app/api/webhooks/paystack/route.ts`.
This layer communicates with the outside world (Paystack). It deals with the chaos of network timeouts, duplicate webhooks, and asynchronous API calls. It buffers this chaos before it can touch the Core Ledger.
- Models: `ExternalPayment`, `PaymentEvent`, `PaymentAttempt`.

## Data Flow: From Intent to Ledger

When a user wants to buy a ticket, the architecture enforces a strict directional flow:

1. **Intent**: The user selects a seat. The Domain Adapter creates a `HoldGroup` and locks the seat inventory. It calculates a `PricingSnapshot`.
2. **External Buffer**: The Gateway Layer creates an `ExternalPayment` record mapping the `HoldGroup` to a Paystack reference.
3. **Execution**: The user pays on Paystack.
4. **Resolution**: Paystack sends a webhook. The Gateway Layer verifies it.
5. **Orchestration**: The Domain Adapter sees the success. It marks the `Booking` as `CONFIRMED`.
6. **Commitment**: The Domain Adapter hands the financial details to the Core Ledger (`AccountingEngine`). The Ledger posts the double-entry transactions and updates the `FinancialAccount` balances.

## Read-Path vs Write-Path

- **Write-Path**: Extremely strict. All financial mutations MUST pass through the `AccountingEngine`. Raw Prisma `update()` calls on `FinancialAccount.availableBalance` are strictly forbidden and will result in data corruption.
- **Read-Path**: Fast and permissive. The UI can read `FinancialAccount.availableBalance` directly using standard Prisma queries without needing to sum up all `LedgerEntry` rows (because the `AccountingEngine` maintains a materialized balance).

---

[Next: 02 Financial Philosophy ➡️](./02-financial-philosophy.md)
