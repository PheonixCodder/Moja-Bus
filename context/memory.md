# Memory

**Session:** Ivory Coast geography import (M0) + GPS capture-link terminal workflow (M1+M2+M3+M4+M5 done, M6 verification next)
**Date:** 2026-08-05

## Summary
Implemented the Ivory Coast geography data pipeline (M0): full import of cities/municipalities/quarters from OSM + GADM GeoJSON sources with PostGIS polygons, plus a "capture link" terminal workflow (M1 geo-resolution engine, M2 backend capture-link, M3 public capture page, M4 operator UI done). Seed now delegates all geography to a single importer (`runIvoryCoastGeoImport`) — the 188-city/200-municipality/3230-quarter dataset is fully idempotent. **Coordinate backfill for Abidjan's 13 communes + 81 curated quarters complete (2026-08-05):** all 13 communes + 81/81 quarters now have coordinates (OSM-derived + user-supplied).

## Completed Work
- **M5 — Search/consumer audit (DONE, 2026-08-05):**
  - Audited every §8 consumer against the expanded dataset. All green; only `build-search-entries.test.ts` needed hardening (format-only, no unsafe lint fixes — repo `noPropertyAccessFromIndexSignature` rule conflicts with biome `--unsafe`).
  - **`geo-fixtures.ts`**: already mirrors full importer output (188 cities w/ hub flags, Abidjan 13 communes + 81 quarters, `seedPassThroughCities` = 187) — no change.
  - **New tests** ("full 188-city dataset" describe in `build-search-entries.test.ts`, +3): every pass-through city typed yields exactly one city-level row (no `City (City)` dup); no municipality row duplicates its city name across the whole dataset; composite key unique across full Abidjan quarter set (95 entries = 1 city + 13 munis + 81 quarters).
  - **`searchCities`** (`trpc/routers/locations.ts`): `take: 10` on each of 3 queries → `buildSearchEntries(..., 10)`; autocomplete `key` in `city-autocomplete-field.tsx:81` = same composite key.
  - **`getCityDetails`/`getGeoPlaceLabel`/`validate-search-pair`**: dataset-agnostic (id/name-based, accent-normalized), re-verified.
  - **`routes.getCities` → Combobox**: covered by M4 (operator editor Comboboxes).
  - **Mobile app** (`apps/traveler-app/`): search tab is a placeholder shell; grep = zero hard-coded city names (only `use-screen-transition` "opacity" false-positive). No consumer code to break.
  - **Non-COMPLETE terminals unreachable — guards verified (no code change):** `captures.submit` writes only lat/long to the terminal; `cityId/municipalityId/quarterId` stay null until `approveCapture`. `routes.create/update` (`missingCity` guard at routes.ts:122 and :290) reject any route terminal without a cityId; route activation requires `isTerminal && isActive`. Search (`placeMatchesTerminal`/`terminalWhere`) matches only by city/muni/quarter ids → city-less pending terminals can never match. Editor offers capture mode only for NEW terminals, so a geo-complete terminal can't be re-captured.
  - Verification: web `tsc --noEmit` clean (exit 0); **227/227 tests pass** (60 suites; +3 new); `next build` ✓; biome clean on changed test file.
