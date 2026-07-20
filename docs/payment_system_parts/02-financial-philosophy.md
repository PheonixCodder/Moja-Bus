# 02 - Financial Philosophy

[⬅️ Previous: 01 Architecture](./01-architecture.md) | [Back to README](./README.md) | [Next: 03 Accounting ➡️](./03-accounting.md)

---

## Trust via Math

The Moja Ride platform processes third-party funds. We collect money from passengers on behalf of transport operators. This fundamentally shifts the engineering requirement from "high availability" to "absolute mathematical integrity."

If a UI component fails to load, a user refreshes the page. 
If a financial transaction drops a decimal place, or double-credits an operator during a race condition, the company loses real money and faces severe legal and audit repercussions.

The philosophy of the system is built on **Trust via Math**: The platform cannot accidentally create or destroy money.

## The Problem with "Balances"

In a naive system, an operator's balance is a single column: `Company.balance = 50000`.
When a user buys a 10,000 XOF ticket, the system does: `UPDATE Company SET balance = balance + 10000`.

Why is this philosophy flawed?
1. **No Audit Trail**: If the balance jumps to 200,000 unexpectedly, it is impossible to mathematically prove *why* it jumped. You have to parse application logs.
2. **Money Creation**: A bug in the code could execute `balance = balance + 10000` twice. The database will happily comply. The system has just magically "created" 10,000 XOF out of thin air. The operator will withdraw it, but the platform doesn't actually have that money in the real bank account. The platform takes the loss.

## The Ledger Philosophy

Moja Ride abandons the `balance` column in favor of an append-only ledger.

Every time money moves, a `FinancialTransaction` is created. Inside that transaction, multiple `LedgerEntry` rows are created.
- Entry 1: Deduct 10,000 from Paystack Clearing (Asset).
- Entry 2: Add 9,000 to Operator (Liability).
- Entry 3: Add 1,000 to Platform (Revenue).

**The Equation**: The total amount deducted MUST exactly equal the total amount added. (10,000 = 9,000 + 1,000).

Before the database commits, the `AccountingEngine` sums the entries. If they do not balance perfectly to zero, the transaction is forcefully aborted and rolled back. 

This guarantees that a bug in the code *cannot* create or destroy money. The worst a bug can do is move money to the wrong account, but the money is always conserved within the system.

## Float vs. Escrow

When a passenger pays for a ticket on Monday for a bus leaving on Friday, the money physically arrives in Moja Ride's bank account on Monday.

Who owns the money on Tuesday?
- The passenger has given up the money.
- The operator has not yet provided the service (the ride).

Therefore, Moja Ride holds the money in **Escrow**. It is a liability (we owe it to someone), but it is not yet "Available" for the operator to withdraw. 

The `FinancialAccount` model solves this by splitting the balance:
- `postedBalance`: The absolute mathematical truth derived from the ledger. (9,000 XOF)
- `reservedBalance`: The portion of the `postedBalance` held in escrow. (9,000 XOF)
- `availableBalance`: The portion the operator can withdraw. (`postedBalance - reservedBalance` = 0 XOF).

Only when the bus successfully arrives (plus a 24-hour grace period for disputes) does the `release-escrow` cron job shift the 9,000 XOF from `reservedBalance` into `availableBalance`.

This philosophy protects the platform from paying out operators for buses that break down, ensuring we always have the funds on hand to refund passengers.

---

[Next: 03 Accounting ➡️](./03-accounting.md)
