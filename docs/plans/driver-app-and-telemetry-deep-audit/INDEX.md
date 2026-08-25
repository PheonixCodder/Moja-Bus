# Moja Bus Driver System & Real-Time Telemetry — Deep Audit Index

> **Audit Date:** August 21, 2026  
> **Target Subsystems:** Driver Mobile App (`apps/driver-app`), PostgreSQL Schema (`packages/db/prisma/schema.prisma`), tRPC Routers (`apps/web/trpc/routers`), Real-time Telemetry Gateway (`apps/web/server`), Operator Web ERP (`apps/web`), Traveler Mobile App (`apps/traveler-app`), Shared Schemas (`packages/schemas`), Safarpay Enterprise Blueprint (`app-references/safarpay/`), and Mapbox Geospatial Engine (`@rnmapbox/maps`).  
> **Status:** ✅ Complete Multi-Surface Audit — 13 Documents  

---

## 1. Executive Overview

This deep audit provides an exhaustive, line-by-line verification of the **Moja Bus Driver System & Real-Time Telemetry Backbone**. It spans mobile frontends, carrier ERP dashboards, distributed WebSocket/Redis streaming pipelines, Prisma data models, IAM permissions, passenger multi-criteria review loops, full Safarpay enterprise blueprint gap analysis, the Mapbox `@rnmapbox/maps` geospatial integration plan, and an atomic 9-phase master execution plan.

### Key Audit Scorecard

| Subsystem / Surface | Audit Scope | Implementation Status | Quality & Stability Rating | Critical Findings |
| :--- | :--- | :--- | :--- | :--- |
| **Driver Mobile App (`apps/driver-app`)** | React Native Expo app, QR scanner, GPS telematics, manifest check-in, passport | Completed (with mock fallbacks) | 🟡 **Needs Hardening** | 1 Runtime Redscreen Bug (`<div>` in React Native), mock data decoupling required, missing Mapbox integration |
| **Database Schema (`packages/db`)** | 5 core models (`DriverProfile`, `DriverCompanyAffiliation`, `TripDriverAssignment`, `DriverLocationPing`, `DriverShift`) + 3-way `Review` | Fully Migrated & Normalized | 🟢 **Production Ready** | Excellent indexing, robust relations & constraints |
| **Backend tRPC Routers (`apps/web/trpc`)** | Operator CRUD, driver dispatch, live positions, 3-way reviews, IAM gates | Fully Implemented | 🟢 **Production Ready** | Needs driver-scoped self-service procedures (`getMyTrips`, `checkInTicket`) |
| **Real-Time Telemetry Engine (`apps/web/server`)** | WebSocket gateway, Safarpay-grade physical gates, Redis Geo/PubSub, DB batch flush | Fully Implemented | 🟢 **High Performance** | Standalone production WS runner entrypoint needed |
| **Operator Web ERP (`apps/web`)** | Driver directory, passport inspector, compliance verification, live fleet radar map | Fully Implemented | 🟢 **Production Ready** | Rich UX, reactive filters, full i18n support |
| **Traveler App Integration (`apps/traveler-app`)** | Live bus tracking radar, ETA counter, 3-way multi-criteria passenger review modal | Fully Implemented | 🟡 **Needs Hardening** | 1 Runtime Redscreen Bug, simulated telemetry instead of live WS, no Mapbox engine |
| **IAM & Security (`packages/schemas`)** | `drivers:*` and `telemetry:*` permissions, role matrices, profile sovereignty | Fully Enforced | 🟢 **Enterprise Grade** | Complete authorization guard coverage |
| **Safarpay Blueprint Gaps** | 88 feature specs, driver onboarding wizard, urgent alerts, earnings, mode switch | ❌ Not Yet Implemented | 🔴 **Critical Gaps** | 5 high-priority Safarpay features absent from driver-app |
| **Mapbox Geospatial Engine** | `@rnmapbox/maps` vector maps, route polylines, follow-user camera, offline tiles | ❌ Not Yet Integrated | 🔴 **Critical Infrastructure Gap** | Zero vector map coverage in both mobile apps |
| **Package Parity (`driver-app` vs `traveler-app`)** | Dependency alignment, design system tokens, icon libraries | Partially Aligned | 🟠 **Needs Synchronization** | 7 packages missing from `driver-app` |
| **Master Execution Plan** | Phase 0 to Phase 8 phased remediation blueprint with verification gates | 🟢 **Complete** | 🟢 **Ready for Step-by-Step Execution** | 13-phased-execution-master-plan.md active |

