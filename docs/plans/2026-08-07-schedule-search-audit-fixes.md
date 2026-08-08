# Schedule + Search Audit Fixes Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Fix the confirmed bugs from the urban/intercity audit (trackers 02–05): the `schedules.delete` FK crash on historical bookings, the TimePicker nested-portal bug that breaks manual "Add time", the missing `serviceType` filter on `schedules.list`, the missing overlap re-check on `updateFare`, and the unauthenticated `suggestQuarter` mutation.

**Architecture:** Two buckets of work — (a) a Prisma schema + router change to make schedule deletion safe by detaching and soft-archiving trips that still carry historical booking rows, and (b) targeted UI/router fixes for the time-picker and schedule-list UX. No new libraries. All changes are in `apps/web` and `packages/db` (plus `packages/schemas` and `packages/ui`).

**Tech Stack:** pnpm, Prisma 7.8, tRPC, Next.js (app router), Base UI 1.6, nuqs, node:test via `tsx --test`.

---

## Verification Summary (what's real, what's not)

Confirmed in code before writing this plan:

| ID | Verdict | Evidence |
|---|---|---|
| **R7b** | **REAL BUG (HIGH)** — `schedules.delete` crashes with FK error when any trip has even a historical booking row | `Booking.trip` has no `onDelete` → default `Restrict` (`packages/db/prisma/schema.prisma:1814`); `delete()` does `trip.deleteMany` + `schedule.delete` (`apps/web/trpc/routers/schedules.ts:734-741`) despite comment claiming history shouldn't block |
| **B1** | **REAL BUG** — TimePicker nests Base UI `Select`-in-`Popover` (both portaled to body); known Base UI nested-popup regression; plus `addDraft` silently no-ops on duplicate | `time-picker.tsx:105-131` (Selects inside Popover), `select.tsx:74` (Portal), `popover.tsx:29` (Portal), `departure-times-editor.tsx:64-69` (silent return) |
| **R1** | **REAL GAP** — `schedules.list` has no `serviceType` filter; `trips.list` does | `listSchedulesSchema` (`packages/schemas/src/schedules.ts:371-380`) vs `trips.list` (`trips.ts:156,186-187`) |
| **R5** | **REAL GAP** — `updateFare` doesn't re-run the overlap check `addFare` does | `updateFare` (`schedules.ts:1037-1081`) filters falsy values + order check only; `addFare` (`schedules.ts:1109-1140`) has full overlap logic |
| **S9** | **REAL GAP (LOW/MED)** — `suggestQuarter` is a `publicProcedure` with no rate limit or auth | `locations.ts:185-209` |
| R3 | NOT a bug | `Object.fromEntries` keeps explicit `null` (`schedules.ts:814-816`); schema `min(1)` guards empty cadence |
| D4 | NOT a bug | `updateScheduleBasicSchema` requires `departureTimes: min(1)` |
| S1 | NOT a bug | `route-service-type.ts` guard forces `serviceType` to match cityId derivation; search `isUrban` is cityId equality (`places.ts:22-24`) |
| S7 | NOT a bug | `geocodePoint` returns non-null `municipalityId` whenever it resolves; whole result null → router throws `NOT_FOUND` |
| R6, D1, D3, D5, S2, S3, S6 | Low / TZ-fragile, correct today (Africa/Abidjan = UTC+0) | See trackers; **out of scope** for this plan, listed as follow-ups |

---

### Task 1: Schema — detachable + archivable trips

**Files:**
- Modify: `packages/db/prisma/schema.prisma` (Trip model, ~line 1363-1413)

**Step 1: Edit the Trip model**

Change the schedule relation to be nullable with `SetNull`, and add an `archivedAt` column:

