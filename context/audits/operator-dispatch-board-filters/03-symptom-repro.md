# 03 — Symptom → Code Path Repro

Production report (one operator company):

| Chip | Observed badge | Observed list |
| :--- | ---: | :--- |
| All | 340 | Shows trips |
| Scheduled | 1027 | Shows trips |
| Boarding | 1 | Empty + “No trips yet” |
| Arrived | 7 | Empty + “No trips yet” |
| Cancelled | 1 | Empty + “No trips yet” |
| All badge while on Boarding/Arrived/Cancelled | **0** | — |

## Step-by-step

### A. All = 340

1. URL `status=ALL` (default).
2. Client calls `trips.list` with no status, no dates.
3. Server sets `departureDate ∈ getAppRollingTripWindow(14)` (today … today+14).
4. `total = 340` → All badge and `totalInfo` show 340.
5. Cards render.

**Interpretation:** 340 = non-archived trips with departure in the rolling window (all statuses). This is **not** all-time company trips.

### B. Scheduled = 1027 (inflated)

1. `trips.statusCounts` runs with only `companyId` + `archivedAt: null`.
2. `groupBy status` → `counts.SCHEDULED = 1027`.
3. Chip shows 1027.
4. Clicking Scheduled calls `trips.list({ status: "SCHEDULED" })` still inside the rolling window.
5. List shows only **windowed** scheduled trips (~≈340 if almost all windowed trips are still SCHEDULED).
6. All badge under this filter becomes that windowed scheduled total (often still ~340), while Scheduled chip stays 1027.

**Your hypothesis confirmed:** Scheduled badge counts past + future SCHEDULED rows. Implied zombie backlog ≈ `1027 − (scheduled-in-window)`. If scheduled-in-window ≈ 340, backlog ≈ **687** historical SCHEDULED never transitioned.

### C. Boarding=1 / Arrived=7 / Cancelled=1 but empty list

1. Chips read all-time counts (1 / 7 / 1).
2. Click Boarding → `list({ status: "BOARDING" })` + window starting **today**.
3. That single BOARDING trip’s `departureDate` is almost certainly **&lt; today** (left open from a previous day) → `total = 0`, `items = []`.
4. Same for ARRIVED (completed runs are past) and CANCELLED (cancelled departure usually past or outside window).

**Not a rendering bug.** The list query is correct relative to its window; the chip is wrong relative to the list.

### D. All badge → 0 on those tabs

```162:162:apps/web/features/operator/views/operator-trips-view.tsx
          <span className="font-mono font-bold">{listData.total}</span>
```

All chip always prints **current** `list.total`. Filtered empty list ⇒ All shows 0. Operators read this as “company has zero trips.”

### E. Wrong empty copy

```243:249:apps/web/features/operator/views/operator-trips-view.tsx
              <EmptyTitle>
                {listData.total === 0 ? t("noTripsYet") : t("noTripsMatch")}
              </EmptyTitle>
              <EmptyDescription>
                {listData.total === 0
                  ? t("noTripsYetDesc")
                  : t("noTripsMatchDesc")}
```

When filtered total is 0, UI claims the company has never created trips. Correct branch would be: if any active filter (`status !== ALL` or dates/q/…) and total 0 → `noTripsMatch`; only use `noTripsYet` when All-in-window is empty.

## Mental model diagram

```
All-time DB (company)
├── SCHEDULED .............. 1027  ◄── chip
│   ├── departure before today ~687  (invisible to list)
│   └── departure in window   ~340  ◄── list when status=SCHEDULED
├── BOARDING ............... 1     ◄── chip (past) → list empty
├── ARRIVED ................ 7     ◄── chip (past) → list empty
├── CANCELLED .............. 1     ◄── chip (past) → list empty
└── others ................. ?

Window today→+14
└── all statuses ........... 340   ◄── All when status=ALL
```

## How to prove on staging SQL

```sql
-- All-time status histogram (matches chips)
SELECT status, COUNT(*)
FROM trip
WHERE "companyId" = $COMPANY AND "archivedAt" IS NULL
GROUP BY status;

-- Windowed histogram (what chips SHOULD show)
SELECT status, COUNT(*)
FROM trip
WHERE "companyId" = $COMPANY
  AND "archivedAt" IS NULL
  AND "departureDate" >= date_trunc('day', now() AT TIME ZONE 'Africa/Abidjan') AT TIME ZONE 'UTC'
  AND "departureDate" <= (date_trunc('day', now() AT TIME ZONE 'Africa/Abidjan') + interval '14 days' + interval '1 day' - interval '1 ms') AT TIME ZONE 'UTC'
GROUP BY status;

-- The specific “ghost” boarding rows
SELECT id, status, "departureDate"
FROM trip
WHERE "companyId" = $COMPANY AND "archivedAt" IS NULL AND status = 'BOARDING';
```