---

## 2. Audit Document Map

### Core System Audit (Documents 01–09)

| Document | Topic | Description |
| :--- | :--- | :--- |
| [**01-executive-summary-and-architecture.md**](./01-executive-summary-and-architecture.md) | **Architecture & Design Principles** | Dual-mode operational engine (Intercity vs Urban), portable career identity, Safarpay telemetry benchmark comparison, end-to-end data flow. |
| [**02-driver-mobile-app-audit.md**](./02-driver-mobile-app-audit.md) | **Driver Mobile App (`apps/driver-app`)** | Screen-by-screen audit, auth flow, QR camera scanner, GPS background tracking task, manifest check-in, offline queue, and UI tokens. |
| [**03-database-schema-and-data-models-audit.md**](./03-database-schema-and-data-models-audit.md) | **Database & Data Modeling** | Deep dive into `packages/db/prisma/schema.prisma`, model normalization, composite indexes, relational cascades, and data lifecycle. |
| [**04-trpc-routers-and-api-contracts-audit.md**](./04-trpc-routers-and-api-contracts-audit.md) | **Backend APIs & tRPC Routers** | `drivers.ts`, `trips.ts`, `reviews.ts`, `staff.ts`, REST `/api/v1/telemetry/ping`, authorization gates, input validation, and missing endpoints. |
| [**05-realtime-telemetry-and-websocket-gateway-audit.md**](./05-realtime-telemetry-and-websocket-gateway-audit.md) | **Telemetry Pipeline & Ingestion** | Safarpay anomaly filters (Haversine velocity gate, accuracy threshold), Redis Geo/PubSub backbone, buffer batch worker. |
| [**06-operator-web-erp-surfaces-audit.md**](./06-operator-web-erp-surfaces-audit.md) | **Operator Fleet Management ERP** | Roster directory, driver career passport, license verification dialog, live fleet telemetry map radar, and review response center. |
| [**07-traveler-app-and-passenger-experience-audit.md**](./07-traveler-app-and-passenger-experience-audit.md) | **Traveler App & Passenger Loops** | Real-time bus tracking screen, live ETA and speed display, 3-way multi-criteria review modal (`Driver`, `Vehicle`, `Punctuality`). |
| [**08-security-iam-compliance-and-invariants-audit.md**](./08-security-iam-compliance-and-invariants-audit.md) | **Security, IAM & Invariants** | RBAC permissions, driver identity sovereignty, review immutability, trip snapshot freezing, and token lifecycle. |
| [**09-gaps-findings-catalog-and-action-plan.md**](./09-gaps-findings-catalog-and-action-plan.md) | **Findings Catalog & Action Plan** | Complete prioritized list of bugs, gaps, architectural enhancements, exact remediation diffs, Mapbox migration items, Safarpay feature milestones, and verification checklist. |

### Safarpay Blueprint, Geospatial & Execution Documents (Documents 10–13)

| Document | Topic | Description |
| :--- | :--- | :--- |
| [**10-safarpay-blueprint-and-enterprise-features-gap-audit.md**](./10-safarpay-blueprint-and-enterprise-features-gap-audit.md) | **Safarpay Enterprise Blueprint Gap Analysis** | Feature-by-feature comparison against the 88 Safarpay feature specs: 5-step driver registration wizard, urgent dispatch alerts & audio-visual runtime, earnings ledger, mode switch, and turn-by-turn HUD. |
| [**11-mapbox-geospatial-and-navigation-architecture-audit.md**](./11-mapbox-geospatial-and-navigation-architecture-audit.md) | **Mapbox Geospatial Engine (`@rnmapbox/maps`)** | Full integration specification: `app.json` plugin config, `DriverNavigationMap` component, route polyline rendering, follow-user camera mode, Mapbox Directions API wiring, offline tile packs, and traveler live tracking screen integration. |
| [**12-package-parity-and-design-system-alignment-audit.md**](./12-package-parity-and-design-system-alignment-audit.md) | **Package Parity & Design System Audit** | Exhaustive dependency comparison table between `apps/driver-app` and `apps/traveler-app`, 7 missing packages to add, `@rnmapbox/maps` version target, and Midnight Elite design token specification. |
| [**13-phased-execution-master-plan.md**](./13-phased-execution-master-plan.md) | **Master Phased Remediation & Execution Plan** | Phase 0 to Phase 8 sequential, bite-sized, checkable task breakdown covering every single bug, API wiring, Mapbox integration, Safarpay wizard, audio alerts, and QA verification gates. |

