# Driver App — Context Overview

**App**: `apps/driver-app`  
**Framework**: React Native, Expo SDK 56, Expo Router, NativeWind  
**Role**: Mobile app for bus drivers — onboarding wizard, shift management, live trip HUD with GPS, QR passenger check-in, telemetry ingest.

---

## 1. Route Structure (Expo Router)

```
apps/driver-app/app/
├── _layout.tsx                 # Root layout: auth gate + telemetry token init
├── index.tsx                   # Boot screen: onboarding gate → tabs or registration
│
├── (auth)/                     # Auth screens
│   ├── login.tsx               # Phone OTP login
│   ├── verify.tsx              # OTP verification
│   └── register/               # Multi-step onboarding wizard
│       ├── index.tsx           # Personal info step
│       ├── carrier.tsx         # Employment/carrier selection step
│       └── license.tsx         # License upload step (presigned S3)
│
├── (tabs)/                     # Main authenticated tabs
│   ├── _layout.tsx             # Tab bar
│   ├── index.tsx               # Home / available offers feed
│   ├── trips.tsx               # Active + past trips
│   ├── offers.tsx              # Job offer board + counter-offer
│   └── profile.tsx             # Driver profile + preferences
│
├── live.tsx                    # Live trip HUD (GPS tracking, status controls)
└── notifications.tsx           # Push notification log
```

---

## 2. Feature Structure

```
apps/driver-app/features/
├── auth/                      # OTP flow, registration wizard, boot gate
├── driver/                    # Driver profile, documents, preferences
├── notifications/             # Push routing map, notification log
├── offers/                    # Offer board, counter-offer, urgency handling
└── trips/                     # Live HUD, shift ledger, trip history
```

---

## 3. Key Libraries & Patterns

| Library | Purpose |
| :--- | :--- |
| `expo-router` | File-based navigation + typed route params |
| `nativewind` | Tailwind utility classes for React Native |
| `expo-location` | Background GPS position (high accuracy mode) |
| `expo-camera` | QR code scanner for passenger check-in |
| `expo-notifications` | Novu push delivery + tap routing |
| `@trpc/react-query` | Backend API via `apps/web` tRPC server |
| `zustand` | Registration wizard state, offline telemetry queue |

---

## 4. GPS Telemetry Ingest

- Location pings are sent to `/api/v1/telemetry/ping` via HTTP (not WebSocket in v1).
- Pings are batched ≤100 per flush call.
- JWT telemetry token is re-minted when a trip starts. On 401 response, client calls `setTelemetryReauthHandler` to re-fetch a fresh token without user interaction.
- Flush is triggered at: trip start, each ping success, every 60 seconds, or on trip end.

---

## 5. Document Onboarding (Registration Wizard)

- License, medical certificate, and national ID are uploaded via **presigned S3 PUT URLs** minted server-side.
- Files are stored under private bucket path: `documents/drivers/{userId}/{segment}/`.
- After upload, the wizard only stores the S3 key reference — never a public URL.
- Presigned read URLs (5-minute TTL) are minted on demand by `drivers.presignDoc` or `admin.presignDoc`.

---

## 6. Boot Gate Logic

On cold boot, the driver app checks:
1. Is the user authenticated? → If no: show login.
2. Does the user have a `DriverProfile`? → If no: start onboarding wizard.
3. Has the profile been approved? → If pending/suspended: show status screen.
4. Network unreachable after 1 retry? → **Fail-open** (allow to tab shell, log warning). Do NOT block offline drivers indefinitely.

---

## 7. Notification Routing (Driver)

Push taps route via `lib/notification-routes.ts`:
- `driver-offer-received` → `/(tabs)/offers`
- `driver-trip-assigned` → `/(tabs)/trips`
- `driver-dispatch-urgent` → `/live` (live HUD)
