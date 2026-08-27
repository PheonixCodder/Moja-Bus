# Moja Ride Notification Infrastructure: Financial & Payment Events

This document details the complete notification strategy, triggers, payload specifications, and channel routing rules for all payment, ledger, and withdrawal events across the ledger-driven Moja Treasury system.

---

## 1. Payments System Architecture & Webhooks

Moja Ride uses a double-entry ledger database powered by a centralized **Accounting Engine** writing atomic debits and credits:

```
    [Paystack charge.success]             [Paystack transfer.success / failed]
               │                                           │
               ▼                                           ▼
       (Payment Service)                       (Payment Service / Cron)
               │                                           │
       ┌───────┴───────┐                           ┌───────┴───────┐
       ▼               ▼                           ▼               ▼
(Booking Confirm) (Wallet Top-Up)         (Withdrawal Settle) (Withdrawal Fail)
       │               │                           │               │
       ▼               ▼                           ▼               ▼
 passenger-booking passenger-wallet-       operator-withdrawal operator-withdrawal
   -confirmed        topup                      -settled        -failed
```

### Event Triggers
1.  **Booking Checkout Confirmation**: Triggered inside `confirmFromPayment` and `confirmFromWallet` in [`booking-confirmation-service.ts`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/payments/services/booking-confirmation-service.ts#L142-L146) after ledger transactions are committed.
2.  **Wallet Top-Up**: Triggered inside `processTopUp` in [`payment-service.ts`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/payments/payment-service.ts#L419-L460) when verified deposit events complete.
3.  **Booking Cancellation**: Triggered inside `cancelBooking` in [`cancellation-service.ts`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/payments/services/cancellation-service.ts#L115-L200) after refund records and reversing ledger journals are committed.
4.  **Withdrawal Lifecycle**:
    *   **Requested**: Triggered inside `requestWithdrawal` in [`trpc/routers/operator.ts`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/trpc/routers/operator.ts#L1829-L1838) when Paystack accepts the transfer request.
    *   **Settled / Failed**: Triggered inside `handleTransferWebhook` in [`payment-service.ts`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/features/payments/payment-service.ts#L362-L417) when receiving `transfer.success`, `transfer.failed`, or `transfer.reversed` webhooks (or during cron recovery runs).

---

## 2. Notification Event Specifications

---

### Event 1: `passenger-booking-confirmed`
Sent to passengers immediately after a successful checkout to confirm their booking and deliver their ticket references.

*   **Trigger Location**: `apps/web/features/payments/services/booking-confirmation-service.ts` (`confirmFromPayment` & `confirmFromWallet` trigger boarding pass emails).
*   **Recipient**: Passenger (the traveler/payer).
*   **Settings**:
    *   `critical: true` (tickets are critical transactions).
*   **Channel Routing**:
    *   **Email (SendGrid)**: Primary. Delivers the high-fidelity invoice receipt and digital boarding pass details.
    *   **In-App**: Dashboard notification alert.
    *   **SMS (Twilio)**: Fallback. Triggered if email delivery fails, or if a mobile number is present, sending a quick boarding summary.
*   **Payload Schema**:
    ```typescript
    interface PassengerBookingConfirmedPayload {
      email: string;
      passengerName: string;
      companyName: string;
      originCityName: string;
      destinationCityName: string;
      departureTime: string; // Formatted datetime string
      bookingReferences: string[];
      subtotalBaseXOF: number;
      convenienceFeeXOF: number;
      totalAmountXOF: number;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `Your Moja Ride booking — {{payload.bookingReferences | join: ', '}}`
    *   **Email HTML**:
        ```html
        <div style="font-family: Arial, sans-serif; max-width: 520px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #0081F1; margin-top: 0;">Boarding Pass Confirmed</h2>
          <p>Hello {{payload.passengerName}}, your payment was successful. Present your ticket at boarding.</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px;">
            <p style="margin: 0 0 8px 0;">Operator: <strong>{{payload.companyName}}</strong></p>
            <p style="margin: 0 0 8px 0;">Route: <strong>{{payload.originCityName}} → {{payload.destinationCityName}}</strong></p>
            <p style="margin: 0 0 8px 0;">Departure: <strong>{{payload.departureTime}}</strong></p>
            <p style="margin: 0;">Reference(s): <span style="font-family: monospace; font-weight: bold; background: #e2e8f0; padding: 2px 6px; border-radius: 4px;">{{payload.bookingReferences | join: ', '}}</span></p>
          </div>
          <div style="border-top: 1px solid #e2e8f0; padding-top: 12px; font-size: 14px;">
            <p style="margin: 0 0 4px 0; color: #64748b;">Fare: {{payload.subtotalBaseXOF}} XOF</p>
            <p style="margin: 0 0 4px 0; color: #64748b;">Service Fee: {{payload.convenienceFeeXOF}} XOF</p>
            <p style="margin: 0; font-weight: bold; color: #0f172a;">Total Paid: {{payload.totalAmountXOF}} XOF</p>
          </div>
        </div>
        ```
    *   **In-App Body**: `Ticket confirmed! Trip from {{payload.originCityName}} to {{payload.destinationCityName}} departs {{payload.departureTime}}. (Ref: {{payload.bookingReferences | first}})`
    *   **In-App Redirect**: `/dashboard/tickets`
    *   **SMS Text**: `Moja Ride: Booking confirmed! Route: {{payload.originCityName}} -> {{payload.destinationCityName}} at {{payload.departureTime}}. Refs: {{payload.bookingReferences | join: ', '}}. Total paid: {{payload.totalAmountXOF}} XOF.`

---

### Event 2: `passenger-booking-refunded`
Sent to passengers when their ticket is cancelled, notifying them of their wallet credit.

*   **Trigger Location**: `apps/web/features/payments/services/cancellation-service.ts` (`cancelBooking` after refund record and ledger adjustments).
*   **Recipient**: Passenger.
*   **Settings**:
    *   `critical: true`.
*   **Channel Routing**:
    *   **Email (SendGrid)**: Confirmation of refund.
    *   **In-App**: Notification feed alert.
*   **Payload Schema**:
    ```typescript
    interface PassengerBookingRefundedPayload {
      email: string;
      passengerName: string;
      bookingReference: string;
      refundAmountXOF: number;
      channel: "WALLET" | "CASH" | "VOUCHER";
      reason: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `Refund confirmed: Booking {{payload.bookingReference}}`
    *   **Email HTML**:
        ```html
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #64748b; margin-top: 0;">Ticket Refunded</h2>
          <p>Hello {{payload.passengerName}}, your booking has been cancelled and refunded.</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px;">
            <p style="margin: 0 0 8px 0;">Reference: <strong>{{payload.bookingReference}}</strong></p>
            <p style="margin: 0 0 8px 0;">Refund Amount: <strong>{{payload.refundAmountXOF}} XOF</strong></p>
            <p style="margin: 0 0 8px 0;">Refund Channel: <strong>{{payload.channel}}</strong></p>
            <p style="margin: 0; color: #64748b;">Reason: "{{payload.reason}}"</p>
          </div>
          {% if payload.channel == 'WALLET' %}
            <p style="font-size: 13px; color: #64748b;">The funds have been credited to your internal Passenger Wallet balance.</p>
          {% endif %}
        </div>
        ```
    *   **In-App Body**: `Ticket {{payload.bookingReference}} cancelled. {{payload.refundAmountXOF}} XOF has been refunded to your {{payload.channel}}.`
    *   **In-App Redirect**: `/dashboard/wallet`

---

### Event 3: `passenger-wallet-topup`
Sent when a passenger tops up their wallet via Paystack.

*   **Trigger Location**: `apps/web/features/payments/payment-service.ts` (inside `processTopUp` after top-up ledger entry).
*   **Recipient**: Passenger.
*   **Settings**:
    *   `critical: false`.
*   **Channel Routing**:
    *   **Email (SendGrid)**: Primary. Deposit confirmation invoice receipt.
    *   **In-App**: Notification feed badge alert.
*   **Payload Schema**:
    ```typescript
    interface PassengerWalletTopupPayload {
      email: string;
      passengerName: string;
      amountXOF: number;
      transactionId: string;
      paymentMethod: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `Wallet Deposit Confirmation - {{payload.amountXOF}} XOF`
    *   **Email HTML**:
        ```html
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px;">
          <h2 style="color: #0081F1; margin-top: 0;">Wallet Top-Up Successful</h2>
          <p>Hello {{payload.passengerName}}, your deposit is cleared.</p>
          <div style="background: #f1f5f9; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px;">
            <p style="margin: 0 0 8px 0;">Deposit Amount: <strong>{{payload.amountXOF}} XOF</strong></p>
            <p style="margin: 0 0 8px 0;">Payment Method: <strong>{{payload.paymentMethod}}</strong></p>
            <p style="margin: 0; color: #64748b;">Transaction ID: <span style="font-family: monospace;">{{payload.transactionId}}</span></p>
          </div>
        </div>
        ```
    *   **In-App Body**: `Deposit of {{payload.amountXOF}} XOF was successful! Funds are available immediately.`
    *   **In-App Redirect**: `/dashboard/wallet`

---

### Event 4: `operator-withdrawal-requested`
Sent to operator company owners when they request a withdrawal to their verified bank account.

*   **Trigger Location**: `apps/web/trpc/routers/operator.ts` (inside `requestWithdrawal` after registering the `OPERATOR_PAYOUT` ledger transaction).
*   **Recipient**: Operator Owner.
*   **Settings**:
    *   `critical: false`.
*   **Channel Routing**:
    *   **Email (SendGrid)**: Primary. Confirmation receipt detailing bank parameters.
    *   **In-App**: Notification feed update.
*   **Payload Schema**:
    ```typescript
    interface OperatorWithdrawalRequestedPayload {
      email: string;
      ownerName: string;
      companyName: string;
      amountXOF: number;
      bankName: string;
      accountNumberLast4: string;
      transactionId: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `Withdrawal request initiated: {{payload.amountXOF}} XOF`
    *   **Email HTML**:
        ```html
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #ee237c; margin-top: 0;">Withdrawal Initiated</h2>
          <p>Hello {{payload.ownerName}},</p>
          <p>We have initiated a payout request for <strong>{{payload.companyName}}</strong> to your default bank account:</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px;">
            <p style="margin: 0 0 8px 0;">Payout Amount: <strong>{{payload.amountXOF}} XOF</strong></p>
            <p style="margin: 0 0 8px 0;">Destination Bank: <strong>{{payload.bankName}} (****{{payload.accountNumberLast4}})</strong></p>
            <p style="margin: 0; color: #64748b;">Transaction Reference: <span style="font-family: monospace;">{{payload.transactionId}}</span></p>
          </div>
          <p style="font-size: 13px; color: #64748b;">Most transfers clear within minutes, but some banks may take up to 24 hours. We will notify you once Paystack confirms completion.</p>
        </div>
        ```
    *   **In-App Body**: `Withdrawal request for {{payload.amountXOF}} XOF sent to {{payload.bankName}}.`
    *   **In-App Redirect**: `/dashboard/operator/revenue`

---

### Event 5: `operator-withdrawal-settled`
Sent to operator owners when the Paystack transfer completes successfully.

*   **Trigger Location**: `apps/web/features/payments/payment-service.ts` (inside `handleTransferWebhook` when receiving a `transfer.success` webhook).
*   **Recipient**: Operator Owner.
*   **Settings**:
    *   `critical: false`.
*   **Channel Routing**:
    *   **Email (SendGrid)**: Primary. Official settlement receipt.
    *   **In-App**: Notification feed badge alert.
*   **Payload Schema**:
    ```typescript
    interface OperatorWithdrawalSettledPayload {
      email: string;
      ownerName: string;
      companyName: string;
      amountXOF: number;
      bankName: string;
      accountNumberLast4: string;
      transactionId: string;
      settledAt: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `Withdrawal settled successfully: {{payload.amountXOF}} XOF`
    *   **Email HTML**:
        ```html
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #10b981; margin-top: 0;">Withdrawal Settled</h2>
          <p>Hello {{payload.ownerName}},</p>
          <p>The bank transfer for <strong>{{payload.companyName}}</strong> has cleared successfully:</p>
          <div style="background: #ecfdf5; border-left: 4px solid #10b981; padding: 16px; border-radius: 4px; margin: 16px 0; font-size: 14px;">
            <p style="margin: 0 0 8px 0; color: #065f46;">Amount: <strong>{{payload.amountXOF}} XOF</strong></p>
            <p style="margin: 0 0 8px 0; color: #065f46;">Bank: <strong>{{payload.bankName}} (****{{payload.accountNumberLast4}})</strong></p>
            <p style="margin: 0; color: #065f46;">Settled At: <strong>{{payload.settledAt}}</strong></p>
          </div>
        </div>
        ```
    *   **In-App Body**: `Withdrawal of {{payload.amountXOF}} XOF to bank has cleared successfully.`
    *   **In-App Redirect**: `/dashboard/operator/revenue`

---

### Event 6: `operator-withdrawal-failed`
Sent to operator owners when a Paystack transfer fails or is reversed by the destination bank, resulting in a ledger credit reversal.

*   **Trigger Location**: `apps/web/features/payments/payment-service.ts` (inside `handleTransferWebhook` when receiving a `transfer.failed` or `transfer.reversed` webhook).
*   **Recipient**: Operator Owner.
*   **Settings**:
    *   `critical: true`.
    *   `severity`: `high` (visual priority/color indicators in dashboard).
*   **Channel Routing**:
    *   **Email (SendGrid)**: Urgent notification.
    *   **In-App**: High priority badge alert.
*   **Payload Schema**:
    ```typescript
    interface OperatorWithdrawalFailedPayload {
      email: string;
      ownerName: string;
      companyName: string;
      amountXOF: number;
      bankName: string;
      accountNumberLast4: string;
      transactionId: string;
      reason: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `ACTION REQUIRED: Payout transfer failed`
    *   **Email HTML**:
        ```html
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #fca5a5; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #ef4444; margin-top: 0;">Payout Transfer Failed</h2>
          <p>Hello {{payload.ownerName}},</p>
          <p>The bank transfer request for <strong>{{payload.companyName}}</strong> failed and has been reversed by the banking network.</p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin: 16px 0; font-size: 14px;">
            <p style="margin: 0 0 8px 0; color: #991b1b;">Attempted Amount: <strong>{{payload.amountXOF}} XOF</strong></p>
            <p style="margin: 0 0 8px 0; color: #991b1b;">Reason: "<strong>{{payload.reason}}</strong>"</p>
            <p style="margin: 0; color: #991b1b;">Reconciled Reference: <span style="font-family: monospace;">{{payload.transactionId}}</span></p>
          </div>
          <p style="font-weight: bold; color: #ef4444;">No funds were lost. The gross amount has been credited back to your operator available balance.</p>
          <p style="font-size: 13px; color: #64748b;">Please review your bank credentials at `/dashboard/operator/settings` before requesting another payout.</p>
        </div>
        ```
    *   **In-App Body**: `🚨 Payout of {{payload.amountXOF}} XOF failed: {{payload.reason}}. Funds have been restored to your available balance.`
    *   **In-App Redirect**: `/dashboard/operator/settings`

---

---

### Event 7: `admin-treasury-network-failure`
Sent to platform admins when a payout transfer fails at the Paystack API connection level during initiation.

*   **Trigger Location**: `apps/web/trpc/routers/operator.ts` (inside `requestWithdrawal` catch block when transfer network fails).
*   **Recipient**: Platform Administrators.
*   **Settings**:
    *   `critical: true`.
    *   `severity`: `high`.
*   **Channel Routing**:
    *   **In-App Notification**: Sent to admin dashboard feed.
    *   **Slack Chat**: Novu chat integration pushing an alert to `#treasury-alerts`.
*   **Payload Schema**:
    ```typescript
    interface AdminTreasuryFailurePayload {
      companyName: string;
      amountXOF: number;
      transactionId: string;
      reason: string;
    }
    ```
*   **Copy Mockups**:
    *   **In-App Body**: `🚨 Paystack payout initiation failed! Ledger transaction {{payload.transactionId}} is POSTED but Paystack API failed: {{payload.reason}}. Manual reconciliation required.`
    *   **Slack Body**: `:warning: *Treasury Payout Network Failure* :warning:\nCompany: *{{payload.companyName}}*\nAmount: *{{payload.amountXOF}} XOF*\nLedger TxID: \`{{payload.transactionId}}\`\nReason: *{{payload.reason}}*`

---

### Event 8: `operator-verification-approved`
Sent to operator company owners when platform admins approve their company registration and default bank credentials.

*   **Trigger Location**: `apps/web/trpc/routers/admin.ts` (inside `verifyOperator` mutation).
*   **Recipient**: Operator Owner.
*   **Settings**:
    *   `critical: false`.
*   **Channel Routing**:
    *   **Email (SendGrid)**: Primary. Welcome activation email detailing next operational steps.
    *   **In-App**: Notification feed badge alert.
*   **Payload Schema**:
    ```typescript
    interface OperatorVerificationApprovedPayload {
      email: string;
      ownerName: string;
      companyName: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `Your Moja Ride business verification is approved!`
    *   **Email HTML**:
        ```html
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #ee237c; margin-top: 0;">Verification Approved!</h2>
          <p>Hello {{payload.ownerName}},</p>
          <p>We are excited to inform you that verification for <strong>{{payload.companyName}}</strong> has been approved by the Moja Ride team.</p>
          <p>Your default bank account is verified, and your account status is set to <strong>ACTIVE</strong>. You can now setup departure schedules, sell tickets, and request self-serve withdrawals.</p>
          <a href="https://admin.mojaride.com/dashboard/operator/revenue" 
             style="display: inline-block; background: #ee237c; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
             Open Revenue Dashboard
          </a>
        </div>
        ```
    *   **In-App Body**: `🎉 Verification approved! Your operator profile is now ACTIVE. You can publish schedules and initiate bank payouts.`
    *   **In-App Redirect**: `/dashboard/operator/revenue`

---

### Event 9: `operator-verification-rejected`
Sent to operator company owners when platform admins reject their company registration documents.

*   **Trigger Location**: `apps/web/trpc/routers/admin.ts` (inside `rejectOperator` mutation).
*   **Recipient**: Operator Owner.
*   **Settings**:
    *   `critical: true`.
    *   `severity`: `high`.
*   **Channel Routing**:
    *   **Email (SendGrid)**: Urgent notice showing why they were rejected.
    *   **In-App**: High priority badge alert.
*   **Payload Schema**:
    ```typescript
    interface OperatorVerificationRejectedPayload {
      email: string;
      ownerName: string;
      companyName: string;
      reason: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `ACTION REQUIRED: Business verification rejected`
    *   **Email HTML**:
        ```html
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #fca5a5; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #ef4444; margin-top: 0;">Verification Documents Rejected</h2>
          <p>Hello {{payload.ownerName}},</p>
          <p>The verification documents submitted for <strong>{{payload.companyName}}</strong> were rejected for the following reason:</p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #991b1b;">
            "<strong>{{payload.reason}}</strong>"
          </div>
          <p>Please log in to your dashboard and re-upload valid documents under settings to retry verification.</p>
          <a href="https://admin.mojaride.com/dashboard/operator/settings" 
             style="display: inline-block; background: #ef4444; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; margin-top: 16px;">
             Update Company Documents
          </a>
        </div>
        ```
    *   **In-App Body**: `⚠️ Verification documents rejected: {{payload.reason}}. Please re-upload documents in settings.`
    *   **In-App Redirect**: `/dashboard/operator/settings`
