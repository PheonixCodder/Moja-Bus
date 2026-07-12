# Moja Ride Notification Infrastructure: Operator & Dispatch Board Events

This document outlines the complete notification strategy, triggers, payload specifications, and channel routing rules for all operator-driven actions, dispatch board updates, and passenger trip alerts.

---

## 1. Operator Portal & Dispatch Board Architecture

The Operator Portal (`apps/web/app/dashboard/operator`) and Dispatch Board (`operator-trips-view.tsx`) allow operators to control departures, assign fleet, and handle schedules in real time:

```
     [Operator Dispatch Action]
                 │
                 ├──► Delay Departure  ─────► passenger-trip-delayed (SMS + Email + InApp)
                 ├──► Cancel Departure ─────► passenger-trip-cancelled (SMS + Email + InApp)
                 ├──► Begin Boarding   ─────► passenger-trip-boarding (SMS + InApp)
                 ├──► Assign Gate      ─────► passenger-trip-gate-updated (SMS + InApp)
                 └──► Assign Bus/Driver ────► operator-bus-assigned (SMS + InApp)
```

### Event Triggers
1.  **Trip Delayed**: Triggered inside `delay` mutation in [`trips.ts`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/trpc/routers/trips.ts#L317) when an operator delays a trip.
2.  **Trip Cancelled**: Triggered inside `cancel` mutation in [`trips.ts`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/trpc/routers/trips.ts#L368) when an operator cancels a scheduled departure.
3.  **Boarding Commenced**: Triggered inside `updateStatus` mutation in [`trips.ts`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/trpc/routers/trips.ts#L391) when status transitions to `BOARDING`.
4.  **Gate Assigned/Updated**: Triggered inside `setGate` mutation in [`trips.ts`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/trpc/routers/trips.ts#L444) when a terminal boarding gate is configured.
5.  **Bus Swapped/Assigned**: Triggered inside `assignBusDriver` mutation in [`trips.ts`](file:///C:/Users/ubaid/OneDrive/Desktop/moja-buss/apps/web/trpc/routers/trips.ts#L211) when a vehicle is assigned or updated for a departure.

---

## 2. Notification Event Specifications

---

### Event 1: `passenger-trip-delayed`
Sent immediately to all confirmed passengers on a trip when the operator delays the departure.

*   **Recipient**: Passenger (traveler with a confirmed booking).
*   **Settings**:
    *   `critical: true` (time-sensitive departure updates).
*   **Channel Routing**:
    *   **SMS (Twilio)**: Primary (highest priority). Essential because travelers are on their way to or waiting at the terminal, often without active mobile data.
    *   **In-App**: Real-time push alert within passenger dashboard.
    *   **Email (SendGrid)**: Confirmation of schedule adjustment.
*   **Payload Schema**:
    ```typescript
    interface PassengerTripDelayedPayload {
      email: string;
      passengerName: string;
      originCity: string;
      destinationCity: string;
      originalTime: string;
      newTime: string;
      delayMinutes: number;
      gate: string | null;
      phone?: string;
    }
    ```
*   **Copy Mockups**:
    *   **SMS Text**: `Moja Ride Alert: Your trip from {{payload.originCity}} to {{payload.destinationCity}} (scheduled for {{payload.originalTime}}) is delayed by {{payload.delayMinutes}} mins. New departure time: {{payload.newTime}}. {% if payload.gate %}Please board at Gate {{payload.gate}}.{% endif %}`
    *   **Email Subject**: `Trip Update: Your departure is delayed`
    *   **Email HTML**:
        ```html
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #fcd34d; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #d97706; margin-top: 0;">Trip Schedule Update</h2>
          <p>Hello {{payload.passengerName}},</p>
          <p>The operator has delayed the departure for your upcoming trip from <strong>{{payload.originCity}} to {{payload.destinationCity}}</strong>.</p>
          <div style="background: #fef3c7; border-left: 4px solid #d97706; padding: 16px; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #92400e;">
            <p style="margin: 0 0 8px 0;">Delay Duration: <strong>{{payload.delayMinutes}} minutes</strong></p>
            <p style="margin: 0 0 8px 0;">Original Departure: <strong>{{payload.originalTime}}</strong></p>
            <p style="margin: 0 0 8px 0;">New Estimated Departure: <strong>{{payload.newTime}}</strong></p>
            {% if payload.gate %}
              <p style="margin: 0;">Boarding Gate: <strong>Gate {{payload.gate}}</strong></p>
            {% endif %}
          </div>
          <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">Please adjust your travel plans accordingly. Arrive at the gate at least 15 minutes before the new departure time.</p>
        </div>
        ```
    *   **In-App Body**: `⚠️ Trip to {{payload.destinationCity}} delayed by {{payload.delayMinutes}}m. New departure: {{payload.newTime}}.`
    *   **In-App Redirect**: `/dashboard/tickets`

---

### Event 2: `passenger-trip-cancelled`
Sent to all confirmed passengers on a trip if the operator cancels the scheduled departure.

*   **Recipient**: Passenger.
*   **Settings**:
    *   `critical: true`.
    *   `severity`: `high`.
*   **Channel Routing**:
    *   **SMS (Twilio)**: Primary (highest priority). Urgent cancellation alert.
    *   **Email (SendGrid)**: Official cancellation receipt detailing automated refund actions.
    *   **In-App**: Urgent alert banner in passenger feed.
*   **Payload Schema**:
    ```typescript
    interface PassengerTripCancelledPayload {
      email: string;
      passengerName: string;
      originCity: string;
      destinationCity: string;
      departureTime: string;
      cancelReason: string;
      refundAmountXOF: number;
      phone?: string;
    }
    ```
*   **Copy Mockups**:
    *   **SMS Text**: `Moja Ride URGENT: Trip from {{payload.originCity}} to {{payload.destinationCity}} ({{payload.departureTime}}) has been CANCELLED due to: {{payload.cancelReason}}. {{payload.refundAmountXOF}} XOF has been refunded to your wallet.`
    *   **Email Subject**: `URGENT: Your trip has been cancelled`
    *   **Email HTML**:
        ```html
        <div style="font-family: Arial, sans-serif; max-width: 500px; margin: 0 auto; border: 1px solid #fca5a5; border-radius: 12px; padding: 24px; color: #1e293b;">
          <h2 style="color: #ef4444; margin-top: 0;">Trip Cancellation Notice</h2>
          <p>Hello {{payload.passengerName}},</p>
          <p>We regret to inform you that your upcoming trip from <strong>{{payload.originCity}} to {{payload.destinationCity}}</strong> scheduled for <strong>{{payload.departureTime}}</strong> has been cancelled by the transport operator.</p>
          <div style="background: #fef2f2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 4px; margin: 16px 0; font-size: 14px; color: #991b1b;">
            <p style="margin: 0 0 8px 0;">Reason for Cancellation: <strong>"{{payload.cancelReason}}"</strong></p>
            <p style="margin: 0;">Refund Amount: <strong>{{payload.refundAmountXOF}} XOF</strong></p>
          </div>
          <p style="font-weight: bold; color: #ef4444;">A full refund has been credited back to your internal Passenger Wallet balance.</p>
          <p style="font-size: 13px; color: #64748b; margin-bottom: 0;">If you have any questions or need to book a replacement trip, please visit the Moja Ride dashboard.</p>
        </div>
        ```
    *   **In-App Body**: `🚨 Trip to {{payload.destinationCity}} ({{payload.departureTime}}) was CANCELLED: {{payload.cancelReason}}. Balance refunded.`
    *   **In-App Redirect**: `/dashboard/wallet`

---

### Event 3: `passenger-trip-boarding`
Sent to checked-in and confirmed passengers when status transitions to `BOARDING`.

*   **Recipient**: Passenger.
*   **Settings**:
    *   `critical: true`.
*   **Channel Routing**:
    *   **SMS (Twilio)**: Real-time boarding alert (highly time-critical).
    *   **In-App**: Real-time push alert.
*   **Payload Schema**:
    ```typescript
    interface PassengerTripBoardingPayload {
      email: string;
      passengerName: string;
      destinationCity: string;
      gate: string | null;
      busPlate: string | null;
      phone?: string;
    }
    ```
*   **Copy Mockups**:
    *   **SMS Text**: `Moja Ride Boarding: Boarding has started for your trip to {{payload.destinationCity}}. Proceed to {% if payload.gate %}Gate {{payload.gate}}{% else %}the boarding terminal{% endif %}. Vehicle Plate: {{payload.busPlate ?? 'Assigned bus'}}.`
    *   **In-App Body**: `📢 Boarding has started for your trip to {{payload.destinationCity}}! {% if payload.gate %}Proceed to Gate {{payload.gate}}.{% endif %}`
    *   **In-App Redirect**: `/dashboard/tickets`

---

### Event 4: `passenger-trip-gate-updated`
Sent to passengers when the operator sets or updates the boarding gate.

*   **Recipient**: Passenger.
*   **Settings**:
    *   `critical: false`.
*   **Channel Routing**:
    *   **In-App**: Notification feed badge alert.
    *   **SMS (Twilio)**: Secondary (only if departure is within 2 hours).
*   **Payload Schema**:
    ```typescript
    interface PassengerTripGateUpdatedPayload {
      email: string;
      passengerName: string;
      destinationCity: string;
      departureTime: string;
      gate: string;
      phone?: string;
    }
    ```
*   **Copy Mockups**:
    *   **SMS Text**: `Moja Ride Update: The gate for your trip to {{payload.destinationCity}} ({{payload.departureTime}}) is set to Gate {{payload.gate}}.`
    *   **In-App Body**: `🚪 Boarding gate updated: Proceed to Gate {{payload.gate}} for your trip to {{payload.destinationCity}}.`
    *   **In-App Redirect**: `/dashboard/tickets`

---

### Event 5: `operator-bus-assigned`
Sent internally to assigned staff (drivers/dispatchers) when a bus is swapped or assigned.

*   **Recipient**: Operator Staff (Driver/Dispatcher).
*   **Settings**:
    *   `critical: false`.
*   **Channel Routing**:
    *   **In-App**: Staff notification badge.
    *   **SMS (Twilio)**: Real-time driver dispatch notification.
*   **Payload Schema**:
    ```typescript
    interface OperatorBusAssignedPayload {
      email: string;
      staffName: string;
      busPlate: string;
      routeName: string;
      departureTime: string;
      phone?: string;
    }
    ```
*   **Copy Mockups**:
    *   **SMS Text**: `Moja Operator: You are assigned to Bus {{payload.busPlate}} for route {{payload.routeName}} departing {{payload.departureTime}}. Log in to view manifest.`
    *   **In-App Body**: `🚌 Vehicle assignment updated: Bus {{payload.busPlate}} assigned to departure {{payload.departureTime}}.`
    *   **In-App Redirect**: `/dashboard/operator/trips`

---

### Event 6: `passenger-review-request`
Sent automatically to passengers after their trip completes, requesting feedback on their journey.

*   **Recipient**: Passenger (checked-in travelers of completed trips).
*   **Settings**:
    *   `critical: false`.
*   **Channel Routing**:
    *   **Email (SendGrid)**: Primary. Welcome back/feedback survey email.
    *   **In-App**: Notification feed badge alert.
*   **Payload Schema**:
    ```typescript
    interface PassengerReviewRequestPayload {
      email: string;
      passengerName: string;
      companyName: string;
      originCity: string;
      destinationCity: string;
      tripId: string;
      bookingReference: string;
    }
    ```
*   **Copy Mockups**:
    *   **Email Subject**: `How was your trip with {{payload.companyName}}?`
    *   **Email HTML**:
        ```html
        <div style="font-family: Arial, sans-serif; max-width: 480px; margin: 0 auto; border: 1px solid #e2e8f0; border-radius: 12px; padding: 24px; color: #1e293b; text-align: center;">
          <h2 style="color: #ee237c; margin-top: 0;">Welcome Back!</h2>
          <p>Hello {{payload.passengerName}},</p>
          <p>Thank you for riding with <strong>{{payload.companyName}}</strong> on your trip from <strong>{{payload.originCity}} to {{payload.destinationCity}}</strong>.</p>
          <p>We want to ensure you had a safe and comfortable journey. Please take 30 seconds to rate your experience:</p>
          <a href="https://mojaride.com/dashboard/tickets/{{payload.bookingReference}}/review" 
             style="display: inline-block; background: #ee237c; color: white; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: bold; font-size: 15px; margin: 16px 0;">
             Share Your Review
          </a>
        </div>
        ```
    *   **In-App Body**: `⭐️ Welcome back! Rate your recent journey from {{payload.originCity}} to {{payload.destinationCity}} with {{payload.companyName}}.`
    *   **In-App Redirect**: `/dashboard/tickets`

