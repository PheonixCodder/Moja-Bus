# Web App — Context Overview

**App**: `apps/web`  
**Framework**: Next.js 15, App Router, React 19, Tailwind CSS 4, shadcn/ui, tRPC  
**Role**: Serves three distinct portal surfaces — **Passenger Booking Web**, **Operator ERP Portal**, and **Super Admin Dashboard** — plus the shared **tRPC API server** that powers all three apps.

---

## 1. Portal Surfaces & Route Map

```
apps/web/app/
├── (auth)/                     # Public auth pages
│   ├── login/                  # OTP login (email or phone)
│   └── verify/                 # OTP verification screen
│
├── (passenger)/                # Passenger-facing public web
│   ├── search/                 # Trip search + results list
│   ├── booking/[id]/           # Seat selection + checkout
│   └── tickets/                # Ticket wallet / QR viewer
│
├── dashboard/                  # Operator ERP Portal (Authenticated)
│   ├── layout.tsx              # Sidebar + auth gate
│   ├── bookings/               # Booking management + check-in
│   ├── fleet/                  # Bus fleet management + live map
│   ├── routes/                 # Route definition
│   ├── schedules/              # Trip schedules + dispatch
│   ├── drivers/                # Driver roster + verification queue
│   ├── revenue/                # Revenue analytics
│   └── settings/               # Operator company settings + staff
│
├── admin/                      # Super Admin Hub (SUPER_ADMIN only)
│   ├── operators/              # Operator approval + management
│   ├── users/                  # User management
│   ├── drivers/                # Platform driver verifications
│   └── analytics/              # Platform analytics
│
└── api/
    ├── auth/[...all]/          # Better Auth catch-all handler
    ├── trpc/[trpc]/            # tRPC endpoint
    └── v1/telemetry/ping       # Driver GPS ingest endpoint
```

---

## 2. Feature Structure

Features are organized by domain under `apps/web/features/`:
```
features/
├── auth/          # Auth UI, session handling
├── booking/       # Passenger booking + seat map
├── driver/        # Operator driver roster + admin verification
├── fleet/         # Fleet management + live map views
├── notifications/ # Outbox worker, payload contracts, Novu inbox
├── operator/      # Operator company setup + onboarding
├── search/        # Aggregator search engine + results
├── schedule/      # Trip schedule management
└── tickets/       # QR ticket generation + scanning
```

---

## 3. State & Data Fetching
- All data goes through **tRPC** (`apps/web/trpc/`). No ad-hoc `fetch()` in UI components.
- Server components use `serverCaller` from `apps/web/trpc/server.tsx` for prefetching.
- Client components use `api.xxx.useQuery()` or `api.xxx.useMutation()` from tRPC client.
- URL state uses `nuqs` for type-safe search params.

---

## 4. Authorization Layers
| Route Zone | Procedure Middleware | Gate Mechanism |
| :--- | :--- | :--- |
| Public search | `publicProcedure` | None |
| Passenger booking | `protectedProcedure` | Better Auth session |
| Operator dashboard | `operatorProcedure` | Session + companyId tenancy |
| Admin hub | `adminProcedure` | Session + `SUPER_ADMIN` or admin permission keys |
| Driver ingest | JWT token validation | `mintTelemetryToken` claim verification |

---

## 5. Notification Inbox (Web)
- The Novu inbox widget (`@novu/react` `<Inbox>`) is rendered in the operator portal header.
- Notification click routing is managed by `components/notification-routes.ts` which maps workflow identifiers to internal Next.js routes.
