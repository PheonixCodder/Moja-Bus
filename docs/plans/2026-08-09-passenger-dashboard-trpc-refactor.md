# Passenger Dashboard tRPC Refactor + Dynamic Travel Insights Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Bring the passenger dashboard page (`apps/web/app/[locale]/dashboard/(passenger)/page.tsx`) in line with every other passenger page: server-rendered tRPC `prefetch` + `HydrateClient` wrapping a client view. In the process, eliminate the three hardcoded/fake-data spots, make the Travel Insights chart dynamic (URL-driven date range via nuqs, real spend from `Booking.farePaid`, adaptive MONTHLY/DAILY buckets), and make the "Upcoming trips" panel fetch real bookings instead of an empty `[]`. Everything stays under `features/dashboard/`.

**Architecture:** The page becomes a thin server wrapper (parse nuqs search params → `prefetch` all queries → `HydrateClient` + `Suspense` skeleton). A new client view `features/dashboard/views/passenger-dashboard-view.tsx` owns the layout and reads URL state + data with `useQueryStates` and `useSuspenseQuery`, exactly like `features/operator/views/operator-revenue-view.tsx`. Data comes from tRPC procedures on the existing `passengerRouter` (3 new, the rest reused), so the dashboard gains client-side cacheability/refetch and loses raw Prisma in the render path.

**Tech Stack:** pnpm, tRPC + TanStack Query, nuqs, Next.js app router, next-intl, recharts, date-fns, Base UI (Calendar `mode="range"`, Popover). All changes in `apps/web`, `packages/schemas`, `packages/types`.

---

## Current State (verified in code)

| Spot | Verdict | Evidence |
|---|---|---|
| `(passenger)/page.tsx` | Server component rendering `<DashboardView />` — itself fine, no trpc | `page.tsx:15` |
| `features/dashboard/views/dashboard-view.tsx` | 10 raw Prisma queries in `Promise.allSettled`, computed in the render path | `dashboard-view.tsx:53-163` |
| `spent` stat | FAKE — `count * 7500` XOF per-trip estimate | `dashboard-view.tsx:203` |
| `travel-stats-chart.tsx` | FAKE fallback `[2,1,3,2,4,3]` and `* 7500` when empty | `travel-stats-chart.tsx:36-43` |
| `sessions-panel.tsx` | Hardcoded `const trips: never[] = []` — always empty | `sessions-panel.tsx:7` |
| `noBookingsDesc` cities | Hardcoded "Bouaké, Yamoussoukro, or San Pédro" in view (pre-existing, kept) | `dashboard-view.tsx:338` |
| Existing tRPC already available | `passenger.getDashboardStats` (4 counts), `getWalletBalance`, `getWalletLedger`, `listSaved`, `booking.listMyBookings({ filter })` | `trpc/routers/passenger.ts`, `booking.ts:173` |

New procedures needed (3): `getTravelInsights({ from, to })`, `getRecentBookings({ limit })`, `getNextDeparture()`. Everything else is reused.

---

### Task 1: Schemas + DTOs for the new dashboard procedures

**Files:**
- Modify: `packages/schemas/src/passenger.ts`
- Modify: `packages/types/src/passenger.ts`
- Modify: `packages/types/src/index.ts`

**Step 1: Add input schemas** to `packages/schemas/src/passenger.ts` (mirror `operatorRevenueAnalyticsSchema` in `packages/schemas/src/operator.ts:155-159`):

```ts
export const getTravelInsightsSchema = z.object({
  from: z.string().datetime(),
  to: z.string().datetime(),
});
export type GetTravelInsightsInput = z.infer<typeof getTravelInsightsSchema>;

export const getRecentBookingsSchema = z.object({
  limit: z.number().int().min(1).max(10).default(3),
});
export type GetRecentBookingsInput = z.infer<typeof getRecentBookingsSchema>;
```

(`getNextDeparture` takes no input — no schema.)

**Step 2: Add DTOs** to `packages/types/src/passenger.ts`:

```ts
export type TravelInsightsBucket = "MONTHLY" | "DAILY";
export interface TravelInsightsPoint {
  key: string; // "YYYY-MM" (MONTHLY) or "YYYY-MM-DD" (DAILY), Abidjan calendar
  trips: number;
  spentXOF: number;
}
export interface TravelInsightsResult {
  bucket: TravelInsightsBucket;
  items: TravelInsightsPoint[];
}
```

**Step 3: Export** both new types from `packages/types/src/index.ts`.

**Step 4: Commit**