```prisma
model Trip {
  id         String    @id @default(cuid())
  scheduleId String?
  schedule   Schedule? @relation(fields: [scheduleId], references: [id], onDelete: SetNull)
  companyId  String
  company    Company   @relation(fields: [companyId], references: [id])

  // ...unchanged fields...

  archivedAt DateTime? // set when a schedule is deleted but the trip still has booking history

  // ...unchanged...

  @@unique([scheduleId, departureDate])
}
```

Do NOT change the `@@unique` constraint — Postgres treats NULLs as distinct, so multiple archived trips with `scheduleId = null` are allowed.

**Step 2: Generate a migration**

Run: `pnpm --filter @moja/db exec prisma migrate dev --name add_trip_archived_at`
Expected: a new migration folder `packages/db/prisma/migrations/<timestamp>_add_trip_archived_at/` containing SQL that makes `scheduleId` nullable and adds `archivedAt`.

**Step 3: Regenerate the client**

Run: `pnpm --filter @moja/db generate`
Expected: Prisma Client regenerated with `Trip.scheduleId: string | null`, `Trip.schedule: Schedule | null`, `Trip.archivedAt: Date | null`.

**Step 4: Commit**

```bash
git add packages/db/prisma packages/db/src
git commit -m "feat(db): make Trip.scheduleId detachable (SetNull) and add archivedAt for soft-archive"
```

---

### Task 2: Fix type ripples from nullable `Trip.schedule` / `scheduleId`

**Files:** (typecheck-driven — exact sites vary)
- Modify: any file that reads `trip.schedule.X` or `trip.scheduleId` without null handling

The schema change makes `trip.schedule` and `trip.scheduleId` nullable. Every include/read site must be null-safe. Query *filters* (e.g. `where: { scheduleId: input.scheduleId }`, `filters["schedule"] = { routeId }`) compile fine and need no change.

**Step 1: Run typecheck to enumerate broken sites**

Run: `pnpm typecheck --filter web`
Expected: a list of errors at sites that read `trip.schedule.…` / `trip.scheduleId` (e.g. `apps/web/trpc/routers/trips.ts`, `apps/web/trpc/routers/admin.ts`, `apps/web/trpc/routers/operator.ts`, `apps/web/features/search/repositories/search-read-repository.ts`, `apps/web/features/booking/services/*`, `apps/web/features/payments/services/booking-receipt-email.ts`).

**Step 2: Fix each site with the narrowest safe null-handling**

- If the query already filters `schedule: { isActive: true }` (archived trips can never match because their `schedule` is null), the include result is still typed `Schedule | null` — use `?.` or a non-null assertion with a comment, e.g.:
  ```ts
  const routeName = trip.schedule?.route?.name;
  ```
- If the code only needs the trip regardless of schedule, branch on null:
  ```ts
  if (trip.schedule) { /* schedule-scoped logic */ }
  ```

**Step 3: Re-run typecheck**

Run: `pnpm typecheck --filter web`
Expected: clean (0 errors).

**Step 4: Lint**

Run: `pnpm check` (or `pnpm --filter web exec biome check apps/web`)
Expected: no new diagnostics.

**Step 5: Commit**

```bash
git add apps/web
git commit -m "fix(web): null-safe Trip.schedule reads after nullable scheduleId change"
```

---

### Task 3: Rewrite `schedules.delete` to archive trips instead of hard-deleting

**Files:**
- Modify: `apps/web/trpc/routers/schedules.ts:699-744`

**Step 1: Replace the delete body**

Keep the existing guard (block on CONFIRMED / PENDING_PAYMENT). Then, instead of `trip.deleteMany` + `schedule.delete`:

