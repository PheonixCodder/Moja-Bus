# System Architecture & Financial Flow Map

## 1. Chart of Accounts (Double-Entry Ledger)

All accounts are modeled in [`FinancialAccount`](file:///C:/dev/moja-buss/packages/db/prisma/schema.prisma#L1917) and managed via [`FinancialAccountService`](file:///C:/dev/moja-buss/packages/db/src/services/FinancialAccountService.ts).

```mermaid
graph TD
    subgraph ASSETS ["ASSETS (Debit Normal)"]
        A1["PAYSTACK_CLEARING<br/>(System Asset - Pending Gateway Settlement)"]
    end

    subgraph LIABILITIES ["LIABILITIES (Credit Normal)"]
        L1["PASSENGER_WALLET<br/>(User Fiat Liability - Withdrawable/Spendable)"]
        L2["PROMO_CREDITS<br/>(User Marketing Liability - Non-Withdrawable)"]
        L3["OPERATOR_RECEIVABLE<br/>(Company Liability - Escrow & Available Net)"]
        L4["OFFLINE_REFUND_PAYABLE<br/>(Platform Liability - Station Cash Reimbursements)"]
    end

    subgraph REVENUES ["REVENUES (Credit Normal)"]
        R1["COMMISSION_REVENUE<br/>(Platform Commission Share)"]
        R2["CONVENIENCE_FEE_REVENUE<br/>(Platform Booking Processing Fee)"]
    end

    subgraph EXPENSES ["EXPENSES (Debit Normal)"]
        E1["PROMO_EXPENSE_PLATFORM<br/>(Platform Marketing Subsidies & Grants)"]
        E2["PROMO_CONTRA_OPERATOR<br/>(Operator Marketing Concessions)"]
        E3["PAYMENT_PROCESSOR_FEES<br/>(Paystack Interchange / MNO Fees)"]
    end
```

---

## 2. Double-Entry Invariant Rules

For every entry posted via [`AccountingEngine.commit()`](file:///C:/dev/moja-buss/packages/db/src/services/AccountingEngine.ts#L119):

$$\sum \text{Debits} \equiv \sum \text{Credits}$$

### Balance Mutation Rules:
- **ASSET / EXPENSE**:
  $$\Delta \text{Balance} = +\text{Debit} - \text{Credit}$$
- **LIABILITY / REVENUE / EQUITY**:
  $$\Delta \text{Balance} = +\text{Credit} - \text{Debit}$$

### Account Balances:
- `postedBalance`: Total historical balance committed.
- `availableBalance`: Spendable/withdrawable balance.
- `reservedBalance`: Escrowed balance (e.g. operator earnings held until 24h post-arrival).

---

## 3. End-to-End Financial State Machines

### 3.1 Booking & Hold Lifecycle
```mermaid
stateDiagram-v2
    [*] --> ACTIVE: createHold() (Seats locked FOR UPDATE, 15m countdown)
    ACTIVE --> EXPIRED: 15m Timeout (Cron/Hold Countdown)
    ACTIVE --> CONFIRMED: Payment Verified (Paystack / Moja Wallet)
    ACTIVE --> CANCELLED: User explicit release
    CONFIRMED --> COMPLETED: Trip ARRIVED + 24h Escrow Release
    CONFIRMED --> CANCELLED: Passenger Cancel (Before Departure)
```

### 3.2 External Payment & Webhook Lifecycle
```mermaid
stateDiagram-v2
    [*] --> INITIALIZED: initiatePayment()
    INITIALIZED --> PENDING: Paystack popup / mobile redirect initiated
    PENDING --> SUCCESS: Webhook charge.success / verifyPayment
    PENDING --> FAILED: Payment declined / abandoned
    PENDING --> RESCUED: Hold expired before pay -> Credited to User Wallet
```

### 3.3 Promo Credit Lot Lifecycle
```mermaid
stateDiagram-v2
    [*] --> ACTIVE: Admin Grant / Promo Code Claim (Available immediately)
    [*] --> PENDING: Referral Reward (Unlocks after referee departs)
    PENDING --> ACTIVE: processDueReferralRewards() (Cron sweep)
    ACTIVE --> PARTIALLY_REDEEMED: Used in checkout hold
    PARTIALLY_REDEEMED --> REDEEMED: Hold confirmed
    ACTIVE --> EXPIRED: sweepIncentiveStatuses() (Expires after TTL)
```

---

## 4. End-to-End Payment Flow Sequence

```mermaid
sequenceDiagram
    autonumber
    actor Passenger
    participant App as Web / Mobile App
    participant TRPC as Booking / Payments Router
    participant HoldService as BookingHoldService
    participant QuoteService as Discount QuoteService
    participant Paystack as Paystack API
    participant ConfirmService as BookingConfirmationService
    participant Ledger as AccountingEngine (DB)

    Passenger->>App: Select seats & promo code
    App->>TRPC: getCheckoutPricing()
    TRPC->>QuoteService: evaluateCheckoutDiscounts()
    QuoteService-->>App: Pricing breakdown (Subtotal, Discounts, Fee, Payable)
    
    Passenger->>App: Submit Booking ("Pay with Card/Moja Wallet")
    App->>HoldService: createHold(offerId, seatIds, promoCode)
    HoldService->>QuoteService: reserveDiscountOnHold()
    HoldService-->>App: holdId, pricingSnapshotId
    
    alt Payment via Paystack
        App->>TRPC: initiatePayment(holdId)
        TRPC->>Paystack: initialize({ email, amountXOF, reference })
        Paystack-->>App: authorizationUrl / accessCode
        Passenger->>Paystack: Authorizes Mobile Money / Card
        Paystack-->>TRPC: Webhook: charge.success (reference)
        TRPC->>ConfirmService: confirmFromPayment(paymentId)
    else Payment via Moja Wallet
        App->>TRPC: checkoutWithWallet(holdId)
        TRPC->>ConfirmService: confirmFromWallet(holdId)
    end

    ConfirmService->>Ledger: Atomic double-entry Journal Posting
    Note over ConfirmService,Ledger: DEBIT Clearing/Wallet<br/>CREDIT Operator Escrow (Reserved)<br/>CREDIT Commission Revenue<br/>CREDIT Convenience Revenue
    ConfirmService->>QuoteService: finalizeDiscountRedemptions(holdGroupId)
    ConfirmService-->>App: Confirmed Booking References & Tickets
```
