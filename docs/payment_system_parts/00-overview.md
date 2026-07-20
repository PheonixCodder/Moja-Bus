# 00 - Overview

[⬅️ Back to README](./README.md) | [Next: 01 Architecture ➡️](./01-architecture.md)

---

## The 10,000-Foot View

The Moja Ride Financial Platform is not just a payment gateway wrapper. It is a fully decoupled, immutable, double-entry financial ledger designed specifically for the complexities of a multi-sided transport marketplace.

At its core, the platform performs three main functions:
1. **Intake**: Safely accepting funds from passengers (via Paystack or internal Wallets) and locking them.
2. **Escrow**: Holding funds in trust until a physical transport service (the trip) is successfully rendered.
3. **Payout**: Releasing funds, calculating complex commissions and fees, and securely transferring the net revenue to independent transport operators.

## The Marketplace Problem

Building a marketplace payment system is fundamentally different from building a standard e-commerce store checkout. 

In a standard e-commerce store (like Shopify):
- A user pays $100.
- The platform receives $100.
- The transaction is over.

In Moja Ride (a marketplace):
- A passenger pays 10,000 XOF for a seat.
- Moja Ride does **not** own this money. We are simply a custodian.
- 9,000 XOF belongs to the Transport Operator.
- 500 XOF belongs to Moja Ride as a Commission.
- 500 XOF belongs to Moja Ride as a Convenience Fee.
- Paystack charges us a 190 XOF processing fee.

The money cannot be given to the operator immediately because the bus has not arrived yet. If the bus breaks down, Moja Ride must refund the 10,000 XOF to the passenger.

## Why a Custom Ledger?

Many startups attempt to solve the marketplace problem by simply adding a `balance` column to their `User` or `Company` database tables (e.g., `UPDATE users SET balance = balance + 10000`).

**This is a fatal architectural mistake.**

If you only store the final balance, you lose the history of *how* that balance was achieved. If a bug causes the balance to jump to an impossible number, you have no mathematical proof to audit where the money came from or where it went. 

Moja Ride solves this by implementing a **Double-Entry Financial Ledger** (detailed in [03 Accounting](./03-accounting.md)). Money is never created or destroyed; it is only moved between `FinancialAccount` buckets via immutable `LedgerEntry` records.

## Scope of Documentation

This documentation system covers everything required to ingest, hold, calculate, refund, and distribute money. It assumes you understand the core domain concepts of Moja Ride (Trips, Vehicles, Operators, Passengers) and focuses purely on the financial subsystems.

### Core Systems Documented:
- **`AccountingEngine`**: The heart of the platform. Guarantees mathematical perfection.
- **Paystack Integrations**: How external intent is mapped to internal reality.
- **Webhooks & Idempotency**: How the platform handles unpredictable network behavior.
- **Cron Jobs**: The background workers that automate escrow release and error recovery.
- **Concurrency Controls**: How the database prevents deadlocks when two people click "Withdraw" at the exact same millisecond.

---

[Next: 01 Architecture ➡️](./01-architecture.md)
