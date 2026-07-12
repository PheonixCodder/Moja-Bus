# UI/UX Refactoring Report: Modernized Financial Architecture

This report details the necessary UI/UX refactoring, page redesigns, newly added screens, removed views, and core flow changes required to align Moja Ride's frontend interfaces with the newly implemented double-entry ledger and unified treasury payment model.

---

## 1. Summary of Architectural Impact on UI/UX
The shift from Paystack automatic subaccount splits to a consolidated **Moja Treasury** model changes how value is represented. The system is now a ledger-driven clearinghouse where:
*   **Passengers** can maintain wallets, reserve funds, and choose refund methods.
*   **Operators** accrue funds in an internal ledger (`OPERATOR_RECEIVABLE`) and pull payouts via self-serve withdrawals.
*   **Admins** monitor central treasury clearing accounts rather than verifying individual operator subaccount split setups.

---

## 2. Redesign Matrix: Complete, Partial, and New Pages

### 2.1 Complete Redesigns

#### 1. Passenger Wallet Page
*   **File Path**: `apps/web/app/dashboard/(passenger)/wallet/page.tsx`
*   **What is Needed**:
    *   Replace the hardcoded $0$ XOF and placeholder "Manage Cards" buttons with real, active balance cards showing **Available Balance** and **Pending Balance** (from `FinancialAccount`).
    *   Create an interactive **Top-Up Dialog** modal prompting the user to select or input a top-up amount in XOF, which initializes a Paystack transaction and triggers the wallet loading flow.
    *   Build a scrollable, paginated **Transaction Ledger Table** pulling entries directly from the user's `LedgerEntry` logs (credits for deposits/refunds, debits for ticket checkouts).
*   **Why**: The current page is a static UI shell with zero backend integration.
*   **TRPC Changes**:
    *   `passenger.getWalletBalance`: Returns the live account balances.
    *   `passenger.getWalletLedger`: Returns paginated ledger lines for the user's wallet.
    *   `passenger.initiateWalletTopUp`: Calls Paystack's transaction initialization to deposit funds into the treasury.

---

### 2.2 Partial & Section Redesigns

#### 1. Booking Checkout Form
*   **File Path**: `apps/web/features/booking/components/booking-checkout-form.tsx`
*   **What is Needed**:
    *   Introduce a **Payment Method Selector** (radio group/tabs) allowing the passenger to choose between `Card / Mobile Money (Paystack)` or `Moja Wallet Balance`.
    *   If logged in, fetch and display their available wallet balance. If the wallet balance is insufficient, disable the wallet payment option and show a "Top Up" helper link.
    *   Update the price summary to reflect zero convenience fees if paid using the internal wallet (as configured by the platform policy).
*   **Why**: The current form is hardcoded to call `initiatePayment` which triggers a Paystack modal, with no path to pay using the internal wallet balance.
*   **TRPC Changes**:
    *   `booking.initiatePayment`: Accept `paymentMethod: "WALLET" | "PAYSTACK"`. If `WALLET`, it verifies funds, reserves the amount via `WalletReservation`, and confirm booking immediately.
    *   `passenger.getWalletBalance`: Loaded at checkout to check balance.

#### 2. Ticket Cancellation & Refund Modal
*   **File Path**: `apps/web/features/booking/components/ticket-detail-view.tsx` (and the operator booking drawer equivalent)
*   **What is Needed**:
    *   Simplify the Refund Modal to **remove the Refund Method Selector** completely. 
    *   Display a clear notice: *"Your refund will be instantly credited to your Moja Wallet balance."*
    *   Show a warning message if a guest (anonymous booking) tries to cancel, notifying them that they must register/log in to claim their ticket first so that the refund can be credited to their wallet.
    *   Add clear tooltips explaining the convenience fee policy (convenience fees are non-refundable).
*   **Why**: Under the updated policy, refunds are strictly sent to the passenger's wallet instead of the bank account. This simplifies the UI, eliminates Paystack gateway refund wait times, and saves on transaction costs.
*   **TRPC Changes**:
    *   `booking.cancelBooking`: Accepts `channel: "WALLET" | "VOUCHER" | "CASH"`. For automated passenger requests, it is forced to `"WALLET"`. We debit the Operator account for their net share, debit Platform Revenue for the commission portion, and credit the Passenger's Wallet for the full base fare.

#### 3. Operator Settings (Bank Details Card)
*   **File Path**: `apps/web/features/operator/views/operator-settings-view.tsx`
*   **What is Needed**:
    *   Rename the label from `Paystack ID` to `Paystack Recipient ID`.
    *   Remove any references to custom split percentages or merchant subaccount registration files.
    *   Add an information alert note explaining that **Paystack Transfer Fees** are deducted automatically from the operator's requested payout amount at the time of transfer.