- **M4 — Operator UI for capture-link workflow (DONE, 2026-08-05):**
  - **Schema** `packages/schemas/src/routes.ts`: `baseTerminalSchema` gains optional `geoCaptureStatus` (`COMPLETE | PENDING_CAPTURE | PENDING_CONFIRMATION`); `createTerminalSchema.superRefine` skips city/lat/long-required checks when capture pending (`status != null && !== "COMPLETE"`). No tests reference these schemas (verified).
  - **Router** `apps/web/trpc/routers/terminals.ts`: `list` includes latest active capture (`captures` where status `OPEN|PENDING_CONFIRMATION|CONFIRMED`, take 1, desc); `create` persists `geoCaptureStatus` (default `COMPLETE`); `update` city-guard only fires when effective `geoCaptureStatus === "COMPLETE"` (bookable).
  - **Editor** `features/operator/components/terminals/terminal-editor-sheet.tsx` (full rewrite): capture-mode toggle for new terminals (auto-forced when editing a non-COMPLETE terminal); capture mode = name + phone + Primary/Active toggles only (Terminal switch locked on) → `terminals.create({ geoCaptureStatus: "PENDING_CAPTURE" })` / `terminals.update` (status preserved) → `captures.createCapture` → link card (URL, Copy w/ copied state, WhatsApp `https://wa.me/?text=...`, expiry via `expiresOn`); placeholder address `CAPTURE_ADDRESS_PLACEHOLDER = "(pending GPS capture)"` (DB requires `addressLine1`); PENDING_CONFIRMATION info banner; header capture-status badge. Standard mode City/Municipality/Quarter native selects → **Comboboxes** (`trpc.locations.searchMunicipalities({cityId})` / `searchQuarters({municipalityId})`, skipToken when id missing); pass-through single-municipality auto-select kept. i18n via `capture.*` namespace.
  - **Table** `features/operator/components/terminals/terminals-table.tsx`: `CaptureStatusBadge` (amber Awaiting capture / sky Location submitted / violet Pending approval); violet-outline "Resolve capture" (Link2 icon) when latest capture status `CONFIRMED` → new `onResolveCapture` prop.
  - **View** `features/operator/views/operator-terminals-view.tsx` (rewrite): CAPTURE filter added to `[ALL, TERMINAL, DEPOT, CAPTURE]`; `kpi.pendingCaptures` StatCard; pending filter = `geoCaptureStatus != null && !== "COMPLETE"`; Resolve Capture drawer (`trpc.locations.getGeoPlaceLabel` w/ skipToken, coords 5dp, `accuracyMeters`, submitted-on, submitter name/phone, device, notes); Approve (emerald) / Reject (destructive) with `window.confirm`; `captures.approveCapture` / `rejectCapture` mutations + toasts. Passes `{...capture, locationName: loc.name}` to the drawer.
  - **Service** `features/capture/services/capture-service.ts`: `CAPTURE_ADDRESS_PLACEHOLDER` now exported; `approveCapture` auto-fills `addressLine1` from the resolved label via `formatLocationLabel` (e.g. `"Abidjan (Adjamé - Monsieur)"`) only when the current value is null or the placeholder — real addresses left untouched; `findCaptureInCompany` now selects + exposes `locationAddressLine1`. `previewFromCapture` is reused for the label (mock prisma needs `city`/`municipality`/`quarter.findUnique`).
  - **i18n** `en.json` + `fr.json`: `operatorDashboard.terminals.capture.*` (standardMode, pendingFilter, captureMode, captureModeDescription, captureOnlyNamePhone, generateLink, createAndGenerateLink, linkTitle, linkHint, copy, copied, shareWhatsApp, expiresOn, captureStatus, statusAwaitingCapture, statusSubmitted, statusPendingApproval, pendingCaptureNote, submittedNote, linkGenerated, linkGenerationFailed, captureCreated), `resolve.*` (title, description, terminal, submittedBy, noSubmitter, submittedOn, submittedLabel, accuracyMeters "Accuracy: {accuracy} m", accuracyLabel, coordinates, resolvedLocation, notesLabel, device, notYetResolved, approve, reject, approveConfirm, rejectConfirm, approved, rejected, approveFailed, rejectFailed, empty), `kpi.pendingCaptures` — English in both files per language rule.
  - **Verification:** web `npx tsc --noEmit` clean (exit 0); **224/224 tests pass** (59 suites; +2 new approveCapture address tests: fills placeholder, leaves real address); `next build` ✓ (125 static + dynamic routes incl. `/[locale]/capture/[token]` + `/api/cron/sweep-captures`); biome clean on touched files (only repo-conventional `useLiteralKeys` / `noExplicitAny` / `noUselessFragments`(1) / `useExhaustiveDependencies`(2) categories — do NOT apply `--unsafe` fixes, they break `noPropertyAccessFromIndexSignature` tsc).
  - **Toolchain lesson:** PowerShell byte/regex manipulation corrupts and can destroy UTF-8 source files (destroyed `terminal-editor-sheet.tsx` once, recovered by full write-tool rewrite). Always use the write/edit tools for file content.
