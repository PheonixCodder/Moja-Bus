# Memory

**Session:** Language Switcher in Home Header + Locale-Aware Header Navigation
**Date:** 2026-08-02

## Summary
Added a language switcher (EN/FR) to the home header by reusing the existing `LocaleSwitcher` component (`apps/web/components/locale-switcher.tsx`), which was previously only used in the auth layouts. Extended it with an optional `className` prop so the header can adapt colors to its transparent-hero state. Also migrated `home-header.tsx` from `next/link` + `next/navigation` to the locale-aware primitives from `@/i18n/navigation` — this fixes two real bugs on French pages: `isHome = pathname === "/"` was false on `/fr` (transparent hero state silently missing on the FR home) and all nav links dropped the `/fr` prefix. Fixed the pre-existing missing `HelpCircle` import (mobile menu would crash when opened).

## Completed Work
- **`components/locale-switcher.tsx`**: added optional `className` prop merged via `cn` into the trigger Button (default styling unchanged — backward compatible).
- **`home/components/home-header.tsx`**: `import { Link, usePathname } from "@/i18n/navigation"` replaces the next/* imports; `<LocaleSwitcher />` in the desktop right section (before auth area) with `text-white hover:bg-white/10` when `hasLightText`; bottom row in the mobile menu (`w-full justify-start [&_span]:inline` to force the current-locale label visible on small screens); `HelpCircle` added to lucide imports.
- **Behavior**: `router.replace(pathname, { locale })` from `@/i18n/navigation` keeps the current route and only toggles the `/fr` prefix (routing is `as-needed`). No new i18n keys — `locale.*` (`current`/`en`/`fr`/`switchTo`) already existed in en.json + fr.json.
- **Verification**: web typecheck clean (exit 0), 157/157 tests pass. Tracker `context/trackers/internationalization-components.md` home-header row annotated.

## Next Steps
- Optional polish: preserve search params when switching locale in the shared `LocaleSwitcher` (currently `router.replace(pathname)` drops `?from=...` on e.g. `/search`) — skipped per scope decision; note `handleLogout` still hardcodes `window.location.href = "/"` (lands on EN home for FR users).
- Back to standard roadmap (progress-tracker "Recommended Next Steps"): booking ownership hardening (silent lazy-claim vs phone+OTP decision), performance (Redis for search), mobile passenger MVP.

## Key Files
- `apps/web/features/home/components/home-header.tsx` — locale-aware nav + switcher placements.
- `apps/web/components/locale-switcher.tsx` — shared switcher, now with `className` prop.
- `apps/web/i18n/{navigation,routing,types}.ts` — `createNavigation(routing)` primitives; `locales: ["en","fr"]`, `as-needed` prefix.
- `apps/web/messages/{en,fr}.json` — `locale.*` keys (pre-existing).

## Known State
- Web test script is a hardcoded tsx file list in `apps/web/package.json` — new test FILES must be added there; new tests in existing files run automatically.
- Biome diagnostics on touched files are pre-existing style noise (CRLF, a11y, import-order); web `lint` script only checks config files.
- `exactOptionalPropertyTypes: true` is on for web — optional fields must accept `undefined` explicitly in union types.
- AGENTS.md: modified Next.js — consult `node_modules/next/dist/docs/` before writing code.

---

## Prior Session (2026-08-02) — International Phone Validation for Passenger Surfaces (Login + Settings)

## Summary
Upgraded passenger phone handling from CI-only (+225) to strict international validation using `react-phone-number-input` + `libphonenumber-js` (max metadata). Login keeps a single combined email-or-phone field (no visual country picker — decided earlier); phones are validated per-country and normalized to E.164 before OTP send/verify using a geo-detected default country. Settings got a searchable all-countries picker (defaulting to the detected country), inline strict validation, and now writes the correct `user.phoneNumber` column — it was writing a non-existent `user.phone` field (latent Prisma crash on every save).

## Completed Work
- **Phone lib** (`apps/web/lib/phone/phone-number.ts`): `getPhoneValidationError` (libphonenumber `max`; maps TOO_SHORT/TOO_LONG/INVALID_LENGTH/INVALID_COUNTRY/NOT_A_NUMBER/INVALID), `toE164`, `resolveCountryCode` (returns `CountryCode`), `getParsedCountry`, `getCountryDisplayName`, `isSupportedCountryCode`.
- **Geo detection** (`apps/web/lib/phone/detect-country.ts`): `detectCountryFromHeaders` (x-vercel-ip-country, cf-ipcountry, x-geo-country, x-country-code), `detectCountryFromClient` (Intl.Locale region), `resolveDefaultCountry`. Wired through login + settings server pages via `headers()`.
- **Shared PhoneInput** (`packages/ui/.../phone-input.tsx`): backward-compatible — `country` prop now optional; a single-country `countries` list (historical default `["CI"]`) still renders the fixed `FixedCountrySelect`; a full `countries` list (e.g. `getCountries()`) with no `country` renders the searchable `CountrySelect`. Operator call sites unchanged (locked CI).
- **Login flow** (`passenger-auth-flow.tsx`): removed `+225`/`07`/`05`/`01` heuristics; `detectMethod` now `@` → email else digit-symbol → phone; phone normalized via `toE164(value, detectedCountry)` (invalid → inline `invalidPhone` error); email regex-checked (`invalidEmail`); OTP verify uses the exact sent E.164 (`sentIdentifier` state).
- **Settings** (`passenger-settings-view.tsx` + settings page): `countries={getCountries()}`, `defaultCountry={phoneCountry}` (detected → stored-phone country → CI), inline `validationPhone` error, save normalizes to E.164.
- **Server** (`trpc/routers/passenger.ts`): `updatePreferences` validates + normalizes phone to E.164 and writes `phoneNumber` (NOT the nonexistent `user.phone` — fixes a latent crash); P2002 unique-conflict → TRPCError CONFLICT.
- **Schemas**: `updatePreferencesSchema.phone` tightened to E.164 regex.
- **Tests** (`apps/web/lib/phone/__tests__/phone-number.test.ts`): 18 cases; registered in the hardcoded test list in `apps/web/package.json`.
- **i18n**: `auth.passenger.invalidPhone`/`invalidEmail`, `passengerDashboard.settings.validationPhone` in en.json + fr.json (English text in both per language rule).
- **Verification**: web typecheck clean (only pre-existing `routes.ts` errors from the in-flight search-ERP work remain), 125/125 web tests pass, @moja/ui typecheck clean.

### Follow-up (2026-08-02) — Specific phone error UX + save-decision tests
User reported settings phone behaving inconsistently: `+255` "submits", `+255 2342342432` errors. Root cause: (a) the report was likely a stale build — with the current code `+255` → `TOO_SHORT` → rejected — but the generic error message gave no explanation, and (b) `+255 2342342432` IS genuinely invalid (TZ national = 9 digits, this has 10) yet the message was confusing. Fixes:
- `getPhoneValidationError` now derives the number's real country (`parsePhoneNumberFromString(...).country`) so errors name the right country (e.g. `+255 2342342432` → `TOO_LONG` country `TZ`, not the default `CI`).
- New pure `resolvePhoneForSave(phone, defaultCountry): PhoneSaveResult` — single source of truth for "should this save?" (empty → `ok, phone: undefined`; non-empty must be valid E.164). Settings `handleSaveProfile` uses it.
- New `apps/web/lib/phone/phone-error-message.ts` maps error codes → specific i18n keys (`validationPhoneTooShort/TooLong/InvalidLength/InvalidCountry/NotANumber/Invalid` + generic fallback) with `{country}` interpolation; en.json + fr.json updated.
- New test file `apps/web/lib/phone/__tests__/validate-phone-input.test.ts` (25 tests) covering the exact user inputs, save-decision, country context, message mapping; registered in the hardcoded test list. Web typecheck clean, **157/157** tests pass.

## Next Steps
- Back to standard roadmap (progress-tracker "Recommended Next Steps"): booking ownership hardening (silent lazy-claim vs phone+OTP decision), performance (Redis for search), mobile passenger MVP.
- Deferred: operator login/details phone validation (kept CI-locked on purpose); legacy `normalize-phone.ts` loose matcher unchanged.

## Key Files
- `apps/web/lib/phone/{phone-number,detect-country}.ts` + `__tests__/phone-number.test.ts` — strict validation/E.164 normalization + geo country detection.
- `packages/ui/src/components/ui/phone-input.tsx` — country-selectable when a full `countries` list is passed.
- `apps/web/features/auth/components/passenger-auth-flow.tsx`, `features/auth/views/login-view.tsx`, `app/[locale]/(auth)/(passenger)/login/page.tsx` — login flow.
- `apps/web/features/passenger/views/passenger-settings-view.tsx`, `app/[locale]/dashboard/(passenger)/settings/page.tsx` — settings.
- `apps/web/trpc/routers/passenger.ts` — phone normalized to E.164, written to `phoneNumber`, P2002 → CONFLICT.
- `apps/web/package.json` — `libphonenumber-js` dep + test-file list entry.
- `apps/web/messages/{en,fr}.json` — new phone/email validation keys.

## Known State
- No migrations folder — schema changes via `prisma db push` (script `db:push` in `packages/db`); scripts in `packages/db/scripts/` run via `pnpm exec tsx` from `packages/db`.
- Web test script is a hardcoded tsx file list in `apps/web/package.json` — new test FILES must be added there; new tests in existing files run automatically.
- Biome diagnostics on touched files are pre-existing style noise (CRLF, a11y, import-order); web `lint` script only checks config files.
- `exactOptionalPropertyTypes: true` is on for web — optional fields must accept `undefined` explicitly in union types.
- AGENTS.md: modified Next.js — consult `node_modules/next/dist/docs/` before writing code.

---

## Prior Session (2026-08-02) — Fix DOB Input on Onboarding PROFILE Step

## Summary
Fixed the date-of-birth input on the onboarding PROFILE step (`apps/web/features/operator/components/onboarding/profile-step.tsx`). The controlled input derived its `value` from `dateOfBirth` state, which only holds a valid parsed ISO date — `parseDobInput` returns `""` for any incomplete entry, so every keystroke cleared the field and typing was impossible. Added a separate `dobInput` raw-text state: `value` now reflects `dobInput`, `onChange` stores raw text and syncs the parsed ISO into `dateOfBirth` only when valid, and `onBlur` flags an error only when there's text but no valid parsed date. Prefill sets both states. Web typecheck clean.

## Completed Work
- **Root cause:** controlled-input anti-pattern — `value={formatDisplayDob(dateOfBirth)}` + `setDateOfBirth(parseDobInput(raw))` wiped the field on every incomplete keystroke.
- **Fix:** new `dobInput` state (`profile-step.tsx:47`); `onChange` does `setDobInput(raw)` + `setDateOfBirth(parseDobInput(raw))` (:272-277); `onBlur` errors when `dobInput && !dateOfBirth` (:278-282); prefill seeds both `dobIso` and its MM/DD/YYYY display (:76-78). `handleSubmit`/`canContinue` still gate on the valid ISO `dateOfBirth`.
- **Verification:** web `pnpm typecheck` clean.

## Next Steps
- Back to standard roadmap (progress-tracker "Recommended Next Steps"): booking ownership hardening (silent lazy-claim vs phone+OTP decision), performance (Redis for search), mobile passenger MVP.

## Key Files
- `apps/web/features/operator/components/onboarding/profile-step.tsx` — DOB input fix (separate raw-text state).

## Known State
- No migrations folder — schema changes via `prisma db push` (script `db:push` in `packages/db`); scripts in `packages/db/scripts/` run via `pnpm exec tsx` from `packages/db`.
- Web test script is a hardcoded tsx file list in `apps/web/package.json` — new test FILES must be added there; new tests in existing files run automatically.
- Biome diagnostics on touched files are pre-existing style noise (CRLF, a11y, import-order); web `lint` script only checks config files.
- `exactOptionalPropertyTypes: true` is on for web — optional fields must accept `undefined` explicitly in union types.
- AGENTS.md: modified Next.js — consult `node_modules/next/dist/docs/` before writing code.

---

## Prior Session (2026-08-02) — Stops on Map — Shared RouteMapPreview Across Operator + Passenger Surfaces

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
