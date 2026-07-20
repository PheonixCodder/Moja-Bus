# 22 - Future Architecture

[⬅️ Back to README](./README.md)

---

The Moja Ride ledger is designed not just for bus tickets, but to serve as a complete financial operating system for the transport sector. Because the `AccountingEngine` strictly requires a Debit and a Credit, and relies on generic `FinancialAccount` rows, new financial products can be launched with zero changes to the core ledger code.

## 1. Multiple Payment Gateways (e.g., Mobile Money, Stripe)
If Moja Ride expands to a country where Paystack is unavailable, adding a new gateway is trivial.
1. Create a new `FinancialAccount` with `accountClass = "MTN_MOMO_CLEARING"`.
2. When the new webhook arrives, route it to `BookingConfirmationService`.
3. Tell the `AccountingEngine` to debit `MTN_MOMO_CLEARING` instead of `PAYSTACK_CLEARING`.
*Result*: The ledger balances perfectly. The operator still gets paid. The core accounting logic is untouched.

## 2. Operator Savings & Maintenance Funds
Operators want to save 10% of their revenue for bus maintenance.
1. Create a new `FinancialAccount` with `accountClass = "OPERATOR_MAINTENANCE_FUND"` owned by the `Company`.
2. Modify the `BookingConfirmationService` ledger post:
   - Instead of crediting 9,000 to `OPERATOR_RECEIVABLE`, credit 8,100 to `OPERATOR_RECEIVABLE`.
   - Credit 900 to `OPERATOR_MAINTENANCE_FUND`.
*Result*: The 9,000 XOF liability is perfectly split. The operator can withdraw from their maintenance fund separately when they need to buy tires.

## 3. Micro-Loans & Fleet Financing
Moja Ride wants to lend an operator 1,000,000 XOF to buy a new bus, and deduct 20% of their ticket sales to pay it back.
1. The platform issues the loan. 
   - Debit `LOAN_RECEIVABLE` (Asset) by 1,000,000.
   - Credit `OPERATOR_RECEIVABLE` (Liability) by 1,000,000.
   - The operator withdraws the cash.
2. Every time a ticket is sold:
   - Debit `PAYSTACK_CLEARING` (10,000)
   - Credit `LOAN_RECEIVABLE` (2,000) -> Pays down the loan.
   - Credit `OPERATOR_RECEIVABLE` (8,000) -> The operator's remaining cut.
*Result*: A fully automated, risk-free loan repayment system built entirely on double-entry accounting.

## 4. Payroll
An operator wants to pay their drivers a flat 5,000 XOF per day directly from their revenue.
1. Create a `FinancialAccount` with `accountClass = "DRIVER_WALLET"` owned by the `User` (the driver).
2. Run a daily cron job that executes an `AccountingEngine("PAYROLL")` transaction:
   - Debit `OPERATOR_RECEIVABLE` (5,000)
   - Credit `DRIVER_WALLET` (5,000)
*Result*: The driver gets paid instantly. They can withdraw it or use it to buy tickets.

## 5. Multi-Currency (FX)
If Moja Ride expands to Nigeria (NGN), the system can handle FX natively.
1. `FinancialAccount` rows already have a `currency` column.
2. An NGN user buys an NGN ticket. The ledger operates entirely in NGN accounts.
3. If an NGN user wants to buy an XOF ticket, a new `AccountingEngine("FX_EXCHANGE")` transaction type is created.
   - It debits the user's NGN wallet.
   - It credits the platform's NGN FX pool.
   - It debits the platform's XOF FX pool.
   - It credits the user's XOF wallet.
*Result*: The user now has XOF to buy the ticket. The platform tracks its FX exposure perfectly.
