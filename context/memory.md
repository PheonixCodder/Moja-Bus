# Memory

**Session:** Stops on Map — Shared RouteMapPreview Across Operator + Passenger Surfaces
**Date:** 2026-08-02

## Summary
Generalized the operator `RouteMapPreview` to a shared Leaflet map over a minimal `RouteMapPoint[]` shape and wired it into the passenger booking surfaces so segment stops now render on a real map (booking dialog toggle + booking-details map), matching the route-form-drawer behavior the user referenced. No server-logic changes — coordinates were already fetched. Web typecheck clean, 107/107 tests pass.

## Completed Work
- **`RouteMapPreview` generalized** (`apps/web/features/operator/components/route-map-preview.tsx`): props now `RouteMapPoint[]` = `{id, name, cityName, latitude, longitude}` (exported type); markers (pink endpoints `#ee237c` / purple intermediates `#9333ea`) + polyline + popups, midpoint centering, OSM tiles, no-coords fallback message. Migrated `route-form-drawer.tsx` and `admin-route-drawer.tsx` to map `Terminal[]` → points (`cityName: t.cityRelation?.name ?? t.city ?? "Côte d'Ivoire"` — `city` is nullable, caught by typecheck).
- **Booking dialog map toggle** (`trip-summary-card.tsx`): new `StopsMap` under the stops timeline — "Show route on map" / "Hide route map" button + lazy `ssr:false` `RouteMapPreview` (h-56, rounded border). Hidden when <2 stops have coordinates. Card now `"use client"` (both consumers `booking-dialog-flow` + `booking-success-view` already client). `TripSummaryData.stops[]` gained `latitude`/`longitude`.
- **Booking-details map upgraded** (`booking-route-map.tsx`): now renders ALL segment stops via the shared `RouteMapPreview` (was origin→dest straight dashed line). Keeps the pure-CSS fallback banner for missing coords + origin/dest floating overlay. Leaflet internals removed in favor of the shared component.
- **Data plumbing**: `TripDetailsStop` + `PassengerBookingSummary.stops[]` (`PassengerBookingStop {stopOrder, terminalName, cityName, latitude, longitude}`) added in `packages/types/src/booking.ts`; mapped in `trip-details-service.ts` (Prisma include already had terminal coords) and `booking-read-service.ts` (`bookingInclude` now selects `trip.tripStops` with terminals; `toSummary` filters to the booked segment using `originTripStopId`/`destinationTripStopId` stop orders).
- **i18n**: `booking.tripSummary.showRouteMap` + `hideRouteMap` in `en.json` + `fr.json` (English in fr per language rule).
- **Verification**: web typecheck clean, `@moja/types` typecheck clean, web tests **107/107**, both message JSON parse. Only `booking-read-service.toSummary` builds `PassengerBookingSummary`, so no test fixtures needed `stops`.

## Next Steps
- Back to standard roadmap (progress-tracker "Recommended Next Steps"): booking ownership hardening (silent lazy-claim vs phone+OTP decision), performance (Redis for search), mobile passenger MVP.
- Deferred sugar: urban price-range hint in `PricingStep`; open-seating (v2+).

## Key Files
- `apps/web/features/operator/components/route-map-preview.tsx` — shared Leaflet map + exported `RouteMapPoint` type; single source for all route maps.
- `apps/web/features/booking/components/trip-summary-card.tsx` — `StopsMap` toggle rendering segment stops; `TripSummaryData.stops[]` now carries coords.
- `apps/web/features/booking/components/booking-route-map.tsx` — booking-details map renders all stops via shared component + CSS fallback.
- `packages/types/src/booking.ts` — `TripDetailsStop` + `PassengerBookingSummary.stops[]` gain coordinates.
- `apps/web/features/booking/services/{trip-details-service,booking-read-service}.ts` — coordinate mapping; `bookingInclude` selects `trip.tripStops`.
- `apps/web/messages/{en,fr}.json` — `showRouteMap`/`hideRouteMap`.

## Known State
- No migrations folder — schema changes via `prisma db push` (script `db:push` in `packages/db`); scripts in `packages/db/scripts/` run via `pnpm exec tsx` from `packages/db`.
- Web test script is a hardcoded tsx file list in `apps/web/package.json` — new test FILES must be added there; new tests in existing files run automatically.
- Biome diagnostics on touched files are pre-existing style noise (CRLF, a11y, import-order); web `lint` script only checks config files.
- `exactOptionalPropertyTypes: true` is on for web — optional fields must accept `undefined` explicitly in union types.
- AGENTS.md: modified Next.js — consult `node_modules/next/dist/docs/` before writing code.

---

## Prior Session (2026-08-02) — Booking Dialog UX Polish (Centered Seat Map + Stops Timeline)

## Summary
Improved the passenger booking dialog UX (no server changes): centered the interactive seat map grid in the dialog, and redesigned the stops list as a vertical timeline showing arrival/departure times, Boarding/Alight/Pickup/Dropoff badges, and per-leg durations. Web typecheck clean, 107/107 tests pass.

---

## Prior Session (2026-08-01) — Urban Feature: Geography Audit, First-Class Design & Phases 0+1+2+3+4

## Summary
Audited city/municipality/quarter handling across search, booking/ticket UI, and operator ERP (saved to `context/trackers/geography-search-ui-audit.md` — findings B1-B11, recommendations R1-R15). Delivered a "first-class urban" design and **implemented all 4 phases**: persisted service type (0+1), level-aware search places (2), cadence + badges (3), consistency layer (4). **The urban initiative is complete.**

