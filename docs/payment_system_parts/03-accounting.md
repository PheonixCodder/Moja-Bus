# 03 - Accounting Principles

[⬅️ Previous: 02 Financial Philosophy](./02-financial-philosophy.md) | [Back to README](./README.md) | [Next: 04 Chart of Accounts ➡️](./04-chart-of-accounts.md)

---

## The Accounting Equation

Every movement of money in Moja Ride is governed by the fundamental accounting equation:

```
Assets = Liabilities + Equity + Revenue - Expenses
```

To maintain balance, any change to one side of the equation must be offset by an equal change to the other side, or by an opposing change on the same side.

## The Four Account Categories

In Moja Ride's database (`FinancialAccount` model), every account is assigned an `accountCategory`. This category dictates how the account reacts to Debits and Credits.

| Category | Real-World Meaning | Normal Balance | To Increase... | To Decrease... |
| :--- | :--- | :--- | :--- | :--- |
| **ASSET** | Money we physically have (e.g. Paystack balance) | **DEBIT** | Debit | Credit |
| **LIABILITY** | Money we owe others (e.g. Operator funds) | **CREDIT** | Credit | Debit |
| **REVENUE** | Money we earned (e.g. Commissions) | **CREDIT** | Credit | Debit |
| **EXPENSE** | Money it costs us to operate (e.g. Gateway fees) | **DEBIT** | Debit | Credit |

### Understanding "Normal Balance"
The "Normal Balance" is simply the positive state of the account. 
- For an Operator (Liability), a Credit *increases* how much we owe them. A Debit *decreases* it (like when they withdraw).
- For Paystack Clearing (Asset), a Debit *increases* how much money we hold there. A Credit *decreases* it.

## The Rule of Zero

When a `FinancialTransaction` is created, it contains multiple `LedgerEntry` rows. 
The system enforces **The Rule of Zero**:

```sql
SUM(amount WHERE side = 'DEBIT') == SUM(amount WHERE side = 'CREDIT')
```

If this equation is not perfectly balanced, the `AccountingEngine` throws a `TransactionNotBalancedError` and rolls back the database transaction. 

### Why is this rule absolute?
Imagine a passenger pays 10,000 XOF. The system debits the Asset account (Paystack) by 10,000. It credits the Operator (Liability) by 9,000. It forgets to credit the Platform Commission (Revenue) by 1,000.
The equation is: `Debits (10,000) != Credits (9,000)`.
If the system allowed this, we would have 10,000 in the bank, owe 9,000, and have 1,000 "floating" with no owner. In accounting, this is corruption.

## Anatomy of a Booking Entry

Let's look at how the accounting principles apply to a standard user checkout via Paystack.

**Scenario**: 
- Ticket Base Price: 9,000 XOF
- Platform Commission: 500 XOF (deducted from base)
- Platform Convenience Fee: 500 XOF (added to base)
- Total Charged to User: 9,500 XOF
- Paystack Processing Fee: 190 XOF (2% of 9,500)

**The Ledger Entries**:

1. **Debit: Paystack Clearing Asset (9,310 XOF)**
   - *Why*: The physical money arriving in our bank is 9,500 - 190 fee. Debiting an asset increases it.
2. **Debit: Payment Processor Expense (190 XOF)**
   - *Why*: This is the cost of doing business. Debiting an expense increases it.
3. **Credit: Operator Receivable Liability (8,500 XOF)**
   - *Why*: We owe the operator their base fare (9,000) minus our commission (500). Crediting a liability increases what we owe.
4. **Credit: Platform Commission Revenue (500 XOF)**
   - *Why*: We earned this from the operator. Crediting revenue increases it.
5. **Credit: Platform Convenience Fee Revenue (500 XOF)**
   - *Why*: We earned this from the passenger. Crediting revenue increases it.

**The Verification**:
Total Debits = 9,310 + 190 = 9,500 XOF
Total Credits = 8,500 + 500 + 500 = 9,500 XOF
Debits == Credits. The transaction is mathematically sound and is committed to the database.

---

[Next: 04 Chart of Accounts ➡️](./04-chart-of-accounts.md)
