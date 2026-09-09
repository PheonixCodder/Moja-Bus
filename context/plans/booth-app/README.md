# Booth App — Implementation Plan Index

> **App**: `apps/booth-app`  
> **Status**: Phase 1 ✅ — Phase 2 ✅ — Phase 3 ✅ — Phase 4 ✅ — Phase 5 ✅ — Phase 6 ✅ — Phase 7 ✅ — Phase 8 ✅ — Phase 9 ✅ (complete 2026-09-09)  
> **Created**: 2026-09-07  
> **Language**: French (fr) primary — English (en) scaffolded, strings to be added immediately post-launch

---

## What Is the Booth App?

A React Native / Expo tablet + phone app for **operator terminal staff** who sell tickets to walk-up passengers at physical bus terminals in Côte d'Ivoire. It connects to the same `apps/web` tRPC server as every other Moja Ride app.

**It is NOT:**
- A passenger app (that is `apps/traveler-app`)
- A driver app (that is `apps/driver-app`)
- An ERP (that is `apps/web`)

**It IS:**
- A dedicated physical counter sales tool
- An offline-capable seat reservation system
- A cash + Paystack QR payment terminal
- A passenger check-in scanner
- A daily cash reconciliation tool

---

## Phase Index

| Phase | File | Scope | Status |
|-------|------|-------|--------|
| **1** | [phase-1-schema-and-role.md](./phase-1-schema-and-role.md) | DB schema, enums, `BOOTH` role, `BoothSale` model, migrations, `boothProcedure` middleware | ✅ Complete |
| **2** | [phase-2-trpc-booth-router.md](./phase-2-trpc-booth-router.md) | All 15 tRPC `booth.*` procedures, Zod schemas, router registration | ✅ Complete |
| **3** | [phase-3-app-scaffold.md](./phase-3-app-scaffold.md) | Full app directory, `package.json`, `app.json`, Expo config, workspace registration | ✅ Complete |
| **4** | [phase-4-auth-and-boot-gate.md](./phase-4-auth-and-boot-gate.md) | Better Auth client, tRPC client, root layout, login, boot gate, terminal select, session store | ✅ Complete |
| **5** | [phase-5-sell-flow-online.md](./phase-5-sell-flow-online.md) | Trip list, seat map, passenger lookup/creation, payment (cash + Paystack QR), confirmation | ✅ Complete |
| **6** | [phase-6-offline-hold-pool.md](./phase-6-offline-hold-pool.md) | Hold pool store, offline queue, network hook, sync lib, offline banner, sell flow wiring | ✅ Complete |
| **7** | [phase-7-checkin-bookings-reconcile.md](./phase-7-checkin-bookings-reconcile.md) | QR check-in, bookings tab, end-of-day reconciliation, profile tab | ✅ Complete |
| **8** | [phase-8-notifications.md](./phase-8-notifications.md) | Novu workflows, outbox entries, urban conflict alerts in ERP | ✅ Complete |
| **9** | [phase-9-context-and-docs.md](./phase-9-context-and-docs.md) | AGENTS.md, app context, ui-registry, progress-tracker update, post-launch items | ✅ Complete |

---

## Key Architectural Decisions (Summary)

| Topic | Decision |
|-------|---------|
| Framework | React Native + Expo SDK 56, Expo Router, NativeWind |
| Auth | Better Auth (email + password) — same pattern as driver-app |
| API | tRPC client → `apps/web` tRPC server (same as all apps) |
| Role | New `BOOTH` StaffRole + `ROLE_TEMPLATES["BOOTH"]` |
| Eligible login roles | `BOOTH`, `DISPATCHER`, `OPERATIONS`, `MANAGER`, `ADMIN`, `OWNER` |
| Terminal binding | Per-session selector; switchable mid-session |
| Offline — intercity | Pre-fetched real DB hold pool (5 holds × 90-min TTL per trip) |
| Offline — urban | Capacity decrement cache; server validates on sync |
| Cash payment | `booth.createCashSale` — one `$transaction` (hold + cash + confirm) |
| Paystack payment | QR link on screen; 3s poll; 10-min timeout |
| Convenience fee | NOT waived — same as self-service |
| Walk-up passenger | Creates unverified TRAVELER; sends ticket + verify link via email |
| Ticket delivery | Passenger opens traveler app + logs in; Bluetooth print fallback |
| Printer library | `react-native-thermal-receipt-printer-enhanced` |
| Language | French only in v1; English strings to be added immediately post-launch |
| Reconciliation | End-of-day per-staff per-terminal report |
| Urban overbooking UX | Option B — yellow banner on booth, conflict escalated to operator ERP trip detail |
| Admin booth sales view | Post-launch — data ready in `BoothSale`, just needs web view |

---

## Post-Launch Items (NOT in scope for v1 but tracked here)

| Item | Notes |
|------|-------|
| **English (en) locale strings** | Files scaffolded; fill immediately after app ships |
| **Admin booth sales dashboard** | Web view in `apps/web` showing all booth sales across operators; data ready in `BoothSale` |
| **Urban overbooking resolution UI** | Full ERP conflict resolution screen (beyond the warning banner) |
| **Multi-printer support** | Currently Bluetooth thermal only; add WiFi thermal post-launch |

---

## Shared Packages Used

| Package | Usage |
|---------|-------|
| `@moja/db` | Prisma client (BoothSale + existing models) |
| `@moja/schemas` | Zod schemas + `ROLE_TEMPLATES["BOOTH"]` |
| `@moja/auth` | Better Auth client setup |
| `@moja/theme` | Brand tokens, colors, typography via NativeWind |
| `apps/web` tRPC | `booth.*` router consumed via tRPC client |
