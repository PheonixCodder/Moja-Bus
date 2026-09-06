# Moja Ride Design System Audit — Master Monorepo Burndown Index

## Overview
This master index coordinates the exhaustive, file-by-file design system audit for the Moja Ride multi-platform ecosystem. Every single file across mobile applications, web dashboards, shared packages, and archived legacy code is cataloged, analyzed, and tracked.

### Monorepo Rollup Dashboard
| Domain Surface | Tracker Document | Total Files | 🟢 Compliant | 🟡 Minor Drift | 🔴 Critical | Health Score |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **Driver & Conductor Mobile App** | [01-tracker-driver-app.md](./01-tracker-driver-app.md) | `80` | `80` | `0` | `0` | **100%** |
| **Traveler Mobile App** | [02-tracker-traveler-app.md](./02-tracker-traveler-app.md) | `216` | `216` | `0` | `0` | **100%** |
| **Passenger Web Portal & Booking** | [03-tracker-web-passenger.md](./03-tracker-web-passenger.md) | `247` | `247` | `0` | `0` | **100%** |
| **Operator Web Dashboard** | [04-tracker-web-operator.md](./04-tracker-web-operator.md) | `194` | `194` | `0` | `0` | **100%** |
| **Admin Web Dashboard & Governance** | [05-tracker-web-admin.md](./05-tracker-web-admin.md) | `239` | `239` | `0` | `0` | **100%** |
| **Design System Core (UI & Theme Packages)** | [06-tracker-shared-ui-theme.md](./06-tracker-shared-ui-theme.md) | `68` | `68` | `0` | `0` | **100%** |
| **Backend, Services, Schemas & Infrastructure** | [07-tracker-backend-infrastructure.md](./07-tracker-backend-infrastructure.md) | `285` | `285` | `0` | `0` | **100%** |
| **Legacy Repositories & Deprecated Packages** | [08-tracker-legacy-apps.md](./08-tracker-legacy-apps.md) | `85` | `62` | `13` | `10` | **73%** |
| **MONOREPO TOTAL** | **8 Trackers** | **1414** | **1391** | **13** | **10** | **98%** |

---

## Tracker Index & Navigation

1. **[01-tracker-driver-app.md](./01-tracker-driver-app.md)** (80 files)
   - Scope: Driver & conductor mobile app, screens, components, in-cab touch ergonomics, live map, dark theme tokens.
2. **[02-tracker-traveler-app.md](./02-tracker-traveler-app.md)** (216 files)
   - Scope: Traveler mobile app, booking sheets, search, ticket screens, Montserrat typography, offline states.
3. **[03-tracker-web-passenger.md](./03-tracker-web-passenger.md)** (247 files)
   - Scope: Passenger web portal, booking checkout, seat selection, marketing pages, global web CSS.
4. **[04-tracker-web-operator.md](./04-tracker-web-operator.md)** (194 files)
   - Scope: Operator dashboard, fleet tables, dispatch, vehicle manifests, trip scheduling dialogs.
5. **[05-tracker-web-admin.md](./05-tracker-web-admin.md)** (239 files)
   - Scope: Admin platform governance, payouts, carrier KYC verification, ledger data density.
6. **[06-tracker-shared-ui-theme.md](./06-tracker-shared-ui-theme.md)** (68 files)
   - Scope: Core `packages/ui` (60 Base UI primitives) and `packages/theme` design tokens & stylesheets.
7. **[07-tracker-backend-infrastructure.md](./07-tracker-backend-infrastructure.md)** (285 files)
   - Scope: Non-visual accounting: backend APIs, crons, DB seeds, Zod schemas, tRPC routers, type declarations.
8. **[08-tracker-legacy-apps.md](./08-tracker-legacy-apps.md)** (85 files)
   - Scope: Complete inventory of archived packages in `legacy-apps-setup/` ensuring isolation from the active system.
