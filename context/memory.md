# Memory
**Session:** Driver audit Phase 2 EXECUTED — verification truth shipped (2026-08-26)
**Date:** 2026-08-26

## Summary
Implemented all of `20-phase2-execution-plan.md` per locked rulings (D1=A on-demand presign · D3=C operator-now · D3b=audit-log-only · D6=defer i18n). Documents now render through ONE path: `<DriverDocPreview>` mints fresh 5-min URLs via new `drivers.presignDoc`/`admin.presignDoc` procedures (domain-owned in drivers.ts after R2; admin gated on `drivers:verify.read`), with a namespace guard proving keys belong to the authorized driver (`documents/drivers/{userId}/{segment}/`). Both producer queries de-presigned.

## Completed Work
- New: `features/driver/lib/driver-doc-access.ts` (PURE: schema+segments+guard — server-only-free so tsx can test it), `lib/driver-doc-mint.ts` (server side-effect), `components/driver-doc-preview.tsx`, test file (9 cases) registered in web package.json.
- Lesson recorded: `@/lib/storage` imports `server-only` → detonates under tsx --test; keep pure logic in separate modules.
- Wired: passport Credentials-tab inspector (gap#2); VerifyDriverDialog fetches dossier + renders trio above Approve and disables Approve without docs (T3b/R1); admin dialog retrofitted to 3 tiles incl. medical (gap#13); queue pagination (50-page accumulate) + 300ms debounce (gap#4/F6); Edit dialog doc-replacement slots → `updateDriver` writes atomic `DRIVER_DOCS_REPLACED` ActivityLog inside `$transaction`, status kept (D3b); getDriver/listDriversForVerification return raw keys (kills F1 staleness + F6 presign tax).
- Gates: web tsc **0** · web suite **579/579** (+9) · biome clean on new files; routers carry pre-existing noExplicitAny idiom only.
- Docs: plan tasks ✅ (manual staging E2E matrix pending); gap register #2/#4/#13/#14 CLOSED; ui-registry gained shared-component section.

## Next Steps
- i18n micro-phase (D6): sweep ALL driver screens incl. strings introduced today.
- Phase 3 (dispatch integrity): employmentType↔serviceType guard + one-active-exclusive partial unique index.
- Staging legs: manual Phase-2 E2E matrix (plan §T8).

## Known State
- `admin.presignDoc` lives in admin.ts beside verifyDriver; both presign procedures share `mintDriverDocUrl`.
- Approve-gates (admin dialog + operator T3b) check RAW field presence — correct post-de-presign (keys are truthy).

---

# Prior sessions (same day)


## Summary
Implemented Phase 1 of `driver-system-complete-audit/19-phased-implementation-plan.md`. Fixed the 🔴 `<div>` Android crash — repo-wide grep found TWO MORE siblings beyond the audit's one (`register/carrier.tsx:125`, `license.tsx:162`; the whole wizard was broken on Android, not just step 1). Boot-gate rework: real defect was fail-CLOSED (network error → forced onboarding every offline cold boot); now definitive-no → gate, unreachable API after one retry → fail-open + logged warning. Tracking button copy softened. Dead IAM keys documented in permissions.ts. ALSO fixed two PRE-EXISTING typed-router tsc errors that were blocking the CI gate (`(tabs)/offers.tsx:242` invalid "/(tabs)" literal; `notifications.tsx:198` dynamic push — both behavior-preserving `as any` casts per repo idiom).

## Completed Work
- Files changed: driver-app `register/{index,carrier,license}.tsx`, `app/index.tsx`, `(tabs)/offers.tsx`, `notifications.tsx`; traveler-app `booking-detail.tsx`; schemas `permissions.ts`.
- Gates: driver-app tsc **0** · traveler-app tsc **0** · schemas tsc **0** · driver-app suite **31/31**.
- Docs updated: plan Phase 1 marked executed w/ scope notes; gap register #1/#21/#25/#26 status line added.

## Next Steps
- Phase 2 (verification truth): passport document inspector, verifications queue pagination, medical preview tile, operator doc management.

## Known State
- traveler-app/android/build.gradle dirty in working tree BEFORE this session (pre-existing, untouched).
- `apps/traveler-app/features/search/components/search-map-view.tsx` raw divs are LEGITIMATE (WebView-embedded Leaflet HTML) — do not "fix".

---

# Prior session (same day)

**Session:** Complete driver-system audit — `context/drivers/driver-system-complete-audit/` (18 modules, done 2026-08-26)
**Date:** 2026-08-26
Full enterprise audit of the driver system re-derived from code (schema, drivers.ts router, telemetry server stack, operator UI, admin hub, driver-app, traveler-app, passenger web, storage purposes, crons). Delivered as 17 numbered modules + README under `context/drivers/driver-system-complete-audit/`. Progress tracker updated.

## Completed Work
- Read exhaustively: `packages/db/prisma/schema.prisma`, `apps/web/trpc/routers/drivers.ts` (3,860 l) + init.ts + admin.ts driver sections (2817–3526) + trips.ts assignment block (1727–2170), telemetry stack (`apps/web/server/{telemetry-ws,flush,prev-point,redis,validator}.ts`, `/api/v1/telemetry/ping`), operator drivers UI (`operator-drivers-view`, `add-driver-modal`, `driver-detail-view`, `driver-roster-actions`, `verify-driver-dialog`, `operator-fleet-map-view` + `fleet-live-map`), admin views (`admin-driver-verifications-view`, `driver-verification-dialog`, marketplace view structure), full driver-app core (`lib/telemetry.ts`, `live.tsx`, wizard index/documents/carrier + registration store, `preferences.tsx`, boot `index.tsx`, notification-routes), traveler tracking screen + booking-detail track button, storage purposes for the 4 private driver-doc purposes.
- Key NEW findings (full list in `17-gap-register.md`): 🔴 `<div>` Android crash at `apps/driver-app/app/(auth)/register/index.tsx:116`; 🟠 operator passport never renders presigned compliance docs; 🟠 no employmentType↔serviceType guard in assignDriver/listAssignableDrivers; 🟠 admin verifications queue fixed limit:50 offset:0 (no pagination); 🟠 one-active-exclusive rule app-enforced only (no partial unique index); 🟡 DriverLocationPing has no retention job; Trip-History tab is a stub; `traveler-tracking-map.tsx` has zero importers; finalizeTripArrival's passenger-review-request still direct-triggers Novu (outbox bypass); minMonthlyRateCFA collected nowhere; shift.tripsCompleted dead.
- Verified-solid recorded: tenancy scoping everywhere, offer-board integrity incl. DB one-active index, telemetry transport parity + anti-evasion reference rule, assignment lock ordering + batch conflict scan, check-in guard pipeline, private doc storage with reader-agnostic presigning.

## Next Steps
- Fix the 5 headline items in README "Top actions" (crash one-liner first).
- Passenger fast path: authenticated `passenger.getTripTracking` poll + wire orphan map component before any WS revival work.

## Key Files
- `context/drivers/driver-system-complete-audit/README.md` — index + headline answers + top-5 actions.
- `context/drivers/driver-system-complete-audit/17-gap-register.md` — severity-ranked findings.

## Known State
- Background sub-agents failed this session (OpenRouter 402 credits); entire audit executed inline in main loop — fine, just slower.
- vercel.json crontab is a non-prod reference; prod outbox runs every-minute via its own crontab (F-NF-10 ruling).

---

## Prior sessions (newest below this line)
