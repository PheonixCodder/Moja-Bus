# Web App — tRPC Router Map

Comprehensive reference for all tRPC procedures across `apps/web/trpc/routers/`. Synchronized as part of the tRPC architecture audit and remediation master plan.

---

## 1. Middleware Types & Authorization Invariants

| Middleware | Source File | Context Guard & Semantics |
| :--- | :--- | :--- |
| `publicProcedure` | `trpc/init.ts` | No authentication required. Public trip search, static operators, marketing blog posts. |
| `protectedProcedure` | `trpc/init.ts` | Valid Better Auth session required. Populates `ctx.user` and `ctx.session`. |
| `operatorProcedure` | `trpc/init.ts` | Protected session + verified operator membership. |
| `operatorCompanyProcedure` | `trpc/init.ts` | Operator session with active company context (`ctx.companyId`), memoized via `ctx._cache`. Checks RBAC permissions via `requirePermission()`. |
| `driverProcedure` | `trpc/init.ts` | Protected session + active `DriverProfile` or `CONDUCTOR` operator profile, memoized via `ctx._cache`. |
| `adminProcedure` | `trpc/init.ts` | Session + active, un-suspended `AdminStaff` profile, memoized via `ctx._cache`. Requires specific permission via `requireAdminPermission()`. |
| `boothProcedure` | `trpc/init.ts` | Protected session + active booth cashier assignment at an operational terminal. |

---

## 2. Active Domain Routers (26 Subrouters in `_app.ts`)

| Key | File Path | Primary Consumers | Business Domain & Capabilities |
| :--- | :--- | :--- | :--- |
| `public` | `routers/public.ts` | Web, Traveler, Booth, Driver | Public directory, operator profiles, app versioning. *(Note: `getNotificationToken` is deprecated in favor of `notifications.getNotificationToken`)*. |
| `search` | `routers/search.ts` | Web, Traveler | Trip search engine, origin/destination autocomplete, date filtering, seat availability. |
| `booking` | `routers/booking.ts` | Web, Traveler, Booth | Seat reservation holds, booking checkout, ticket generation, QR issuance, cancellation quotes. |
| `passenger` | `routers/passenger.ts` | Web, Traveler | Traveler preferences, passenger wallet balance & ledger, saved companion profiles, reviews. |
| `payments` | `routers/payments.ts` | Web, Traveler, Booth | Paystack payment initialization & verification, booking cancellation refunds, webhook handlers. |
| `trips` | `routers/trips.ts` | Web, Driver, Booth | Scheduled trips, seat maps, departure statuses, route delays, stop arrivals. |
| `routes` | `routers/routes.ts` | Web, Driver | Route definitions, stops, waypoints, city pairs, estimated run times. |
| `schedules` | `routers/schedules.ts` | Web | Recurring trip schedules, seasonal timetables, departure frequency templates. |
| `locations` | `routers/locations.ts` | Web, Traveler | Geographic cities, regions, terminal geocoordinates, map points of interest. |
| `terminals` | `routers/terminals.ts` | Web, Booth | Bus station hubs, terminal gates, counter bays, ticket office locations. |
| `drivers` | `routers/drivers.ts` | Driver, Web (Operator) | Driver profiles, KYC verification, shift tracking, live GPS telemetry, vehicle assignment. |
| `fleet` | `routers/fleet.ts` | Web (Operator) | Vehicle inventory, bus models, seat layouts, inspection checklists, vehicle GPS tracking. |
| `operator` | `routers/operator.ts` | Web (Operator) | Operator company profile, banking details, settings, operational analytics, dispatch overview. *(Legacy root settings queries preserved with `@deprecated` for mobile backward compatibility)*. |
| `staff` | `routers/staff.ts` | Web (Operator) | Operator employee roster, dispatchers, cashiers, role-based permission management. |
| `invitation` | `routers/invitation.ts` | Web, Driver | Staff and driver email/SMS invitation onboarding and token redemption. |
| `booth` | `routers/booth.ts` | Booth App | Counter sales, cash drawer shifts, ticket printing, sales reconciliation. |
| `captures` | `routers/captures.ts` | Driver, Web | Physical driver license scanning, identity document capture and upload. |
| `admin` | `routers/admin.ts` | Web (Admin) | Platform administration, operator approvals, system configuration, audit trails. |
| `adminStaff` | `routers/admin-staff.ts` | Web (Admin) | Administrative team members, IAM permissions, internal role assignments. |
| `storage` | `routers/storage.ts` | Web, Mobile | S3/MinIO presigned upload URL generation for receipts, avatars, and KYC documents. |
| `blog` | `routers/blog.ts` | Web, Traveler | Marketing blog posts, announcements, promotional hero banners. |
| `contact` | `routers/contact.ts` | Web | Support contact inquiries, help requests, contact form submissions. |
| `discounts` | `routers/discounts.ts` | Traveler | Passenger coupon redemption, referral credits, invite codes. |
| `notifications` | `routers/notifications.ts` | Web, Traveler, Driver, Booth | Push notification tokens, Novu subscriber HMAC hashes, and unread notification state. Canonical home for `getNotificationToken`. |
| `discountsAdmin` | `routers/discounts-admin.ts` | Web (Admin) | Platform-wide discount campaigns, voucher batch creation. |
| `discountsOperator` | `routers/discounts-operator.ts` | Web (Operator) | Operator-specific promotional fares and early-bird discounts. |

---

## 3. Client Monorepo Packaging & Shared Mobile Client Factory

In compliance with the tRPC architecture remediation master plan:
1. Mobile applications import the backend type contract directly from `@moja/web` without file-path traversals:
```typescript
import type { AppRouter } from "@moja/web/trpc/router";
```
2. Mobile applications consume the single, canonical mobile tRPC client factory from `@moja/shared/mobile-client`:
```typescript
import { createMobileTRPC } from "@moja/shared/mobile-client";

export const {
  TRPCProvider,
  useTRPC,
  getTrpcClient,
  getQueryClient,
  ensureAuthHydrated,
  TRPCReactProvider,
} = createMobileTRPC<AppRouter>({ ... });
```

The export is declared in `apps/web/package.json`:
```json
"exports": {
  "./trpc/router": {
    "types": "./trpc/routers/_app.ts"
  }
}
```

---

*Last Updated: September 2026 (Phase 5 tRPC Architecture Remediation)*