```ts
await ctx.prisma.$transaction(async (tx) => {
  // Trips with NO booking rows at all can be removed outright.
  const trips = await tx.trip.findMany({
    where: { scheduleId: schedule.id },
    select: {
      id: true,
      _count: { select: { bookings: true } },
    },
  });
  const emptyIds = trips.filter((t) => t._count.bookings === 0).map((t) => t.id);
  const keptIds = trips.filter((t) => t._count.bookings > 0).map((t) => t.id);

  if (emptyIds.length > 0) {
    await tx.trip.deleteMany({ where: { id: { in: emptyIds } } });
  }

  // Trips that still carry historical booking rows are detached from the
  // schedule (scheduleId -> null via SetNull) and soft-archived so the
  // booking history and financial records survive.
  if (keptIds.length > 0) {
    await tx.trip.updateMany({
      where: { id: { in: keptIds } },
      data: { archivedAt: new Date(), scheduleId: null },
    });
  }

  await tx.schedule.delete({ where: { id: schedule.id } });
});
```

**Step 2: Verify the comment above the guard is still accurate**

It says "completed, cancelled, or expired historical bookings should not prevent cleanup" — now true. Leave it.

**Step 3: Ensure archived trips are hidden from operator trip listings**

Add `archivedAt: null` to the `where` in `trips.list` (`apps/web/trpc/routers/trips.ts:175-181`) so archived trips don't resurface in the 14-day operator view:

```ts
const filters: Record<string, unknown> = {
  companyId: ctx.companyId,
  archivedAt: null,
  departureDate: { gte: startDate, lte: endDate },
};
```

Also audit other operator/booking trip-read procedures (`trips.ts`, `operator.ts`) that return trip lists or trip-by-id to the operator and add `archivedAt: null` where archived trips must not appear. Public search is already safe: `search-read-repository.ts` filters `schedule: { isActive: true }`, which archived trips (null schedule) can never match.

**Step 4: Typecheck + lint**

Run: `pnpm typecheck --filter web` then `pnpm check`
Expected: clean.

**Step 5: Commit**

```bash
git add apps/web/trpc/routers/schedules.ts apps/web/trpc/routers/trips.ts apps/web/trpc/routers/operator.ts
git commit -m "fix(schedules): archive trips with booking history on delete instead of FK crash"
```

---

### Task 4: Replace nested Selects in `TimePicker` (B1 root cause)

**Files:**
- Modify: `packages/ui/src/components/ui/time-picker.tsx`

**Step 1: Remove the hour/minute Base UI Selects**

The two `Select`/`SelectContent` blocks (lines ~105-131) render inside the `Popover.Popup` and each portals a second popup to `document.body` — the nested-popup shape with known Base UI regressions. Replace them with a plain, non-portaled grid of buttons (same interaction pattern as the existing preset chips, which already work):

```tsx
<div className="space-y-1">
  <span className="text-[11px] text-muted-foreground">Hours</span>
  <div className="grid grid-cols-4 gap-1">
    {hoursList.map((h) => (
      <button
        key={h}
        type="button"
        onClick={() => handleHourChange(h)}
        className={cn(
          "rounded-md border px-1 py-1 font-mono text-xs transition-colors",
          h === hour
            ? "bg-primary text-primary-foreground border-primary font-bold"
            : "bg-muted/50 hover:bg-muted text-muted-foreground"
        )}
      >
        {h}
      </button>
    ))}
  </div>
</div>
<div className="space-y-1">
  <span className="text-[11px] text-muted-foreground">Minutes</span>
  <div className="grid grid-cols-4 gap-1">
    {minutesList.map((m) => (
      <button
        key={m}
        type="button"
        onClick={() => handleMinuteChange(m)}
        className={cn(
          "rounded-md border px-1 py-1 font-mono text-xs transition-colors",
          m === minute
            ? "bg-primary text-primary-foreground border-primary font-bold"
            : "bg-muted/50 hover:bg-muted text-muted-foreground"
        )}
      >
        {m}
      </button>
    ))}
  </div>
</div>
```

**Step 2: Remove now-unused imports**

Remove `Select, SelectContent, SelectItem, SelectTrigger, SelectValue` from the `#components/ui/select` import in `time-picker.tsx` (preset chips and the new grids are plain `<button>`s). Keep `Popover`, `Button`, `Clock`, `cn`.

**Step 3: Typecheck + lint**

