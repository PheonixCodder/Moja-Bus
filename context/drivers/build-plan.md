# Moja Bus Driver System & Real-Time Telemetry — Build Plan

## Core Principle
Full page UI built with mock data first — verified visually before any logic is written. Then functionality is built and wired to the UI step by step. Every feature must be visible and testable before moving to the next. No invisible backend phases.

---

## Development Phases & Feature Roadmap

### Phase 1 — Schema, Core Types & IAM Foundation
- [ ] **01.01** Extend `StaffRole` with `DRIVER` in `packages/db/prisma/schema.prisma`
- [ ] **01.02** Create `DriverProfile`, `DriverCompanyAffiliation`, `TripDriverAssignment`, `DriverLocationPing`, and `DriverShift` models in `schema.prisma`
- [ ] **01.03** Update `Review` model with `driverRating`, `busRating`, `punctualityRating`, `driverId`, `tripId`, `busId`
- [ ] **01.04** Run Prisma migration (`prisma db push` / `prisma migrate dev`) and generate updated Prisma Client
- [ ] **01.05** Define driver Zod schemas and validation in `packages/schemas/src/drivers.ts`
- [ ] **01.06** Add `drivers:*` and `telemetry:*` IAM permissions and role defaults in `packages/schemas/src/permissions.ts`

---

### Phase 2 — Operator Web ERP: Drivers Module & Dispatch Board
- [ ] **02.01** Create `apps/web/trpc/routers/drivers.ts` with procedures (`listDrivers`, `getDriver`, `createDriver`, `updateDriver`, `verifyDriver`, `getDriverAnalytics`, `getLivePositions`)
- [ ] **02.02** Add "Drivers" item with steering wheel icon in `apps/web/features/operator/components/operator-sidebar.tsx`
- [ ] **02.03** Build `apps/web/app/[locale]/dashboard/operator/(dashboard)/drivers/page.tsx` and `OperatorDriversView` component
- [ ] **02.04** Build Driver Registration & License Upload Modal (`add-driver-modal.tsx`)
- [ ] **02.05** Build `apps/web/app/[locale]/dashboard/operator/(dashboard)/drivers/[id]/page.tsx` with Driver Career Passport, License Document Inspector, and Reviews Breakdown
- [ ] **02.06** Update `apps/web/app/[locale]/dashboard/operator/(dashboard)/staff/page.tsx` to support `DRIVER` role filtering and permissions
- [ ] **02.07** Update Trip Dispatch Board (`apps/web/features/operator/views/operator-trips-view.tsx`) with Driver selector, relief driver assignment, and license verification warnings
- [ ] **02.08** Build Operator Live Fleet Telemetry Map View (`/dashboard/operator/drivers/map`) with real-time bus markers and speedometer HUD

---

### Phase 3 — Real-Time Telemetry & WebSocket Ingestion Gateway
- [ ] **03.01** Build standalone / modular WebSocket Telemetry Gateway in `apps/web/server/telemetry-ws.ts` (or `packages/realtime`)
- [ ] **03.02** Implement Better Auth JWT / token handshake on WebSocket `upgrade`
- [ ] **03.03** Implement Safarpay-inspired validation pipeline (accuracy $<50\text{m}$, speed $<200\text{ km/h}$, Haversine jump detector)
- [ ] **03.04** Implement Redis Geo storage (`GEOADD`, `GEORADIUS`, `HSET live_location`)
- [ ] **03.05** Implement Redis Pub/Sub broadcast channels (`trip:{tripId}:telemetry`, `operator:{companyId}:fleet`)
- [ ] **03.06** Implement background batch flush worker from Redis queue to PostgreSQL `DriverLocationPing` table
- [ ] **03.07** Implement HTTP POST fallback endpoint (`/api/v1/telemetry/ping`) for intermittent network handshakes

---

### Phase 4 — Driver Mobile App (`apps/driver-app`): Foundation & Auth
- [ ] **04.01** Initialize `apps/driver-app` with Expo 57, Expo Router, NativeWind, Biome, and monorepo workspace packages (`@moja/schemas`, `@moja/shared`, `@moja/ui`)
- [ ] **04.02** Configure `app.json`, `metro.config.js`, `tailwind.config.js`, and navigation layouts
- [ ] **04.03** Implement Driver Auth Flow (`/(auth)/login`) with Phone/OTP and Password via Better Auth
- [ ] **04.04** Implement Operator Company Switcher & On-Duty / Off-Duty Shift Toggle
- [ ] **04.05** Build Driver Tabs Navigation: `Trips`, `Live Trip`, `QR Scanner`, `Profile & Career`
- [ ] **04.06** Build Driver QR Ticket Scanner (`/(tabs)/scanner`) using `expo-camera` with instant audio/haptic feedback and offline ticket token cache

---

