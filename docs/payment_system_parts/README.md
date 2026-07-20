# Moja Ride Financial Platform — Engineering Handbook

Welcome to the canonical engineering manual for the Moja Ride Financial Platform. This documentation is the ultimate source of truth for all money movement, accounting, and financial ledger operations within Moja Ride.

> **CRITICAL RULE**: Do not trust memory or intuition. The implementation documented here is derived directly from the source code. If there is a contradiction, the codebase is correct and this document should be updated.

---

## Philosophy of This Document

This handbook is organized **conceptually, not by implementation**. You will not find a section called "Services" or "Database Models" at the top level. Instead, you will find:

1. First, the **financial model** — what problem we are solving and why.
2. Then, the **money lifecycle** — where money lives at every second.
3. Then, the **mechanisms** — how the system enforces correctness.
4. Finally, the **implementation** — how the code realizes all of the above.

This ordering mirrors how a financial regulator, a senior fintech engineer, or an incoming engineer should understand the system: concept first, code second.

---

## Reading Order & Dependency Map

### 📐 Part 1: Financial Model (Start Here)

Read these in order before touching any code.

| # | Document | What It Teaches |
|---|---|---|
| [00](./00-overview.md) | **Overview** | The 10,000-foot view. What Moja Ride's payment system is and isn't. |
| [01-arch](./01-architecture-principles.md) | **Architecture Principles** | The 8 invariants. Rules that can NEVER be broken. |
| [01](./01-architecture.md) | **Architecture** | System design, service boundaries, and decoupling strategy. |
| [02](./02-life-of-money.md) | **Life of Money** | **READ FIRST.** Where money physically lives from T=0 (passenger pays) to T=final (operator bank). |
| [03](./03-accounting.md) | **Accounting Principles** | Double-entry accounting: Assets = Liabilities + Equity + Revenue - Expenses. |
| [04](./04-chart-of-accounts.md) | **Chart of Accounts** | Every ledger account: PAYSTACK_CLEARING, OPERATOR_RECEIVABLE, PASSENGER_WALLET, etc. |

### 💸 Part 2: Money Mechanisms (Core Concepts)

These explain *how* the system enforces financial correctness.

| # | Document | What It Teaches |
|---|---|---|
| [02-phil](./02-financial-philosophy.md) | **Financial Philosophy** | Why the system was built this way. Float vs. Escrow vs. Trust. |
| [03-acct](./03-account-lifecycle.md) | **Account Lifecycle** | When accounts are created, frozen, archived, and why they never merge. |
| [04-led](./04-ledger-philosophy.md) | **Ledger Philosophy** | Why the ledger is append-only, immutable, and the supreme source of truth. |
| [05](./05-state-machines.md) | **State Machines** | State diagrams for ExternalPayment, FinancialTransaction, Booking, WalletReservation, HoldGroup. |

### 🔒 Part 3: Critical Subsystems

Each of these is a standalone chapter on a major subsystem.

| # | Document | What It Teaches |
|---|---|---|
| [06](./06-escrow.md) | **Escrow** | Why escrow exists, when reserved/available changes, every escrow scenario. |
| [07](./07-reconciliation.md) | **Reconciliation** | 4-layer reconciliation: transaction, cron, daily balance, investigative. |
| [08](./08-audit.md) | **Auditability** | The complete audit chain. How to answer: who, what, when, why, how. |
| [09](./09-settlement.md) | **Settlement** | Operator payouts: prerequisites, step-by-step flow, arrears, retry protocol. |
| [10](./10-concurrency.md) | **Concurrency** | Pessimistic locking, deadlock prevention algorithm, race condition scenarios. |
| [11](./11-idempotency.md) | **Idempotency** | 3-layer idempotency: webhook gate, ledger key, domain state machines. |

### 📖 Part 4: Business Workflows

End-to-end walkthroughs of business processes from user click to ledger commit.

| # | Document | What It Teaches |
|---|---|---|
| [12](./12-pricing.md) | **Pricing** | The pricing formula, snapshot immutability, and fare breakdown. |
| [13](./13-wallet.md) | **Wallet** | PASSENGER_WALLET: topup, spend, reservation, expiry, business benefits. |
| [14](./14-bookings.md) | **Bookings** | The complete lifecycle of buying a ticket (card and wallet paths). |
| [15](./15-refunds.md) | **Refunds** | Returning money gracefully: pre-trip, post-trip, gateway refunds. |
| [16](./16-withdrawals.md) | **Withdrawals** | Operator withdrawal requests and the payout lifecycle. |
| [17](./17-ledger.md) | **Transaction Catalog** | **Every** transaction type with its trigger, postings, and rollback. |

