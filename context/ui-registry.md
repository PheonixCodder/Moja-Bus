# UI Registry

Living document. Updated after every component is built. Read this before building any new component - match existing patterns exactly before inventing new ones.

## How to Use
Before building any component:
1. Check whether a similar component already exists here.
2. If yes, match its exact classes and behavior.
3. If no, build it from the token and UI rules, then add it here.

After building any component, update this file with the component name, file path, and exact classes used.

## Components
- `apps/web/components/auth-shell.tsx`: full-screen auth shell with `bg-[#07131f]`, layered radial gradients, `rounded-[2rem]`, `border border-white/10`, `bg-white/[0.06]`, and `backdrop-blur`.
- `apps/web/components/auth-field.tsx`: auth input rows using `rounded-2xl`, `border border-white/10`, `bg-slate-950/75`, `px-4 py-3`, and cyan focus states.
- `apps/web/components/dashboard-panel.tsx`: protected dashboard card using `bg-[#06111a]`, gradient overlays, and `rounded-[2rem]` glass panels.
- `apps/app/src/components/auth-shell.tsx`: mobile auth screen shell with dark background, decorative glow views, `SafeAreaView`, and a glass card container.
- `apps/app/src/components/auth-field.tsx`: mobile auth text input rows with rounded 18px borders, dark fill, and secondary helper text.
- `apps/app/src/components/auth-button.tsx`: shared pressable auth action with primary/secondary variants, loading spinner, and disabled state styling.
- `packages/ui/src/components/ui/date-picker.tsx`: Shared Shadcn Popover + Calendar single date picker re-exported to `@moja/ui/components/ui/date-picker`.
- `packages/ui/src/components/ui/time-picker.tsx`: Shared Shadcn Popover + Select time picker (`HH:mm`) with preset times re-exported to `@moja/ui/components/ui/time-picker`.
- `packages/ui/src/components/ui/date-time-picker.tsx`: Shared Shadcn Popover + Calendar + TimePicker combo component for datetime selection re-exported to `@moja/ui/components/ui/date-time-picker`.
- `apps/web/lib/format-date.ts`: Centralized application date & time formatting module (`formatDate`, `formatTime`, `formatDateTime`, `formatDepartureTime`) anchored to `Africa/Abidjan` (UTC+0).
- `packages/ui/src/components/ui/*`: shared shadcn component source of truth mirrored from `demo-ui` and exposed to apps through `@moja/ui/components/ui/*`.
- `apps/web/features/dashboard/components/dashboard-sidebar.tsx`: passenger dashboard sidebar redesigned to match best-dashboard-setup layout structure, custom grouped nav, traveler support card, and NavUser ellipsis dropdown footer.
- `apps/web/features/dashboard/components/dashboard-header.tsx`: dashboard welcome header with session-aware greeting and search CTA.
- `apps/web/features/dashboard/components/sessions-panel.tsx`: empty-state trips panel using the same card shell as the demo dashboard, adapted to bookings.
- `apps/web/features/passenger/views/passenger-wallet-view.tsx`: Client-side view component displaying live Available/Reserved balances, top-up dialogue, and dynamic ledger transaction history table.
- `apps/web/features/admin/views/admin-settlements-view.tsx`: Admin treasury cockpit displaying central clearing and revenue balance cards, an emergency manual settlement panel, and a class-filterable ledger auditor.
- `apps/web/features/admin/views/admin-withdrawals-view.tsx`: Payout monitoring queue view displaying KPI summaries, status filters, and manual override dialogs.
- `apps/web/app/dashboard/admin/withdrawals/page.tsx`: Page container prefetching withdrawals queue data and rendering `AdminWithdrawalsView`.
- `apps/web/app/dashboard/(passenger)/wallet/page.tsx`: Suspense-bound container page prefetching passenger wallet data and rendering `PassengerWalletView`.
- `apps/web/app/dashboard/(passenger)/layout.tsx`: redesigned passenger dashboard layout using SidebarProvider and SidebarInset with unified h-12 sticky header, search shortcut tag button, and integrated notification inbox.
- `apps/web/features/operator/views/operator-onboarding-view.tsx`: Single-route onboarding multi-step form view using Montserrat typeface, primary brand color `#ee237c`, dense-but-readable layout, small radii (<= 8px), and visible borders.
- `apps/web/features/operator/views/operator-dashboard-view.tsx`: Operator dashboard landing overview rendering company details and verification status.
- `apps/web/features/operator/views/operator-fleet-view.tsx`: Fleet management dashboard with bus table grid and Add Bus popover form.
- `apps/web/features/operator/views/operator-routes-view.tsx`: Full Route Builder page with drag-and-drop stop sequence reordering, Leaflet map previews, and search-equipped Combobox selectors.
- `apps/web/features/operator/views/operator-schedules-view.tsx`: Thin orchestrator — list filters/pagination (nuqs), IAM-gated actions, 4-step wizard, edit drawer. Components under `features/operator/components/schedules/`.
- `apps/web/features/operator/views/operator-trips-view.tsx`: Thin Dispatch Board orchestrator — nuqs filters, Abidjan day grouping, pagination, IAM-gated fleet/actions. Composes `features/operator/components/trips/*`.
- `apps/web/features/operator/components/trips/`: Trip card, toolbar, status badge, segment occupancy, manifest drawer (board/depart/arrive/delay/cancel, gate/notes, check-in).
- `apps/web/features/operator/views/operator-bookings-view.tsx`: Bookings list with nuqs filters/pagination, check-in scanner, CSV export, detail drawer cancel via `operator.cancelBooking`.
- `apps/web/features/operator/views/operator-withdraw-view.tsx`: Self-serve operator payout withdrawal portal displaying Available vs Escrow (`liveReservedBalance`); bank-not-verified banner gates withdraw.
- `apps/web/features/operator/components/revenue/transaction-ledger-table.tsx`: Ledger table with CSV export via `operator.exportLedgerCsv`.
- `apps/web/app/dashboard/operator/(dashboard)/withdraw/page.tsx`: Page wrapper for `OperatorWithdrawView`.
- `apps/web/features/booking/components/booking-dialog-flow.tsx`: 2-step (seats → checkout) booking dialog with sticky header; trip summary card, centered `PassengerSeatMap` grid, centered Continue CTA.
- `apps/web/features/booking/components/passenger-seat-map.tsx`: interactive seat grid centered in the dialog (`w-max mx-auto` wrapper + `justify-center` legend), fixed seat geometry, status legend (Available/Selected/Sold/Held/Blocked).
- `apps/web/features/booking/components/trip-summary-card.tsx`: trip summary header (logo, company, urban/express badges, origin→dest label), departure/arrival grid with bus timeline, price rail + availability badge, amenity chips, a vertical `StopsTimeline` (arr/dep times per stop, colored node rail, leg durations, Boarding/Alight/Pickup/Dropoff tags), and a "Show route on map" toggle (`StopsMap`) rendering the segment stops via `RouteMapPreview`.
- `apps/web/features/booking/components/booking-route-map.tsx`: passenger booking-details map — renders ALL segment stops (markers + polyline + popups) via shared `RouteMapPreview`; falls back to a pure-CSS route diagram banner when coordinates are missing; floating origin/destination overlay badge.
- `apps/web/features/operator/components/route-map-preview.tsx`: shared Leaflet map (markers + polyline + popups) over a minimal `RouteMapPoint[]` shape (`{id, name, cityName, latitude, longitude}`); used by route-form-drawer, admin-route-drawer, trip-summary-card stops map, and booking-route-map.
- `apps/web/features/operator/components/operator-quick-actions.tsx`: Header-level dashboard quick actions supporting query-parameter-driven form automation.
- `apps/web/features/operator/components/terminals/terminal-editor-sheet.tsx`: **M4 capture-mode terminal editor** — standard mode (City/Municipality/Quarter Comboboxes via `locations.searchMunicipalities/searchQuarters` with skipToken, pass-through auto-select, operating hours) OR capture mode (name + phone + Primary/Active toggles, Terminal switch locked; auto-forced when editing a non-COMPLETE terminal) → `terminals.create/update` (`geoCaptureStatus: PENDING_CAPTURE`) → `captures.createCapture` → **link card** (URL, Copy w/ copied state, WhatsApp `https://wa.me/?text=`, expiry); placeholder address `CAPTURE_ADDRESS_PLACEHOLDER = "(pending GPS capture)"`; header capture-status badge; PENDING_CONFIRMATION info banner.
- `apps/web/features/operator/components/terminals/terminals-table.tsx` + `apps/web/features/operator/views/operator-terminals-view.tsx`: **M4 capture UI** — `CaptureStatusBadge` (amber Awaiting capture / sky Location submitted / violet Pending approval), CAPTURE filter + `kpi.pendingCaptures` StatCard, violet "Resolve capture" button when latest capture CONFIRMED → **Resolve drawer** (terminal name, resolved label via `getGeoPlaceLabel`, coords 5dp, `accuracyMeters`, submitted-on, submitter name/phone, device, notes; Approve emerald / Reject destructive with `window.confirm`; `captures.approveCapture`/`rejectCapture`).
- `apps/web/app/[locale]/capture/[token]/page.tsx` → `apps/web/features/capture/components/capture-page-view.tsx`: M3 public GPS capture-link page. Server page does `getInfo` + friendly expired/rejected/invalid error screens; client view is a mobile-first single-card flow — signature pulsing **radar disc** (navy `bg-[#07131f]` + brand-pink `#ee237c` crosshair, `animate-ping` rings, `motion-reduce:hidden`), terminal/company card, optional name/phone/street-landmark fields, `navigator.geolocation` → 150m accuracy gate → `captures.submit` → resolved preview (`formatLocationLabel` + coords/±accuracy) → `captures.confirm` → emerald success + "waiting for operator approval" pill. Phases `idle|locating|submitting|preview|confirmPrompt|confirming|done|error`; brand CTAs `bg-[#ee237c] rounded-xl h-12 font-bold`.