Run: `pnpm typecheck --filter @moja/ui` and `pnpm --filter @moja/ui exec biome check src`
Expected: clean.

**Step 4: Commit**

```bash
git add packages/ui/src/components/ui/time-picker.tsx
git commit -m "fix(ui): replace nested Select-in-Popover in TimePicker with button grids (Base UI nested-portal regression)"
```

---

### Task 5: Give feedback in `addDraft` and extract pure helper (B1 secondary)

**Files:**
- Modify: `apps/web/features/operator/components/schedules/departure-times-editor.tsx`
- Test: create `apps/web/features/operator/components/schedules/__tests__/departure-times-editor.test.ts`

**Step 1: Extract a pure `addDepartureTime` helper**

At the bottom of `departure-times-editor.tsx` (or a sibling `lib` file — keep it in the same file for now, exported):

```ts
export function addDepartureTime(
  current: string[],
  draft: string,
): { times: string[]; added: boolean } {
  const normalized = normalizeTimes([...current, draft]);
  return {
    times: normalized,
    added: normalized.length !== normalizeTimes(current).length,
  };
}
```

**Step 2: Write the failing test**

`apps/web/features/operator/components/schedules/__tests__/departure-times-editor.test.ts`:

```ts
import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { addDepartureTime } from "../departure-times-editor";

describe("addDepartureTime", () => {
  it("adds a new valid time sorted and deduplicated", () => {
    const { times, added } = addDepartureTime(["07:00", "09:00"], "08:00");
    assert.equal(added, true);
    assert.deepEqual(times, ["07:00", "08:00", "09:00"]);
  });

  it("returns added=false when the time is already present", () => {
    const { times, added } = addDepartureTime(["07:00", "09:00"], "09:00");
    assert.equal(added, false);
    assert.deepEqual(times, ["07:00", "09:00"]);
  });

  it("ignores invalid formats", () => {
    const { times, added } = addDepartureTime(["07:00"], "25:99");
    assert.equal(added, false);
    assert.deepEqual(times, ["07:00"]);
  });
});
```

**Step 3: Run the test to confirm it fails**

Run: `pnpm --filter web exec tsx --test features/operator/components/schedules/__tests__/departure-times-editor.test.ts`
Expected: FAIL — `addDepartureTime` is not exported.

**Step 4: Wire the helper into `addDraft` with feedback**

```ts
function addDraft() {
  const { times, added } = addDepartureTime(normalized, draft);
  if (!added) {
    toast.error(t("wizard.duplicateTime", { time: draft }));
    return;
  }
  onChange(times);
  setDraft("");
}
```

Add a translation key `wizard.duplicateTime` in the operator schedules locale file (English; pattern: `"Duplicate time — {time} is already in the schedule."`).

**Step 5: Register the test file**

Add the new test path to the `"test"` script list in `apps/web/package.json` (the repo maintains an explicit list).

**Step 6: Run the tests**

Run: `pnpm --filter web test`
Expected: all pass, including the new file.

**Step 7: Typecheck + commit**

Run: `pnpm typecheck --filter web`
Commit:

```bash
git add apps/web/features/operator/components/schedules apps/web/package.json
git commit -m "fix(schedules): surface duplicate departure-time feedback and add pure addDepartureTime helper"
```

---

### Task 6: Add `serviceType` filter to `schedules.list` (R1)

**Files:**
- Modify: `packages/schemas/src/schedules.ts:371-380`
- Modify: `apps/web/trpc/routers/schedules.ts:330-354`
- Modify: `apps/web/features/operator/lib/schedules/schedule-search-params.ts:9-19`
- Modify: `apps/web/features/operator/components/schedules/schedule-toolbar.tsx`
- Modify: `apps/web/features/operator/views/operator-schedules-view.tsx`

**Step 1: Extend the schema**

In `listSchedulesSchema` add:

```ts
serviceType: z.enum(["INTERCITY", "URBAN"]).optional(),
```