---

## 3. High-Priority Blockers Summary

Before production release, the following **P0 / P1 issues** must be addressed in priority order:

### 🔴 P0 — Critical: Fatal Runtime Crashes

1. **React Native JSX Incompatibilities (`<div>` Tags)**:
   - `apps/driver-app/app/(tabs)/scanner.tsx` (Line 118): `<div>` inside React Native view → fatal redscreen on any device.
   - `apps/traveler-app/features/booking/components/review-sheet.tsx` (Line 76): `<div>` inside React Native modal → fatal redscreen when opening review.
   - **Fix**: Replace with `<View>` — exact patches in [Document 09](./09-gaps-findings-catalog-and-action-plan.md).

### 🔴 P0 — Critical: Missing Geospatial Infrastructure

2. **No Vector Map Engine in Either Mobile App**:
   - Both `apps/driver-app` and `apps/traveler-app` lack `@rnmapbox/maps` integration.
   - Driver app shows a CSS grid placeholder; traveler app shows a simulated radar canvas.
   - **Fix**: Follow complete integration plan in [Document 11](./11-mapbox-geospatial-and-navigation-architecture-audit.md).

### 🟠 P1 — High: API Wiring & Operational Gaps

3. **Driver Mobile App Mock Data Decoupling**: All 4 driver app tab screens use static mocks instead of real tRPC calls. Hardcoded `drv_default_01` driver ID must be replaced with session identity.
4. **Driver-Scoped tRPC Procedures Missing**: Backend lacks `driverProcedure` context — drivers cannot self-service `getMyTrips`, `getMyProfile`, or `checkInTicket` from the mobile app.
5. **Missing 5-Step Driver Self-Registration Wizard**: Drivers cannot self-register via mobile. Currently requires operator manual entry via Web ERP. Full spec in [Document 10](./10-safarpay-blueprint-and-enterprise-features-gap-audit.md).
6. **No Urgent Dispatch Alert System**: Dispatch events appear only in a passive list — zero audio, vibration, or full-screen modal interrupt for urgent trips.

### 🟡 P2 — Medium: Package & Design Sync

7. **7 Packages Missing from `apps/driver-app`**: `@hugeicons/react-native`, `@hugeicons/core-free-icons`, `i18next`, `react-i18next`, `expo-image-picker`, `expo-image-manipulator`, `zustand`, `rn-international-phone-number`. Full table in [Document 12](./12-package-parity-and-design-system-alignment-audit.md).
8. **Driver Earnings Screen Missing**: No `(tabs)/earnings.tsx` screen despite `DriverShift` schema being fully implemented.
9. **French (fr) i18n Missing from Driver App**: Mandatory for West Africa (Côte d'Ivoire) commercial deployment.

---

## 4. Phased Master Execution Guide

All tasks are cataloged sequentially with verification gates in [**13-phased-execution-master-plan.md**](./13-phased-execution-master-plan.md):

* **Phase 0**: Emergency Fixes & Critical Crash Remediation (P0)
* **Phase 1**: Dependency Synchronization & Mapbox Setup (P0 / P1)
* **Phase 2**: Backend tRPC & Driver IAM Architecture (P1)
* **Phase 3**: Mapbox Geospatial Engine Integration (P1)
* **Phase 4**: Driver App Frontend & Real API Wiring (P1)
* **Phase 5**: Safarpay Enterprise Blueprint Features (P2)
* **Phase 6**: Real-time Telemetry & WebSocket Hardening (P2)
* **Phase 7**: Localization (fr/en) & Design Polish (P3)
* **Phase 8**: End-to-End Verification & Release QA (P3)
