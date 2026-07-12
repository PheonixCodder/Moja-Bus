# Moja Ride Novu Notifications Infrastructure: Overview

This document provides a comprehensive dashboard mapping all **30 notification workflows** integrated across the Moja Ride application. It details the active channels (In-App, Email, SMS), recipient roles, provider services, trigger files, and verification states.

---

## 1. Notification Matrix by Concern

| Category | Workflow ID (Bridge Key) | Channels | Providers | Recipient Role | Trigger Source |
| :--- | :--- | :---: | :--- | :--- | :--- |
| **Authentication & Invites** | [`auth-otp`](/apps/web/features/notifications/workflows/auth/auth-otp.ts) | SMS, Email | Twilio, SendGrid | Traveler / Operator | [`lib/auth-email.ts`](/apps/web/lib/auth-email.ts) |
| | [`operator-signup-otp`](/apps/web/features/notifications/workflows/auth/operator-signup-otp.ts) | SMS, Email | Twilio, SendGrid | Owner | [`trpc/routers/operator.ts`](/apps/web/trpc/routers/operator.ts) |
| | [`operator-welcome`](/apps/web/features/notifications/workflows/auth/operator-welcome.ts) | Email, In-App | SendGrid, Feed | Owner / Manager | [`trpc/routers/operator.ts`](/apps/web/trpc/routers/operator.ts) |
| | [`operator-staff-invite`](/apps/web/features/notifications/workflows/staff/operator-staff-invite.ts) | SMS, Email | Twilio, SendGrid | Driver / Dispatcher / Manager | [`trpc/routers/staff.ts`](/apps/web/trpc/routers/staff.ts) |
| | [`staff-acceptance-alert`](/apps/web/features/notifications/workflows/staff/staff-acceptance-alert.ts) | Email, In-App | SendGrid, Feed | Owner / Manager | [`trpc/routers/invitation.ts`](/apps/web/trpc/routers/invitation.ts) |
| **Payments & Ledger** | [`passenger-booking-confirmed`](/apps/web/features/notifications/workflows/payments/booking-confirmed.ts) | Email, In-App, SMS | SendGrid, Feed, Twilio | Booking Payer | [`booking-receipt-email.ts`](/apps/web/features/payments/services/booking-receipt-email.ts) |
| | [`passenger-booking-refunded`](/apps/web/features/notifications/workflows/payments/booking-refunded.ts) | Email, In-App | SendGrid, Feed | Booking Payer | [`cancellation-service.ts`](/apps/web/features/payments/services/cancellation-service.ts) |
| | [`passenger-wallet-topup`](/apps/web/features/notifications/workflows/payments/wallet-topup.ts) | Email, In-App | SendGrid, Feed | Wallet Owner | [`payment-service.ts`](/apps/web/features/payments/payment-service.ts) |
| | [`operator-withdrawal-requested`](/apps/web/features/notifications/workflows/payments/withdrawal-requested.ts) | Email, In-App | SendGrid, Feed | Owner | [`trpc/routers/operator.ts`](/apps/web/trpc/routers/operator.ts) |
| | [`operator-withdrawal-settled`](/apps/web/features/notifications/workflows/payments/withdrawal-settled.ts) | Email, In-App | SendGrid, Feed | Owner | [`payment-service.ts`](/apps/web/features/payments/payment-service.ts) |
| | [`operator-withdrawal-failed`](/apps/web/features/notifications/workflows/payments/withdrawal-failed.ts) | Email, In-App | SendGrid, Feed | Owner | [`payment-service.ts`](/apps/web/features/payments/payment-service.ts) |
| | [`operator-verification-approved`](/apps/web/features/notifications/workflows/payments/operator-verification-approved.ts) | Email, In-App | SendGrid, Feed | Owner | [`trpc/routers/admin.ts`](/apps/web/trpc/routers/admin.ts) |
| | [`operator-verification-rejected`](/apps/web/features/notifications/workflows/payments/operator-verification-rejected.ts) | Email, In-App | SendGrid, Feed | Owner | [`trpc/routers/admin.ts`](/apps/web/trpc/routers/admin.ts) |
| **Operator Operations** | [`passenger-trip-delayed`](/apps/web/features/notifications/workflows/operator/trip-delayed.ts) | SMS, Email, In-App | Twilio, SendGrid, Feed | Booked Passenger | [`trpc/routers/trips.ts`](/apps/web/trpc/routers/trips.ts) |
| | [`passenger-trip-cancelled`](/apps/web/features/notifications/workflows/operator/trip-cancelled.ts) | SMS, Email, In-App | Twilio, SendGrid, Feed | Booked Passenger | [`trpc/routers/trips.ts`](/apps/web/trpc/routers/trips.ts) |
| | [`passenger-trip-boarding`](/apps/web/features/notifications/workflows/operator/trip-boarding.ts) | SMS, In-App | Twilio, Feed | Booked Passenger | [`trpc/routers/trips.ts`](/apps/web/trpc/routers/trips.ts) |
| | [`passenger-trip-gate-updated`](/apps/web/features/notifications/workflows/operator/trip-gate-updated.ts) | SMS, In-App | Twilio, Feed | Booked Passenger | [`trpc/routers/trips.ts`](/apps/web/trpc/routers/trips.ts) |
| | [`operator-bus-assigned`](/apps/web/features/notifications/workflows/operator/bus-assigned.ts) | Email, In-App | SendGrid, Feed | Driver / Manager | [`trpc/routers/trips.ts`](/apps/web/trpc/routers/trips.ts) |
| | [`passenger-review-request`](/apps/web/features/notifications/workflows/operator/review-request.ts) | SMS, In-App | Twilio, Feed | Booked Passenger | [`trpc/routers/trips.ts`](/apps/web/trpc/routers/trips.ts) |
| **Passenger Lifecycle** | [`passenger-hold-created`](/apps/web/features/notifications/workflows/passenger/hold-created.ts) | In-App, SMS | Feed, Twilio | Traveler | [`trpc/routers/booking.ts`](/apps/web/trpc/routers/booking.ts) |
| | [`passenger-wallet-low-balance`](/apps/web/features/notifications/workflows/passenger/wallet-low-balance.ts) | In-App | Feed | Traveler | [`booking-confirmation-service.ts`](/apps/web/features/payments/services/booking-confirmation-service.ts) |
| | [`passenger-review-submitted`](/apps/web/features/notifications/workflows/passenger/review-submitted.ts) | In-App | Feed | Traveler | [`trpc/routers/passenger.ts`](/apps/web/trpc/routers/passenger.ts) |
| | [`passenger-profile-updated`](/apps/web/features/notifications/workflows/passenger/profile-updated.ts) | Email, SMS | SendGrid, Twilio | Traveler | [`trpc/routers/passenger.ts`](/apps/web/trpc/routers/passenger.ts) |
| | [`passenger-ticket-shared`](/apps/web/features/notifications/workflows/passenger/ticket-shared.ts) | SMS, Email | Twilio, SendGrid | Ticket Recipient | [`trpc/routers/booking.ts`](/apps/web/trpc/routers/booking.ts) |
| **Platform Administration**| [`admin-treasury-network-failure`](/apps/web/features/notifications/workflows/admin/admin-treasury-network-failure.ts) | Email, In-App | SendGrid, Feed | Platform Admin | [`trpc/routers/operator.ts`](/apps/web/trpc/routers/operator.ts) |
| | [`admin-operator-signup-pending`](/apps/web/features/notifications/workflows/admin/operator-signup-pending.ts) | In-App, Email | Feed, SendGrid | Platform Admin | [`trpc/routers/operator.ts`](/apps/web/trpc/routers/operator.ts) |
| | [`admin-bank-account-pending`](/apps/web/features/notifications/workflows/admin/bank-account-pending.ts) | In-App | Feed | Platform Admin | [`trpc/routers/operator.ts`](/apps/web/trpc/routers/operator.ts) |
| | [`admin-payout-failed`](/apps/web/features/notifications/workflows/admin/payout-failed.ts) | In-App, Email | Feed, SendGrid | Platform Admin | [`trpc/routers/admin.ts`](/apps/web/trpc/routers/admin.ts) |
| | [`operator-bank-verified`](/apps/web/features/notifications/workflows/admin/bank-verified.ts) | In-App, Email | Feed, SendGrid | Owner | [`trpc/routers/admin.ts`](/apps/web/trpc/routers/admin.ts) |
| | [`operator-bank-rejected`](/apps/web/features/notifications/workflows/admin/bank-rejected.ts) | In-App, Email | Feed, SendGrid | Owner | [`trpc/routers/admin.ts`](/apps/web/trpc/routers/admin.ts) |
| | [`operator-account-suspended`](/apps/web/features/notifications/workflows/admin/account-suspended.ts) | Email, SMS | SendGrid, Twilio | Operators & Staff | [`trpc/routers/admin.ts`](/apps/web/trpc/routers/admin.ts) |
| | [`operator-account-restored`](/apps/web/features/notifications/workflows/admin/account-restored.ts) | In-App, Email | Feed, SendGrid | Owner | [`trpc/routers/admin.ts`](/apps/web/trpc/routers/admin.ts) |
| | [`operator-withdrawal-resolved`](/apps/web/features/notifications/workflows/admin/withdrawal-resolved.ts) | In-App, Email | Feed, SendGrid | Owner | [`trpc/routers/admin.ts`](/apps/web/trpc/routers/admin.ts) |
| | [`user-role-updated`](/apps/web/features/notifications/workflows/admin/user-role-updated.ts) | In-App, Email | Feed, SendGrid | User | [`trpc/routers/admin.ts`](/apps/web/trpc/routers/admin.ts) |