- **M3 — Public capture share page (DONE, 2026-08-05):**
  - `apps/web/app/[locale]/capture/[token]/page.tsx` (server): `generateMetadata` from `capturePage` namespace; calls `createCaptureService(getPrismaClient()).getInfo({token})`; TRPCError mapped to friendly expired/rejected/invalid error screens; renders the client view. Mirrors the `tickets/[token]` page pattern (`params: Promise`, header bar).
  - `apps/web/features/capture/components/capture-page-view.tsx` (client): branded mobile-first flow — idle screen with a signature pulsing "radar" disc (navy `#07131f` + brand pink `#ee237c` crosshair, `animate-ping` rings, `motion-reduce:hidden`) + terminal/company card + optional name/phone/street-landmark fields → "Share my location" → `navigator.geolocation.getCurrentPosition({enableHighAccuracy, timeout:15000, maximumAge:0})` → client 150m accuracy gate (server enforces too) → `captures.submit` → resolved preview via `formatLocationLabel` (isUrban:false → `Abidjan (Cocody - Riviera 3)`), coords + ±accuracy → `captures.confirm` → emerald success + "Waiting for operator approval" pill. Handles: PENDING_CONFIRMATION reopen (`confirmPrompt` → confirm), CONFIRMED reopen (straight to done), permission-denied / locate-failed / accuracy-too-low / server errors (retry → idle). Phases: `idle | locating | submitting | preview | confirmPrompt | confirming | done | error`.
  - All copy in a new `capturePage` namespace in `en.json` + `fr.json` (English text in both per language rule).
  - **Decision:** `addressLine1` is NOT a `LocationCapture` column (M2 schema), so the "Street / landmark" input maps to `submit`'s `notes` field — no schema change needed.
  - **Pre-existing build blockers fixed (user-approved):** the 3 `features/admin/*` typecheck errors that blocked `next build` are now fixed — `redirect-delete-dialog.tsx:63` (`redirect?.source ?? ""`), `redirects-table.tsx` (added missing `useTranslations` import), `admin-verifications-view.tsx` (added `columnsT = useTranslations("adminDashboard.verificationsColumns")` passed as the required `t` to `getCompanyColumns` — correct namespace for the column labels). **Web `tsc --noEmit` is now fully clean (exit 0)** and `next build` compiles green (125 static pages + `ƒ /[locale]/capture/[token]` + `ƒ /api/cron/sweep-captures`).
  - Verification: typecheck clean; biome clean on the new files (M3 files only; the admin files retain pre-existing style noise — CRLF, unused imports, `any`); **222/222 web tests pass**; `next build` green.
