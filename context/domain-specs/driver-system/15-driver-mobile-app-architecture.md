# Driver Mobile App Architecture & UI System

## 1. Application Architecture

The **Moja Driver Mobile App** (`apps/driver-app`) is a React Native / Expo application built with Expo Router (file-based routing), NativeWind (Tailwind CSS v4 styling), React Native Reusables, Zustand state stores, and TanStack Query + tRPC client bindings.

```mermaid
graph TD
    subgraph App Root app/
        INDEX[app/index.tsx Entry Router Guard]
        LAYOUT[app/_layout.tsx Providers & Urgent Dispatch Gate]
        NOTIF[app/notifications.tsx Notifications View]
        LANG[app/language.tsx Language Selector]
    end

    subgraph Auth Group app/(auth)/
        LOGIN[login.tsx Phone OTP Sign-in]
        REG_IDX[register/index.tsx Step 1: Personal & Selfie]
        REG_LIC[register/license.tsx Step 2: Commercial License]
        REG_DOC[register/documents.tsx Step 3: Identity & Medical]
        REG_CAR[register/carrier.tsx Step 4: Carrier Code]
        REG_STAT[register/status.tsx Step 5: Verification Status]
    end

    subgraph Main Tabs app/(tabs)/
        TAB_LAYOUT[_layout.tsx Custom TabBar & Offers Badge]
        TAB_TRIPS[trips.tsx Trips View & Mode Switcher]
        TAB_OFFERS[offers.tsx Offers Board & Counter Sheet]
        TAB_LIVE[live.tsx Live Trip HUD & Mapbox Navigation]
        TAB_SCAN[scanner.tsx QR Ticket Scanner & Offline Sync]
        TAB_PROF[profile.tsx Passport Profile & Settings]
        TAB_EARN[earnings.tsx Live Shift & Earnings Breakdown]
    end

    subgraph Trip Stack app/trip/
        TRIP_MAN[trip/id/manifest.tsx Passenger Manifest & Check-in]
    end

    INDEX --> LOGIN
    INDEX --> TAB_LAYOUT
    LOGIN --> REG_IDX
    REG_IDX --> REG_LIC --> REG_DOC --> REG_CAR --> REG_STAT
    TAB_LAYOUT --> TAB_TRIPS
    TAB_LAYOUT --> TAB_OFFERS
    TAB_LAYOUT --> TAB_LIVE
    TAB_LAYOUT --> TAB_SCAN
    TAB_LAYOUT --> TAB_PROF
    TAB_TRIPS --> TRIP_MAN
```

---

## 2. Navigation Hierarchy & Screen Catalog