---

## 2. Integrated Provider Details

### A. In-App Notifications
*   **Provider**: Novu In-App Inbox Component.
*   **Delivery Channel**: Real-time WebSocket connection to Novu Cloud. Displays directly in user header navigation dropdowns.
*   **Payload Features**: Actionable redirect links (e.g., routing drivers straight to updated trip details, passengers to their wallet balances).

### B. Email Receipts & Notices
*   **Provider**: SendGrid (using dynamic templates and custom inline HTML blocks).
*   **Delivery Channel**: SMTP/API delivery via SendGrid.
*   **Content Types**: Dynamic HTML receipts, boarding passes containing travel summaries, and security notifications.

### C. SMS Mobile Warnings
*   **Provider**: Twilio SMS.
*   **Delivery Channel**: Global carrier routing (focus on West African formats for Mobile Money coordination).
*   **Content Types**: Urgent operational notifications (e.g., OTP codes, 10-minute hold warnings, delay announcements).

---

## 3. Reference Documentation Files

For in-depth descriptions of schemas, triggers, payload configurations, copy mockups, and routing preferences, see:

1.  **[Authentication & Staff Invites](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/docs/novu/auth-events.md)**: Accounts setup, MFA verification, and staff registrations.
2.  **[Payments, Wallets & Receipts](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/docs/novu/payment-events.md)**: Paystack billing, ledger checks, withdrawals, and bank codes.
3.  **[Operator Trip Dispatch](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/docs/novu/operator-events.md)**: Live dispatcher adjustments and traveler delays.
4.  **[Passenger Lifecycle](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/docs/novu/passenger-events.md)**: Cart checkout thresholds, seat holds, profiles, and shares.
5.  **[Platform Administration](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/docs/novu/admin-events.md)**: KYC validation approvals, treasury balancing warnings, and user promotional alerts.