```bash
git add packages/schemas/src/passenger.ts packages/types
git commit -m "feat(schemas): add passenger dashboard travel-insights + recent-bookings schemas/types"
```

---

### Task 2: Implement the three procedures on `passengerRouter`

**Files:**
- Modify: `apps/web/trpc/routers/passenger.ts`

**Step 1: Add imports**

- `getTravelInsightsSchema`, `getRecentBookingsSchema` from `@moja/schemas`
- `getCalendarDateKey`, `getZonedDateParts` from `@/lib/timezone`
- `sumXOF`, `toSafeDisplayNumber` from `@/lib/money` (already imported: `toSafeDisplayNumber`)

**Step 2: Add `getTravelInsights`** (real spend from `Booking.farePaid`; adaptive bucketing; empty range returns `items: []` — no fake data):

```ts
getTravelInsights: protectedProcedure
  .input(getTravelInsightsSchema)
  .query(async ({ ctx, input }) => {
    const userId = ctx.user.id;
    const fromDate = new Date(input.from);
    const toDate = new Date(input.to);

    const bookings = await ctx.prisma.booking.findMany({
      where: {
        userId,
        status: "CONFIRMED",
        createdAt: { gte: fromDate, lte: toDate },
      },
      select: { createdAt: true, farePaid: true },
    });

    const spanDays = Math.max(
      1,
      Math.round((toDate.getTime() - fromDate.getTime()) / 86_400_000),
    );
    const bucket: TravelInsightsBucket = spanDays > 62 ? "MONTHLY" : "DAILY";

    const totals = new Map<string, { trips: number; spent: bigint }>();
    for (const b of bookings) {
      const parts = getZonedDateParts(b.createdAt);
      const key =
        bucket === "MONTHLY"
          ? `${parts.year}-${String(parts.month).padStart(2, "0")}`
          : getCalendarDateKey(b.createdAt);
      const cur = totals.get(key) ?? { trips: 0, spent: 0n };
      cur.trips += 1;
      cur.spent += BigInt(b.farePaid);
      totals.set(key, cur);
    }

    const items = Array.from(totals.entries())
      .map(([key, v]) => ({
        key,
        trips: v.trips,
        spentXOF: toSafeDisplayNumber(v.spent),
      }))
      .sort((a, b) => a.key.localeCompare(b.key));

    return { bucket, items };
  }),
```

**Step 3: Add `getRecentBookings`** — reuse the exact include shape from the current view (`dashboard-view.tsx:88-119`: `trip.schedule.route.originTerminal/destTerminal`, `originTripStop.terminal`, `destinationTripStop.terminal`, `company`):

```ts
getRecentBookings: protectedProcedure
  .input(getRecentBookingsSchema)
  .query(async ({ ctx, input }) => {
    return ctx.prisma.booking.findMany({
      where: { userId: ctx.user.id },
      orderBy: { createdAt: "desc" },
      take: input.limit,
      include: {
        trip: {
          include: {
            schedule: {
              include: {
                route: {
                  include: { originTerminal: true, destTerminal: true },
                },
              },
            },
          },
        },
        originTripStop: { include: { terminal: true } },
        destinationTripStop: { include: { terminal: true } },
        company: true,
      },
    });
  }),
```

**Step 4: Add `getNextDeparture`** — mirrors `dashboard-view.tsx:137-162`:

```ts
getNextDeparture: protectedProcedure.query(async ({ ctx }) => {
  return ctx.prisma.booking.findFirst({
    where: {
      userId: ctx.user.id,
      status: "CONFIRMED",
      trip: { departureDate: { gte: new Date() } },
    },
    orderBy: { trip: { departureDate: "asc" } },
    include: {
      trip: {
        include: {
          schedule: {
            include: {
              route: {
                include: { originTerminal: true, destTerminal: true },
              },
            },
          },
        },
      },
      originTripStop: { include: { terminal: true } },
      destinationTripStop: { include: { terminal: true } },
    },
  });
}),
```

**Step 5: Typecheck**

Run: `pnpm typecheck --filter web`
Expected: clean (0 errors).

**Step 6: Commit**

```bash
git add apps/web/trpc/routers/passenger.ts
git commit -m "feat(passenger): add getTravelInsights/getRecentBookings/getNextDeparture tRPC procedures"
```

---

### Task 3: nuqs search-params for the dashboard date range

**Files:**
- Create: `apps/web/features/dashboard/lib/dashboard-search-params.ts`

Mirror `features/operator/lib/revenue-search-params.ts` exactly. Default range = first day of month 5 months back → today (≈ last 6 months):

