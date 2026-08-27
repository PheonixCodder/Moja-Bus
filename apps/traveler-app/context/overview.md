# Traveler App — Context Overview

**App**: `apps/traveler-app`  
**Framework**: React Native, Expo SDK 56, Expo Router, NativeWind (Tailwind for RN)  
**Role**: Passenger-facing mobile app for searching trips, booking seats, viewing digital tickets, and tracking live trip progress.

---

## 1. Route Structure (Expo Router)

```
apps/traveler-app/app/
├── _layout.tsx                 # Root layout: auth gate + session provider
├── index.tsx                   # Boot screen: redirect to tabs or auth
│
├── (auth)/                     # Public auth screens
│   ├── login.tsx               # Phone/email OTP request
│   └── verify.tsx              # OTP verification
│
├── (tabs)/                     # Main authenticated tab navigator
│   ├── _layout.tsx             # Tab bar with icons
│   ├── index.tsx               # Search screen (origin/destination/date)
│   ├── tickets.tsx             # Ticket wallet (active + past bookings)
│   └── profile.tsx             # User profile + settings
│
├── search-results.tsx          # Trip search results list
├── booking/
│   ├── [scheduleId].tsx        # Seat map selection + passenger details
│   └── checkout.tsx            # Payment selection (Paystack mobile money)
│
├── booking-detail/
│   └── [bookingId].tsx         # Booking detail + QR ticket + tracking button
│
└── tracking/
    └── [tripId].tsx            # Live trip tracking map (passenger-facing)
```

---

## 2. Feature Structure

```
apps/traveler-app/features/
├── auth/                      # OTP login / session management
├── booking/                   # Seat selection, checkout, booking detail
├── notifications/             # Novu push notification handler + routing
├── search/                    # Trip search, result cards, map view
└── tickets/                   # QR ticket viewer, offline access
```

---

## 3. Key Libraries & Patterns

| Library | Purpose |
| :--- | :--- |
| `expo-router` | File-based typed navigation |
| `nativewind` | Tailwind CSS utility classes in React Native |
| `@moja/schemas` | Shared Zod validators from monorepo |
| `@trpc/react-query` | Data fetching from `apps/web` tRPC server |
| `expo-camera` | QR code scanning (check-in) |
| `expo-notifications` | Novu push notification receiver |
| `zustand` | Local UI state (search form, booking session) |

---

## 4. State Management
- **Zustand stores** are defined under `stores/` — shared session state, booking draft, search params.
- **URL state** in native contexts is handled via Expo Router's `useLocalSearchParams` typed params.
- **Server state** is fetched via tRPC client queries cached by React Query.

---

## 5. Offline & Network Handling
- QR tickets are stored locally after confirmation so they are accessible offline.
- Network-failed state on booking operations shows a retry UI — do not silently fail.
- Seat hold expiry (15-min server-side) is surfaced with a countdown timer in checkout.

---

## 6. Notification Routing (Mobile)
Push notification taps route via `lib/notification-routes.ts`:
- `passenger-booking-confirmed` → `/(tabs)/tickets`
- `passenger-trip-cancelled` → `/booking-detail/[bookingId]`
- `passenger-trip-delayed` → `/tracking/[tripId]`

Cross-surface `/dashboard/*` redirects are ignored on mobile by design.
