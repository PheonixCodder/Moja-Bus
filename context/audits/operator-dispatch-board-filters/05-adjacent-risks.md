# 05 — Adjacent Risks & Missed Angles

Issues beyond the reported chip/list mismatch that matter for a complete Dispatch Board health picture.

## 1. Zombie SCHEDULED backlog (data quality)

`SCHEDULED` is the default at generation and never auto-expires. After ~weeks of generation cron:

- Chips: huge SCHEDULED count.
- Search: past SCHEDULED usually excluded by departure filters — passengers OK.
- Bus conflict helper (`trips.ts` top-level conflict check): queries **all** `SCHEDULED|BOARDING|DEPARTED|DELAYED` without a date floor — a years-old SCHEDULED can still block assignment if times overlap the naive window math.

**Missed if you only look at UI:** this is an ops/data lifecycle gap, not just a badge bug.

## 2. Stale in-progress statuses

Leaving a trip in `BOARDING` or `DEPARTED` overnight:

- Hides from today’s board (window starts today).
- Still counted on chips.
- Still treated as “active” for bus conflicts and some driver queries.

Driver anti-strand work (`convergeDriversAfterRunEnd`) cleans **driver** `currentTripId` on ARRIVED/CANCELLED — it does **not** auto-arrive forgotten trips.

## 3. “Scheduled works” is partially luck

Scheduled opens a non-empty list because most **future** generated trips are still `SCHEDULED` inside the window. The chip number (1027) is still wrong relative to that list. Do not treat Scheduled as “healthy” — only as “less empty.”

## 4. Delayed / Departed chips may be invisible

Chips with count 0 hide. If production has zero DELAYED/DEPARTED all-time, those statuses only appear via the toolbar Select — easy to miss during QA.

## 5. Date pickers vs rolling default

Clearing toolbar dates restores rolling window. Setting only `startDate` without `endDate` uses `new Date(startDate)` … `window.endDate` mix — can surprise. Setting only `endDate` uses `window.startDate` … truncated end (DISP-006).

## 6. Manifest status actions vs board visibility

Manifest drawer can set BOARDING / ARRIVED. After ARRIVED, trip immediately leaves the default board (departure usually “today” still in window — **same-day ARRIVED should still list**).

So: if Arrived chip shows 7 and list is empty, those 7 are **not** today’s arrivals — they are older. If you mark Arrive today and Arrived chip increments but the trip disappears from All after midnight, that is expected under current window; until midnight it should still appear under Arrived **if** counts were windowed.

## 7. Pagination interaction

`pageSize: 50`. With 340 All trips, operators paginate. Chip counts are not page-scoped (good). After fixing DISP-001, keep counts unpaginated but windowed.

## 8. i18n / copy debt

`noTripsYetDesc` pushes schedule creation — correct for greenfield companies, harmful for filtered empties (DISP-003). Consider a third string: “No trips in this date range — try widening From/To.”

## 9. What is NOT wrong

- You are on the correct page (`trips/page.tsx` → `OperatorTripsView`).
- Status names match the domain (Boarding not “Borading” in code; UI typo only in the user message).
- Prisma schema is not missing statuses.
- This is not caused by shadcn migration or nuqs defaults alone.
