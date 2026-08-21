# Moja Bus Driver System — Progress Tracker

Update this file after every completed feature. Any AI agent reading this immediately knows what is done, what is in progress, and what is next.

---

## Current Status
- **Current Phase**: All Phases Completed (Phases 1 through 6)
- **Last Completed**: Phase 6 (Traveler App Integration & 3-Way Review System)
- **Next Milestone**: Production Deployment & Driver Onboarding

---

## Phase Checklist & Progress

### Phase 1 — Schema, Core Types & IAM Foundation
- [x] **01.01** Extend `StaffRole` with `DRIVER` in `packages/db/prisma/schema.prisma`
- [x] **01.02** Create `DriverProfile`, `DriverCompanyAffiliation`, `TripDriverAssignment`, `DriverLocationPing`, and `DriverShift` models in `schema.prisma`
- [x] **01.03** Update `Review` model with `driverRating`, `busRating`, `punctualityRating`, `driverId`, `tripId`, `busId`
- [x] **01.04** Run Prisma migration / client generation (`prisma generate`) and validated schema
- [x] **01.05** Define driver Zod schemas and validation in `packages/schemas/src/drivers.ts`
- [x] **01.06** Add `drivers:*` and `telemetry:*` IAM permissions and role defaults in `packages/schemas/src/permissions.ts`

### Phase 2 — Operator Web ERP: Drivers Module & Dispatch Board
- [x] **02.01** Create `apps/web/trpc/routers/drivers.ts` with procedures (`listDrivers`, `getDriver`, `createDriver`, `updateDriver`, `verifyDriver`, `getDriverAnalytics`, `getLivePositions`)
- [x] **02.02** Add "Drivers" item with steering wheel icon in `apps/web/features/operator/components/operator-sidebar.tsx`
- [x] **02.03** Build `apps/web/app/[locale]/dashboard/operator/(dashboard)/drivers/page.tsx` and `OperatorDriversView` component
- [x] **02.04** Build Driver Registration & License Upload Modal (`add-driver-modal.tsx`)
- [x] **02.05** Build `apps/web/app/[locale]/dashboard/operator/(dashboard)/drivers/[id]/page.tsx` with Driver Career Passport, License Document Inspector, and Reviews Breakdown
- [x] **02.06** Update `apps/web/app/[locale]/dashboard/operator/(dashboard)/staff/page.tsx` to support `DRIVER` role filtering and permissions
- [x] **02.07** Update Trip Dispatch Board (`apps/web/features/operator/views/operator-trips-view.tsx` and `trips.ts` router) with Driver selector, relief driver assignment, and license verification warnings
- [x] **02.08** Build Operator Live Fleet Telemetry Map View (`/dashboard/operator/drivers/map`) with real-time bus markers and speedometer HUD

### Phase 3 — Real-Time Telemetry & WebSocket Ingestion Gateway
- [x] **03.01** Build standalone / modular WebSocket Telemetry Gateway in `apps/web/server/telemetry-ws.ts`
- [x] **03.02** Implement session / token query handshake on WebSocket `upgrade`
- [x] **03.03** Implement Safarpay-inspired validation pipeline (accuracy $<50\text{m}$, speed $<200\text{ km/h}$, Haversine jump detector)
- [x] **03.04** Implement Redis Geo storage (`GEOADD`, `HSET driver:live`, and in-memory mock fallback)
- [x] **03.05** Implement Redis Pub/Sub broadcast channels (`trip:{tripId}:telemetry`, `operator:{companyId}:fleet`)
- [x] **03.06** Implement background batch flush worker from memory buffer to PostgreSQL `DriverLocationPing` table
- [x] **03.07** Implement HTTP POST fallback endpoint (`/api/v1/telemetry/ping`) for intermittent network handshakes

