# 🗺️ Moja Ride — Comprehensive Product Roadmap & Goals

This document outlines the strategic vision, execution phases, and complete actionable backlog for Moja Ride across all platforms: Web (`apps/web`), Traveler App (`apps/traveler-app`), Driver App (`apps/driver-app`), Booth App (`apps/booth-app`), and documentation sites (`guides.mojaride.net`, `docs.mojaride.net`).

---

## 🌟 North Star & Core Vision

> **"To become the operating system of intercity passenger transport in West Africa, connecting passengers with operators through an intuitive booking marketplace and an enterprise-grade ERP dispatch platform."**

---

## 🧭 Milestone & Phase Breakdown

```
[Phase 1: Foundation] ✅ COMPLETE
        │
[Phase 2: Core Platform & Operator ERP] 🔄 CURRENT SPRINT
        ├── Overview & Dispatch Board overhaul (Manifest, Crew)
        ├── Common Header & Action Cards unification across all operator pages
        ├── Full Nuqs query state hardening & type-safe URL synchronization
        └── Strict Prisma type inference (eliminate `any` types)
        │
[Phase 3: Production DevOps & Infrastructure] 🛡️ IN PROGRESS
        ├── GitHub Container Registry (GHCR) automated container builds
        ├── Signoz APM, Traces & Logs integration
        └── Uptime Kuma monitoring & production DB health checks
        │
[Phase 4: Telemetry & Multimodal Growth] 🚀 SCHEDULED
        ├── PostHog end-to-end metrics tracking (Web, Traveler, Driver)
        ├── Operator Mobile Analytics link
        └── WhatsApp Conversational Booking Agent for passengers
        │
[Phase 5: Knowledge & Documentation Ecosystem] 📚 SCHEDULED
        ├── guides.mojaride.net (Operator video guides, tutorials, onboarding)
        └── docs.mojaride.net (Developer API references, webhooks, architecture)
```

---

## 📋 Comprehensive Master Backlog & Todo Registry

### 1. 🎨 Operator Portal UI/UX Unification & Page Redesigns (`app:web-operator`)
* [ ] **Curate Full Page Redesign Audit**: Audit all web pages across passenger, operator, and admin views to curate high-end visual redesign requirements.
* [ ] **Operator Dashboard Overview Page (`/operator`)**: Modernize overview with high-level KPI cards, live trip counter, occupancy gauges, quick actions, and revenue summary.
* [ ] **Common Header Unification**: Ensure the standardized header component (currently used in Bookings, Reviews, Terminals, Routes) is adopted across:
  * Dispatch Board (`/operator/trips`)
  * Schedules (`/operator/schedules`)
  * Drivers (`/operator/drivers`)
  * Driver Marketplace (`/operator/drivers/marketplace`)
  * Sent Offers (`/operator/drivers/offers`)
  * Revenue (`/operator/revenue`)
  * Withdrawals (`/operator/withdraw`)
  * Promotions (`/operator/promotions`)
  * Staff (`/operator/staff`)
* [ ] **Common Action Cards System**: Create and deploy consistent, clickable action cards across:
  * Overview Page
  * Terminals (`/operator/terminals`)
  * Routes (`/operator/routes`)
  * Buses / Fleet (`/operator/fleet`)
  * Drivers (`/operator/drivers`)
  * Revenue (`/operator/revenue`)
  * Withdrawals (`/operator/withdraw`)
  * Promotions (`/operator/promotions`)
* [ ] **Dispatch Board Trip Manifest Drawer (`SCRUM-12`)**: Slide-over drawer displaying live passenger manifest, seat assignments, check-in status, ticket QR details, and emergency contacts.
* [ ] **Dispatch Board Crew Assignment (`SCRUM-13`)**: Interactive modal/dropdown to assign Driver, Relief Driver, and Conductor to scheduled trips.

---