```ts
import { createSearchParamsCache, parseAsIsoDateTime } from "nuqs/server";
import { startOfMonth, subMonths } from "date-fns";

export const dashboardParsers = {
  from: parseAsIsoDateTime.withDefault(startOfMonth(subMonths(new Date(), 5))),
  to: parseAsIsoDateTime.withDefault(new Date()),
};

export const dashboardSearchParamsCache = createSearchParamsCache(dashboardParsers);
```

**Step 2: Commit**

```bash
git add apps/web/features/dashboard/lib/dashboard-search-params.ts
git commit -m "feat(dashboard): add nuqs from/to search params for the travel insights range"
```

---

### Task 4: Server page — prefetch + HydrateClient

**Files:**
- Modify: `apps/web/app/[locale]/dashboard/(passenger)/page.tsx`

**Step 1: Rewrite the page**

```tsx
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { Skeleton } from "@moja/ui/components/ui/skeleton";
import { PassengerDashboardView } from "@/features/dashboard/views/passenger-dashboard-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { dashboardSearchParamsCache } from "@/features/dashboard/lib/dashboard-search-params";
import { getUser } from "@/lib/auth-server";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "passengerDashboard.overview" });
  return { title: t("metaTitle") };
}

export default async function PassengerDashboardPage({ searchParams }: PageProps) {
  const { from, to } = dashboardSearchParamsCache.parse(await searchParams);
  const user = await getUser();
  const userName = user?.name?.split(" ")[0] ?? "Traveler";

  await Promise.all([
    prefetch(trpc.passenger.getDashboardStats.queryOptions()),
    prefetch(trpc.passenger.getRecentBookings.queryOptions({ limit: 3 })),
    prefetch(trpc.passenger.getNextDeparture.queryOptions()),
    prefetch(trpc.passenger.getWalletBalance.queryOptions()),
    prefetch(trpc.passenger.getWalletLedger.queryOptions({ limit: 3, offset: 0 })),
    prefetch(trpc.passenger.listSaved.queryOptions()),
    prefetch(trpc.booking.listMyBookings.queryOptions({ filter: "upcoming", limit: 5 })),
    prefetch(trpc.passenger.getTravelInsights.queryOptions({
      from: from.toISOString(),
      to: to.toISOString(),
    })),
  ]);

  return (
    <HydrateClient>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
          <Suspense fallback={<DashboardSkeleton />}>
            <PassengerDashboardView userName={userName} />
          </Suspense>
        </div>
      </div>
    </HydrateClient>
  );
}
```

Add a local `DashboardSkeleton` (small client-free component in the same file or a sibling) that mirrors the page structure with `Skeleton` blocks, following the operator revenue page fallback (`operator/(dashboard)/revenue/page.tsx:48-70`).

**Step 2: Delete the old server view**

Remove `apps/web/features/dashboard/views/dashboard-view.tsx` (no longer referenced anywhere — grep confirmed `DashboardView` is only imported by this page). `features/dashboard/components/page-header.tsx` is only imported by the deleted view; delete it too if typecheck confirms nothing else uses it (`page-title-header.tsx` is a different, still-used file — keep it).

**Step 3: Typecheck**

Run: `pnpm typecheck --filter web`
Expected: clean.

**Step 4: Commit**

```bash
git add apps/web/app/[locale]/dashboard/\(passenger\)/page.tsx
git rm apps/web/features/dashboard/views/dashboard-view.tsx apps/web/features/dashboard/components/page-header.tsx
git commit -m "feat(dashboard): server prefetch + HydrateClient on passenger dashboard page"
```

---

### Task 5: Client dashboard view

**Files:**
- Create: `apps/web/features/dashboard/views/passenger-dashboard-view.tsx`

**Step 1: Build the client view** (`"use client"`)

Props: `{ userName: string }`.

```tsx
const trpc = useTRPC();
const t = useTranslations("passengerDashboard.overview");
const locale = useLocale();
const [{ from, to }] = useQueryStates(dashboardParsers, { shallow: false });
```

Use `useSuspenseQuery` for the same 8 queries prefetched in Task 4:

- `trpc.passenger.getDashboardStats.queryOptions()` → stats
- `trpc.passenger.getRecentBookings.queryOptions({ limit: 3 })` → recent bookings timeline
- `trpc.passenger.getNextDeparture.queryOptions()` → live boarding pass
- `trpc.passenger.getWalletBalance.queryOptions()` → wallet hub
- `trpc.passenger.getWalletLedger.queryOptions({ limit: 3, offset: 0 })` → ledger rows for `WalletQuickDeposit`
- `trpc.passenger.listSaved.queryOptions()` → `SavedCompanions` (slice top 4)
- `trpc.booking.listMyBookings.queryOptions({ filter: "upcoming", limit: 5 })` → `SessionsPanel`
- `trpc.passenger.getTravelInsights.queryOptions({ from: from.toISOString(), to: to.toISOString() })` → chart

**Step 2: Port the layout** from `dashboard-view.tsx` JSX (lines 246-499), swapping server hooks for the client equivalents:

- `user.name?.split(" ")[0]` → the `userName` prop in the greeting.
- `t("noBookingsDesc", { cities: "Bouaké, Yamoussoukro, or San Pédro" })` → keep as-is.
- `showLivePass` → `nextDeparture && new Date(nextDeparture.trip.departureDate).getTime() - Date.now() <= 24 * 60 * 60 * 1000`.
- Stats array → built from `getDashboardStats` values; remove the `badgeVariant ... as any` and the dead `digitalTickets` count usage if desired.
- `WalletQuickDeposit recentTransactions={ledger.items}` (already a client component).
- `SavedCompanions companions={saved.slice(0, 4)}`.
- `TravelInsightsChart bucket={insights.bucket} items={insights.items}` (Task 7).
- `SessionsPanel trips={upcoming.items}` (Task 8).

**Step 3: Typecheck + lint**

Run: `pnpm typecheck --filter web` then `pnpm --filter web exec biome check apps/web/features/dashboard`
Expected: clean.

**Step 4: Commit**

```bash
git add apps/web/features/dashboard/views/passenger-dashboard-view.tsx
git commit -m "feat(dashboard): client passenger dashboard view backed by tRPC + nuqs"
```

---

### Task 6: Date-range picker component

**Files:**
- Create: `apps/web/features/dashboard/components/dashboard-date-range-picker.tsx`

Client component. Mirror `features/operator/components/revenue/revenue-header.tsx:59-137` (Popover + `Calendar mode="range"` + `numberOfMonths={2}`) but without the export button / permissions hook. Presets: Last 6 months, This month, Last 30 days, This year — each a `setParams({ from, to: new Date() })` call using `startOfMonth`, `subMonths`, `subDays`, `startOfYear` from date-fns. Labels come from new i18n keys (Task 9).

```tsx
const [{ from, to }, setParams] = useQueryStates(dashboardParsers, { shallow: false });
```

Renders the selected range via `format(from, "dd MMM yyyy") - format(to, "dd MMM yyyy")`.

**Step 2: Commit**

```bash
git add apps/web/features/dashboard/components/dashboard-date-range-picker.tsx
git commit -m "feat(dashboard): travel insights date-range picker (nuqs-bound)"
```

---

### Task 7: Refactor chart to real, adaptive data

**Files:**
- Rename + modify: `apps/web/features/dashboard/components/travel-stats-chart.tsx` → `apps/web/features/dashboard/components/travel-insights-chart.tsx`

**Step 1: Rewrite the component** (`"use client"`)

Props: `{ bucket: TravelInsightsBucket; items: TravelInsightsPoint[] }` (types from `@moja/types`).

- **Remove the fake fallback entirely** (lines 36-43). If `items.length === 0`, render an empty-state (`t("chartEmpty")`, new key — Task 9) inside the card instead of the chart.
- X labels: MONTHLY → `Intl.DateTimeFormat(locale, { month: "short" })` parsed from `"YYYY-MM"`; DAILY → `Intl.DateTimeFormat(locale, { month: "short", day: "numeric" })` parsed from `"YYYY-MM-DD"`.
- Y axis = trips count (unchanged). Tooltip: `trips` via `chartTooltipTrips`, `spent` via `formatXOF(item.spentXOF)` from `@/lib/money` (replaces the inline `${val.toLocaleString(locale)} XOF`).
- Keep the `trips` gradient/stroke `#ee237c` and the existing chart config keys.

**Step 2: Update the import** in `passenger-dashboard-view.tsx` to `TravelInsightsChart`.

**Step 3: Delete** `travel-stats-chart.tsx`.

**Step 4: Typecheck**

Run: `pnpm typecheck --filter web`
Expected: clean.

**Step 5: Commit**

```bash
git add apps/web/features/dashboard/components/travel-insights-chart.tsx apps/web/features/dashboard/views/passenger-dashboard-view.tsx
git rm apps/web/features/dashboard/components/travel-stats-chart.tsx
git commit -m "feat(dashboard): dynamic adaptive travel-insights chart with real spend data"
```

