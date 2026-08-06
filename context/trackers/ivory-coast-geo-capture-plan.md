# Plan: Full Côte d'Ivoire Geography + GPS Capture for Terminals

**Status:** Approved — M0 (data) + M1 (geo engine) + M2 (backend capture) + M3 (public capture page) + M4 (operator UI) + M5 (search/consumer audit) done; M6 (verification) next. **Post-plan deliverables (2026-08-05): portable geo seed document shipped** — `packages/db/seed/geo-seed.sql` + `export:geo-seed` script (idempotent 188/200/3230 upserts with PostGIS geometry + coords, validated against the live DB). **Resolve-capture button bug fixed** — `LocationCaptureStatus` gains `APPROVED` (migration applied), `approveCapture` marks the capture `APPROVED` (drops from `terminals.list` include filter) + UI guard; button now disappears after approval. **Reverse geocoding for the capture flow (2026-08-06):** OSM Nominatim public API (env-overridable base URL) — `captures.submit` reverse-geocodes the GPS point (`accept-language=fr`, 1 req/s limiter, 24 h cache, null-on-failure) and stores it in the new `location_capture.reverse_geocoded_address` column (migration `20260805000001`, applied + recorded on live Neon); the Resolve drawer shows it as "Suggested address"; `approveCapture` writes it to the terminal's `addressLine1` (preferred over the offline hierarchy label). **Foundation SQL cleanup (2026-08-06):** deleted stale unused `apps/web/migrations/001_foundation_constraints.sql` + `_rollback.sql` (dead code — `run-migrations.ts` not wired; Dockerfile uses `prisma migrate deploy`).
**Date:** 2026-08-05

## 0. Goals

1. Replace the 30-city manual seed with **complete, authoritative CI geography** (districts → regions → departments → sous-préfectures → communes → quartiers), all with coordinates, so operators never type city/municipality/quarter or coordinates.
2. Give operators a **"share a capture link"** flow: create a bare terminal (name + phone + role/status), share a link, a person at the terminal opens it, the system **auto-derives** the full address, city, municipality, quarter + coordinates from their **GPS**, and the operator **approves** before it goes live.
3. Everything deterministic, auditable, idempotent, PostGIS-backed — no recurring third-party cost.

---

## 1. Data Source Analysis (`ivory_coast_data/`)

Two complementary, authoritative sources:

| File | Features | Role |
|---|---|---|
| `District.geojson` (NomDistric) | 14 | District (top admin) |
| `Region.geojson` (NomReg) | 33 | Region |
| `Departement.geojson` (NomDep) | 111 | Department |
| `SousPrefecture.geojson` (NomSp) | 510 | Sous-préfecture → **Municipality polygons** |
| `populated_places.gpkg` | 58,540 pts | **Cities** (29 city + 147 town), **Quarters** (12 suburb + 7 neighbourhood + villages), all with point coords + `adm1..adm4` + `is_in` |
| `civ_admin*.geojson` / `civ_admincapitals.geojson` (108) | — | Cross-check + department-capital cities |
| `region.csv` (GADM worldwide) | — | **Excluded** (not CI-scoped, redundant) |

### Domain mapping (decision: City=commune, Municipality=commune, Quarter=quartier)
- **`City`** = urban commune. Source: `populated_places` `place ∈ {city, town}` (176) **∪** existing 30 seed cities **∪** department capitals (108), deduped by normalized name. `region`/`district` derived by point-in-polygon against `Region`/`District` GeoJSON.
- **`Municipality`** = commune. Abidjan → its 13 existing communes (kept). Multi-commune agglomerations get multiple; single-commune cities get a **pass-through** municipality (preserves current UX and `isPassThrough` semantics).
- **`Quarter`** = quartier. Keep the 13 seeded Abidjan municipalities' quarters **∪** OSM `suburb`/`neighbourhood` + named villages per municipality, deduped by normalized name so existing rows (e.g. "Riviera 3") aren't duplicated.

---

## 2. Schema Changes (`packages/db/prisma/schema.prisma`)

Add `latitude`/`longitude` (Float, nullable) + PostGIS geometry + provenance fields.

**`Municipality`** (lines 761–777): `latitude Float?`, `longitude Float?`, `geometry Unsupported("geometry")?`, `pcode String?`, `source String?`
**`Quarter`** (lines 779–792): `latitude Float?`, `longitude Float?`, `geometry Unsupported("geometry")?`, `externalId String?`, `source String?`
**`City`** (lines 734–751): `pcode String?`, `source String?`
**`CompanyLocation`** (lines 801–856): `geoCaptureStatus LocationGeoCaptureStatus @default(COMPLETE)`, `captureToken String? @unique`, `captureExpiresAt DateTime?`