- **M2 — Backend capture-link (DONE, 2026-08-05):**
  - `apps/web/features/capture/services/capture-service.ts` — `CaptureService` with `CAPTURE_TTL_MS = 7d`, `MAX_ACCURACY_METERS = 150`, `defaultSubmitLimiter` (10 req / 10 min window). Tokens stored RAW (256-bit base64url, single-use). `createCapture` idempotent: live OPEN/PENDING_CONFIRMATION/CONFIRMED attempt re-shared as-is (doesn't invalidate in-flight link). Operations: `createCapture`, `getInfo` (auto-marks expired → EXPIRED), `submit` (accuracy gate → rate-limit by `token:ip` → require `OPEN` → geo-resolve → capture `PENDING_CONFIRMATION` + terminal `PENDING_CONFIRMATION` with tentative lat/lon, all in one tx; stores `capturedAt`/`resolvedAt`/resolved ids/`device` (UA regex mobile|tablet|desktop)/`userAgent`/`ip`/`submitterName`/`submitterPhone`/`notes`), `confirm` (idempotent for `CONFIRMED`, rejects `OPEN`), `approveCapture` (require `CONFIRMED` + resolvedCityId/MunicipalityId → terminal `COMPLETE` + city/municipality/quarter linked + `CAPTURE_APPROVED` ActivityLog + clears captureToken/captureExpiresAt), `rejectCapture` (→ `REJECTED`, terminal `PENDING_CAPTURE`, `CAPTURE_REJECTED` log), `sweepExpired` (expire stale attempts; terminal reverts to `COMPLETE` if it already has a city, else stays `PENDING_CAPTURE`). `createCaptureService(prisma)` default factory wires the offline resolver.
  - `apps/web/lib/rate-limit.ts` — in-memory fixed-window limiter (`createRateLimiter({windowMs, max, now?, store?})` → `(key) => {ok, retryAfterMs}`), map store injectable.
  - `apps/web/lib/geo/load-geo-dataset.ts` — shared `loadGeoDataset(prisma)` (`$queryRaw` + `ST_AsGeoJSON(m.geometry)` → `{municipalities, quarters}`); `locations.geocodePoint` refactored onto it (same SQL, inline maps removed).
  - `apps/web/trpc/routers/captures.ts` registered as `captures` in `_app.ts`: `createCapture`/`approveCapture`/`rejectCapture` via `operatorCompanyProcedure` (`terminals:update`), `getInfo`/`submit`/`confirm` public. IP parsed from `x-forwarded-for` first value → `x-real-ip` (mirrors `contact.ts`).
  - Cron `apps/web/app/api/cron/sweep-captures/route.ts` (GET, `assertCronAuthorized`) → `service.sweepExpired()`.
  - Tests: `apps/web/lib/__tests__/rate-limit.test.ts` (3) + `apps/web/features/capture/services/__tests__/capture-service.test.ts` (19) — mock prisma (`$transaction(fn) = fn(prisma)`) + injected `now/generateToken/appUrl/resolvePlace/submitLimiter`. Both registered in the hardcoded web test list in `apps/web/package.json`. **Full web suite 222/222 pass.**
  - Verification: `npx tsc --noEmit` clean (only the 3 pre-existing `features/admin/*` errors); biome clean on touched files (only the repo-conventional `process.env["..."]` `useLiteralKeys` info, same as staff.ts). Enum comments in `packages/db/prisma/schema.prisma` updated to reflect plan semantics (submitter confirms → `CONFIRMED`, then operator approves → `COMPLETE`); DB enum values unchanged (comments only).
  - Fixes landed during verification: `confirm` idempotency return shape (`{status:"CONFIRMED", resolved}`); `exactOptionalPropertyTypes` on `submit` optional fields + `approveCapture` lat/lon conditional spreads; `submitLimiter?: ... | undefined` in `CaptureServiceDeps`; `addressLine1` added to test `Row` type.
- **M1 — Geo-resolution engine (DONE, 2026-08-05):** `apps/web/lib/geo/geocode-point.ts` — pure, offline `geocodePoint({latitude, longitude, municipalities, quarters})` → `{cityId, cityName, municipalityId, municipalityName, quarterId, quarterName, method, distanceMeters}`. Resolution: (1) municipality point-in-polygon (smallest-area wins when boundaries overlap; holes respected), (2) nearest quarter within the resolved municipality (Haversine, scoped so neighbours' quarters never win), (3) nearest-municipality fallback when no polygon contains the point (`method: "nearest"`, skips coords-less munis). Returns null for out-of-range coords / empty dataset. **tRPC:** `locations.geocodePoint` (public procedure, z-validated lat/lon) loads all active municipalities via `$queryRaw` (`ST_AsGeoJSON(m.geometry)` = MultiPolygon GeoJSON + city join) + all active quarters, maps to the pure types, delegates. 13 unit tests (`lib/geo/__tests__/geocode-point.test.ts`): polygon hit, scoped-quarter, overlap smallest-area, holes, fallback + nearest quarter, coords-less skip, edge validation, distance. Registered in the hardcoded web test list → **200/200 web tests pass**. Smoke-tested against live DB: Cocody→Riviera 3, Abobo→Abobo Baoule, Yopougon→Toit Rouge, Adjamé→Monsieur, Bouaké→Mamianou (polygon), ocean point near Treichville→Mobidoum (nearest). Web typecheck clean (only pre-existing `features/admin/*` errors). No third-party services — fully offline/deterministic per plan §4.
- **Abidjan coordinate backfill (DONE, 2026-08-05):** New `readAbidjanCoords()` in `import-ivory-coast-geo.ts` parses `ivory_coast_data/abidjan_communes_quarters_osm.csv` (13 communes + 81 quarters; user-filled commune/quarter coords kept verbatim) and sets `latitude`/`longitude` on the Abidjan municipality + quarter upserts (`source: "CURATED"`). Data sources: full Geofabrik OSM extract `ivory_coast_data/ivory-coast.gpkg` (queried via Node `node:sqlite` + custom GPKG WKB decoder — no GDAL) and `osm-2020-02-10-v3.11_africa_ivory-coast.mbtiles` (tile archive, not queryable per-name, unused). Matching used commune point-in-polygon containment + name matching (norm/stopword/meaning-token), then manual rejection of spurious hits (e.g. Agboville for Agbo, Bacongo-for-Baco = Brazzaville, "Majestic Ficgayo" cinema is in Yopougon not Treichville). The last 10 quarters were filled from user-supplied coords (Adjamé/Monsieur; Attécoubé/Abia, Agbo, Ahongbon, Baco, Dogosso; Treichville/Djelan, Ficgayo, Mobidoum; Yopougon/Nianguan). Final state in DB: **13/13 communes + 81/81 quarters have coords**.
- **PostGIS on Neon:** installed `postgis 3.6.0` extension (persists per database). DB is PostgreSQL 18.4 via pooler host `ep-still-shadow-at2zgkyc-pooler.c-9.us-east-1.aws.neon.tech`; `prisma migrate dev` hangs (shadow-DB) so use `prisma migrate diff` + `migrate deploy`.
- **Schema** (`packages/db/prisma/schema.prisma`): added `LocationGeoCaptureStatus` (COMPLETE/PENDING_CAPTURE/PENDING_CONFIRMATION) + `LocationCaptureStatus` (OPEN/PENDING_CONFIRMATION/CONFIRMED/REJECTED/EXPIRED) enums; `City.pcode/source`; `Municipality.latitude/longitude/geometry(Unsupported)/pcode/source`; `Quarter.latitude/longitude/geometry/externalId/source`; `CompanyLocation.geoCaptureStatus/captureToken/captureExpiresAt`; new `LocationCapture` model → `location_capture` (cascades). Migration `20260804000000_add_geo_capture` adds PostGIS + GiST indexes (`municipality_geometry_gist`, `quarter_geometry_gist`) + `municipality_name_pcode_idx`.
- **GDAL-free pipeline:** `convert-populated-places.ts` reads the `.gpkg` via Node 24 `node:sqlite` (GPB blob → WKB → GeoJSON), producing `ivory_coast_data/populated_places.geojson` (9090 point features). No fiona/geopandas on this Windows box.
- **Importer** (`packages/db/scripts/import-ivory-coast-geo.ts`): exported `runIvoryCoastGeoImport(prisma)` with CLI guard (`process.argv[1]?.endsWith("import-ivory-coast-geo.ts")` — the earlier `new URL(import.meta.url)` guard fired on import, running the import twice). Domain mapping: City = urban commune, Municipality = commune, Quarter = quartier. City candidates = OSM city/town ∪ GADM department capitals ∪ existing seed cities (deduped by normalized name). **Final state: 188 cities, 200 municipalities (187 pass-through + 13 Abidjan communes), 3209 quarters, geometry on 187 municipalities, 168 sous-préfectures linked.** 171/172 named OSM cities/towns map to a sous-préfecture (only Niakaramandougou unmatched).
- **Hub flags:** new `MAJOR_HUBS` set preserves `isMajorHub` on a fresh DB (Abidjan, Bouaké, Yamoussoukro, San-Pédro, Daloa, Korhogo, Man); updates never touch the flag on re-runs.
- **Abidjan communes:** embedded `ABIDJAN_COMMUNES` constant (13 communes + 81 quarters, moved verbatim from old seed) with `source: "CURATED"`, `isPassThrough: false` — importer is the single geographic source of truth. Relabeled from "LEGACY" to "CURATED" (2026-08-05) so the label means "curated Abidjan layer" not "stale old-app data". **No legacy records remain anywhere**: cities are 100% OSM/GADM with coords; the 13 communes + 81 quarters are the only CURATED rows. OSM cannot backfill Abidjan quarter coords (whole country has only 8 suburb/neighbourhood features, 4 near Abidjan, none matching the 81 names — surrounding OSM points are rural villages/hamlets with mojibake); the 81 quarters keep null coords, filled later by the capture-link workflow (M1+).
- **Stale pass-through cleanup (permanent):** deletes a legacy source-null pass-through municipality when a GADM pass-through exists for the same city and the legacy one is unreferenced (removed "Duekoué" when city renamed to "Duékoué").
- **`seed.ts` restructure:** CITIES + MUNICIPALITIES&QUARTERS sections replaced with a single `runIvoryCoastGeoImport(prisma)` call; only non-geo seed (bus types, seat layouts) remains. **Fixed two pre-existing latent bugs** exposed by the refactor: bus-type upsert used `where: { name }` (schema unique is compound `companyId_name`, and Postgres NULLs don't match in unique upserts → switched to findFirst+create), and 7 `findUniqueOrThrow({ where: { name } })` lookups → `findFirstOrThrow({ where: { companyId: null, name } })`. Seed now completes end-to-end idempotently.
- **Test fixtures** (`apps/web/features/search/lib/__tests__/geo-fixtures.ts`): `seedCities` regenerated to the full 188 cities (with hub flags) sourced from the DB; `seedAbidjanMunicipalities` verified to match DB exactly (13 communes, 81 quarters). Web tests **187/187 pass**.
- **Idempotency verified:** repeated importer runs show 0 creates; final counts stable (188/200/3230; one 21-quarter catch-up landed after the relabel run, then stable).

## Next Steps
- **M6 (next):** final verification — web `tsc --noEmit` (already clean), full unit suite (227/227), `next build` (already ✓), and **manual E2E** of the full capture flow (operator creates capture-mode terminal → shares link → submitter GPS-resolves + confirms → operator approves from resolve drawer → terminal COMPLETE + searchable). Update context files at the end.
- Back to standard roadmap: booking ownership hardening, performance (Redis for search), mobile passenger MVP.

## Key Files
- `apps/web/features/search/lib/__tests__/build-search-entries.test.ts` — M5 "full 188-city dataset" regression tests (+3).
- `apps/web/features/search/lib/__tests__/geo-fixtures.ts` — full-dataset fixtures (188 cities, 13 Abidjan communes, 81 quarters, 187 pass-through).
- `apps/web/features/operator/components/terminals/terminal-editor-sheet.tsx` — M4 capture-mode editor + Comboboxes (`CAPTURE_ADDRESS_PLACEHOLDER` imported from service).
- `apps/web/features/operator/components/terminals/terminals-table.tsx` + `apps/web/features/operator/views/operator-terminals-view.tsx` — M4 badges/filter/StatCard/resolve drawer.
- `apps/web/trpc/routers/terminals.ts` — `list` includes captures; `create`/`update` persist/guard `geoCaptureStatus`.
- `packages/schemas/src/routes.ts` — `geoCaptureStatus` on baseTerminalSchema; relaxed superRefine for pending captures.
- `apps/web/messages/{en,fr}.json` — `operatorDashboard.terminals.{capture,resolve}.*` + `kpi.pendingCaptures`.
- `apps/web/app/[locale]/capture/[token]/page.tsx` — M3 public capture page (server).
- `apps/web/features/capture/components/capture-page-view.tsx` — M3 client flow (radar signature, geolocation, submit/confirm).
- `apps/web/messages/{en,fr}.json` — `capturePage` namespace (English in both).
- `apps/web/features/capture/services/capture-service.ts` — M2 capture-link backend (create/submit/confirm/approve/reject/sweep; `CAPTURE_TTL_MS`, `MAX_ACCURACY_METERS`, exported `CAPTURE_ADDRESS_PLACEHOLDER`; `createCaptureService` factory). M4: approve auto-fills placeholder address from resolved label.
- `apps/web/features/capture/services/__tests__/capture-service.test.ts` — 21 tests (mock prisma + injected deps).
- `apps/web/trpc/routers/captures.ts` + `apps/web/trpc/routers/_app.ts` — public + operator mutations; `captures` router registered.
- `apps/web/lib/rate-limit.ts` + `apps/web/lib/__tests__/rate-limit.test.ts` — fixed-window limiter.
- `apps/web/lib/geo/load-geo-dataset.ts` — shared municipality/quarter dataset loader (used by `locations.geocodePoint` + capture submit resolver).
- `apps/web/app/api/cron/sweep-captures/route.ts` — cron sweeper.
- `apps/web/lib/geo/geocode-point.ts` — pure M1 resolver (`GeoResolvedPlace`, `method polygon|nearest`).
- `apps/web/package.json` — test list includes capture + rate-limit test files.
- `packages/db/scripts/import-ivory-coast-geo.ts` — geo importer, single source of truth, exports `runIvoryCoastGeoImport`; reads `readAbidjanCoords()` from the CSV.
- `packages/db/scripts/convert-populated-places.ts` — one-time gpkg→geojson converter (no GDAL).
- `packages/db/prisma/seed.ts` — delegates geography to the importer; bus types + layouts.
- `packages/db/prisma/migrations/20260804000000_add_geo_capture/migration.sql` — PostGIS + new columns + GiST indexes.
- `ivory_coast_data/populated_places.geojson` — converted OSM source (9090 point features).
- `ivory_coast_data/abidjan_communes_quarters_osm.csv` — curated coords (13 communes / 81 quarters; all filled).
- `ivory_coast_data/ivory-coast.gpkg` — full Geofabrik OSM extract used for the quarter-coordinate backfill (Node `node:sqlite` + WKB decode; not needed at runtime).
- `apps/web/features/search/lib/__tests__/geo-fixtures.ts` — 188-city fixture mirroring importer output.
- `context/trackers/ivory-coast-geo-capture-plan.md` — approved plan (M0 data + M1 geo engine done).

## Known State
- Prisma 7.9.1 + `@prisma/adapter-pg` + `PrismaPg`; connection via Neon pooler host. `prisma migrate dev` hangs → use `migrate diff` + manual SQL + `migrate deploy`.
- GDAL/fiona/geopandas NOT available on this Windows dev box — `node:sqlite` used for `.gpkg`.
- Web test script is a hardcoded tsx file list in `apps/web/package.json`.
- **Web typecheck is now fully clean** (2026-08-05 — the 3 `features/admin/*` errors that previously blocked `next build` were fixed during M3). `packages/db/src/index.ts` lines 50-52 relative-import errors pre-existing/unrelated.
- `exactOptionalPropertyTypes: true` on web; `process.env.*` must use bracket access.

---

# Memory

**Session:** Intercity municipality/quarter search expansion
**Date:** 2026-08-04

## Summary
Expanded level-aware search to intercity municipality/quarter combinations (quarter→quarter, muni→quarter across different cities). The search engine already supported every combo server-side; blockers were the two forms stripping refinements for non-same-city pairs, the intercity label convention hiding quarters, and the autocomplete first-match-per-city de-dupe.

## Completed Work
- **Form pass-through (both forms):** `features/search/components/search-form.tsx` (submit handler) + `features/home/components/hero-search-bar-2.tsx` dropped the `sameCity &&` guard — `fromMuni/toMuni/fromQuarter/toQuarter` now always pass through, enabling intercity quarter/muni search. Engine, params.ts, `cheapestByDate`, date strip, and `validate-search-pair` already supported all level combos; same-city identical pairs still blocked.
- **Intercity quarter labels:** `lib/format-location-label.ts` intercity branch now `"Abidjan (Cocody - Riviera 3)"` when quarter known (was always `"Abidjan (Cocody)"`). Global via shared function (offer-card, trip-summary-card, checkout, digital tickets, passenger views, booking-detail-drawer).
- **Autocomplete de-dupe fix (R9):** `trpc/routers/locations.ts` `searchCities` now keys by full `(city, municipality, quarter, level)` triple via `add()` helper instead of first-match-per-city; `city-autocomplete-field.tsx` button `key` is a composite key. Multiple quarters of the same city reachable.
- **Verification:** web `pnpm typecheck` clean; 32 search unit tests pass.
- **Post-Phase 4 follow-up fixes (2026-08-04):** (R9a) `searchCities` now skips pass-through municipalities whose city already matched — closes the duplicate-row regression (typing "Yamoussoukro" returned both the city and `Yamoussoukro (Yamoussoukro)`). (R9b) `validate-search-pair.ts` compares **normalized display text** when at least one side lacks a resolved id (chips/popular hints use `id:""`), so a dropdown-picked city (cuid) + same-named chip now correctly block; accent-insensitive ("San-Pédro" vs "San Pedro"). All 10 existing `validateSearchPair` tests still pass. (B3) New `locations.getGeoPlaceLabel({cityId, municipalityId?, quarterId?})` procedure + `useGeoPlaceLabel` hook; `search-form.tsx` deep links now render full hierarchy labels (e.g. `Abidjan (Cocody - Riviera 3)`) instead of plain city name.
- **Search tests finalized (2026-08-04):** Extracted the de-dupe + pass-through suppression logic from `searchCities` into a pure `features/search/lib/build-search-entries.ts` (`buildSearchEntries(cities, municipalities, quarters, limit)`) — router delegates to it. New fixtures `features/search/lib/__tests__/geo-fixtures.ts` mirror the seed dataset (30 cities, Abidjan's 13 municipalities + all their quarters, pass-through cities). New test files: `format-location-label.test.ts` (urban/intercity labels across every seeded muni + quarter + pass-through city), `build-search-entries.test.ts` (pass-through suppression, de-dupe key, all munis/quarters reachable), plus 6 new `validateSearchPair` chip-vs-cuid/accent cases. Registered all in the hardcoded test list in `apps/web/package.json`. Web typecheck clean, **184/184** tests pass.
- **T6 — Postgres + migrations + backups:** `db` (postgres:16-alpine, `db_data`, `pg_isready` healthcheck, `01-extensions.sql` for `uuid-ossp`+`pg_trgm`); one-shot `migrate` service runs `prisma migrate deploy` only (stale `run-migrations.ts` + `001_foundation_constraints.sql` removed from the flow — targets PascalCase tables that no longer exist; kept for history, R10); `web` waits on `migrate: service_completed_successfully`. Verified: 67 snake_case tables from `0_init`, `_prisma_migrations` = 1 row, all services healthy, `/api/health`(+`?full=1`)/`/api/auth/ok` 200 through Caddy vs self-hosted DB. `deploy/backup/dump.sh` now `export PGPASSWORD` (pg_dump ignores `POSTGRES_PASSWORD`); valid gzipped dump verified; 01:30 cron, 14-day retention.
- **MetadataBase fix:** `apps/web/app/[locale]/layout.tsx` `generateMetadata` uses `metadataBase: new URL(process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000")` + `openGraph.siteName`. Index-signature bracket access is REQUIRED for `process.env` everywhere in this repo (`Property 'X' comes from an index signature` fails the Docker type-check otherwise) — same for the Expo app (`process.env["EXPO_PUBLIC_*"]`).
- **T9 — Uptime Kuma:** `status` service (louislam/uptime-kuma:1, `kuma_data`) + `{$STATUS_ADDRESS}` Caddy block; verified `https://status.localhost` → `/dashboard` 200. Server TODO: DNS `status.mojaride.net`, set admin password, add monitors (`/`, `/api/health`, `/api/health?full=1`, `/api/auth/ok`, mobile API base).
- **T8 — PostHog (self-host, full official hobby stack):** `deploy/posthog/install.sh` (non-interactive `POSTHOG_APP_TAG`/`DOMAIN`, no sudo, clones posthog repo, writes `.env` only on fresh install, disables PostHog's own `proxy`, publishes `web` loopback-only, `up -d --no-build --pull always`) + README. Caddy third block `{$POSTHOG_ADDRESS}` → `host.docker.internal:8000` (`extra_hosts: host.docker.internal:host-gateway` added to `caddy` service in `compose.yml`). `POSTHOG_ADDRESS=posthog.mojaride.net` in `.env.example`; local `.env` = `posthog.localhost` (empty would be a Caddy parse error). Web: `posthog-js@1.410.6`, `components/posthog-provider.tsx` in `app/[locale]/layout.tsx`. RN: `posthog-react-native@4.61.4`, `apps/traveler-app/lib/posthog.ts` + `<PHProvider client={posthog ?? undefined}>` in `app/_layout.tsx`. Both typechecks clean, biome clean on touched files, `docker compose config` OK. Build verification passed (next build exit 0, posthog-js in client chunk; docker compose build web OK; `/api/health?full=1`/`/api/auth/ok`/`/` 200 through Caddy).
- **T10 — Storage (confirmed done):** Cloudflare R2 in production, working end-to-end; free quota sufficient → no self-hosted MinIO. `S3_*` envs point at R2 (`apps/web/lib/storage/s3.ts` via `@aws-sdk/client-s3` + presigner; `cdn.mojaride.com` allow-listed in `next.config.ts`). No code changes. Launch TODO: R2 custom-domain/CNAME for `cdn.mojaride.com` + re-verify one upload from staging.
- **Tracker updated** (`context/trackers/production-deployment-report.md`): T6/T9/T8 notes, T7 done-block + in-progress → DONE (code), T10 → DONE (confirmed), D3 ✅ PostHog, D8 ✅ R2, R8 🕐 Mitigated, R1/R7/R10 statuses already set earlier.

## Next Steps
- Back to standard roadmap (progress-tracker "Recommended Next Steps"): booking ownership hardening (silent lazy-claim vs phone+OTP decision), performance (Redis for search), mobile passenger MVP. Verify intercity quarter search with real seeded data (Abidjan quarter → another city's quarter/muni).
- Deferred sugar: urban price-range hint in `PricingStep`.

## Key Files
- `apps/web/features/search/components/search-form.tsx` + `apps/web/features/home/components/hero-search-bar-2.tsx` — unconditional muni/quarter pass-through.
- `apps/web/lib/format-location-label.ts` — intercity quarter label convention.
- `apps/web/trpc/routers/locations.ts` + `apps/web/features/search/components/city-autocomplete-field.tsx` — R9 autocomplete de-dupe fix.
- `apps/web/features/search/lib/validate-search-pair.ts` — R9b normalized-text comparison for id-less (chip) values.
- `apps/web/features/search/hooks/use-geo-place-label.ts` + `apps/web/trpc/routers/locations.ts` (`getGeoPlaceLabel`) + `apps/web/features/search/components/search-form.tsx` — B3 deep-link hierarchy-label rendering.
- `apps/web/features/search/lib/build-search-entries.ts` — pure searchCities result assembly (de-dupe key + pass-through suppression); `trpc/routers/locations.ts` delegates.
- `apps/web/features/search/lib/__tests__/{geo-fixtures,format-location-label,build-search-entries}.test.ts` — full-dataset geography + label + search-entries tests.
- `context/trackers/geography-search-ui-audit.md` — Post-Phase 4 follow-up log appended.

## Known State
- Prisma 7 (`^7.8.0`), `@prisma/adapter-pg`, `prisma.config.ts` in `packages/db`; lockfile `pnpm-lock.yaml`.
- Web test script is a hardcoded tsx file list in `apps/web/package.json`; new test FILES must be added there.
- `exactOptionalPropertyTypes: true` on web; `process.env.*` must use bracket access (TS4111).
- Biome full-app `lint` scripts report many PRE-EXISTING errors (177 web / 115 traveler) — check only touched files with the local `node_modules/.bin/biome.cmd`; traveler-app biome must run from `apps/traveler-app` (nested root config).
- Web Docker build: `DATABASE_URL` build-arg required (R2); `DATABASE_URL_BUILD` (Neon) feeds build-time only.
- PostHog stack (~25 services / 16GB RAM) and SigNoz (ClickHouse Keeper) are NOT bootable on this Docker Desktop — deploy to the Linux VM only.

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
