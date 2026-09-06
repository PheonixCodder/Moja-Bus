# 02 — Intended vs Actual Behavior

## Product intent (Dispatch Board)

The operator Dispatch Board is an **operational** surface for running today's and near-future trips:

1. See trips that matter **now** (today + generation horizon).
2. Filter by lifecycle status to act (board / depart / arrive / cancel / assign).
3. Trust chip counts to match the list you open.
4. Empty “create a schedule” copy only when the company truly has no operational trips.

Supporting evidence in-repo:

- Trip generator + reconcile use a **~14-day forward** horizon (`trip-generator.ts`, `schedule-trip-window.ts`).
- `trips.list` commentless but hard-codes `getAppRollingTripWindow(14)` — list was designed as a rolling board, not a full archive.
- `statusCounts` comment (M2) says chips should reflect “every trip for the operator, not just the current page” — meaning **not page-scoped**, but it was implemented as **not window-scoped**, which overshoots the intent.

## Intended contract (recommended)

| UI element | Should mean |
| :--- | :--- |
| All | Count of non-archived trips in the **active date window** (default rolling 14/15 days) |
| Status chip N | Count of that status **in the same window** (and same schedule/service/q filters if applied) |
| Opening a chip | List of those same trips; count on chip equals `list.total` (when page 1 and no extra filters diverge) |
| Empty “No trips yet” | Only when All-in-window total is 0 (or company has never generated trips) |
| Empty “No trips match” | When filters exclude everything but the board still has trips under All |
| History / past ARRIVED | Opt-in via date pickers (widen `startDate`), or a dedicated History mode — not silently mixed into chips |

## Actual contract (shipped)

| UI element | Actually means |
| :--- | :--- |
| All badge | `trips.list.total` under **current** filters — changes when you pick Boarding etc. |
| Status chip N | All-time `groupBy(status)` for the company |
| Opening Boarding/Arrived/Cancelled | `list` with that status **∩ today→+14** — usually empty for terminal/past statuses |
| Empty copy | If `list.total === 0` → always “No trips yet / create a schedule”, even when filtered |
| Window visibility | `list` returns `window.startDate/endDate` but **UI never displays them** |
| Toolbar dates | Applied to `list` only; chips ignore them |

## Status lifecycle vs calendar

```
SCHEDULED ──► BOARDING ──► DEPARTED ──► ARRIVED
    │            │            │
    └────────────┴── DELAYED ─┘
    └────────────┴── CANCELLED (from SCHEDULED/BOARDING/DELAYED)
```

`ARRIVED` / `CANCELLED` (and stale `BOARDING`/`DEPARTED`) almost always have `departureDate` **before today**. The rolling window starts at **today 00:00**, so those rows drop out of `list` while remaining in `statusCounts`.

`SCHEDULED` accumulates forever if operators never close runs — search may stop showing them once departure is past, but chips still count them.
