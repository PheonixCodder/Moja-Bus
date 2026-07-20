# 03. Account Lifecycle

The `FinancialAccount` model is the central anchor for all balances in the Moja Ride platform. This document explains how accounts are born, how they are managed, and when they are retired.

---

## 1. Creation

Financial Accounts are created lazily ("Just-In-Time") via the `FinancialAccountService`. 

When a transaction needs to debit or credit an account, it calls a getter like `getOperatorReceivableAccount(companyId)`. If the account does not exist in the database, the service performs a PostgreSQL `UPSERT` to create it instantly.

**Why lazy creation?**
- It prevents race conditions during user registration or company onboarding.
- It ensures that no account exists until it is actually needed for a financial transaction.
- It guarantees that a missing account row will never cause a ledger transaction to fail.

### Ownership Structure
Every account has an `ownerType` and `ownerId`:
- `USER` (e.g., `ownerId = <user_uuid>`)
- `COMPANY` (e.g., `ownerId = <company_cuid>`)
- `PLATFORM` (e.g., `ownerId = 'moja_ride'`)
- `SYSTEM` (e.g., `ownerId = 'system'`)

## 2. Immutability and Identifiers

Once created, an account's primary attributes are strictly immutable:
- `ownerType` and `ownerId` **cannot** be changed. If a company is acquired by another company, the old company's account remains distinct. Balances must be moved via an explicit Ledger Transfer, not by changing the owner ID.
- `currency` is locked (XOF).
- `accountCategory` and `accountClass` are permanent. You cannot convert a Liability into an Asset.

## 3. Merging and Transfers

**Accounts can NEVER be merged at the database row level.**

If an operator accidentally creates two companies and wants to consolidate them, the database administrator cannot simply combine the `FinancialAccount` rows.

Instead, a formal `MANUAL_ADJUSTMENT` transaction must be passed through the `AccountingEngine`:
1. **Debit** `OPERATOR_RECEIVABLE` (Company A) for its total balance.
2. **Credit** `OPERATOR_RECEIVABLE` (Company B) for the same amount.

This leaves Company A with a 0 balance and a perfect audit trail of where the money went.

## 4. Archiving and Deletion

**Financial Accounts are never deleted.** 

Because `LedgerEntry` records hold a strict foreign key to `FinancialAccount`, deleting an account would require cascading deletes across the immutable ledger, destroying the financial history of the platform.

### Freezing / Suspension
If a user is banned for fraud, or an operator is suspended, their account `status` is updated to `FROZEN` or `SUSPENDED`.
- The `AccountingEngine` will reject any attempt to Debit a `FROZEN` account (preventing withdrawals).
- The engine may still allow Credits to a `FROZEN` account (allowing us to claw back funds or process incoming delayed settlements).

### Closing
When a user formally deletes their account, and their wallet balance is 0, the `FinancialAccount` status is set to `CLOSED`.
Any future attempt to post a transaction to a `CLOSED` account will throw a hard error.

## 5. Negative Balances

By default, the `AccountingEngine` strictly enforces `availableBalance >= 0`. If a transaction would result in a negative balance, the engine throws an `Insufficient Funds` exception and rolls back the database transaction.

However, certain accounts bypass this check via the `allowNegativeBalance = true` flag:
- **`PAYSTACK_CLEARING`**: Often swings negative temporarily when we issue a massive batch of payouts before the daily capture batch has settled.
- **`OPERATOR_RECEIVABLE`**: Must allow negative balances so that passenger refunds (which debit the operator) never fail, even if the operator withdrew all their cash yesterday. This places the operator in "Arrears," where future ticket sales automatically pay off the negative debt before returning to a positive withdrawable balance.
