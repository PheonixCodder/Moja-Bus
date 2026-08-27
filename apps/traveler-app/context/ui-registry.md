# Traveler App — UI Component Registry

Living document. Updated after every component is built. Read before building new screens.

---

## Screens

| Screen | File | Notes |
| :--- | :--- | :--- |
| `SearchScreen` | `app/(tabs)/index.tsx` | Origin/destination/date picker, search CTA |
| `SearchResultsScreen` | `app/search-results.tsx` | Trip cards with price, time, operator |
| `BookingScreen` | `app/booking/[scheduleId].tsx` | Seat map + passenger details form |
| `CheckoutScreen` | `app/booking/checkout.tsx` | Payment method selector (Paystack mobile money) |
| `TicketWalletScreen` | `app/(tabs)/tickets.tsx` | Active + past bookings list |
| `BookingDetailScreen` | `app/booking-detail/[bookingId].tsx` | QR ticket viewer + tracking button |
| `TrackingScreen` | `app/tracking/[tripId].tsx` | Live passenger-facing bus location map |

---

## Reusable Components

| Component | File | Notes |
| :--- | :--- | :--- |
| `TripCard` | `features/search/components/trip-card.tsx` | Search result card with operator, price, time |
| `SeatMap` | `features/booking/components/seat-map.tsx` | Interactive bus seat selector |
| `QrTicket` | `features/tickets/components/qr-ticket.tsx` | Offline-capable QR code ticket display |
| `BookingStatusBadge` | `features/booking/components/booking-status-badge.tsx` | Color-coded booking state badge |

---

*Add new components here as they are built.*