**Step 2: Extend the query**

In `schedules.list`, add to `where`:

```ts
...(input?.serviceType ? { route: { serviceType: input.serviceType } } : {}),
```

**Step 3: Extend the nuqs parsers**

In `schedule-search-params.ts` add:

```ts
serviceType: parseAsStringEnum(["INTERCITY", "URBAN"]).withDefault(""),
```

**Step 4: Add the toolbar filter**

In `schedule-toolbar.tsx` add a `serviceType` prop (`"all" | "INTERCITY" | "URBAN"`) + `onServiceTypeChange` and render a `<select>` next to the status one (mirror lines 48-59) with options All / Intercity / Urban.

**Step 5: Wire the view**

In `operator-schedules-view.tsx`, pass `serviceType` + `onServiceTypeChange` from the `scheduleSearchParamsCache` (update the URL param on change) and include `serviceType` in the `trpc.schedules.list` input.

**Step 6: Typecheck + lint**

Run: `pnpm typecheck --filter web` and `pnpm --filter web exec biome check apps/web/features/operator packages/schemas/src`
Expected: clean.

**Step 7: Commit**

```bash
git add packages/schemas/src/schedules.ts apps/web/trpc/routers/schedules.ts apps/web/features/operator
git commit -m "feat(schedules): add serviceType filter to schedule list (parity with trips.list)"
```

---

### Task 7: Re-run the overlap check in `updateFare` (R5)

**Files:**
- Modify: `apps/web/trpc/routers/schedules.ts:1037-1081`

**Step 1: Extract the overlap logic**

Pull the overlap check from `addFare` (lines 1112-1140) into a module-level helper:

```ts
async function assertNoFareOverlap(
  prisma: typeof ctx.prisma,
  scheduleId: string,
  excludeFareId: string | null,
  f: { type: string; fromStopOrder: number; toStopOrder: number; validFrom?: Date | null; validUntil?: Date | null },
) {
  const existingFares = await prisma.fare.findMany({
    where: {
      scheduleId,
      isActive: true,
      ...(excludeFareId ? { id: { not: excludeFareId } } : {}),
      type: f.type,
      fromStopOrder: f.fromStopOrder,
      toStopOrder: f.toStopOrder,
    },
  });

  const newFrom = f.validFrom?.getTime() ?? 0;
  const newUntil = f.validUntil?.getTime() ?? Infinity;
  for (const ef of existingFares) {
    if (!f.validFrom && !f.validUntil && !ef.validFrom && !ef.validUntil) {
      throw new TRPCError({ code: "BAD_REQUEST", message: "An always-valid fare already exists for this segment." });
    }
    const efFrom = ef.validFrom?.getTime() ?? 0;
    const efUntil = ef.validUntil?.getTime() ?? Infinity;
    if (newFrom <= efUntil && newUntil >= efFrom) {
      throw new TRPCError({
        code: "BAD_REQUEST",
        message: `Fare dates overlap with an existing fare (valid from ${ef.validFrom?.toISOString().split("T")[0] ?? "forever"} to ${ef.validUntil?.toISOString().split("T")[0] ?? "forever"}).`,
      });
    }
  }
}
```

**Step 2: Use it in `addFare`**

Replace the inline loop (lines 1112-1140) with `await assertNoFareOverlap(ctx.prisma, schedule.id, null, f);` — behavior unchanged.

**Step 3: Use it in `updateFare`**

`updateFare` only mutates `priceXOF`, `type`, `isActive` (no date/segment changes), so call the guard when the type is changing (the only field that can create a new conflict):

```ts
if (input.data.type && input.data.type !== fare.type) {
  await assertNoFareOverlap(
    ctx.prisma,
    schedule.id,
    input.fareId,
    {
      type: input.data.type,
      fromStopOrder: fare.fromStopOrder,
      toStopOrder: fare.toStopOrder,
      validFrom: fare.validFrom,
      validUntil: fare.validUntil,
    },
  );
}
```

