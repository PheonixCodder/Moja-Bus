# Moja Ride Notification Infrastructure: Admin Lifecycle Events

This document defines the administrative notification architecture, trigger points, payload models, and channel routing instructions across all stages of platform administration, operator verifications, bank account approvals, payouts, and company suspension operations.

---

## 1. Administrative Workflow & Event Triggers

The administrative notification model coordinates interactions between **Platform Admins** and **Transport Operators/Travelers**:

```
[Operator Signup] ──► PENDING_VERIFICATION ──► admin-operator-signup-pending (Email/In-App)
                                                     │
                                           ┌─────────┴─────────┐
                                           ▼                   ▼
                                       [Approve]           [Reject]
                                           │                   │
                                           ▼                   ▼
                           operator-verification-approved  operator-verification-rejected

[Add Bank Account] ──► PENDING_VERIFY ────► admin-bank-account-pending (Email/In-App)
                                                     │
                                           ┌─────────┴─────────┐
                                           ▼                   ▼
                                       [Approve]           [Reject]
                                           │                   │
                                           ▼                   ▼
                                  operator-bank-verified   operator-bank-rejected

[Company Operations] ─────────────────────► [Suspended] ──────► operator-account-suspended
                                           └► [Reactivated] ──► operator-account-restored
```

---

## 2. Notification Event Specifications (Targeting Platform Admins)

---

### Event 1: `admin-operator-signup-pending`
Triggered immediately when a transport operator completes onboarding and uploads documents for verification.

*   **Recipient**: Platform Administrators (`role: ADMIN`).
*   **Settings**:
    *   `critical: true`.
*   **Channel Routing**:
    *   **In-App**: Real-time admin dashboard notification feed.
    *   **Email**: Core notification containing verification document links.