*   **Why**: The backend schema replaced Paystack subaccounts with transfer recipients. Displaying "Subaccount Code" causes confusion.

#### 4. Operator Withdrawals View
*   **File Path**: `apps/web/features/operator/views/operator-withdraw-view.tsx`
*   **What is Needed**:
    *   Add a paginated **Withdrawal History Table** below the request form.
    *   The table should display the date of the request, the requested amount, the status (`PENDING` | `SETTLED` | `FAILED`), the Paystack Transfer Code, and the actual bank reference.
    *   Show a clear line item for **Paystack Transfer Fees** deducted from the gross requested payout.
*   **Why**: The base withdrawals view has been created, but operators cannot track past requested payouts or verify transaction fees without this list.
*   **TRPC Changes**:
    *   `operator.listWithdrawals`: Retrieves a paginated history of withdrawal transactions for the operator's company.

#### 5. Admin Settlements & Ledger Auditor
*   **File Path**: `apps/web/features/admin/views/admin-settlements-view.tsx`
*   **What is Needed**:
    *   Update the "Record Settlement" workflow. Instead of representing the primary payout channel, rename it to **Emergency Offline Settlement** to record manual cash or bank payouts done outside of Paystack.
    *   Add a **Platform Treasury Summary Card** at the top of the dashboard displaying:
        *   **Moja Clearing Balance** (derived from the `PAYSTACK_CLEARING` asset account).
        *   **Moja Platform Revenue** (derived from the `PLATFORM_FEES` revenue account).
    *   Provide a dropdown to filter the Ledger Auditor by account class (e.g., `OPERATOR_RECEIVABLE`, `PAYSTACK_CLEARING`, `PLATFORM_FEES`).
*   **Why**: Settlements are now operator-driven (pull) rather than admin-driven (push). Admins only intervene for manual, emergency overrides. They also need to monitor platform reserves.
*   **TRPC Changes**:
    *   `admin.getTreasuryOverview`: Computes the current balances of all system asset and revenue accounts.

---

### 2.3 New Pages to be Created

#### 1. Admin Payout Monitoring Queue
*   **Route**: `apps/web/app/dashboard/admin/withdrawals/page.tsx`
*   **What is Needed**:
    *   A central dashboard for platform administrators to monitor all operator-initiated withdrawal requests.
    *   Shows a list of payouts sorted by date, displaying Operator Name, Amount, Paystack Transfer Code, Gateway Status, and an action button to "Manually Resolve/Retry" if a transfer fails or remains pending due to network issues.
*   **Why**: Because payouts are initiated programmatically by operators, admins must have an audit screen to troubleshoot gateway API issues, watch for limits abuse, and resolve transfer failures.
*   **TRPC Changes**:
    *   `admin.listOperatorWithdrawals`: Lists all operator withdrawal transactions across the platform.
    *   `admin.retryFailedPayout`: Retries a failed payout in the event of an API error.

---

## 3. Pages & Features to be Removed

1.  **Individual Operator Split Config (Admin Settings)**:
    *   *What to remove*: Remove any dashboard input forms, tables, or database fields allowing admins to customize split percentages or commission split values on a per-operator basis.
    *   *Why*: Payout splits are fully decommissioned. All checkouts route 100% of funds to the master treasury. Operator earnings are tracked internally in the ledger using global platform commission rates or dynamic `CommissionDistanceTier` structures.

---

## 4. Flow Redesigns

### 4.1 Ticket Booking Flow (Wallet vs. Card)
```
[Select Seats]
      │
      ▼
[Go to Checkout]
      │
      ├──────► [Select Wallet] ──► Check Balance ──► Apply WalletReservation ──► Confirm & Deduct
      │
      └──────► [Select Card/MoMo] ──► Trigger Paystack ──► Webhook/Callback ──► Verify & Confirm
```

### 4.2 Ticket Cancellation & Refund Flow
```
[Cancel Ticket Request]
      │
      ▼
[Select Refund Target]
      │
      ├──────► [Internal Wallet] ──► Instant Balance Credit (Liability credit)
      │
      └──────► [Original Gateway] ──► Paystack API Refund call ──► Wait T+2 Days
```

### 4.3 Operator Payment Flow
```
Old Flow (Push-based Splits):
Passenger Card ──► Paystack split engine ──► Operator Bank Account (T+2 automatic)

New Flow (Pull-based Ledger Payouts):
Passenger Card ──► Consolidated Moja Treasury ──► Operator Ledger (Posted) ──► clears in 24h ──► Available ──► Operator Payout Request ──► Paystack Transfer API ──► Operator Bank
```
