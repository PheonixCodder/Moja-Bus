# B1 — Calendar Step: Manual "Add time" Doesn't Add

## Reported Bug
In the schedule wizard's **Calendar Step**, the Cadence Preset ("Apply Cadence") works, but the
manual **Add time** path doesn't add the selected time.

## Files Involved
- `apps/web/features/operator/components/schedules/departure-times-editor.tsx`
- `apps/web/features/operator/components/schedules/calendar-step.tsx`
- `packages/ui/src/components/ui/time-picker.tsx`
- `packages/ui/src/components/ui/select.tsx`, `popover.tsx`
- `packages/ui/package.json` — `@base-ui/react: ^1.6.0`

## Root Cause Analysis

### Data flow
1. `CalendarStep` renders `<DepartureTimesEditor times={config.departureTimes} onChange=...>`.
   `ScheduleEditDrawer` also renders it (`times={editDepartureTimes}`, `onChange={setEditDepartureTimes}`).
2. `DepartureTimesEditor` holds local state: `draft` (default `"07:00"`), `cadStart` (default
   `"06:00"`), `cadFrequency` (default 30), `cadEnd` (default `"22:00"`).
3. Manual add: user picks a time via `<TimePicker value={draft} onChange={(v) => setDraft(v)} />`,
   then clicks **Add** → `addDraft()`:
   ```ts
   function addDraft() {
     const next = normalizeTimes([...normalized, draft]);
     if (next.length !== normalized.length) return; // duplicate
     onChange(next);
     setDraft("");
   }
   ```
4. Cadence: `applyCadence()` reads `cadStart/cadEnd/cadFrequency` state and calls `onChange(...)`.

### Why cadence works but manual add doesn't
Both paths ultimately call the same `onChange`, so the divergence is **upstream of `addDraft`**:
the only way `addDraft` sees a stale/unchanged value is if `draft` never updates from its default
`"07:00"` (or the picker never fires `onChange`).

The `TimePicker` value is changed ONLY via:
- **Hour/Minute `Select`** components nested inside the `TimePicker`'s `Popover` (Base UI).
- **Preset chips** inside the same popover (`onChange?.(p); setOpen(false)`).

`TimePicker`'s `Select`s are Base UI `Select.Root`/`Select.Popup` **portaled to `document.body`**
(`select.tsx` `SelectPrimitive.Portal`, `z-[9999]`), rendered *inside* the Base UI `Popover.Popup`
(`popover.tsx` `PopoverPrimitive.Portal`). That is exactly the nested-popup shape with known Base UI
regressions:

- mui/base-ui#2480 — "[select] menu inside nested Popover automatically closes" (closed/fixed)
- mui/base-ui#5408 (2026-08-04, current version line) — "[dialog] Select/Popover nested in Dialog closes the outer ..."

Mechanism candidates (any one reproduces "Add doesn't work"):
1. **Select popup closes on click before `onValueChange` fires** → `draft` stays `"07:00"` →
   clicking **Add** either adds `07:00` silently (looks like "nothing happened" if 07:00 is already
   present, e.g. right after a cadence 06:00→22:00 every 30 which includes 07:00) or, if the value
   was already present, the `// duplicate` early-return silently no-ops with zero feedback.
2. **Outer `Popover` dismisses when the nested `Select` item is clicked** (pointer-outside
   detection), so the hour/minute change never commits; preset chips are plain `<button>`s inside the
   popover and DO work — which is consistent with the reporter's "cadence works" (cadence also
   defaults need no picker interaction).

### Secondary problems in the same editor
- `addDraft()` silent `return` on duplicate — no toast/inline feedback, no hint; operator sees
  nothing happen.
- After a successful add, `setDraft("")` empties the draft; the **Add** button becomes `disabled`
  (`disabled={!draft}`), so a second add requires re-opening the picker. Fine-ish, but combined with
  the picker failure the flow feels dead.
- `normalizeTimes` rejects anything not matching `/^([01]\d|2[0-3]):([0-5]\d)$/`; `draft` starts
  `"07:00"` (valid). `toMinutes("")` → `parseInt("" ,10)` → NaN path guarded by regex filter.
- `applyCadence` uses `Math.min(start,end)` so reversed start/end silently swaps; no validation
  shown to user (minor).
- `toHhMm` clamps to 23:59 but loop `m += freq` can overshoot; the `end` is force-added, fine.

## Recommendation
1. Replace the nested Base UI `Select`-in-`Popover` hour/minute pattern in `time-picker.tsx` with a
   non-portaled listbox, or plain `<input type="time">`, or a set of quick buttons + direct text
   input. The presets already work — keep them.
2. Add a `data-*` / `dismissible={false}` / explicit focus-trap handling, or use Base UI's supported
   nested-menu pattern (`SubmenuRoot`) if keeping Select.
3. In `addDraft`, give feedback on duplicate (toast / disabled state / inline note) instead of
   silent `return`.
4. Consider persisting `draft` across step navigation (currently resets to `07:00` on remount).

## Verification Needed
- Confirm the actual Base UI behavior at runtime (browser) — is `onValueChange` firing but the
  value already present (duplicate), or is the popover dismissing pre-commit?
- Quick unit test: render `TimePicker`, dispatch select item click, assert `onChange` called.