*   **Payload Schema**:
    ```typescript
    interface AdminOperatorSignupPendingPayload {
      adminEmail: string;
      companyId: string;
      companyName: string;
      ownerName: string;
      ownerPhone: string;
      submittedAt: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `Action Required: Verification Pending for {{payload.companyName}}`
    *   **In-App Body**: `🆕 Company {{payload.companyName}} submitted verification documents. Review pending.`
    *   **In-App Redirect**: `/dashboard/admin/verification`

---

### Event 2: `admin-bank-account-pending`
Triggered when an operator registers a new bank account requiring platform approval and Paystack transfer recipient mapping.

*   **Recipient**: Platform Administrators.
*   **Settings**:
    *   `critical: true`.
*   **Channel Routing**:
    *   **In-App**: Actionable badge on Bank Accounts review queue.
*   **Payload Schema**:
    ```typescript
    interface AdminBankAccountPendingPayload {
      adminEmail: string;
      companyName: string;
      bankName: string;
      accountName: string;
      accountNumberHidden: string; // E.g., "******1234"
      bankAccountId: string;
    }
    ```
*   **Copy Mockups**:
    *   **In-App Body**: `🏦 Bank account verification requested by {{payload.companyName}} ({{payload.bankName}} - {{payload.accountNumberHidden}}).`
    *   **In-App Redirect**: `/dashboard/admin/verification`

---

### Event 3: `admin-payout-failed`
Sent when a manual payout resolution or automated Paystack transfer fails due to invalid parameters or API errors.

*   **Recipient**: Platform Administrators.
*   **Settings**:
    *   `critical: true`.
*   **Channel Routing**:
    *   **Email**: Instant warning.
    *   **In-App**: Dashboard alert.
*   **Payload Schema**:
    ```typescript
    interface AdminPayoutFailedPayload {
      adminEmail: string;
      transactionId: string;
      companyName: string;
      amountXOF: number;
      errorCode: string;
      errorMessage: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `CRITICAL: Payout failed for {{payload.companyName}} - {{payload.amountXOF}} XOF`
    *   **In-App Body**: `❌ Payout of {{payload.amountXOF}} XOF failed for {{payload.companyName}}. Error: {{payload.errorMessage}}.`
    *   **In-App Redirect**: `/dashboard/admin/withdrawals`

---

### Event 4: `admin-treasury-limit-warning`
Sent when clearing accounts or unified treasury reports indicate low Paystack account balances.

*   **Recipient**: Platform Administrators.
*   **Settings**:
    *   `critical: true`.
*   **Channel Routing**:
    *   **Email**: Critical alert.
*   **Payload Schema**:
    ```typescript
    interface AdminTreasuryLimitWarningPayload {
      adminEmail: string;
      currentBalanceXOF: number;
      minimumThresholdXOF: number;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `WARNING: Platform Paystack Balance Below Threshold`
    *   **Email HTML**:
        ```html
        <div style="font-family: Arial, sans-serif; border: 1px solid #ef4444; border-radius: 12px; padding: 24px; color: #7f1d1d;">
          <h2 style="color: #ef4444; margin-top: 0;">Treasury Balance Alert</h2>
          <p>The unified Paystack treasury account balance has dropped below the configured warning threshold.</p>
          <p>Current Balance: <strong>{{payload.currentBalanceXOF}} XOF</strong></p>
          <p>Threshold Limit: <strong>{{payload.minimumThresholdXOF}} XOF</strong></p>
        </div>
        ```

---

## 3. Notification Event Specifications (Targeting Operators, Triggered by Admin Action)

---

### Event 5: `operator-bank-verified`
Sent when an admin successfully approves a bank account and establishes Paystack Transfer Recipient mappings.

*   **Recipient**: Operator Owners.
*   **Settings**:
    *   `critical: false`.
*   **Channel Routing**:
    *   **Email**: Official notice.
    *   **In-App**: Banner alert.
*   **Payload Schema**:
    ```typescript
    interface OperatorBankVerifiedPayload {
      email: string;
      ownerName: string;
      companyName: string;
      bankName: string;
      accountNumberHidden: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `Bank Account Verified - {{payload.companyName}}`
    *   **In-App Body**: `✅ Bank account {{payload.bankName}} ({{payload.accountNumberHidden}}) verified successfully. You can now request payouts to this account.`
    *   **In-App Redirect**: `/dashboard/operator/settings`

---

### Event 6: `operator-bank-rejected`
Sent when bank account information fails validation (e.g. business name mismatch).

*   **Recipient**: Operator Owners.
*   **Settings**:
    *   `critical: true`.
*   **Channel Routing**:
    *   **Email**: Immediate update.
    *   **In-App**: Status warning.
*   **Payload Schema**:
    ```typescript
    interface OperatorBankRejectedPayload {
      email: string;
      ownerName: string;
      companyName: string;
      bankName: string;
      accountNumberHidden: string;
      reason: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `Bank Account Rejected - {{payload.companyName}}`
    *   **In-App Body**: `❌ Bank account validation failed for {{payload.bankName}} ({{payload.accountNumberHidden}}). Reason: {{payload.reason}}.`
    *   **In-App Redirect**: `/dashboard/operator/settings`

---

### Event 7: `operator-account-suspended`
Sent immediately when a company account is suspended by platform administration.

*   **Recipient**: All company operators.
*   **Settings**:
    *   `critical: true` (suspends login and bookings).
*   **Channel Routing**:
    *   **Email**: Primary notification.
    *   **SMS**: Verification notice.
*   **Payload Schema**:
    ```typescript
    interface OperatorAccountSuspendedPayload {
      email: string;
      operatorName: string;
      companyName: string;
      phone?: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `URGENT: Moja Ride Operator Account Suspended`
    *   **SMS Text**: `Moja Ride: Account for {{payload.companyName}} has been suspended. All scheduling and sales are offline. Contact support.`

---

### Event 8: `operator-account-restored`
Sent when a company is reactivated/restored to status ACTIVE.

*   **Recipient**: Operator Owners.
*   **Settings**:
    *   `critical: true`.
*   **Channel Routing**:
    *   **Email**: Welcome back message.
    *   **In-App**: Reactivated welcome toast.
*   **Payload Schema**:
    ```typescript
    interface OperatorAccountRestoredPayload {
      email: string;
      ownerName: string;
      companyName: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `Your Moja Ride Operator Account is Reactivated`
    *   **In-App Body**: `🎉 Welcome back! {{payload.companyName}} account is reactivated. Routes and scheduling are online.`
    *   **In-App Redirect**: `/dashboard/operator`

---

### Event 9: `operator-withdrawal-resolved`
Sent when an administrator manually updates a pending withdrawal to completed or failed status.

*   **Recipient**: Operator Owners.
*   **Settings**:
    *   `critical: true`.
*   **Channel Routing**:
    *   **Email**: Receipt.
    *   **In-App**: Status update.
*   **Payload Schema**:
    ```typescript
    interface OperatorWithdrawalResolvedPayload {
      email: string;
      ownerName: string;
      companyName: string;
      transactionId: string;
      amountXOF: number;
      status: "SETTLED" | "FAILED";
      reason: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `Withdrawal status updated: {{payload.status}}`
    *   **In-App Body**: `💸 Payout of {{payload.amountXOF}} XOF marked as {{payload.status}} by platform admin. Note: {{payload.reason}}.`
    *   **In-App Redirect**: `/dashboard/operator/revenue`

---

### Event 10: `user-role-updated`
Sent when a platform administrator modifies a user's system role (e.g. promoting a TRAVELER to ADMIN or OPERATOR).

*   **Recipient**: Updated User.
*   **Settings**:
    *   `critical: true` (security and access alert).
*   **Channel Routing**:
    *   **Email**: Primary notification.
    *   **In-App**: Status banner badge.
*   **Payload Schema**:
    ```typescript
    interface UserRoleUpdatedPayload {
      email: string;
      userName: string;
      newRole: "TRAVELER" | "OPERATOR" | "ADMIN";
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `Security Alert: Your Moja Ride role has changed`
    *   **In-App Body**: `🔑 Security: Your account privilege has been updated to {{payload.newRole}}. Log out and log back in to apply.`
    *   **In-App Redirect**: `/dashboard`