## Completed Work
- **Audit + design** in `context/trackers/geography-search-ui-audit.md` §10: 4 phases mapped to R1–R15.
- **Phase 0+1:** `ServiceType` enum, `Route.serviceType`/`Trip.serviceType` (indexed, pushed via `prisma db push` — no migrations folder); idempotent backfill `backfill-service-type.ts`; `createTerminalSchema` requires `cityId` when terminal; `routes.ts` server-side ID-based derivation; `trip-generator.ts` snapshot; operator UI badges.
- **Phase 2:** `places.ts` (`GeoPlace`, `isUrban` = same cityId), `validate-search-pair.ts` (shared by search-form + hero-search-bar-2), `SearchOffer.serviceType`, `findTrips(originPlace, destPlace, date)` + `findTripsInWindow` repository, place-based `SearchContext`, `originQuarterId`/`destinationQuarterId` params, `fromQuarter`/`toQuarter` nuqs. 16 tests → 87/87.
- **Phase 3:** `Schedule.departureTimes String[]` (primary `departureTime` kept); backfill script; cadence-aware `schedule-trip-window.ts` (MODIFIED replaces day's cadence), overlap guard (time-set aware), generator/reconcile/updateBasic; shared `DepartureTimesEditor` (15/30/45/60/90 min presets) in wizard + edit drawer; shared `apps/web/components/urban-badge.tsx`; `TripDetails`/`DigitalTicketDTO.serviceType`. 2 tests → 89/89.
- **Phase 4 (consistency):**
  - `apps/web/lib/format-location-label.ts`: `formatLocationLabel({cityName, municipalityName, quarterName, isUrban})` — urban `"Cocody – Riviera 3"`, intercity `"Abidjan (Cocody)"`; `formatCityWithMuni` for operator surfaces. Kills B5/B7 (4 ad-hoc label formats, offer-card-vs-ticket mismatch).
  - Applied on all 10 R6 surfaces: offer-card (urban now shows quarter — R8 "show"), trip-summary-card, booking-checkout-form, digital-ticket-card, passenger-tickets-view, booking-route-map, booking-card, booking-details, passenger-trip-card, operator booking-detail-drawer. `Terminal · Quarter` secondary lines kept as-is.
  - Plumbing: `PassengerBookingSummary.serviceType` + `OperatorBookingListItem.serviceType` (`packages/types/src/booking.ts`); mapped in `booking-read-service.toSummary` + `operator-booking-service.toListItem`/`toDetail` (include selects `trip.serviceType`).
  - R11: `StopLabel.municipality` + `buildStopsFromRoute`; pricing-step stops → `Terminal — City (Muni)`; route-card/routes-table/schedule-card → `City (Muni) → City (Muni)`; terminals-table → `City (Muni)`.
  - R12: `admin.listRoutes` search on `cityRelation.name` (was free-text `city`); copy de-urbanized (admin routes page, routes/terminals metaDescription, noRoutesDesc) in en.json + fr.json.
  - R15: deleted `hero-search-bar.tsx` (v1), `search-hero.tsx`, `route-editor-sheet.tsx` (verified zero imports; live code uses `hero-search-bar-2.tsx`).
  - Verification: web typecheck clean (one `exactOptionalPropertyTypes` fix on `LocationLabelParts`); web tests **89/89**; tracker status → all phases implemented 2026-08-01.

## Next Steps
- **Urban initiative complete.** Back to standard roadmap (progress-tracker "Recommended Next Steps"): booking ownership hardening (silent lazy-claim vs phone+OTP decision), performance (Redis for search), mobile passenger MVP.
- Deferred sugar: urban price-range hint in `PricingStep`; open-seating (v2+).
- Scope decisions locked: urban fares NOT separated; urban seating keeps seat maps.

## Key Files
- `context/trackers/geography-search-ui-audit.md` — findings, R1-R15, design, Phase 0+1+2+3+4 logs.
- `apps/web/lib/format-location-label.ts` — single label convention (R6/R11) used across search/booking/tickets/operator.
- `packages/types/src/booking.ts` — `TripDetails`/`DigitalTicketDTO`/`PassengerBookingSummary`/`OperatorBookingListItem` all carry `serviceType`.
- `apps/web/features/booking/services/booking-read-service.ts`, `apps/web/features/operator/services/operator-booking-service.ts` — serviceType mapping.
- `packages/db/prisma/schema.prisma` (+ `backfill-schedule-departure-times.ts`), `packages/schemas/src/schedules.ts`, `apps/web/lib/schedule-trip-window.ts`, `apps/web/trpc/routers/schedules.ts`, `apps/web/features/operator/components/schedules/departure-times-editor.tsx` — Phase 3 cadence.
- `apps/web/components/urban-badge.tsx` — single badge source (Phase 3).
- `apps/web/features/search/lib/{places,validate-search-pair}.ts` — Phase 2 shared libs; `packages/types/src/search.ts` — `SearchOffer.serviceType`.
- `apps/web/trpc/routers/admin.ts` (listRoutes search), `apps/web/messages/{en,fr}.json` — R12.

## Known State
- No migrations folder — schema changes via `prisma db push` (script `db:push` in `packages/db`); scripts in `packages/db/scripts/` run via `pnpm exec tsx` from `packages/db`.
- Web test script is a hardcoded tsx file list in `apps/web/package.json` — new test FILES must be added there; new tests in existing files run automatically.
- Biome diagnostics on touched files are pre-existing style noise (CRLF, a11y, import-order); web `lint` script only checks config files.
- `exactOptionalPropertyTypes: true` is on for web — optional fields must accept `undefined` explicitly in union types.
- AGENTS.md: modified Next.js — consult `node_modules/next/dist/docs/` before writing code.
