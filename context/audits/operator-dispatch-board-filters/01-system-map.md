# 01 — System Map

## Route & UI stack

```
apps/web/app/[locale]/dashboard/operator/(dashboard)/trips/page.tsx
  └─ prefetch(trpc.trips.list)   // statusCounts NOT prefetched
  └─ OperatorTripsView
       ├─ Status chips (All + STATUS_CHIPS)
       ├─ TripsToolbar (status select, service type, date range, search)
       ├─ TripCard list (grouped by Abidjan calendar day)
       └─ ManifestDrawer
```

### Key files

| Layer | Path | Role |
| :--- | :--- | :--- |
| Page | `apps/web/app/[locale]/dashboard/operator/(dashboard)/trips/page.tsx` | RSC prefetch of `trips.list` from nuqs |
| View | `apps/web/features/operator/views/operator-trips-view.tsx` | Orchestrates filters, chips, list, empty state |
| URL state | `apps/web/features/operator/lib/trips/trip-search-params.ts` | nuqs parsers (`status`, dates, `q`, page, …) |
| Toolbar | `apps/web/features/operator/components/trips/trips-toolbar.tsx` | Duplicate status control + date pickers |
| API | `apps/web/trpc/routers/trips.ts` → `list`, `statusCounts` | Authoritative query logic |
| Window | `apps/web/lib/timezone.ts` → `getAppRollingTripWindow` | Today → today+N (Abidjan) |
| Generator | `apps/web/lib/trip-generator.ts` + `schedule-trip-window.ts` | Creates ~14-day forward trips |
| Schema | `packages/schemas/src/trips.ts` | Zod `tripStatusEnum` |
| DB | `packages/db/prisma/schema.prisma` → `Trip` / `TripStatus` | Persistence |

## Prisma model (relevant fields)

```prisma
enum TripStatus {
  SCHEDULED
  BOARDING
  DEPARTED
  ARRIVED
  CANCELLED
  DELAYED
}

model Trip {
  companyId     String
  departureDate DateTime   // full timestamp (Abidjan = UTC+0)
  status        TripStatus @default(SCHEDULED)
  archivedAt    DateTime?
  // …
  @@index([status])
  @@index([departureDate])
}
```

Status is **manual / event-driven** (operator or driver transitions). There is **no cron** that auto-moves overdue `SCHEDULED` → terminal status. Past trips can remain `SCHEDULED` forever.

## Data flow (current)

```
┌─────────────────────────────────────────────────────────────┐
│ OperatorTripsView                                           │
│                                                             │
│  statusCounts ──────────────► chip badges (1027 / 1 / 7 / 1)│
│       │                                                     │
│       │  WHERE companyId + archivedAt=null                  │
│       │  NO departureDate window                            │
│       ▼                                                     │
│  trips.statusCounts                                         │
│                                                             │
│  list(status?, startDate?, endDate?, …) ──► cards + All #   │
│       │                                                     │
│       │  WHERE companyId + archivedAt=null                  │
│       │  + departureDate ∈ [today, today+14] (default)      │
│       │  + status = chip (when not ALL)                     │
│       ▼                                                     │
│  trips.list                                                 │
└─────────────────────────────────────────────────────────────┘
```

## Default list window (code)

```60:67:apps/web/lib/timezone.ts
export function getAppRollingTripWindow(daysAhead = 14): {
  startDate: Date;
  endDate: Date;
} {
  const now = new Date();
  const startDate = startOfAppCalendarDay(now);
  const endDate = endOfAppCalendarDay(addAppCalendarDays(startDate, daysAhead));
  return { startDate, endDate };
}
```

Semantics: **start of today** through **end of today+14** inclusive (= **15 calendar days**). Past days are excluded unless the operator sets toolbar `startDate`/`endDate`.

Trip generation uses `daysCount = 14` meaning today … today+13 (**14 days**) — off-by-one vs list window (see DISP-007).

## Chip rendering rules

From `operator-trips-view.tsx`:

- Chips: SCHEDULED, BOARDING, DELAYED, DEPARTED, ARRIVED, CANCELLED.
- Chip with `count === 0` and not active is **hidden** (why Delayed/Departed may be invisible in prod).
- **All** badge value = `listData.total` (current list query), **not** sum of counts.
- Status chip badge value = `statusCounts[status]` (global).

## Admin Dispatch Board (contrast)

`admin.listDispatchTrips` has **no default rolling window**. Filters only apply when admin supplies `from`/`to`. Admin has **no** `statusCounts` chips — different product surface, different failure mode.
