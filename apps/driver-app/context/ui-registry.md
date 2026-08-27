# Driver App — UI Component Registry

Living document. Updated after every component is built.

---

## Screens

| Screen | File | Notes |
| :--- | :--- | :--- |
| `BootScreen` | `app/index.tsx` | Auth check + onboarding gate |
| `OfferFeedScreen` | `app/(tabs)/index.tsx` | Available job offers list |
| `TripsScreen` | `app/(tabs)/trips.tsx` | Active + past trips |
| `LiveHudScreen` | `app/live.tsx` | GPS HUD with speed, route progress, ETA |
| `RegisterIndexScreen` | `app/(auth)/register/index.tsx` | Personal info onboarding step |
| `RegisterCarrierScreen` | `app/(auth)/register/carrier.tsx` | Carrier/employer selection step |
| `RegisterLicenseScreen` | `app/(auth)/register/license.tsx` | License document upload step |

---

## Reusable Components

| Component | File | Notes |
| :--- | :--- | :--- |
| `DriverStatusBadge` | `components/driver-status-badge.tsx` | Color-coded driver status display |
| `TripCard` | `features/trips/components/trip-card.tsx` | Trip summary card with route and time |
| `OfferCard` | `features/offers/components/offer-card.tsx` | Job offer with counter-offer CTA |
| `QrScannerOverlay` | `features/trips/components/qr-scanner-overlay.tsx` | Camera overlay for passenger check-in |
| `ShiftLedgerRow` | `features/trips/components/shift-ledger-row.tsx` | Shift history row with earnings |

---

*Add new components here as they are built. Do NOT use bare `<div>` elements — use React Native `<View>` equivalents.*