| Route Path | Screen Component | Purpose & Business Logic | Primary Hooks & tRPC APIs |
| :--- | :--- | :--- | :--- |
| `/` | `app/index.tsx` | Root auth router guard. Directs unauthenticated users to `/login`, drivers with pending registration to `/register/status`, and verified drivers to `/(tabs)/trips`. | `authClient.useSession`, `drivers.getMyVerificationStatus` |
| `/(auth)/login` | `features/auth/screens/login.tsx` | Passwordless phone number sign-in with 6-digit SMS OTP verification. | `authClient.phoneNumber.sendOtp`, `authClient.phoneNumber.verify` |
| `/(auth)/register/*` | `app/(auth)/register/*` | 5-step onboarding wizard capturing demographics, license photos, medical certificates, and carrier affiliations. | `useDriverRegistrationStore`, `storage.presignUpload`, `drivers.registerDriver` |
| `/(tabs)/trips` | `features/trips/screens/trips-view.tsx` | Displays assigned trips filtered by tab (`TODAY`, `UPCOMING`, `COMPLETED`) and mode (`INTERCITY` vs `URBAN`). Actions: Start Run, View Manifest. | `drivers.getMyTrips`, `drivers.startTrip` |
| `/(tabs)/offers` | `features/offers/screens/offers-view.tsx` | Employment offer board. Actions: Accept offer, Decline offer, Counteroffer via bottom sheet. | `drivers.getMyOffers`, `drivers.markMyOffersSeen`, `drivers.respondToOffer` |
| `/(tabs)/live` | `features/live/screens/live-view.tsx` | Real-time in-flight navigation HUD. Renders Mapbox turn-by-turn route, live speedometer gauge, stop arrival/departure buttons, delay report modal, and Complete Run action. | `drivers.getMyProfile`, `drivers.recordStopArrival`, `drivers.recordStopDeparture`, `drivers.reportTripDelay`, `drivers.completeTrip` |
| `/(tabs)/scanner` | `features/scanner/screens/scanner-view.tsx` | High-speed camera QR ticket scanner with torch toggle, validation result modals, and offline scan batch synchronization. | `CameraView`, `drivers.checkInPassenger`, `drivers.batchSyncCheckIns` |
| `/(tabs)/profile` | `features/profile/screens/profile-view.tsx` | Professional driver "Passport". Displays career reputation, safety score, trust badges, verified license details, affiliations, and duty toggle. | `drivers.getMyProfile`, `drivers.toggleShift` |
| `/(tabs)/earnings` | `features/earnings/screens/earnings-view.tsx` | Wage analytics dashboard showing today/week earnings, live shift accrual counter, compensation rate descriptions, and shift logs. | `drivers.getMyEarnings` |
| `/trip/[id]/manifest` | `features/trips/screens/manifest-view.tsx` | Passenger manifest for a departure. Lists seat numbers, passenger phone numbers, boarding status, and manual check-in triggers. | `drivers.getMyTripManifest`, `drivers.manualCheckInPassenger` |
| `/notifications` | `features/notifications/screens/notifications-view.tsx` | In-app notification feed displaying dispatches, offer events, delay broadcasts, and compliance alerts. | `notifications.getNotifications` |

---

## 3. UI Component System & Theming

The mobile app implements a unified design system built on **React Native Reusables** (`components/ui/`):
* **`Button`** (`components/ui/Button.tsx`): Variants (`primary` [Rose #E11D48], `secondary`, `destructive`, `outline`, `ghost`, `warning`). Sizes (`sm`, `md`, `lg`, `icon`).
* **`Card`** (`components/ui/Card.tsx`): Slate/Zinc dark mode surfaces (`#18181b`, `#27272a` borders) with header, content, and footer slots.
* **`Badge`** (`components/ui/Badge.tsx`): Status badges with semantic tints (emerald for `VERIFIED` / `ON_TRIP`, amber for `PENDING` / `DELAYED`, rose for `REJECTED` / `CANCELLED`).
* **`Input`** (`components/ui/Input.tsx`): Dark theme form inputs with validation error states.
* **`ScreenShell`** (`components/ui/ScreenShell.tsx`): Standardized safe-area wrapper with page headers and scroll views.

---

## 4. Haptic Feedback Engine (`DriverFeedback`)

Commercial bus environments require instant tactile feedback. Implemented in `apps/driver-app/lib/haptics.ts`:

```typescript
export const DriverFeedback = {
  tap: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  successScan: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  warning: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning),
  invalidScan: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error),
  overspeedAlert: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy),
};
```

---

## 5. Mapbox Navigation & Offline Route Caching

Implemented in `apps/driver-app/lib/mapbox.ts` and `apps/driver-app/lib/mapbox-cache-core.ts`:
* **Direction Routing**: Calls Mapbox Directions API with waypoint coordinates.
* **Geometric Polyline Caching**: Caches GeoJSON route lines in `AsyncStorage` under cache keys `mapbox_route_{tripId}`.
* **Offline Fallback**: If internet connection drops mid-route, `fetchRouteDirections` falls back to the locally cached GeoJSON geometry, or computes a straight-line approximate polyline (`isApproximate: true`).
