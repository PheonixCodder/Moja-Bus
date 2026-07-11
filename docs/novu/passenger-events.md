# Moja Ride Notification Infrastructure: Passenger Lifecycle Events

This document defines the comprehensive passenger notification architecture, trigger points, payload models, and channel routing instructions across all stages of the passenger lifecycle (holds, checkouts, tickets, wallet, profile changes, and reviews).

---

## 1. Passenger Lifecycle & Event Triggers

The passenger's interaction with Moja Ride progresses through a transaction and travel lifecycle. Triggers are wired directly into database mutations and services:

```
[Search & Select] ──► Create Hold ──► passenger-hold-created (In-App + SMS Alert)
                             │
                  ┌──────────┴──────────┐
                  ▼                     ▼
          [Finalize Payment]     [Hold Expires]
                  │                     │
                  ▼                     ▼
     passenger-booking-confirmed  (Auto Released)
                  │
         ┌────────┴────────┐
         ▼                 ▼
   [Travel Day]     [Passenger Cancel]
         │                 │
         ▼                 ▼
  Boarding / Arrived  passenger-booking-refunded
         │
         ▼
  passenger-review-request ──► Submit Review ──► passenger-review-submitted
```

---

## 2. Notification Event Specifications

---

### Event 1: `passenger-hold-created`
Sent immediately when a passenger reserves one or more seats, initiating the 10-minute hold window.

*   **Recipient**: Passenger.
*   **Settings**:
    *   `critical: true` (time-sensitive reservation window).
*   **Channel Routing**:
    *   **In-App**: Real-time ticker banner displaying the 10-minute countdown.
    *   **SMS**: Triggers immediately if guest checkout is initiated with a phone number.
*   **Payload Schema**:
    ```typescript
    interface PassengerHoldCreatedPayload {
      email: string;
      passengerName: string;
      originCity: string;
      destinationCity: string;
      departureTime: string;
      holdId: string;
      expiresAt: string; // ISO string or format "10:15 AM"
      totalAmountXOF: number;
      phone?: string;
    }
    ```
*   **Copy Mockups**:
    *   **SMS Text**: `Moja Ride: Seats reserved for your trip {{payload.originCity}} -> {{payload.destinationCity}} ({{payload.departureTime}}). Complete payment of {{payload.totalAmountXOF}} XOF before {{payload.expiresAt}} to confirm.`
    *   **In-App Body**: `⏱️ Seats held! You have until {{payload.expiresAt}} to complete checkout for {{payload.destinationCity}}.`
    *   **In-App Redirect**: `/book/{{payload.holdId}}`

---

### Event 2: `passenger-booking-confirmed`
Sent upon successful checkout (Card, Mobile Money, or Wallet balance payment) to issue the digital tickets and QR tokens.

*   **Recipient**: Passenger.
*   **Settings**:
    *   `critical: true`.
*   **Channel Routing**:
    *   **Email (SendGrid)**: Primary. Contains a formal PDF/HTML receipt, receipt breakdowns, and the ticket reference.
    *   **In-App**: Actionable dashboard notification feed badge.
    *   **SMS (Twilio)**: Primary if booked as guest or selected in preferences.
*   **Payload Schema**:
    ```typescript
    interface PassengerBookingConfirmedPayload {
      email: string;
      passengerName: string;
      bookingReference: string;
      originCity: string;
      destinationCity: string;
      departureTime: string;
      seatLabels: string[];
      totalAmountXOF: number;
      phone?: string;
    }
    ```
*   **Copy Mockups**:
    *   **SMS Text**: `Moja Ride: Ticket CONFIRMED! Ref: {{payload.bookingReference}} for trip to {{payload.destinationCity}} on {{payload.departureTime}}. Seats: {{payload.seatLabels | join: ', '}}. Show QR code at boarding.`
    *   **Email Subject**: `Your Moja Ride Ticket Confirmation - {{payload.bookingReference}}`
    *   **Email HTML**:
        ```html
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #ee237c; border-radius: 16px; padding: 24px; color: #1e293b;">
          <h2 style="color: #ee237c; margin-top: 0;">Ticket Confirmation</h2>
          <p>Hello {{payload.passengerName}},</p>
          <p>Your payment was successful! Your booking is now confirmed.</p>
          <div style="background: #f8fafc; padding: 16px; border-radius: 8px; margin: 16px 0; font-size: 14px;">
            <p style="margin: 0 0 8px 0;">Booking Reference: <strong>{{payload.bookingReference}}</strong></p>
            <p style="margin: 0 0 8px 0;">Trip: <strong>{{payload.originCity}} to {{payload.destinationCity}}</strong></p>
            <p style="margin: 0 0 8px 0;">Departure: <strong>{{payload.departureTime}}</strong></p>
            <p style="margin: 0 0 8px 0;">Seats: <strong>{{payload.seatLabels | join: ', '}}</strong></p>
            <p style="margin: 0;">Total Paid: <strong>{{payload.totalAmountXOF}} XOF</strong></p>
          </div>
          <p style="font-size: 13px; color: #64748b; line-height: 1.5;">Please present your digital QR code at the origin terminal to scan and check in.</p>
        </div>
        ```
    *   **In-App Body**: `✅ Booking {{payload.bookingReference}} confirmed for trip to {{payload.destinationCity}}.`
    *   **In-App Redirect**: `/dashboard/tickets`