Place it right after the `fromStopOrder < toStopOrder` check (line 1066-1071) and before the update.

**Step 4: Typecheck + lint**

Run: `pnpm typecheck --filter web` and `pnpm --filter web exec biome check apps/web/trpc/routers/schedules.ts`
Expected: clean.

**Step 5: Commit**

```bash
git add apps/web/trpc/routers/schedules.ts
git commit -m "fix(schedules): enforce fare overlap rule on updateFare type changes"
```

---

### Task 8: Rate-limit `suggestQuarter` (S9)

**Files:**
- Modify: `apps/web/trpc/routers/locations.ts:185-209`

**Step 1: Add a per-IP rate limiter**

Import and use the existing limiter + header/IP pattern already used in `captures.ts:48-56` and `contact.ts:34-35`:

```ts
import { createRateLimiter } from "@/lib/rate-limit";

const suggestQuarterLimiter = createRateLimiter({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10,
});
```

In `suggestQuarter`'s mutation body, before the municipality lookup:

```ts
const forwarded = ctx.headers.get("x-forwarded-for");
const ip =
  forwarded?.split(",")[0]?.trim() ||
  ctx.headers.get("x-real-ip") ||
  "unknown";
const gate = suggestQuarterLimiter(`suggestQuarter:${ip}`);
if (!gate.ok) {
  throw new TRPCError({
    code: "TOO_MANY_REQUESTS",
    message: `Too many quarter suggestions. Try again in ${Math.ceil(gate.retryAfterMs / 1000)}s.`,
  });
}
```

**Step 2: Typecheck + lint**

Run: `pnpm typecheck --filter web` and `pnpm --filter web exec biome check apps/web/trpc/routers/locations.ts`
Expected: clean.

**Step 3: Commit**

```bash
git add apps/web/trpc/routers/locations.ts
git commit -m "fix(locations): rate-limit public suggestQuarter mutation per IP"
```

---

### Task 9: Final verification pass

**Step 1: Full checks**

Run: `pnpm typecheck`
Run: `pnpm check`
Run: `pnpm test`
Expected: all clean.

**Step 2: Manual QA checklist (browser)**

1. Schedule wizard → Calendar step → pick a time with the TimePicker → click Add → the time appears as a chip; clicking Add again on an existing time shows the duplicate toast.
2. Cadence preset still fills the list correctly.
3. Operator Schedules → filter by Intercity / Urban → list filters correctly.
4. Delete a schedule whose trips all have historical (completed/cancelled) bookings → succeeds, schedule disappears, bookings/history intact in DB.
5. Delete a schedule with CONFIRMED/PENDING_PAYMENT bookings → still blocked with the existing error.
6. Suggest a quarter repeatedly → after the limit, a 429-ish error surfaces.

**Step 3: Update audit tracker statuses**

In `context/trackers/urban-intercity-audit/01-overview.md` and `14-final-report.md`, mark R7b, B1, R1, R5, S9 as fixed, and add the link to this plan.

**Step 4: Commit**

```bash
git add context
git commit -m "docs(audit): mark R7b/B1/R1/R5/S9 fixed per schedule-search-audit-fixes plan"
```

---

## Follow-ups (out of scope, low severity)

- D1/D3/D5 + S2/S3/S6: date handling uses naive UTC slicing / `new Date("YYYY-MM-DD")`. Correct today because the app is pinned to Africa/Abidjan (UTC+0). Standardize on `getCalendarDateKey` / `buildAppDepartureTimestamp` from `lib/timezone` if the app ever supports another timezone.
- R6: `addException` active-day check uses `getUTCDay()` — same UTC+0 assumption.
- R8: retiring a schedule leaves booked future trips SCHEDULED (no auto-cancel/refund); confirm this is intended product behavior.
- R2: mis-indented mutation handler bodies in `schedules.ts` — run `biome format --write` to normalize.
