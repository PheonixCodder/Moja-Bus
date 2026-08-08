# D — Schedule Wizard / Edit Drawer Data & UI Findings

File: `apps/web/features/operator/components/schedules/schedule-edit-drawer.tsx` (816 lines, full read).

## D1 — Drawer date handling uses `toISOString().slice(0,10)` (naive, may shift a day)
`schedule-edit-drawer.tsx:126-131`:
```ts
validFrom: cal?.validFrom
  ? new Date(cal.validFrom).toISOString().slice(0, 10)
  : "",
```
`cal.validFrom` is a full UTC timestamp (e.g. `2026-08-07T00:00:00.000Z`). `toISOString` keeps it
UTC — correct for Abidjan (UTC+0). But **validUntil** is stored as `2026-08-10T23:59:59.999Z`; slicing
to date gives the right day. OK today, fragile if TZ changes; also inconsistent with wizard's
`parseLocalDate` + manual `YYYY-MM-DD` (see D3). Flag: prefer `getCalendarDateKey` from `lib/timezone`.

## D2 — Drawer never lets operator change validFrom/validUntil for a *new* extend — only existing `schedule.calendar`
The drawer renders `DepartureTimesEditor`, day toggles, dates, exceptions, fares. `handleSave` calls
`updateBasic` (name, departureTimes, isActive, preferredBusId) then `updateCalendar` **only if
`schedule.calendar` exists**. `updateCalendar` sends `validFrom: new Date(editCalConfig.validFrom).toISOString()` —
this converts the local date to a **UTC midnight** timestamp. Because Abidjan = UTC, fine today.

## D3 — Wizard vs Drawer date formats diverge
- Wizard (`calendar-step.tsx`): stores `YYYY-MM-DD` strings, `parseLocalDate` for display, `disabled`
  compares against local midnight.
- Drawer (`schedule-edit-drawer.tsx`): `DatePicker` value is `editCalConfig.validFrom` (a `YYYY-MM-DD`
  string) but on save converts via `new Date(...).toISOString()`. The `DatePicker` component API and
  `parseLocalDate` usage should be unified with the wizard for consistency.

## D4 — `handleSave` sends `departureTimes` array into `updateBasic`; server syncs `departureTime`
The drawer's `DepartureTimesEditor` writes `editDepartureTimes` (string[]). `updateBasic` patches the
single legacy `departureTime` = `departureTimes[0]`. **RESOLVED**: `updateScheduleBasicSchema`
(`packages/schemas/src/schedules.ts:282-293`) requires `departureTimes: z.array(hhMm).min(1)`, so an
empty cadence is rejected at the schema layer. NOTE: the drawer sends `departureTimes` only if it
changed? Verify `updateBasic` builds `departureTime` when only `departureTimes` present — the
`Object.fromEntries` filter (R3) must not drop `departureTimes`.

## D5 — Exceptions: date display uses `new Date(exception.date).toISOString().slice(0,10)`
`exception.date` in Prisma is `DateTime` (day at midnight). Slice gives day — OK UTC. Same
naive-UTC caveat as D1.

## D6 — Drawer fare matrix
`handleFarePriceChange` debounces 500ms per fare; `setSavingFareIds` per-fare spinner. `parseInt` of
empty string → `NaN` → `0`. Updates `priceXOF` even when 0. OK. No add/remove fare in drawer (only
edit) — deactivateFare/addFare only in wizard? (Verify: `addFare`/`deactivateFare` not wired here.)

## D7 — Wizard default config
`defaultCalendarConfig()` (`types.ts:98`): days Mon–Fri active; `departureTimes: ["08:00"]`;
`validFrom: getCalendarDateKey(new Date())` (app-day aware, comment M26); `validUntil: ""`;
`preferredBusId: ""`. Good.

## D8 — `hasRequiredFullRouteFare` uses `stops.length < 2` and last stop order
`types.ts:87-96`: requires a fare `from 0 → lastStopOrder` with `priceXOF > 0`. Consistent with
server `create` full-route-fare guard (R4). Note `FareDraft` has no `isActive` — wizard always adds
active fares; server `deactivateFare` used in edit. OK.

## D9 — WizardStep count/ordering
`WIZARD_STEPS = ["Route","Stops","Calendar","Pricing","Preview"]`. `schedule-search-params.ts` `step`
enum mirrors these. Calendar = step index 2. The reported bug is on this step.

## Open Questions
- Where is the wizard container that holds `config`/`departureTimes`? (`operator-schedules-view.tsx`
  + a `schedule-form-wizard` not yet globbed.) Need to confirm `DepartureTimesEditor`'s `times` prop
  and `onChange` wiring at the top level, and that `defaultCalendarConfig` departureTimes flows.
- Does `route-picker-step` reset config on route change (stop/waypoint set changes)?