---

### Event 3: `passenger-booking-refunded`
Sent when a passenger requests a cancellation before departure, detailing returned funds.

*   **Recipient**: Passenger.
*   **Settings**:
    *   `critical: true`.
*   **Channel Routing**:
    *   **Email (SendGrid)**: Official cancellation receipt.
    *   **In-App**: Notification feed badge.
*   **Payload Schema**:
    ```typescript
    interface PassengerBookingRefundedPayload {
      email: string;
      passengerName: string;
      bookingReference: string;
      refundAmountXOF: number;
      channel: string;
      reason: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `Refund Issued: Booking {{payload.bookingReference}}`
    *   **In-App Body**: `💸 Refund of {{payload.refundAmountXOF}} XOF issued to your {{payload.channel}} for booking {{payload.bookingReference}}.`
    *   **In-App Redirect**: `/dashboard/wallet`

---

### Event 4: `passenger-wallet-topup`
Sent immediately when a passenger completes a wallet deposit via card or Mobile Money.

*   **Recipient**: Wallet Owner.
*   **Settings**:
    *   `critical: false`.
*   **Channel Routing**:
    *   **Email (SendGrid)**: Receipt of deposit.
    *   **In-App**: Balance update notification badge.
*   **Payload Schema**:
    ```typescript
    interface PassengerWalletTopupPayload {
      email: string;
      passengerName: string;
      amountXOF: number;
      newBalanceXOF: number;
      reference: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `Wallet Top-Up Successful`
    *   **In-App Body**: `💰 Wallet top-up of {{payload.amountXOF}} XOF succeeded. New balance: {{payload.newBalanceXOF}} XOF.`
    *   **In-App Redirect**: `/dashboard/wallet`

---

### Event 5: `passenger-wallet-low-balance`
Sent when checkout fails due to insufficient balance, reminding them to reload.

*   **Recipient**: Passenger.
*   **Settings**:
    *   `critical: false`.
*   **Channel Routing**:
    *   **In-App**: Urgent topbar warning drawer.
*   **Payload Schema**:
    ```typescript
    interface PassengerWalletLowBalancePayload {
      email: string;
      passengerName: string;
      availableBalanceXOF: number;
      requiredAmountXOF: number;
    }
    ```
*   **Copy Mockups**:
    *   **In-App Body**: `⚠️ Insufficient Wallet Balance! Your booking requires {{payload.requiredAmountXOF}} XOF. You only have {{payload.availableBalanceXOF}} XOF available.`
    *   **In-App Redirect**: `/dashboard/wallet`

---

### Event 6: `passenger-review-submitted`
Sent to confirm review submission and thank passengers for providing feedback.

*   **Recipient**: Passenger.
*   **Settings**:
    *   `critical: false`.
*   **Channel Routing**:
    *   **In-App**: Notification feed confirmation.
    *   **Email**: Optional feedback receipt.
*   **Payload Schema**:
    ```typescript
    interface PassengerReviewSubmittedPayload {
      email: string;
      passengerName: string;
      companyName: string;
      rating: number;
      content?: string;
    }
    ```
*   **Copy Mockups**:
    *   **In-App Body**: `❤️ Thank you for your {{payload.rating}}-star review of {{payload.companyName}}! Your feedback helps us keep the ride safe.`
    *   **In-App Redirect**: `/dashboard/bookings`

---

### Event 7: `passenger-profile-updated`
Sent when critical profile configurations (phone number, email address, password) are changed.

*   **Recipient**: Profile Owner.
*   **Settings**:
    *   `critical: true` (security update).
*   **Channel Routing**:
    *   **Email**: Notification of setting adjustments.
    *   **SMS**: Secondary verification alert.
*   **Payload Schema**:
    ```typescript
    interface PassengerProfileUpdatedPayload {
      email: string;
      passengerName: string;
      changedFields: string[];
      phone?: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `Security Alert: Your Moja Ride profile was updated`
    *   **SMS Text**: `Moja Ride Alert: Profile updates ({{payload.changedFields | join: ', '}}) were applied to your account. If this wasn't you, contact support.`

---

### Event 8: `passenger-ticket-shared`
Sent to notify a recipient when a ticket is shared/transferred to them.

*   **Recipient**: Ticket Recipient.
*   **Settings**:
    *   `critical: true`.
*   **Channel Routing**:
    *   **SMS**: Primary channel for receiving ticket links.
    *   **Email**: Secondary.
*   **Payload Schema**:
    ```typescript
    interface PassengerTicketSharedPayload {
      email: string;
      passengerName: string;
      senderName: string;
      originCity: string;
      destinationCity: string;
      departureTime: string;
      ticketToken: string;
      phone?: string;
    }
    ```
*   **Copy Mockups**:
    *   **SMS Text**: `Moja Ride: {{payload.senderName}} shared a bus ticket to {{payload.destinationCity}} ({{payload.departureTime}}) with you! View ticket here: https://mojaride.com/tickets/{{payload.ticketToken}}`