---

### Task 8: Upcoming trips panel — real data

**Files:**
- Modify: `apps/web/features/dashboard/components/sessions-panel.tsx`

**Step 1: Convert to a client component receiving real trips**

- Add `"use client"`; props: `{ trips: PassengerBookingsListResult["items"] }` (i.e. `PassengerBookingSummary[]` from `@moja/types`).
- Replace `const trips: never[] = []` with the prop. When non-empty, render one row per trip above/behind the empty state:
  - `originCityName → destinationCityName` (from the summary)
  - `departureTime` formatted in the locale (same `toLocaleDateString` shape as the recent-bookings timeline)
  - `companyName` and, if a single seat, `seats[0].seatLabel`; link the row to `/tickets/{seats[0].ticketToken}` or `/dashboard/bookings?tab=upcoming`.
- Keep the existing empty state exactly as-is (already i18n'd).

**Step 2: Add i18n keys** under `passengerDashboard.sessions` (Task 9) for the row: `departs`/`seat`/`passenger`-ish labels as needed. Keep it minimal — reuse existing `overview.timelineSeat`/`sessions.*` where possible.

**Step 3: Typecheck + lint**

Run: `pnpm typecheck --filter web`
Expected: clean.

**Step 4: Commit**

```bash
git add apps/web/features/dashboard/components/sessions-panel.tsx
git commit -m "feat(dashboard): upcoming-trips panel now renders real bookings"
```

---

### Task 9: Localization (en + fr)

**Files:**
- Modify: `apps/web/messages/en.json`
- Modify: `apps/web/messages/fr.json`

Add the new keys under `passengerDashboard` (keep namespaces consistent with the existing chart keys in `passengerDashboard.tickets`):

- `tickets.chartEmpty`: "No trips in this period yet." / "Aucun trajet sur cette période pour l'instant."
- `tickets.chartPickRange`: "Pick a range" / "Choisir une période"
- `tickets.chartPresets.last6Months` / `last30Days` / `thisMonth` / `thisYear` (EN + FR).
- `sessions` row keys if needed (e.g. `sessions.seat`: "Seat {id}"; reuse `overview.timelineSeat` if possible to avoid duplication).

Verify both files stay structurally identical to `en.json` (the project types translations via `IntlMessages` in `global.d.ts`). The existing `chartTripsLabel`/`chartSpentLabel`/`chartTitle`/`chartDescription`/`chartTooltipTrips` keys already exist in both — confirm they still line up (in `fr.json` earlier grep showed some chart keys; ensure all five exist in both files, add any missing).

**Step 2: Commit**

```bash
git add apps/web/messages
git commit -m "feat(i18n): dashboard travel-insights range + empty-state keys (en/fr)"
```

---

### Task 10: Final verification pass

**Step 1: Full checks**

Run: `pnpm typecheck`
Run: `pnpm check`
Expected: all clean.

**Step 2: Manual QA checklist (browser, passenger account with some history)**

1. `/dashboard` renders instantly (server prefetch) with all 8 queries hydrated — no spinners on first paint beyond the skeleton.
2. Stat cards (wallet, upcoming, pending, saved passengers) match `getDashboardStats`.
3. Travel Insights chart shows REAL spend (no more `count * 7500`); selecting a > 62-day range flips to MONTHLY buckets, a shorter range flips to DAILY; the URL gains `from=`/`to=` and is shareable/deep-linkable; empty range shows the empty state (no fake bars).
4. "Upcoming trips" panel lists real upcoming bookings; empty state shows for a fresh account.
5. Wallet hub, saved companions, recent-bookings timeline, live boarding pass (≤ 24 h) all still render and behave.
6. Switching locale (en/fr) shows translated chart/preset keys.

**Step 3: Commit any stragglers**

```bash
git add -A
git commit -m "chore(dashboard): final cleanup after passenger dashboard tRPC refactor"
```

---

## Follow-ups (explicitly out of scope)

- `dashboard-view.tsx:338` hardcoded cities string in `noBookingsDesc` — pre-existing, cosmetic, could be driven by popular-route data later.
- The chart's MONTHLY/DAILY cutoff (`62` days) is a heuristic; revisit if product wants fixed granularity.
- `getRecentBookings`/`getNextDeparture` return full Prisma entities over the wire (matching the pre-existing operator/wallet patterns); if payload size becomes a concern, replace with slim DTOs.