### 🚨 Part 5: System Integrity

| # | Document | What It Teaches |
|---|---|---|
| [21](./21-failure-scenarios.md) | **Failure Scenarios** | 14 failure modes with classification, detection, recovery, and invariants. |
| [19](./19-security.md) | **Security** | HMAC verification, authorization, replay protection. |
| [20](./20-testing.md) | **Testing** | How the financial system is verified. |

### 📊 Part 6: Observation & Extension

| # | Document | What It Teaches |
|---|---|---|
| [18](./18-analytics.md) | **Analytics** | Deriving metrics strictly from the ledger. |
| [22](./22-future-architecture.md) | **Future Architecture** | How to extend for Payroll, FX, Loans, Savings. |

### 🔁 Visual References

| Document | What It Shows |
|---|---|
| [Sequence Diagrams](./sequence-diagrams.md) | **7 end-to-end flows** with DB locks, transaction boundaries, and failure paths |
| [State Machines](./state-machines.md) | State transition diagrams for all core entities |

### 📚 Reference Materials

| Document | What It Contains |
|---|---|
| [Glossary](./glossary.md) | Domain language definitions |
| [Invariants](./invariants.md) | The 8 rules that must NEVER be broken |
| [Formulas](./formulas.md) | The strict mathematical equations |
| [Appendix](./appendix.md) | Historical notes and legacy context |

---

## Implementation Details

The conceptual chapters above describe *what* the system does and *why*. For *how* the code implements it:

- **Database Models** → [`17-implementation/database/`](./17-implementation/database/)
  - [Ledger Models](./17-implementation/database/ledger-models.md) — FinancialAccount, FinancialTransaction, LedgerEntry
  - [Gateway Models](./17-implementation/database/gateway-models.md) — ExternalPayment, PaymentAttempt, WebhookEvent
  - [Booking Models](./17-implementation/database/booking-models.md) — HoldGroup, PricingSnapshot, Booking
  - [Wallet Models](./17-implementation/database/wallet-models.md) — WalletReservation

- **Services** → [`17-implementation/services/`](./17-implementation/services/)
  - [AccountingEngine](./17-implementation/services/accounting-engine.md) — The most critical service
  - [FinancialAccountService](./17-implementation/services/financial-account-service.md) — Account retrieval and lazy creation
  - [PaymentService](./17-implementation/services/payment-service.md) — Paystack integration
  - [BookingConfirmationService](./17-implementation/services/booking-confirmation-service.md) — Orchestrator
  - [PricingResolver](./17-implementation/services/pricing-resolver.md) — Immutable snapshots

- **Background Jobs** → [`17-implementation/crons/`](./17-implementation/crons/)
  - [reconcile-payments](./17-implementation/crons/reconcile-payments.md) — Catches missed webhooks
  - [release-escrow](./17-implementation/crons/release-escrow.md) — Releases operator funds after trip
  - [release-reservations](./17-implementation/crons/release-reservations.md) — Expires wallet reservations
  - [snapshot-accounts](./17-implementation/crons/snapshot-accounts.md) — Data warehousing

- **Webhooks** → [`17-implementation/webhooks/`](./17-implementation/webhooks/)

---

## The 8 Invariants (Never Break These)

| # | Rule |
|---|---|
| 1 | The Ledger is the source of truth. `FinancialAccount` balances are derived caches. |
| 2 | `FinancialAccount.postedBalance` = `Σ(CREDIT LedgerEntries) - Σ(DEBIT LedgerEntries)` |
| 3 | `ExternalPayment` is never accounting. It is a gateway event record only. |
| 4 | Bookings never own money. Money lives in `FinancialAccount`. |
| 5 | `AccountingEngine` is the ONLY writer to `LedgerEntry`. No exceptions. |
| 6 | Money only moves via `FinancialTransaction` + `LedgerEntry` pairs. |
| 7 | `LedgerEntry` rows are immutable. Never UPDATE or DELETE them. |
| 8 | External systems (Paystack) are eventually consistent. Design for this. |

> **IMPORTANT**: This document should be kept in sync with the codebase. When a new transaction type is added, update [17-ledger.md](./17-ledger.md). When a new failure mode is found, update [21-failure-scenarios.md](./21-failure-scenarios.md). When a service is refactored, update the relevant implementation doc.
