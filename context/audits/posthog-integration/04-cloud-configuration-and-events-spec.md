# PostHog Audit — Module 04: PostHog Cloud Configuration & Event Taxonomy Spec

## 1. PostHog Cloud Integration Configuration

Because we are targeting **PostHog Cloud** (SaaS) and not self-hosting:

### 1.1 Ingestion Endpoints
PostHog Cloud provides two primary hosting regions. Select the one matching your project account:
- **US Cloud**:
  - API / Ingest Host: `https://us.i.posthog.com`
  - Web UI: `https://us.posthog.com`
- **EU Cloud**:
  - API / Ingest Host: `https://eu.i.posthog.com`
  - Web UI: `https://eu.posthog.com`

### 1.2 Web App Reverse Proxy (Ad-Blocker Defense)
In `apps/web/next.config.ts`, implement rewrites so telemetry requests appear as first-party endpoints to client browsers:

```typescript
// apps/web/next.config.ts
const nextConfig = {
  async rewrites() {
    return [
      {
        source: "/ingest/static/:path*",
        destination: "https://us-assets.i.posthog.com/static/:path*", // or eu-assets.i.posthog.com
      },
      {
        source: "/ingest/:path*",
        destination: "https://us.i.posthog.com/:path*", // or eu.i.posthog.com
      },
      {
        source: "/ingest/decide",
        destination: "https://us.i.posthog.com/decide",
      },
    ];
  },
  // Skip trailing slash redirect for ingestion endpoints
  skipTrailingSlashRedirect: true,
};
```

When rewrites are active, the web client initializes PostHog with:
```typescript
api_host: "/ingest",
ui_host: "https://us.posthog.com" // or https://eu.posthog.com
```

---

## 2. Standardized Event Taxonomy across Moja Bus

To ensure uniform analytics across web and mobile, all four apps should adhere to a typed event taxonomy.

### 2.1 Passenger Booking Funnel (`apps/web` & `apps/traveler-app`)

| Event Name | Trigger Location | Key Properties |
| :--- | :--- | :--- |
| `trip_searched` | Search form submitted | `origin_id`, `destination_id`, `departure_date`, `passenger_count` |
| `search_results_viewed` | Results list loaded | `results_count`, `has_results`, `origin`, `destination` |
| `trip_selected` | User taps/clicks a specific schedule | `schedule_id`, `operator_id`, `price`, `departure_time` |
| `seats_selected` | Seat map selection confirmed | `schedule_id`, `seat_numbers`, `seat_count`, `total_amount` |
| `checkout_started` | User arrives on checkout screen | `hold_id`, `schedule_id`, `amount`, `currency` |
| `payment_initiated` | Paystack modal or mobile money checkout opened | `payment_method`, `amount`, `reference` |
| `booking_completed` | Payment success & ticket minted | `booking_id`, `ticket_count`, `total_amount`, `currency`, `operator_id` |
| `ticket_viewed` | Ticket QR opened in wallet | `booking_id`, `trip_id`, `is_offline` |

### 2.2 Driver Lifecycle Funnel (`apps/driver-app`)

| Event Name | Trigger Location | Key Properties |
| :--- | :--- | :--- |
| `driver_onboarding_step_completed` | Registration wizard step completed | `step_name`, `step_index` |
| `driver_license_uploaded` | S3 document upload completed | `document_type`, `file_extension` |
| `driver_offer_viewed` | Dispatch offer board opened | `offer_id`, `route_name`, `compensation_amount` |
| `driver_offer_accepted` | Driver accepts assigned trip offer | `offer_id`, `trip_id`, `operator_id` |
| `driver_offer_rejected` | Driver rejects offer | `offer_id`, `reason` |
| `driver_trip_started` | Live trip HUD activated | `trip_id`, `vehicle_id`, `origin`, `destination` |
| `passenger_checked_in` | Driver scans passenger QR ticket | `ticket_id`, `trip_id`, `checkin_status` |
| `driver_trip_completed` | Driver ends trip | `trip_id`, `duration_minutes`, `passenger_count` |

### 2.3 Terminal / Booth Counter Funnel (`apps/booth-app`)

| Event Name | Trigger Location | Key Properties |
| :--- | :--- | :--- |
| `terminal_session_started` | Booth agent selects terminal and starts shift | `terminal_id`, `station_id`, `agent_id` |
| `counter_ticket_issued` | In-person walk-in ticket sold | `booking_id`, `payment_method` (`CASH` vs `POS`), `amount`, `destination` |
| `shift_reconciled` | Daily cash/POS sales reconciled | `total_cash_collected`, `total_pos_collected`, `discrepancy_amount` |

### 2.4 Operator & ERP Portal Funnel (`apps/web` / Dashboard)

| Event Name | Trigger Location | Key Properties |
| :--- | :--- | :--- |
| `operator_route_created` | New bus route published | `route_id`, `origin`, `destination`, `stops_count` |
| `operator_trip_dispatched` | Schedule dispatched to driver | `schedule_id`, `driver_id`, `bus_id` |
| `operator_refund_issued` | Manual booking cancellation & refund | `booking_id`, `refund_amount`, `reason` |
