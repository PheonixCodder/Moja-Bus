# Moja Bus Financial & Payment Architecture Audit
## Executive Summary & Architecture Blueprint

**Audit Date:** August 2026  
**Audited Codebase:** `PheonixCodder/Moja-Bus` (`apps/web`, `packages/db`, `packages/schemas`)  
**Scope:** Search & Checkout, Payment Gateways (Paystack), Moja Wallet, Promo Credits, Double-Entry Ledger, Single Paystack Treasury Abstraction, Operator Revenue & Withdrawals, Admin Financials & Settlements.

---

### 1. Architectural Overview

Moja Bus employs a **closed-loop double-entry accounting engine** backed by a **single custodial Paystack merchant account**. All physical fiat inflows (cards, mobile money, top-ups) enter one centralized Paystack account, while all internal financial movements—such as passenger deposits, platform commissions, service fees, promotional subsidies, operator escrow reservations, and withdrawals—are tracked as strict debits and credits across double-entry ledger accounts in PostgreSQL.

```
                                  ┌──────────────────────────────────────────────┐
                                  │           PAYSTACK MASTER ACCOUNT            │
                                  │      (Physical Fiat Pool in Côte d'Ivoire)   │
                                  └──────────────────────┬───────────────────────┘
                                                         │
                                    ┌────────────────────┴────────────────────┐
                                    │                                         │
                             [ MONEY IN ]                              [ MONEY OUT ]
                      • Card Checkout (XOF)                     • Operator Bank Payouts
                      • Mobile Money (Wave, Orange, MTN, Moov)  • Mobile Money Transfers
                      • Moja Wallet Top-Ups                     • Paystack Gateway Fees
                                    │                                         │
                                    └────────────────────┬────────────────────┘
                                                         ▼
                                  ┌──────────────────────────────────────────────┐
                                  │         DOUBLE-ENTRY ACCOUNTING CORE         │
                                  │         (PostgreSQL + AccountingEngine)      │
                                  └──────────────────────┬───────────────────────┘
                                                         │
           ┌───────────────────────┬─────────────────────┼─────────────────────┬────────────────────────┐
           ▼                       ▼                     ▼                     ▼                        ▼
    [ SYSTEM ASSET ]        [ USER LIABILITIES ]  [ OPERATOR LIABILITIES ] [ PLATFORM REVENUE ]  [ PLATFORM EXPENSE ]
• Paystack Clearing     • Passenger Wallets     • Operator Receivables   • Ticket Commission    • Promo Subsidies
  (Physical Pool Net)     (Cash deposits/refunds) (Escrowed/Available)     (5% default / tiers) • Payment Gateway Fees
                        • Promo Credits         • Operator Promo Contra  • Convenience Fees     • Referral Rewards
                          (Marketing grants)      (Discounts absorbed)     (2.5% card / 0 wallet)
```

---

### 2. Core Financial Tenets in Moja Bus

1. **Conservation of Money (Zero-Sum Journal)**:
   Every transaction requires $\sum \text{Debits} = \sum \text{Credits}$ within safe integer boundaries (XOF). No balance is ever altered without an immutable `LedgerEntry` record linked to a `FinancialTransaction`.
2. **Deterministic Single Paystack Abstraction**:
   Instead of opening sub-accounts for every bus operator, Moja Bus holds 100% of physical funds in a single Paystack balance. Operators hold internal liability accounts (`OPERATOR_RECEIVABLE`) and withdraw their cleared balances via Paystack Transfer API.
3. **Trip-Bound Escrow Protection (`reserveOnCredit`)**:
   Ticket proceeds are credited to the operator's account with `reserveOnCredit: true`. The operator sees the revenue, but the funds are locked in `reservedBalance` and cannot be withdrawn until a background cron (`release-escrow`) confirms the bus safely arrived at its destination (+ 24 hours).
