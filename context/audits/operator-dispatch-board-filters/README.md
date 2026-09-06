# Operator Dispatch Board Filters Audit

**Status:** Remediation in progress (Phases 0–2 code landed 2026-09-06)  
**Date:** 2026-09-06  
**Surface:** Operator ERP → `/dashboard/operator/trips` (Dispatch Board)  
**Reported symptoms (production):** All=340 · Scheduled=1027 · Boarding=1 · Arrived=7 · Cancelled=1; opening Boarding/Arrived/Cancelled shows empty state + All badge flips to 0.

---

## Verdict

Your reading was largely correct: **Scheduled chip counts include historical trips**, not just the forward operational window. The empty Boarding/Arrived/Cancelled tabs are **not a separate mystery** — they are the same architectural mismatch.

**Root cause (P1):** `trips.list` and `trips.statusCounts` answered different questions.

| Endpoint | Date scope (before) | Date scope (after fix) |
| :--- | :--- | :--- |
| `trips.list` | Rolling today → +14 | Shared `buildOperatorTripWhere` window |
| `trips.statusCounts` | **All time** | **Same window + toolbar filters as list** |

---

## Code landed (2026-09-06)

- `features/operator/lib/trips/trip-where.ts` — shared where builder
- `lib/timezone.ts` — `OPERATOR_TRIP_BOARD_DAYS` + inclusive N-day window
- `trpc/routers/trips.ts` — list + statusCounts share where
- `operator-trips-view.tsx` — All badge = sum of counts; empty copy; window label
- Prefetch statusCounts on trips page
- Unit tests: `trip-where.test.ts`

**Still open:** Gate A/B/C in `07-release-checklist.md`; DISP-008 data lifecycle (zombie SCHEDULED) is a separate product session.

---

## Index

| # | File | Contents |
| :--- | :--- | :--- |
| 01 | [01-system-map.md](./01-system-map.md) | Components, procedures, Prisma model, data flow |
| 02 | [02-intended-vs-actual.md](./02-intended-vs-actual.md) | How Dispatch Board should work vs what ships |
| 03 | [03-symptom-repro.md](./03-symptom-repro.md) | Production numbers → code path walkthrough |
| 04 | [04-findings-catalog.md](./04-findings-catalog.md) | Severity-ranked findings (DISP-001 …) |
| 05 | [05-adjacent-risks.md](./05-adjacent-risks.md) | Zombie SCHEDULED, bus conflicts, admin parity, date parsing |
| 06 | [06-remediation-plan.md](./06-remediation-plan.md) | Recommended fix order |
| 07 | [07-release-checklist.md](./07-release-checklist.md) | Gate A/B/C probes before closing |

---

## Top actions (do these first)

1. **Unify window:** Make `statusCounts` use the same `getAppRollingTripWindow(14)` (and the same optional `startDate`/`endDate`/`serviceType`/`q`/`scheduleId`) as `list`.
2. **Decouple All badge:** All chip must show unfiltered-in-window total (or sum of windowed counts), never `listData.total` under an active status filter.
3. **Fix empty copy:** When a status filter is active and `total === 0`, show “no trips match” — never “No trips yet / create a schedule”.
4. **Surface the window** in UI (“Showing today → +14 days”) so operators know why history is hidden.
5. **Follow-up (P2):** Policy for stale/past `SCHEDULED` trips (~687 implied by 1027−~340) — auto-close, archive, or history mode.

---

## What you got right / wrong / missed

| Your hypothesis | Verdict |
| :--- | :--- |
| Scheduled count includes past trips, not only future scheduled | **Correct** — all-time `groupBy`, no date filter |
| Boarding/Arrived/Cancelled chips lie relative to the list | **Correct** — same mismatch; those statuses are almost always past-dated |
| Empty state means “no trips exist” | **Misinterpretation caused by bad copy** — trips exist; filtered window is empty |
| All showing 0 when those tabs open is a second bug | **Related UX bug** — All badge reuses filtered `list.total` |
| Something else entirely (wrong page / wrong status enum) | **No** — status enum and page wiring are fine |

---

## Out of scope (checked, not broken)

- Prisma `TripStatus` enum matches UI chips (`SCHEDULED|BOARDING|DEPARTED|ARRIVED|CANCELLED|DELAYED`).
- Transition graph in `lib/trip-status.ts` is coherent.
- nuqs status parsing accepts all enum values + `ALL`.
- Tenancy (`companyId` + `archivedAt: null`) is applied on both endpoints.
