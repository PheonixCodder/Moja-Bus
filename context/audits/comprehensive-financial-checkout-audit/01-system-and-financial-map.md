# 01 — System & Financial Map

**Scope:** Moja Ride Financial Architecture, Chart of Accounts, Money Flows, Escrow Pipeline, and Double-Entry Invariants.

---

## 1. Core Financial Architecture

Moja Ride operates as a two-sided digital marketplace for passenger bus transport in Côte d'Ivoire (WAEMU / UEMOA zone). The fundamental monetary unit is **Franc CFA (`XOF`)**, which has no fractional sub-units (zero-decimal currency).

```
                      ┌─────────────────────────────────┐
                      │    PASSENGER (Web & Mobile)     │
                      └────────────────┬────────────────┘
                                       │
                  ┌────────────────────┴───────────────────┐
                  ▼                                        ▼
      ┌────────────────────────┐              ┌────────────────────────┐
      │   PAYSTACK GATEWAY     │              │   MOJA PASSENGER       │
      │ (Wave, MTN, Orange,    │              │       WALLET           │
      │  Moov, Visa, MC)       │              │ (Stored Balance XOF)   │
      └───────────┬────────────┘              └───────────┬────────────┘
                  │                                        │
                  │ Inbound Cash (Fees Net)                │ Stored Liability
                  ▼                                        ▼
┌────────────────────────────────────────────────────────────────────────┐
│            DOUBLE-ENTRY GENERAL LEDGER (AccountingEngine)              │
│        (Enforces: Σ Debits ≡ Σ Credits; Zero Float Math; ACID)         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │
         ┌─────────────────────────┼─────────────────────────┐
         ▼                         ▼                         ▼
┌─────────────────┐       ┌─────────────────┐       ┌─────────────────┐
│ OPERATOR ESCROW │       │ PLATFORM TAKE   │       │ MARKETING POOL  │
│ (Held 24h post  │       │ (Commission +   │       │ (Promo Credits  │
│  trip arrival)  │       │  Convenience)   │       │  & Subsidies)   │
└────────┬────────┘       └─────────────────┘       └─────────────────┘
         │
         │ Escrow Release Cron (24h post-arrival)
         ▼
┌─────────────────┐
│ OPERATOR PAYOUT │
│ (Bank Transfer  │
│  via Paystack)  │
└─────────────────┘
```

---

## 2. Chart of Accounts & Normal Balances

All monetary movements are registered in `FinancialAccount` records, typed by `AccountCategory` (`ASSET`, `LIABILITY`, `REVENUE`, `EXPENSE`).

| Account Class | Category | Owner Type | Normal Balance | Description |
| :--- | :--- | :--- | :--- | :--- |
| `PAYSTACK_CLEARING` | `ASSET` | `SYSTEM` | **DEBIT** | Physical fiat funds held in Moja Ride's Paystack merchant bank account. |
| `PASSENGER_WALLET` | `LIABILITY` | `USER` | **CREDIT** | Fiat money deposited by a passenger or refunded; withdrawable/usable for bookings. |
| `PROMO_CREDITS` | `LIABILITY` | `USER` | **CREDIT** | Marketing grant credits issued to a passenger. **Non-withdrawable**. |
| `OPERATOR_RECEIVABLE` | `LIABILITY` | `COMPANY` | **CREDIT** | Money owed to the bus operator for completed or escrowed ticket sales. |
| `PLATFORM_COMMISSION` | `REVENUE` | `PLATFORM` | **CREDIT** | Percentage cut deducted from operator fare ($BPS / 10,000$). |
| `PLATFORM_CONVENIENCE_FEE` | `REVENUE` | `PLATFORM` | **CREDIT** | Booking fee paid by passenger for card/mobile money gateway processing. |
| `PLATFORM_PROMO_EXPENSE` | `EXPENSE` | `PLATFORM` | **DEBIT** | Marketing subsidy incurred when platform funds a discount or grants promo credits. |
| `PAYMENT_PROCESSOR_FEE` | `EXPENSE` | `PLATFORM` | **DEBIT** | Gateway surcharge deducted by Paystack ($1.5\% - 2.5\%$). |
| `PROMO_CONTRA_OPERATOR` | `REVENUE` | `COMPANY` | **DEBIT** | Negative revenue contra account tracking operator-funded ticket discounts. |
| `OFFLINE_REFUND_PAYABLE` | `LIABILITY` | `SYSTEM` | **CREDIT** | Cash/voucher liability owed to counter agents for physical passenger refunds. |

---

## 3. Account Balance Invariants

Every `FinancialAccount` has three balance fields:
1. `postedBalance`: Total historical accumulated balance. Mutated exclusively by `AccountingEngine.commit()`.
2. `reservedBalance`: Portions of posted balance locked in escrow (e.g. operator funds prior to trip arrival, or pending wallet reservations).
3. `availableBalance`: Materialized as $\text{postedBalance} - \text{reservedBalance}$.

### The Golden Rule:
$$\text{availableBalance} \ge 0 \quad (\text{unless } allowNegativeBalance = \text{true})$$
$$\sum_{\text{All Entries}} \text{Debit} \equiv \sum_{\text{All Entries}} \text{Credit}$$

---

## 4. End-to-End Money In / Money Out Flows

### A. Direct Card / Mobile Money Checkout (10,000 XOF Ticket, 5% Commission, 2.5% Fee)
* Base Fare = 10,000 XOF
* Platform Commission (5%) = 500 XOF
* Operator Net = 9,500 XOF
* Platform Convenience Fee (2.5%) = 250 XOF
* Total Charged to Passenger = 10,250 XOF
* Paystack Gateway Fee (say 205 XOF):
  * **Debit** `PAYSTACK_CLEARING` (Asset): 10,045 XOF
  * **Debit** `PAYMENT_PROCESSOR_FEE` (Expense): 205 XOF
  * **Credit** `OPERATOR_RECEIVABLE` (Liability, Reserved): 9,500 XOF
  * **Credit** `PLATFORM_COMMISSION` (Revenue): 500 XOF
  * **Credit** `PLATFORM_CONVENIENCE_FEE` (Revenue): 250 XOF
  * **Equation:** $\sum \text{Debit} = 10,250 = \sum \text{Credit} = 10,250$. Balanced.

### B. Wallet Checkout (10,000 XOF Ticket)
* Platform policy: **Convenience fee is WAIVED (0 XOF)** when paying with Wallet.
* Total Charged to Passenger = 10,000 XOF:
  * **Debit** `PASSENGER_WALLET` (Liability): 10,000 XOF
  * **Credit** `OPERATOR_RECEIVABLE` (Liability, Reserved): 9,500 XOF
  * **Credit** `PLATFORM_COMMISSION` (Revenue): 500 XOF
  * **Equation:** $\sum \text{Debit} = 10,000 = \sum \text{Credit} = 10,000$. Balanced.

### C. Escrow Release (24 hours post-arrival)
* Once the trip status is `ARRIVED` and 24 hours have elapsed:
  * **Debit** `OPERATOR_RECEIVABLE` (`releaseFromReserve: true`): 9,500 XOF
  * **Credit** `OPERATOR_RECEIVABLE` (Available): 9,500 XOF
  * **Result:** `reservedBalance` decreases by 9,500; `availableBalance` increases by 9,500. Operator can now withdraw.