4. **Convenience Fee Incentive for Moja Wallet**:
   Direct Paystack checkout incurs a convenience fee (e.g. 2.5% / 250 bps). Checking out with the internal **Moja Wallet Balance** completely waives the convenience fee ($0\text{ XOF}$), driving user deposits and lowering payment gateway interchange expenses.
5. **Separation of Real Cash (Wallet) and Marketing Currency (Promo Credits)**:
   - **Moja Wallet**: 100% backed by real deposited cash or verified refunds. Fully withdrawable, permanent, spendable on any booking.
   - **Promo Credits**: Backed by the platform's promotional budget (`PROMO_EXPENSE_PLATFORM`). Managed via FIFO `CreditLot` records with expiration dates, non-withdrawable, and bounded by anti-abuse device fingerprints.

---

### 3. Audit Report Structure

This audit dossier is divided into seven focused markdown documents:

| File | Focus Area | Key Code References |
|---|---|---|
| **[01-checkout-and-payment-flows.md](./01-checkout-and-payment-flows.md)** | Search & Checkout, Hold Groups, Paystack vs Wallet flows, Zero-cash promos, Orphan recovery | `search/page.tsx`, `booking-checkout-form.tsx`, `payment-service.ts`, `booking-confirmation-service.ts` |
| **[02-double-entry-ledger-and-chart-of-accounts.md](./02-double-entry-ledger-and-chart-of-accounts.md)** | Chart of accounts, Accounting engine mechanics, Row locking (`FOR UPDATE`), Invariants | `schema.prisma`, `AccountingEngine.ts`, `FinancialAccountService.ts`, `account-classes.ts` |
| **[03-money-in-out-and-single-paystack-abstraction.md](./03-money-in-out-and-single-paystack-abstraction.md)** | Single Paystack treasury pool, Inflows vs Outflows, Processing fees, Webhook handling, Reversals | `payment-service.ts`, `api/webhooks/paystack/route.ts`, `api/cron/reconcile-payments/route.ts` |
| **[04-wallet-system-and-promo-credits.md](./04-wallet-system-and-promo-credits.md)** | Moja Wallet vs Promo Credit Lots, Referral bonuses, Marketing grants, Stacking & Quotes | `discounts/services/`, `promo-ledger.ts`, `credit-grant-service.ts`, `referral-service.ts` |
| **[05-operator-financial-lifecycle-and-settlements.md](./05-operator-financial-lifecycle-and-settlements.md)** | Bank account onboarding, Escrow holding & clearance cron, Operator withdrawals & 2FA, Rebooking | `bank-step.tsx`, `release-escrow/route.ts`, `operator.ts`, `revenue/page.tsx`, `withdraw/page.tsx` |
| **[06-admin-controls-auditing-and-governance.md](./06-admin-controls-auditing-and-governance.md)** | Admin double-entry ledger viewer, Settlements, Platform settings, Fee overrides, Audit trails | `admin/financials/ledger/page.tsx`, `settlements/page.tsx`, `withdrawals/page.tsx`, `admin.ts` |
| **[07-complete-system-flowcharts-and-risk-analysis.md](./07-complete-system-flowcharts-and-risk-analysis.md)** | Comprehensive Mermaid diagrams, Failure modes, Edge case analysis, Vulnerability mitigations | Complete cross-stack analysis |
| **[08-operator-financial-metrics-and-calculations-audit.md](./08-operator-financial-metrics-and-calculations-audit.md)** | Line-by-line audit of Operator Dashboard calculations (Balance, Escrow, Net Earnings, Metrics, Routes, Ledger, CSV) | `operator/(dashboard)/`, `operator.ts`, `revenue-analytics.ts` |
| **[09-admin-financial-metrics-and-settlements-audit.md](./09-admin-financial-metrics-and-settlements-audit.md)** | Reconciliation of all 45 ledger records (316,838 XOF), Paystack Clearing vs Operator Payables, Admin KPIs | `admin/`, `payments.ts`, `admin.ts`, `settlements-clearing-card.tsx` |