**New model `LocationCapture`** — audit + retry trail:
```
LocationCapture {
  id, locationId → CompanyLocation(Cascade)
  token (unique), expiresAt, status LocationCaptureStatus ∈ {OPEN, PENDING_CONFIRMATION, CONFIRMED, REJECTED, EXPIRED}
  latitude, longitude, accuracyMeters, capturedAt, device, userAgent, ip
  resolvedCityId? resolvedMunicipalityId? resolvedQuarterId?
  submitterName?, submitterPhone?, notes?
  createdAt, resolvedAt
}
```

**New enums:** `LocationGeoCaptureStatus`, `LocationCaptureStatus`.

> **Prisma + PostGIS note:** `Unsupported("geometry")` lets Prisma manage the table while exposing spatial columns only through `$queryRaw`. Geometry is written with `ST_GeomFromGeoJSON(...)`/`ST_SetSRID`, never through Prisma.

**Migration (hand-written SQL, Neon Postgres):** `CREATE EXTENSION postgis;` + GiST indexes:
- `CREATE INDEX muni_geom_gist ON municipality USING GIST (geometry);`
- `CREATE INDEX qtr_geom_gist ON quarter USING GIST (geometry);`
- B-tree on `latitude/longitude` for display + fallback.

---

## 3. Data Importer (one-time pipeline)

New `packages/db/scripts/import-ivory-coast-geo.ts` (pattern: `backfill-service-type.ts`). **Idempotent** (upsert by `pcode`/normalized name), **re-runnable**.

Steps:
1. Read `District/Region/Departement/SousPrefecture.geojson`; build polygon lookup.
2. Read `populated_places.gpkg` (convert once to GeoJSON via GDAL, import GeoJSON — dependency-light).
3. **City pass:** upsert `City` from towns/cities + existing seed set; derive `region`/`district` by point-in-polygon (PostGIS `ST_Contains` or JS fallback); set `latitude/longitude` from the point.
4. **Municipality pass:** upsert `Municipality` from by-city commune grouping + Abidjan's 13; set `isPassThrough` when a city has exactly one commune; write polygon geometry via raw SQL; set `pcode`/`source`.
5. **Quarter pass:** upsert `Quarter` from suburbs/neighbourhoods/villages per municipality, deduped by `(municipalityId, name)`; set point coords.
6. **Backfill:** re-run existing `backfill-service-type.ts` logic (re-resolve any `CompanyLocation` free-text `city` → new `cityId`).
7. Print reconciliation report (counts expected vs upserted, names with no match). Fail loudly on gaps.

**Seed restructure:** geo section of `packages/db/prisma/seed.ts` **replaced** by a call to this importer (single source of truth). Non-geo seed (bus types, layouts) stays. `isMajorHub` flags preserved for the 7 hubs.

---

## 4. Geo-resolution engine (the capture brain)

New `apps/web/lib/geo/geocode-point.ts` (pure + `$queryRaw`), exposed via tRPC. Resolution order:
1. **Municipality point-in-polygon (primary, exact):** `ST_Contains(m.geometry, ST_SetSRID(ST_MakePoint($lon,$lat),4326))` → `municipalityId` → `cityId`.
2. **Quarter:** nearest quarter centroid **within the resolved municipality** (B-tree + Haversine).
3. **Fallback (no polygon match):** hierarchical nearest — City → Municipality in city → Quarter in municipality.
4. **Address label (optional, free):** reverse-geocode only if a free source is configured; otherwise skip.

**No external API at runtime.** Deterministic, offline, PostGIS-indexed.

---

## 5. Capture Link — Backend