### 2. ⚡ Architecture, State & Type Safety (`core:architecture`)
* [ ] **Fix Nuqs Setup Across All Web Pages (`SCRUM-10`)**:
  * Replace buggy query string parsing with type-safe `useQueryState` / `useQueryStates` from `nuqs`.
  * Standardize search, date range, pagination, status tabs, and filter drawers to sync cleanly with browser history.
  * Eliminate infinite re-renders or dropped query parameters on page refresh.
* [ ] **Component Centralization**:
  * Consolidate duplicate UI widgets (modals, filter bars, status badges, confirmation dialogs, stat cards) into shared component libraries (`packages/ui` or `apps/web/components/shared`).
* [ ] **Strict Prisma Type Inference (Eliminate `any`)**:
  * Remove untyped `any` and unsafe type assertions across all server actions, tRPC/route handlers, mutations, and queries.
  * Utilize Prisma's generated types (`Prisma.TripGetPayload<...>`, `Prisma.BookingGetPayload<...>`) for strict end-to-end type safety between database and UI.

---

### 3. 🛡️ Infrastructure, DevOps & Observability (`infra:devops`, `infra:observability`)
* [ ] **GitHub Container Registry (GHCR) Pipeline (`SCRUM-11`)**:
  * Configure GitHub Actions workflow to build multi-stage Docker images on push/release and publish to `ghcr.io/moja-ride/*`.
* [ ] **Production Monitoring with Uptime Kuma (`SCRUM-9`)**:
  * Deploy and configure Uptime Kuma for continuous HTTP health checks, SSL certificate expiry checks, and latency tracking for web and APIs.
* [ ] **Production Telemetry with Signoz & DB Hardening (`SCRUM-9`)**:
  * Instrument OpenTelemetry (OTel) traces, error reporting, and query performance in the Next.js and backend runtime.
  * Connect production PostgreSQL health checks and connection pool monitoring.

---

### 4. 📈 Analytics & Mobile Expansion (`infra:observability`, `app:mobile`)
* [ ] **PostHog Metrics Strategy Across All Platforms (`SCRUM-8`)**:
  * Define tracking taxonomy for Web Portal (operator interactions, funnel conversion, booking drops).
  * Instrument Traveler App (search events, seat selection, checkout progression, ticket views).
  * Instrument Driver App (trip start/stop, check-in scans, GPS waypoint updates).
* [ ] **Operator Analytics Mobile Integration (`SCRUM-6`)**:
  * Create mobile-responsive views or deep links for operators to monitor live revenue, bus occupancy, and dispatch KPIs directly on mobile devices.
* [ ] **WhatsApp Conversational Agent for Passengers (`SCRUM-5`)**:
  * Build an automated WhatsApp assistant allowing travelers to check bus times, book seats, receive digital ticket PDFs, and get trip delay notifications.

---

### 5. 📚 External Documentation Portals (`docs:ecosystem`)
* [ ] **`guides.mojaride.net`**:
  * Create the video and knowledge-base portal for bus operators and terminal staff.
  * Include step-by-step interactive walkthroughs for fleet onboarding, route creation, dispatch operations, and revenue withdrawal.
* [ ] **`docs.mojaride.net`**:
  * Build the public developer documentation hub with API references, webhooks (Paystack, Novu), authentication protocols, and monorepo architectural standards.

---

## 🎯 OKRs & Measurable Success Metrics

| Pillar | Objective | Key Results (Target) |
| :--- | :--- | :--- |
| **UX & Consistency** | Single unified design system across all operator pages | 100% of operator pages use the standardized Header and Action Cards. |
| **Code Quality** | Zero TypeScript `any` leaks & zero URL desyncs | 0 `any` types in database queries/mutations; 100% test pass on Nuqs URL filters. |
| **Uptime & Health** | Enterprise-grade production monitoring | 99.9% uptime SLA verified on Uptime Kuma; < 250ms p95 latency tracked via Signoz. |
| **User Engagement** | Full visibility into passenger and operator behaviors | 100% of critical funnel steps instrumented with PostHog across Web, Traveler, and Driver apps. |
| **Support Automation** | Self-serve onboarding and passenger ticketing | 40% reduction in support requests via WhatsApp agent and `guides.mojaride.net`. |