## Platform Data (Seeded via `packages/db/prisma/seed.ts`)
- **`City`**: 35 CI cities seeded. `isMajorHub` flags Abidjan, Bouaké, Yamoussoukro, San-Pédro, Daloa, Korhogo, Man.
| **AddBusModal** | Dialog | Operator / Fleet | Modal to register new vehicles, now includes grouped layout picker with quick access to the layout builder. |
| **SeatMapPreview** | Component | Operator / Fleet | Shared interactive/readonly grid canvas for visualizing a seat layout. |
| **LayoutBuilderSheet** | Sheet | Operator / Fleet | Advanced 3-step wizard (Configure, Design, Preview) for operators to create custom layout grid maps. |
- **`BusType`**: 7 vehicle types seeded.
- **`SeatLayoutTemplate`**: 5 platform-default seat grid layouts. Operator-specific layouts use `companyId`.
- **`CompanyLocation` (Terminal)**: Operator depots from onboarding. `isTerminal=true` makes them bookable passenger stops. Linked to `City` via `cityId`.

## Backend Services (tRPC Routers under `apps/web/trpc/routers`)
- `apps/web/features/operator/views/operator-schedules-view.tsx`: Thin orchestrator for schedule list, 4-step create wizard, edit drawer, retire/delete. Composes `features/operator/components/schedules/*`.
- `apps/web/features/operator/components/schedules/`: Wizard steps, toolbar, card, edit drawer, delete dialog, success banner.
- `apps/web/lib/schedule-trip-window.ts`: Shared candidate departure dates (preview + generator).
- `apps/web/lib/trip-generator.ts`: Auto-generates rolling 14-day `Trip`, `TripStop`, and `TripSeat` records from a Schedule + preferred bus. Honors `isActive`, EXTRA_SERVICE, MODIFIED override time.
- `apps/web/app/api/cron/generate-trips/route.ts`: Daily cron extends active schedules (vercel `0 2 * * *`).
- `apps/web/trpc/routers/trips.ts`: Trip operations — paginated list (`scheduleId`, status, date window), detail, `assignBus`, delay (incremental), cancel with refunds, status lifecycle graph, gate/notes.
- `apps/web/trpc/routers/schedules.ts`: Schedule CRUD, retire, reconcileFutureTrips, fare add/update/deactivate, safe exceptions.
- `apps/web/trpc/routers/routes.ts`: Route + waypoint CRUD procedures.
- `apps/web/trpc/routers/terminals.ts`: Terminals list procedure.
- `apps/web/trpc/routers/fleet.ts`: Bus CRUD, bus-types list, seat layout templates list, seat layout per bus.
- `apps/web/trpc/routers/staff.ts`: Staff list, invitation, and role management.