### Phase 5 — Driver Mobile App: Trip Execution & Background Telemetry
- [ ] **05.01** Build Assigned Trips List (`/(tabs)/trips`) with Today, Upcoming, and Completed filters
- [ ] **05.02** Build Trip Detail & Passenger Manifest screen (`/trip/[id]/manifest`) with search, seat labels, and boarding status badges
- [ ] **05.03** Implement Dual-Mode UI Engine:
  - **Intercity Flow**: Gate Check-in $\rightarrow$ Departure $\rightarrow$ Stop checklist $\rightarrow$ Arrival
  - **Urban Flow**: Line shift start $\rightarrow$ Loop runner $\rightarrow$ Headway tracker $\rightarrow$ Shift end
- [ ] **05.04** Implement Background Location Engine using `expo-location` and `expo-task-manager` with battery-optimized ping intervals (5s moving, 30s idling)
- [ ] **05.05** Implement Offline Sync Queue with local SQLite / AsyncStorage for ping buffering during low-signal zones
- [ ] **05.06** Build In-Trip Incident & Delay Reporter modal with automated Novu passenger notifications
- [ ] **05.07** Build Driver Career Passport (`/(tabs)/profile`) with lifetime statistics, badge achievements, and review summary

---

### Phase 6 — Traveler App Integration & 3-Way Review System
- [ ] **06.01** Integrate Live Bus Tracking Screen in `apps/traveler-app/app/tracking/[tripId].tsx` with live moving vehicle icon, route polyline, and real-time ETA
- [ ] **06.02** Add "Track Live Bus" button on active bookings in `apps/traveler-app/features/booking/screens/booking-detail.tsx`
- [ ] **06.03** Build Multi-Criteria Review Modal (`Driver`, `Vehicle`, `Punctuality` 1–5 stars + written feedback)
- [ ] **06.04** Implement automatic post-trip review prompt on Traveler App launch + Novu push notification upon trip completion
- [ ] **06.05** Wire review submission to `apps/traveler-app/app/reviews.tsx` and `apps/traveler-app/app/(tabs)/bookings.tsx`
- [ ] **06.06** Update Operator Reviews View (`apps/web/features/operator/views/operator-reviews-view.tsx`) to display driver breakdown, vehicle score, and filter by driver

---

## Feature Count
- **Phase 1 (Foundation)**: 6 Checklist items
- **Phase 2 (Operator ERP)**: 8 Checklist items
- **Phase 3 (Real-Time Ingestion)**: 7 Checklist items
- **Phase 4 (Driver App Base)**: 6 Checklist items
- **Phase 5 (Trip Execution)**: 7 Checklist items
- **Phase 6 (Traveler App & Reviews)**: 6 Checklist items
- **Total Checklist Items (Phases 1–6)**: 40 Milestone Deliverables

> **Note**: Phases 1–8 are completed and tracked in `docs/plans/driver-app-and-telemetry-deep-audit/13-phased-execution-master-plan.md`.

---

## Marketplace Evolution — Phases 9–15

*These phases build the driver supply-side marketplace — the third side of the Moja three-sided marketplace.*

### Phase 9 — Driver Preference Profile & Availability System
New schema: `DriverServicePreference`. Driver signals employment type, city base, route experience, availability, and minimum salary. Availability toggle appears on driver profile tab.

### Phase 10 — Operator Driver Marketplace (Talent Discovery)
New page: `/dashboard/operator/drivers/marketplace`. Operators browse verified, available drivers with filters. Public driver profile cards show rating, safety score, contact, and affiliation history.

### Phase 11 — Employment Offer & Counter-Offer Flow
New schema: `DriverEmploymentOffer`. Operator sends formal offer. Driver can accept, decline, or counter with different salary/start date. On acceptance, `DriverCompanyAffiliation` is auto-created. 7-day auto-expiry. Novu notifications for all state changes.

### Phase 12 — Live Driver Assignment on Dispatch Board
Trip card driver assignment panel in Operator ERP. Conflict detection. Driver receives push notification on assignment. Relief driver & conductor role support via `TripDriverAssignment`.

### Phase 13 — Driver Ratings Aggregation & Trust Score
Background job computes `averageRating`, `safetyScore`, `totalTripsCompleted` after each trip. Safety score algorithm: starts 100, -5 per overspeed, -10 per harsh braking, +1 per 10 clean trips. Trust badges: Top Rated, Safe Driver, Veteran.

### Phase 14 — Platform Admin Marketplace Controls
Admin marketplace health panel, featured driver flag, marketplace suspension (separate from verification suspension), offer audit log.

### Phase 15 — End-to-End Validation & Release QA
Full three-sided lifecycle test: driver registers → verified → listed → operator finds → offers → driver counters → accepted → affiliation created → trip assigned → executed → review submitted → stats updated.

