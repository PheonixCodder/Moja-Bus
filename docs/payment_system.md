# Moja Bus — Payment System Architecture & Integration Guide

This document describes the end-to-end architecture, data models, transaction lifecycles, and configuration rules for the payment system implemented in the Moja Bus platform. 

The system relies on **Paystack** for secure customer collections and automatic merchant split payments, backed by a robust transactional database ledger for operator reconciliation.

---

## 1. Core Financial Models & Concepts

The platform tracks every transaction using several database tables to guarantee financial audibility and prevent double-spending:

*   **PlatformSettings**: Stores global defaults, specifically `defaultCommissionBps` (the platform's cut of ticket sales, e.g., `500` basis points = 5%) and `defaultConvenienceFeeBps` (the booking fee charged to passengers, e.g., `300` basis points = 3%).
*   **CommissionDistanceTier**: Stores rules to calculate dynamic commission rates based on route distance (in km). This enables charging higher or lower commission percentages depending on how far the bus travels.
*   **HoldGroup & Booking**:
    *   When a traveler selects seats and proceeds to checkout, they are placed in a `HoldGroup`.
    *   The seats are marked as `PENDING` with an expiration timer (usually 10 minutes) to hold the inventory.
*   **PricingSnapshot**: Appended to a `HoldGroup` immediately during seat selection, capturing the exact financial snapshot of the tickets:
    *   `subtotalBaseXOF`: The base ticket price multiplied by the number of seats.
    *   `convenienceFeeXOF`: The service fee added to the checkout total.
    *   `chargeAmountXOF`: The total charged to the passenger (`subtotalBaseXOF` + `convenienceFeeXOF`).
    *   `commissionXOF`: The platform's commission deducted from the ticket price.
    *   `operatorNetXOF`: The net amount the bus operator keeps (`subtotalBaseXOF` - `commissionXOF`).
*   **Payment**: Stores the overall payment intent, reference state, and status (`INITIALIZED`, `PENDING`, `SUCCESS`, or `FAILED`).
*   **PaymentAttempt**: Tracks individual charge attempts. Since a user's transaction may fail initially and they might retry, a single `Payment` record can have multiple `PaymentAttempt` records (e.g., attempt `_1`, `_2`).
*   **OperatorLedgerEntry**: A double-entry style financial journal tracking operator balances.
    *   `CREDIT` entries increase the operator's ledger balance (e.g., when a ticket is purchased).
    *   `DEBIT` entries decrease their balance (e.g., when the platform records a payout settlement).

---

## 2. Pricing & Fee Calculations

All values are calculated in **CFA Francs (XOF)** using basis points ($1\% = 100 \text{ bps}$) to avoid floating-point errors:

1.  **Commission Rate**: Determined dynamically by checking the route's distance against the active `CommissionDistanceTier` table. If no distance tier matches, it falls back to `defaultCommissionBps` in `PlatformSettings`.
2.  **Convenience Fee**: Calculated from the base ticket price using `defaultConvenienceFeeBps`.
3.  **Breakdown Formula**:
    *   `subtotalBaseXOF = baseFareXOF * seatCount`
    *   `convenienceFeeXOF = (subtotalBaseXOF * convenienceFeeBps) / 10,000`
    *   `commissionXOF = (subtotalBaseXOF * commissionBps) / 10,000`
    *   `chargeAmountXOF = subtotalBaseXOF + convenienceFeeXOF`
    *   `operatorNetXOF = subtotalBaseXOF - commissionXOF`

---

## 3. Operator Onboarding & Paystack Subaccount Setup

To receive automated payouts, operators must register their bank or mobile money account details during onboarding.

### Automatic Verification & Registration
1.  **Onboarding Submission**: Operators input their business details, Bank Code (e.g., SGCI, Ecobank), and Bank Account Number. The account number is encrypted before database insertion using `encryptBankAccountNumber` (AES-256-GCM).
2.  **Verification Approval**: An Admin reviews the onboarding documents. Upon approval, the `admin.verifyOperator` procedure is triggered.
3.  **Subaccount Generation**: 
    *   The app decrypts the operator's account number.
    *   It invokes the Paystack API `/subaccount` endpoint to register a new Subaccount under our merchant account.
    *   The subaccount is created with `percentage_charge: 100` (meaning transaction splits will route 100% of the specified split portion to this subaccount).
    *   The generated `subaccount_code` (e.g. `ACCT_xxxxxxxxxx`) is saved to the operator's `Company` record.

---

## 4. Transaction & Booking Lifecycle

When a passenger purchases a ticket, the payment flows through Paystack and the database as follows:

### Detailed Execution Steps:
1.  **Initialize Payment**: 
    *   The web app makes a call to `PaymentService.initiate(...)` with the `holdGroupId` and payer details.
    *   The service checks if the operator company has a `paystackSubaccountCode`.
    *   It creates a new `Payment` in the database with status `INITIALIZED`, generating a unique reference: `ref_[holdGroupId]_[attemptNumber]`.
2.  **Paystack Initialization**:
    *   The service calls Paystack `/transaction/initialize` containing the total `chargeAmountXOF`.
    *   If the operator has a subaccount, we pass `subaccount: subaccountCode` and `bearer: "account"`.
    *   Paystack returns the payment `accessCode` and `authorizationUrl`. The platform redirects the passenger to this checkout URL.
3.  **Checkout & Split Processing**:
    *   The passenger completes payment on Paystack.
    *   Because the transaction was initialized with the operator's `subaccountCode`, Paystack automatically splits the payout:
        *   The operator gets their share settled directly into their bank account or mobile wallet.
        *   The platform gets its share (convenience fee + commission) in the main merchant account.
4.  **Verification (Idempotent Callback/Webhook)**:
    *   Once paid, the traveler is redirected to our callback page which triggers the `verifyAndConfirm` method.
    *   Concurrently, Paystack sends a `charge.success` webhook to our webhook receiver, calling `handleWebhookEvent`.
    *   Both endpoints are idempotent: they call `paystackVerify` to verify the reference status directly with Paystack's servers.
5.  **Booking & Ticket Confirmation**:
    *   If verified successfully, the `Payment` and `PaymentAttempt` records are updated to `SUCCESS`.
    *   `BookingConfirmationService.confirmFromPayment` is triggered:
        *   The `Booking` status is updated to `CONFIRMED` and `paymentStatus` to `PAID`.
        *   A **CREDIT** entry is added to `OperatorLedgerEntry` logging `operatorNetXOF` to represent the operator's net earnings from the ticket.
        *   SMS/Emails containing the ticket tokens are sent to the passenger.

---

## 5. Ledger Auditor & Manual Settlements

Since ticket sales automatically split funds to the operator via Paystack subaccounts, why does the Admin Dashboard feature a **Settlements Ledger**?

### The Role of the Ledger
The ledger serves as a single source of truth for **reconciliation**:
1.  **Auditing**: It keeps a running historical balance of what the operator has earned.
2.  **Handling Edge Cases**:
    *   **Manual/Offline Bookings**: If an operator sells cash tickets offline or via physical terminal sales, these do not go through Paystack online splits. They can be logged in the system.
    *   **Fallback Payouts**: If the operator's Paystack subaccount was not active at the time of a transaction (e.g., pending bank details clearance) and the platform collected 100% of the funds, the platform can pay out the operator manually.
3.  **Payout Recording**: When the platform makes a manual bank transfer settlement, the Admin records this transaction inside the **Record Settlement Payout** dialog. This creates a `DEBIT` entry in the ledger to balance the operator's account.

### Ledger Summary Calculations
*   **Balance**: Sum of all `CREDIT` entries minus all `DEBIT` entries.
*   The Settlements view dynamically displays each operator's total ledger balance, allowing admins to track and reconcile operator accounts with a clear history.