## Geo Data Layer (feeds search/autocomplete + terminal workflows)
- `packages/db/scripts/import-ivory-coast-geo.ts`: Single source of truth for the CI geography dataset — 188 cities, 200 municipalities (187 pass-through + 13 Abidjan communes), 3230 quarters, PostGIS polygons. Exports `runIvoryCoastGeoImport(prisma)`; invoked by `prisma db seed` and `pnpm --filter @moja/db import:geo`. CLI guard: `process.argv[1]?.endsWith("import-ivory-coast-geo.ts")` (an earlier `import.meta.url` check fired on import, running the import twice). `readAbidjanCoords()` reads `ivory_coast_data/abidjan_communes_quarters_osm.csv` to backfill `latitude/longitude` on the 13 Abidjan communes + 81 curated quarters (all 81/81 + 13/13 filled).
- `apps/web/lib/geo/geocode-point.ts`: Pure offline geo-resolution engine (M1) — `geocodePoint({latitude, longitude, municipalities, quarters})` → resolved city/municipality/quarter + `method` + `distanceMeters`. Point-in-polygon (smallest-area on overlap, holes), nearest-quarter scoped to resolved municipality, nearest-municipality fallback. Consumed by `locations.geocodePoint` tRPC procedure (loads MultiPolygon geometry + coords via `$queryRaw`).
- `packages/db/scripts/convert-populated-places.ts`: One-time `.gpkg` → `.geojson` converter (Node `node:sqlite`, no GDAL) → `ivory_coast_data/populated_places.geojson`.
- `apps/web/features/search/lib/__tests__/geo-fixtures.ts`: 188-city fixture mirroring the importer output (hub flags, Abidjan's 13 communes / 81 quarters) — consumed by `build-search-entries` + `format-location-label` tests. Regenerate from DB via a temp script if the dataset changes.