### Phase 4 — Driver Mobile App (`apps/driver-app`): Foundation & Auth
- [x] **04.01** Initialize `apps/driver-app` with Expo 57, Expo Router, NativeWind, Biome, and monorepo workspace packages (`@moja/schemas`, `@moja/shared`, `@moja/ui`)
- [x] **04.02** Configure `app.json`, `metro.config.js`, `tailwind.config.js`, and navigation layouts
- [x] **04.03** Implement Driver Auth Flow (`/(auth)/login`) with Phone/OTP and Password via Better Auth
- [x] **04.04** Implement Operator Company Switcher & On-Duty / Off-Duty Shift Toggle
- [x] **04.05** Build Driver Tabs Navigation: `Trips`, `Live Trip`, `QR Scanner`, `Profile & Career`
- [x] **04.06** Build Driver QR Ticket Scanner (`/(tabs)/scanner`) using `expo-camera` with instant audio/haptic feedback and offline ticket token cache

### Phase 5 — Driver Mobile App: Trip Execution & Background Telemetry
- [x] **05.01** Build Assigned Trips List (`/(tabs)/trips`) with Today, Upcoming, and Completed filters
- [x] **05.02** Build Trip Detail & Passenger Manifest screen (`/trip/[id]/manifest`) with search, seat labels, and boarding status badges
- [x] **05.03** Implement Dual-Mode UI Engine (Intercity formal terminal schedule vs Urban loop runner)
- [x] **05.04** Implement Background Location Engine using `expo-location` and `expo-task-manager` with battery-optimized ping intervals (5s moving, 30s idling)
- [x] **05.05** Implement Offline Sync Queue with local SQLite / AsyncStorage for ping buffering during low-signal zones
- [x] **05.06** Build In-Trip Incident & Delay Reporter modal with automated Novu passenger notifications
- [x] **05.07** Build Driver Career Passport (`/(tabs)/profile`) with lifetime statistics, badge achievements, and review summary

### Phase 6 — Traveler App Integration & 3-Way Review System
- [x] **06.01** Integrate Live Bus Tracking Screen in `apps/traveler-app/app/tracking/[tripId].tsx` with live moving vehicle icon, route polyline, and real-time ETA
- [x] **06.02** Add "Track Live Bus" button on active bookings in `apps/traveler-app/features/booking/screens/booking-detail.tsx`
- [x] **06.03** Build Multi-Criteria Review Modal (`Driver`, `Vehicle`, `Punctuality` 1–5 stars + written feedback)
- [x] **06.04** Implement automatic post-trip review prompt on Traveler App launch + Novu push notification upon trip completion
- [x] **06.05** Wire review submission to `apps/traveler-app/app/reviews.tsx` and `apps/traveler-app/app/(tabs)/bookings.tsx`
- [x] **06.06** Update Operator Reviews View (`apps/web/features/operator/views/operator-reviews-view.tsx`) to display driver breakdown, vehicle score, and filter by driver

---

## Decisions Made During Planning
1. **Lifetime Portable Driver Identity**: The root `DriverProfile` is attached to the global `User` account so ratings, badges, and verified licenses follow the driver throughout their career across multiple operators.
2. **Dual-Mode Operational Engine**: Intercity vs Urban rules are decoupled in the schema via `DriverCompanyAffiliation.employmentType` and `Trip.serviceType`. Intercity operates under exclusive single-operator assignment with seat-level manifests, while Urban operates under a shared contractor driver pool with high-frequency loops.
3. **Enterprise Telemetry Ingestion**: Replaces basic in-memory WebSockets with a Redis Geo + PubSub architecture (inspired by the Safarpay reference) to support horizontal clustering, GPS jump anomaly filtering ($<50\text{m}$ accuracy gate, $<200\text{ km/h}$ speed gate), and dual-path HTTP/WebSocket fallbacks.
4. **3-Way Multi-Dimensional Passenger Review**: Reviews directly link to `driverId`, `busId`, and `tripId`, capturing 1–5 star ratings across Driver Behavior, Vehicle Comfort, and Punctuality.
