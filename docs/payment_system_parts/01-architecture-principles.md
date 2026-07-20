# 01. Architecture Principles

This document defines the unbreakable invariants and core rules that govern the Moja Ride financial platform. These rules dictate how money moves, how balances are calculated, and how external systems interact with the core ledger.

If a pull request violates any of these principles, it must be rejected.

---

## Rule 1: The Ledger is the Source of Truth

The Double-Entry Ledger (`LedgerEntry` table) is the **absolute, cryptographic source of truth** for all financial value in the system. 

If a balance is disputed, the ledger is correct. If an external payment gateway says a payment succeeded, but the ledger does not have the corresponding entries, the money does not exist in our system. The ledger cannot be overridden by application logic.

## Rule 2: FinancialAccount Balances are Caches

The `postedBalance`, `reservedBalance`, and `availableBalance` fields on the `FinancialAccount` model are **read-only materialized views (caches)** of the underlying ledger entries.

They exist purely for `O(1)` query performance. They are mutated exclusively by the `AccountingEngine` when a transaction is committed. You must **never** manually update a balance field outside of the engine.

## Rule 3: ExternalPayment is Never Accounting

The `ExternalPayment` model tracks communication with third-party payment gateways (e.g., Paystack). It records intent, webhook payloads, and provider references.

**An `ExternalPayment` record holds zero financial value.** Creating a payment record with `status = SUCCESS` does not give a user money. Money only moves when the `AccountingEngine` commits a `FinancialTransaction` linked to that payment.

## Rule 4: Bookings Never Own Money

The `Booking` model tracks operational state (e.g., seat 1A on Bus 4 is assigned to John). It does not hold monetary value. 

When a booking is cancelled, the `Booking` record is updated to `CANCELLED`, but the financial refund requires a distinct `FinancialTransaction` to move funds from the `OPERATOR_RECEIVABLE` (liability) account to the `PASSENGER_WALLET` (liability) account. 

## Rule 5: AccountingEngine is the Only Writer

All inserts into `FinancialTransaction` and `LedgerEntry`, and all updates to `FinancialAccount` balances, must pass through the `AccountingEngine`.

Direct Prisma `create` calls on ledger tables are strictly forbidden. The engine enforces double-entry validation (Σ Debits = Σ Credits), locking, precision bounds, and atomic balance materialization.

## Rule 6: Money Only Moves via FinancialTransaction

Funds cannot be teleported. Every movement of value—whether a passenger paying for a ticket, a refund being issued, or an operator withdrawing funds—must be modeled as a `FinancialTransaction` with at least two balanced `LedgerEntry` records. 

## Rule 7: LedgerEntries are Immutable and Append-Only

Once a `LedgerEntry` is written, it can **never** be updated or deleted (`UPDATE` and `DELETE` queries are logically forbidden on ledger tables).

If a mistake is made, it must be corrected by appending a new reversing transaction (e.g., a `SYSTEM_CORRECTION` transaction) that nullifies the original entries.

## Rule 8: External Systems are Eventually Consistent

The Moja Ride platform cannot guarantee real-time synchronization with external gateways like Paystack or local banks. Network calls fail, webhooks drop, and timeouts occur.

The system is designed to embrace eventual consistency:
- Webhooks are processed idempotently.
- Webhooks can arrive out of order.
- Crons constantly sweep for dangling states (e.g., a payment pending for >10 minutes) and query the external system for the truth.

## Rule 9: Idempotency is Mandatory

Every financial write must include an `idempotencyKey` governed by a strict unique constraint at the database layer. This ensures that retries (e.g., a webhook redelivered by Paystack, or an operator clicking "Withdraw" twice) can never result in duplicate money movement.