`apps/web/trpc/routers/locations.ts` (or new `captures.ts`):
- **`operator.createCapture(terminalId)`** (`terminals:update`): flip terminal to `PENDING_CAPTURE`, mint single-use expiring `captureToken` (7-day TTL), create `LocationCapture { OPEN }`, return `{ url, token, expiresAt }`. Idempotent.
- **`captures.getInfo(token)`** (public): display-safe terminal info for share page.
- **`captures.submit(token, { latitude, longitude, accuracyMeters })`** (public): validate token + rate-limit; reject `accuracyMeters` > 150 m; run geo-resolution → `resolvedCityId/MunicipalityId/QuarterId`, capture `PENDING_CONFIRMATION`, write lat/long onto terminal (keeps `geoCaptureStatus: PENDING_CONFIRMATION`).
- **`captures.confirm(token)`**: capture `CONFIRMED`, return resolved preview for final "Yes this is correct".
- **`operator.approveCapture(captureId)` / `rejectCapture`** (`terminals:update`): approve → terminal `COMPLETE` + linked `cityId/municipalityId/quarterId`, bookable; reject → `REJECTED`, terminal back to `PENDING_CAPTURE`. Both write `ActivityLog`.
- **Sweeper cron:** `apps/web/app/api/cron/sweep-captures/route.ts` expires stale captures.

**Terminal stays non-bookable until approved.**

---

## 6. Capture Link — Public Share Page

`apps/web/app/[locale]/capture/[token]/page.tsx` (server) → `features/capture/capture-page.tsx` (client):
1. `captures.getInfo(token)`; branded screen (English per language rule; `fr.json` mirror).
2. "Share my location" → `navigator.geolocation.getCurrentPosition()` (HTTPS + consent).
3. `captures.submit` with coords + `accuracyMeters`; render resolved preview via `formatLocationLabel` + editable `addressLine1`.
4. Accuracy warning if pin radius large.
5. "Confirm" → `captures.confirm` → success + "waiting for operator approval."
6. Failure/denied/permission-blocked states.

---

## 7. Operator UI Changes

- **`terminal-editor-sheet.tsx`:** new "Capture-missing location" mode (name + phone + role/status only → "Generate share link" + copy/WhatsApp); City/Municipality/Quarter native `<select>`s → **Comboboxes** (imports already present, unused); preserve cascade + pass-through auto-fill; show capture status when editing pending terminal.
- **`operator-terminals-view.tsx` + `terminals-table.tsx`:** "Pending capture" filter + badge + "Resolve capture" approve/reject drawer.
- **i18n keys** under `operatorDashboard.terminals` in `en.json` + `fr.json`.
- **`packages/schemas/src/routes.ts:226`:** relax geo-required validation when `geoCaptureStatus ≠ COMPLETE`; **routes/search still reject non-COMPLETE terminals** (unchanged guard).

---

## 8. Search / Consumer Impact (don't-miss audits)

- **`geo-fixtures.ts`** mirrors seed verbatim → extend/refresh to expanded dataset (keep Cocody, Yamoussoukro, Riviera 3).
- **`build-search-entries.ts`** + tests — verify pass-through suppression + composite-key de-dupe with larger set.
- **`searchCities`** (`locations.ts`) — `take: 10` fine; confirm autocomplete key/dedupe.
- **`getCityDetails` / `getGeoPlaceLabel` / `validate-search-pair`** — dataset-agnostic, re-verify.
- **`routes.getCities`** → operator city `<select>` → Combobox (covered §7).
- **Mobile app** — confirm consumes search via tRPC, no hard-coded city list (audit `apps/app/`).

---

## 9. Security & Enterprise Hardening

- Token = capability (single-use, expiring, unguessable); `getInfo` display-safe only.
- Rate limiting on `submit` (token + IP).
- Accuracy threshold + client retry prevents garbage pins.
- Geolocation: browser API only (no IP-lookup); HTTPS enforced.
- Approve gate: nothing live until operator approves; audit via `ActivityLog` + `LocationCapture`.
- Zero paid third-party at runtime; optional free reverse-geocode for address label gated by config.
- Zod validation on both public mutations; parameterized `$queryRaw`.

---

## 10. Tests

- **Importer:** dry-run fixture assertions (counts per level, no-name-mismatch, pass-through correctness).
- **Geo engine:** `geocode-point.test.ts` — point-in-polygon hit, polygon miss → hierarchical fallback, nearest-quarter, edge/accuracy.
- **Schema:** latitude/longitude/geometry presence; pcode uniqueness; unique constraints on re-run.
- **Search fixtures:** extended geo-fixtures + updated build-search-entries/format-location-label/search-pair-validation (keep 184 green; add new).
- **Capture flow:** router tests for token lifecycle, rate-limit, accuracy rejection.
- Register new tests in the hardcoded web test list in `apps/web/package.json`.

---

## 11. Rollout Order (phased, UI-first per build-plan.md)

