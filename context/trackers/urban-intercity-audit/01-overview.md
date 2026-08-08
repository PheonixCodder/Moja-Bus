# Urban + Intercity System Audit — Overview

## Goal
Exhaustive audit of the urban + intercity system: terminals, schedules (all wizard steps), and
all related schemas/models/files (schema.prisma, operator features, tRPC routers, UI components,
capture service, search infra). Find inconsistencies, UI bugs (e.g. Calendar Step: Cadence Preset
works but manual "Add time" doesn't add), and other problems.

## Scope
- Monorepo: `apps/web` (Next.js 16, tRPC v11, Prisma, Zod, React 19, Tailwind v4, next-intl, nuqs),
  `packages/db` (schema + seed), `packages/schemas` (zod), `packages/ui` (Base UI primitives),
  `packages/types`.
- Platform: Côte d'Ivoire bus booking, single-tenant-per-company, currency XOF.
- `ServiceType` (`INTERCITY | URBAN`) is the single urban/intercity discriminator — persisted on
  `Route` (derived server-side from terminal cityIds), snapshotted onto `Trip` at generation; search
  `isUrban = origin.cityId === destination.cityId`.
- Timezone: `Africa/Abidjan` (UTC+0, no DST).
- Windows environment (PowerShell): no `head`/`tail`; use `Select-Object -First N`.

## Progress

### Completed reads
- `packages/db/prisma/schema.prisma` (lines 1–1823; remainder captured in tracker 06).
- `apps/web/trpc/routers/schedules.ts` (1505 lines, full).
- `apps/web/trpc/routers/locations.ts` (full).
- `apps/web/trpc/routers/search.ts` (full).
- `apps/web/trpc/routers/trips.ts` (1255 lines, full).
- `apps/web/trpc/routers/_app.ts` (full).
- `apps/web/features/operator/lib/schedules/types.ts` (full).
- `apps/web/features/operator/lib/schedules/schedule-search-params.ts` (full).
- `apps/web/features/operator/components/schedules/calendar-step.tsx` (full).
- `apps/web/features/operator/components/schedules/departure-times-editor.tsx` (full).
- `apps/web/features/operator/components/schedules/schedule-edit-drawer.tsx` (full).
- `packages/ui/src/components/ui/time-picker.tsx` (full).
- `packages/ui/src/components/ui/select.tsx` (full).
- `packages/ui/src/components/ui/popover.tsx` (full).
- `apps/web/lib/route-service-type.ts`, `format-location-label.ts`, `schedule-trip-window.ts`.
- `apps/web/components/urban-badge.tsx`.
- `packages/ui/package.json` (@base-ui/react ^1.6.0 confirmed).
- `apps/web/trpc/routers/routes.ts` (full, 508), `public.ts` (full, 233).
- `packages/schemas/src/routes.ts` (full, 263).
- `apps/web/features/operator/components/routes/route-form-drawer.tsx` (full, 712).
- `apps/web/features/search/**` (places, segment-fare-match, build-search-entries,
  validate-search-pair, search-service, search-read-repository, params, constants,
  use-city-search), `app/[locale]/search/page.tsx`.
- `apps/web/trpc/routers/search.ts` (full).
- `apps/web/features/search/components/search-page-client.tsx` (413, full) — S9 resolved, S10 found.
- `apps/web/features/operator/views/operator-routes-view.tsx` (264, full).
- Verify `Booking.tripId` FK onDelete (DONE — R7b confirmed RESTRICT).

### Still to read
- `apps/web/features/operator/views/operator-terminals-view.tsx` (rest),
  `operator-trips-view.tsx`, `operator-fleet-view.tsx` (mostly covered in 09).
- `apps/web/features/operator/components/schedules/*` (route-picker-step, pricing-step, preview-step,
  wizard-stepper, schedule-card, schedule-toolbar, schedule-delete-dialog, schedule-success-banner, timing-step —
  mostly read; final skim pending).
- `apps/web/features/operator/components/terminals/*` (terminal-editor-sheet, terminals-table — read).
- `packages/schemas/src/schedules.ts` (rest — read).

## Key Findings Index
| # | Area | Severity | Tracker |
|---|------|----------|---------|
| B1 | Calendar Step: manual "Add time" doesn't register | High | 02 |
| R1 | schedules.list lacks serviceType/urban filter | Med | 03 |
| R2 | schedules router mis-indented mutation bodies | Low | 03 |
| R3 | updateBasic Object.fromEntries — RESOLVED (null survives) | Low | 03 |
| R5 | updateFare no overlap re-check vs other fares | Med | 03 |
| R7b | schedules.delete breaks on historical bookings (FK Restrict) | High | 03 |
| R8 | retire leaves booked future trips running (documented behavior) | Low | 03 |
| S1 | search isUrban vs stored Trip.serviceType — VERIFIED CONSISTENT | Low | 13 |
| S2 | search UTC day bounds — OK while UTC+0 | Low | 13 |
| S5 | no serviceType param in search (derived) — no mismatch | Low | 13 |
| RTE1 | routes.update urban stray-waypoint check skips existing waypoints | Med | 12 |
| RTE2 | drawer urban badge vs geo-incomplete terminals divergence | Low | 12 |
| RTE3 | edit seeds serviceType then clears (dead code) | Low | 12 |
| T1 | trips list/statusCounts/get GET-ish but operatorCompanyProcedure | Low | 07 |
| D1 | ScheduleEditDrawer never edits/editCalConfig validFrom via toISOString | Med | 04 |
| D2 | ScheduleEditDrawer uses DayKey lookup pattern inconsistent w/ wizard | Low | 04 |
| S10 | search isExpress filter is a NO-OP (never sent to query) | Med | 13 |
| V1 | schedules.list isActive filter — RESOLVED (works) | Low | 09 |
| OT1 | Offer/booking show 0h 0m + identical dep/arr (dest offset = 0 on direct routes) | High | 15 |

## FINAL REPORT
Audit complete. Consolidated prioritized report written to `14-final-report.md` (confirmed bugs:
B1 manual add, R7b delete FK crash, S10 isExpress no-op; medium: R1, R5, D1, N4, G2, S9; verified-good
list; decision items for team). **Fixes for R7b, B1, R1, R5, and S9 have been implemented** per
`docs/plans/2026-08-07-schedule-search-audit-fixes.md` (Tasks 1–8): schedule delete now detaches +
soft-archives trips instead of FK-crashing (R7b); `TimePicker` pickers are button grids and `addDraft`
gives duplicate feedback (B1); `schedules.list` filters by `serviceType` (R1); `updateFare` re-runs
the shared overlap guard (R5); `suggestQuarter` is per-IP rate-limited (S9). S10 remains open
(out of scope for this plan). No browser/test infra exists; S9 reuses existing `createRateLimiter`
tests, B1's UI path is structurally verified, and the pure-logic additions are unit-tested.

## POST-AUDIT (reporter-confirmed)
- **OT1 CONFIRMED (High)** — searched trips show "0h 0m everywhere": destination `scheduledArrival` /
  `estimatedArrival` falls back to `?? 0` when a route has no waypoints (all urban + direct intercity),
  so arrival == departure and duration == 0. Full-route fare `durationMinutes` never maps to the
  destination offset. Written to `15-offer-time-derivation.md`.