1. **M0 — Data:** PostGIS (Neon), schema + migration, `import-ivory-coast-geo.ts`, backfill, seed restructure. Verify counts. ✅ Done (2026-08-05): 188 cities / 200 municipalities / 3230 quarters, geometry on 187 municipalities, migration applied, seed delegates to importer, web tests 187/187. Abidjan layer relabeled `LEGACY` → `CURATED` (0 legacy records remain). **Coordinates backfilled (2026-08-05):** OSM-derived + user-supplied coords for all 13 Abidjan communes and 71/81 curated quarters via `abidjan_communes_quarters_osm.csv` (read by `readAbidjanCoords()` in the importer). 10 quarters have no reliable OSM source (Adjamé/Monsieur, Attécoubé/Abia, Agbo, Ahongbon, Baco, Dogosso, Treichville/Djelan, Ficgayo, Mobidoum, Yopougon/Nianguan) → left null, covered by M1+ GPS capture link.
2. **M1 — Geo engine:** `apps/web/lib/geo/geocode-point.ts` (pure) + `locations.geocodePoint` tRPC procedure (`$queryRaw` loads municipality MultiPolygon geometry + quarter coords → pure `geocodePoint`). Resolution: point-in-polygon (smallest-area wins on overlap) → nearest quarter within resolved municipality → nearest-municipality fallback; holes respected; `method: "polygon" | "nearest"`, `distanceMeters`. ✅ Done (2026-08-05): 13 unit tests pass, smoke-tested against live DB (Cocody Riviera 3, Abobo Baoule, Yopougon Toit Rouge, Adjamé Monsieur resolve correctly; Bouaké via polygon). No third-party services — fully offline.
3. **M2 — Backend capture:** ✅ Done (2026-08-05). `features/capture/services/capture-service.ts` (`CaptureService`): `CAPTURE_TTL_MS = 7d`, `MAX_ACCURACY_METERS = 150`, `defaultSubmitLimiter` 10 req/10min; raw 256-bit base64url tokens; `createCapture` idempotent (re-shares live attempt), `getInfo` (auto-expires), `submit` (accuracy gate → token:ip rate limit → require OPEN → geo-resolve → capture `PENDING_CONFIRMATION` + terminal tentative coords), `confirm` (idempotent → `CONFIRMED`), `approveCapture` (require CONFIRMED + resolvedCityId/MunicipalityId → terminal `COMPLETE` + geo-linked + `CAPTURE_APPROVED` ActivityLog + clears token), `rejectCapture` (→ `REJECTED`, terminal `PENDING_CAPTURE`, `CAPTURE_REJECTED` log), `sweepExpired` (expire stale; terminal reverts COMPLETE if city set else PENDING_CAPTURE). `createCaptureService(prisma)` factory wires offline resolver (`loadGeoDataset` + `geocodePoint`). Router `trpc/routers/captures.ts` registered as `captures`: `createCapture`/`approveCapture`/`rejectCapture` (operatorCompanyProcedure, `terminals:update`), `getInfo`/`submit`/`confirm` (public); IP from `x-forwarded-for` → `x-real-ip` (mirrors contact.ts). Rate limiter `lib/rate-limit.ts` (in-memory fixed-window, injectable store/now). Cron `app/api/cron/sweep-captures/route.ts` (GET + `assertCronAuthorized`) → `sweepExpired()`. Tests: `lib/__tests__/rate-limit.test.ts` (3) + `features/capture/services/__tests__/capture-service.test.ts` (19), registered in the hardcoded web test list → **222/222 web tests pass**; typecheck clean (only pre-existing `features/admin/*`); biome clean on touched files (one repo-conventional `useLiteralKeys` info).
4. **M3 — Public capture page** ✅ Done (2026-08-05). `apps/web/app/[locale]/capture/[token]/page.tsx` (server: `generateMetadata`, `createCaptureService(getPrismaClient()).getInfo()`; TRPCError → friendly expired/rejected/invalid error screen; renders client view) → `features/capture/components/capture-page-view.tsx` (client). Flow: branded idle screen (radar signature + terminal/company card + optional name/phone/street-landmark fields + "Share my location") → `navigator.geolocation.getCurrentPosition` (enableHighAccuracy, 15s timeout) → client-side 150m accuracy gate → `captures.submit` → resolved preview (`formatLocationLabel`, coords + ±accuracy) → `captures.confirm` → success + "Waiting for operator approval". Handles: already-submitted (`confirmPrompt`), already-confirmed (straight to done), permission-denied / locate-failed / accuracy-too-low / server errors with retry. All copy in `capturePage` namespace (en.json + fr.json, English per language rule). Note: `addressLine1` is not a `LocationCapture` column — the street/landmark field maps to `notes` (schema untouched).
5. **M4 — Operator UI** ✅ Done (2026-08-05). **Schema** `packages/schemas/src/routes.ts`: `baseTerminalSchema` gains optional `geoCaptureStatus` (`COMPLETE | PENDING_CAPTURE | PENDING_CONFIRMATION`); `createTerminalSchema.superRefine` skips city/lat/long-required checks when capture pending (`status != null && !== "COMPLETE"`). **Router** `trpc/routers/terminals.ts`: `list` includes latest active capture (`captures` status `OPEN|PENDING_CONFIRMATION|CONFIRMED`, take 1, desc); `create` persists `geoCaptureStatus` (default `COMPLETE`); `update` city-guard only when effective `geoCaptureStatus === COMPLETE`. **Editor** `features/operator/components/terminals/terminal-editor-sheet.tsx` (rewritten): capture-mode toggle for new terminals (auto-forced when editing non-COMPLETE); capture mode = name + phone + Primary/Active toggles (Terminal locked) → `terminals.create({ geoCaptureStatus:"PENDING_CAPTURE" })` / `terminals.update` (status preserved) → `captures.createCapture` → link card (copy + WhatsApp `https://wa.me/?text=` + expiry); placeholder address `CAPTURE_ADDRESS_PLACEHOLDER = "(pending GPS capture)"`; PENDING_CONFIRMATION banner; header capture-status badge; standard mode City/Municipality/Quarter native selects → **Comboboxes** (`trpc.locations.searchMunicipalities({cityId})`/`searchQuarters({municipalityId})`, skipToken), pass-through auto-select kept. **Table** `terminals-table.tsx`: `CaptureStatusBadge` (amber Awaiting capture / sky Location submitted / violet Pending approval) + violet "Resolve capture" button when latest capture `CONFIRMED` → new `onResolveCapture` prop. **View** `operator-terminals-view.tsx` (rewritten): CAPTURE filter, `kpi.pendingCaptures` StatCard, resolve drawer (`getGeoPlaceLabel` skipToken, coords 5dp, `accuracyMeters`, submitter name/phone, device, notes; Approve emerald / Reject destructive with `window.confirm`; `approveCapture`/`rejectCapture`). **Service** `capture-service.ts`: `CAPTURE_ADDRESS_PLACEHOLDER` now exported and, on `approveCapture`, `addressLine1` is auto-filled from the resolved label (`formatLocationLabel`, e.g. "Abidjan (Adjamé - Monsieur)") when it is null or the placeholder; real addresses left untouched; `findCaptureInCompany` exposes `locationAddressLine1`. **i18n** `capture.*`/`resolve.*`/`kpi.pendingCaptures`/`capture.pendingFilter` in `en.json` + `fr.json` (English in both, per language rule). Verification: web `tsc --noEmit` clean; **224/224 tests pass** (59 suites; +2 approve address tests); `next build` ✓; biome clean (only repo-conventional `useLiteralKeys`/`noExplicitAny`).
6. **M5 — Search/consumer audit** (§8) ✅ Done (2026-08-05). Audited every §8 consumer against the expanded dataset — all green, one test file hardened:
   - **`geo-fixtures.ts`** already mirrors the full importer output (188 cities w/ hub flags, Abidjan's 13 communes + quarters, pass-through cities) — no change needed.
   - **`build-search-entries.ts` + tests**: existing pass-through suppression + composite-key de-dupe tests pass; **added a "full 188-city dataset" describe block** (3 tests): typing ANY of the 187 pass-through cities yields exactly one city-level row (no `City (City)` duplicate); no municipality row ever duplicates its city name; composite key stays unique across the full Abidjan quarter set (1 + 13 munis + 81 quarters = 95 entries). Test file biome-formatted (format-only, no unsafe lint fixes).
   - **`searchCities` (`locations.ts`)**: `take: 10` on each of city/municipality/quarter queries → `buildSearchEntries(..., 10)`; autocomplete key in `city-autocomplete-field.tsx` is the same composite key (`id|muniId|quarterId|level`). ✓
   - **`getCityDetails` / `getGeoPlaceLabel` / `validate-search-pair`**: all dataset-agnostic (id/name-based, no hard-coded cities; accents normalized). ✓
   - **`routes.getCities` → Combobox**: covered by M4 (operator terminal editor Comboboxes). ✓
   - **Mobile app (`apps/traveler-app/`)**: search tab is a placeholder shell (no search/booking yet); grep confirms **zero hard-coded city names** anywhere. ✓
   - **Non-COMPLETE terminals unreachable (unchanged guards verified)**: `submit` only writes lat/long onto the terminal — `cityId/municipalityId/quarterId` stay null until `approveCapture`. `routes.create/update` reject any terminal without a `cityId` (`missingCity` guard, routes.ts:122 / :290) and route activation requires `isTerminal && isActive`. Search matches terminals only by city/muni/quarter ids (`placeMatchesTerminal`, `terminalWhere`) — a city-less terminal can never match. Editor only offers capture mode for NEW terminals, so a geo-complete terminal can't be re-captured. `geo-fixtures`/search/booking/tickets surfaces show no other city hard-coding.
   - Verification: web `tsc --noEmit` clean; **227/227 tests pass** (60 suites; +3 new); `next build` ✓; biome clean on the changed test file.
7. **M6 — Verification:** typecheck, unit suites, manual E2E; update context files.

---

## 12. Confirmed decisions (2026-08-04)

- Hierarchy mapping: **City=urban commune, Municipality=commune, Quarter=quartier**.
- Geometry storage: **PostGIS geometry column**.
- Capture write mode: **Pending terminal, operator approves**.
- `.gpkg` handled by one-time conversion to GeoJSON (GDAL), importer reads GeoJSON.

---

## 13. Reverse geocoding (post-plan deliverable, 2026-08-06)

Implements plan §4 item 4 / §9 "optional free reverse-geocode for address label".

- **Decision (user-confirmed):** OSM **Nominatim public API** (`https://nominatim.openstreetmap.org`) — zero paid third-party. `REVERSE_GEOCODE_BASE_URL` env override lets us swap to a self-hosted/paid Nominatim later with no code change.
- **Timing:** reverse-geocode **at submit time**, store the street address on the `LocationCapture`; operator sees it in the Resolve drawer; `approveCapture` applies it to the terminal's `addressLine1` (preferred over the offline `formatLocationLabel` hierarchy label).
- **Client** `apps/web/lib/geo/reverse-geocode.ts`: valid `User-Agent` (`MojaRide/1.0 (support@mojaride.com)`), 1 req/s shared limiter (existing `createRateLimiter`), 4 s timeout (`AbortController`), 24 h cache keyed by 4-dp-rounded coords (~11 m), **null on every failure** (network / HTTP error / rate limit / timeout / malformed payload) — the capture flow can never break because of Nominatim. Params `format=jsonv2`, `zoom=18`, `accept-language=fr`. `formatNominatimAddress`: `"${house_number} ${road|pedestrian}, ${neighbourhood|suburb|quarter|city|town|municipality}"`, fallback `display_name`.
- **Schema:** `LocationCapture.reverseGeocodedAddress String?`; migration `20260805000001_add_capture_reverse_geocoded_address` (single `ALTER TABLE ... ADD COLUMN`), applied + recorded on live Neon (checksum `b0654a7f…`), column verified.
- **Service:** `CaptureServiceDeps.reverseGeocode?` (default `async () => null`); `submit` stores + returns `resolvedAddress`; `approveCapture` fill order `capture.reverseGeocodedAddress?.trim() || formatLocationLabel(...)` only when `addressLine1` null/placeholder; factory wires `createReverseGeocoder()`.
- **UI/i18n:** Resolve drawer "Suggested address" (or "No street address found"); capture preview shows `preview.resolvedAddress` + "Street address" subtitle. `en.json` + `fr.json`: `resolve.suggestedAddress` / `resolve.noSuggestedAddress` / `capturePage.resolvedAddress` (English in both per language rule).
- **Tests:** `lib/geo/__tests__/reverse-geocode.test.ts` (9: formatNominatimAddress ×4, client ×7; registered in `apps/web/package.json`) + `capture-service.test.ts` +3 (store+return, null-on-failure, prefer-over-label). **245/245 web tests pass.** Web `tsc --noEmit` clean for all touched files (the sole reported error `auth-server.ts(262,5) expo` is a pre-existing unrelated traveler-app Better Auth working-tree leftover; better-auth left untouched per user instruction).
- **Housekeeping:** deleted stale `apps/web/migrations/001_foundation_constraints.sql` + `_rollback.sql` + empty dir (dead — `run-migrations.ts` sole consumer isn't wired to any npm script; Dockerfile `migrate` stage = `prisma migrate deploy` only).

