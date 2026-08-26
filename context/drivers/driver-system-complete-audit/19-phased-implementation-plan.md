# 19 — Phased Implementation Plan (findings → shippable phases)

> Companion to `17-gap-register.md`. Ordered by increasing difficulty & scope: Phase 1 is minutes, Phase 7 is an open-ended product track. Every phase is independently shippable; later phases do NOT depend on earlier ones unless stated. Checkbox style mirrors `context/drivers/remediation-plan.md`.

---

## Phase 1 — Crash & Copy Fixes (~1 hour, zero risk)

*Goal: nothing crashes, nothing lies.*

> ✅ **EXECUTED 2026-08-26.** Gates: driver-app tsc exit 0 · traveler-app tsc exit 0 · schemas tsc exit 0 · driver-app suite **31/31**.
> Scope note: repo-wide grep found TWO MORE sibling `<div>` crashers beyond the audit's one (`register/carrier.tsx:125`, `register/license.tsx:162` — wizard steps 2 and 4 were equally broken on Android); all three fixed. Also fixed two PRE-EXISTING typed-router tsc errors blocking the CI gate (`(tabs)/offers.tsx:242` invalid `"/(tabs)"` literal → behavior-preserving `as any`; `notifications.tsx:198` dynamic push → `as any`, matching repo idiom). Boot-gate correction detail: the real defect was fail-CLOSED (any network error returned false → offline drivers trapped in onboarding every cold boot, contradicting the code's own comment); new behavior = definitive no-row → gate, unreachable API after one retry → fail-open with a logged warning.

- [x] **1.1** 🔴 Fix `<div>` → `<View>` in `apps/driver-app/app/(auth)/register/index.tsx:116`. *(Gap #1 — ship-blocker)*
- [x] **1.2** ⚪ Tracking button copy: "Track Live Bus" (drop "in Realtime") until a real feed exists. `traveler-app/features/booking/screens/booking-detail.tsx:492`.
- [x] **1.3** ⚪ Boot preference-gate: distinguish definitive-no from cannot-determine; retry once then fail open with a logged warning instead of trapping offline drivers in onboarding. `driver-app/app/index.tsx`.
- [x] **1.4** ⚪ Catalog hygiene note: document `drivers:assign` (dead key, UI advertises `trips:update`) and `telemetry:stream` (no runtime consumer) in `packages/schemas/src/permissions.ts` comments for the next permissions sweep. *(Gap #25)*

**Done when:** wizard step 1 renders on Android; no user-facing string promises realtime; boot gate degrades loudly.

---

## Phase 2 — Verification Truth (UI-only, ~1–2 days)

*Goal: operators and admins see what they approve. No schema/migration work — every API already returns the data.*

> 📐 **EXECUTION PLAN LOCKED (2026-08-26): see `20-phase2-execution-plan.md`.** Exploration upgraded this phase beyond pure UI: on-demand presigning architecture (D1=A), admin-dialog retrofit, queue debounce, de-presigned producer queries, and operator doc-replacement with ActivityLog audit trail (D3=C, D3b=audit-log-only). i18n deferred to a dedicated micro-phase immediately after (D6). One open ruling recorded there: D8 (wizard selfie never uploaded — recommend deferring to Phase 7).

- [ ] **2.1** 🟠 **Document inspector on operator passport**: render presigned `licenseFrontUrl/licenseBackUrl/medicalDocUrl` from `drivers.getDriver` in `driver-detail-view.tsx` Credentials tab. Copy the admin pattern incl. `renderableDoc` https-guard + "Legacy device URI — ask driver to re-upload" placeholders (`features/admin/components/drivers/driver-verification-dialog.tsx:36-38,196-245`). *(Gap #2)*
- [ ] **2.2** 🟠 **Verifications queue pagination**: replace fixed `limit:50, offset:0` call in `admin-driver-verifications-view.tsx:54-55` with offset state + Load-more (reuse the roster accumulate-pagination pattern). *(Gap #4)*
- [ ] **2.3** 🟡 **Medical doc preview tile** in the admin dossier dialog (gate-relevant doc currently invisible). *(Gap #13)*
- [ ] **2.4** 🟡 **Operator post-onboarding doc management**: extend the passport Edit dialog (`driver-roster-actions.tsx`) to attach/replace licence front/back + medical via the same storage purposes the add-modal uses; wire through existing `updateDriver` fields. *(Gap #14)*
- [ ] **2.5** ⚪ *(Optional, same files)* i18n sweep of operator/admin driver screens to `useTranslations` namespaces with en/fr parity. *(Gap #18)*

**Done when:** an operator can verify a licence while looking at the licence image; >50 pending drivers are all reachable; admins see all three docs.

---

## Phase 3 — Dispatch & Rule Integrity (server guards + 1 migration, ~2–3 days)

*Goal: the platform's employment promises are machine-enforced.*

- [ ] **3.1** 🟠 **employmentType↔serviceType guard**: add affiliation `employmentType` to `listAssignableDrivers` selects + eligibility sort (soft signal first: `modeOk` flag greying mismatched candidates in the dispatch combobox); optionally a hard BLOCK/warn toggle in `assignDriver` (URBAN-affiliation driver on INTERCITY trip). Files: `trips.ts:1727+`, `drivers.ts:3082+`, trip-card combobox. *(Gap #3)*
- [ ] **3.2** 🟠 **DB backstop for one-active-exclusive**: partial unique index on `driver_company_affiliation(driverProfileId) WHERE isActive AND employmentType='EXCLUSIVE_INTERCITY'`; pre-migration repair script for any existing violations (terminate all but latest hiredAt); map P2002 → CONFLICT in `resolveAcceptance`/affiliation upsert paths. Mirror the offer-pair index pattern. *(Gap #5)*
- [ ] **3.3** 🟡 Increment shift `tripsCompleted` inside `completeTrip`'s open-shift branch (or delete the dead column — decide once). *(Gap #15)*
- [ ] **3.4** ⚪ Offers-engine polish: cap counter rounds (const + check in both respond procedures); stop setting `respondedAt` on WITHDRAWN. *(Gap #19)*
- [ ] **3.5** ⚪ Licence-fit warning in Send-Offer dialog when offering EXCLUSIVE_INTERCITY to a sub-D licence holder (client-side check against returned `licenseCategory`). *(Gap #20)*

**Done when:** concurrent exclusive-acceptance loses cleanly at the DB layer; dispatch combobox visibly flags mode mismatches; unit tests cover the new index behavior.

---

## Phase 4 — Data Hygiene, Jobs & Admin Tooling (~2–3 days)

*Goal: growth doesn't rot the dataset; notification fabric fully consistent.*

- [ ] **4.1** 🟡 **Ping retention**: new `/api/cron/prune-telemetry` route (unified cron-auth) deleting `driver_location_ping` older than N days in bounded batches (keep anomaly rows longer if desired for disputes); register in `apps/web/vercel.json`. *(Gap #8)*
- [ ] **4.2** 🟡 **Migrate review-request to the outbox**: wrap `finalizeTripArrival`'s direct `novu.trigger` in an outbox enqueue helper (hourly-bucketed transactionIds) + contract-harness row, matching every other workflow. Last remaining direct trigger. *(Gap #16)*
- [ ] **4.3** 🟡 **Trip History tab for real**: new operator query listing a driver's assigned trips (status/departure/route/plate, paginated) feeding `driver-detail-view.tsx` Trips tab. *(Gap #9)*
- [ ] **4.4** 🟡 **Marketplace data quality**: validate `cityBase` against `CIV_CITY_HUBS` (+ normalize case) in `setServicePreference`; routeExperience chips normalized (trim/dedupe/case); display-side fallback grouping. *(Gap #11)*
- [ ] **4.5** 🟡 **Collect minMonthlyRateCFA**: numeric field on the driver preferences screen (already private end-to-end; never surfaced operator-side). *(Gap #12)*
- [ ] **4.6** ⚪ **Re-verification loop**: extend `expire-driver-licenses` cron to notify owning operators (not just the driver) when a licence flips EXPIRED. *(Gap #24)*
- [ ] **4.7** ⚪ *(Optional)* Bulk CSV onboarding + verification queue assignment for admins. *(Gap #23)*

**Done when:** ping table size is bounded by policy; a Novu outage can't lose arrival review prompts; passport history shows completed runs.

---

## Phase 5 — Passenger Live Tracking v1 (flagship feature, ~2–4 days)

*Goal: flip the promise on WITHOUT any WS infrastructure — parity with the operator map's honesty level.*

- [ ] **5.1** 🟡 New `passenger.getTripTracking({tripId})`: authorization = caller holds a CONFIRMED booking whose origin/destination segment covers the trip (or any CONFIRMED booking on the trip for v1); returns `last{Lat,Lng,Heading,SpeedKmh,PingAt}` + freshness classification (reuse `vehicleFreshness` semantics), trip status/serviceType/stops. Zero new tables.
- [ ] **5.2** 🟡 Wire the orphan `traveler-tracking-map.tsx` into `app/tracking/[tripId].tsx`: replace the coming-soon body when data exists; 10 s refetchInterval poll; stale-dimming; fall back to status screen when no fresh fix.
- [ ] **5.3** ETA honesty carried over verbatim: NO fabricated ETAs; distance-to-destination optional behind `isApproximate` chip rules.
- [ ] **5.4** Web passenger dashboard entry point on active bookings (same procedure).
- [ ] **5.5** Staging QA: fresh/stale/hidden states, unauthorized-tripId rejection, guest bookings, DEPARTED→ARRIVED transitions.

**Done when:** a passenger with a confirmed booking sees the bus dot move on a real poll; everyone else sees nothing fake.

---

## Phase 6 — Real-Time Revival (infrastructure, ~1–2 weeks elapsed)

*Goal: push instead of poll, using everything already shipped dormant.* Depends on Phase 5's shapes (payload contract stays identical).

- [ ] Host the gateway: `runner-ws` image stage or Next custom-server image + Caddy upgrade passthrough (revival checklist in `telemetry-ws.ts:10-14`).
- [ ] Design + implement OPERATOR subscriber credentials (fleet room ACL from claims — drivers are done).
- [ ] Passenger subscription credential: signed claim minted against a CONFIRMED booking (mirror dispatch-token pattern); join `trip:{t}` only.
- [ ] Redis subscriber relay decision for scale-out (F-TM-08/09 posture doc already written).
- [ ] Swap consumers: fleet map + traveler tracking screen read push under the SAME props contracts (in-code notes promise this); polls become fallbacks.
- [ ] *(Optional)* real adaptive ping cadence (battery-aware intervals replacing cosmetic labels). *(Gap #22)*

**Done when:** killing the poll still updates maps <2 s after pings; spoofed subscriptions rejected; single-instance documented or relay live.

---

## Phase 7 — Product Track: Money & Stop-Level Ops (open-ended)

*Goal: close the design-doc gaps that need product decisions, not just code.*

- [ ] 🟡 **Per-affiliation pay-rate model** replacing the ×50/min placeholder (schema migration PlatformSettings → affiliation rates; earnings rework; retire `isPlaceholderRate`). *(Gap #17a)*
- [ ] 🟡 **Payout rail** for driver earnings (wallet account class vs Paystack transfer — needs a money-movement ruling like the refund-channel one). *(Gap #17b)*
- [ ] 🟡 **Stop-execution checklist**: driver-app waypoint arrive/depare taps writing `TripStop.actualArrival/actualDeparture` + progress surfaced to Phase-5/6 consumers. *(Gap #10)*
- [ ] **Structured route-experience matching engine** (terminal cities ↔ declared routes; marketplace ranking). *(extends Gap #11)*
- [ ] **Offline scan-queue UI** consuming `batchSyncCheckIns`.

---

## Suggested sequencing notes

- Phases 1–2 before anything public-facing: they're cheap and restore truthfulness.
- Phase 3 before scaling driver supply: exclusivity enforcement gets exponentially harder to retrofit once real money flows.
- Phase 5 is the highest user-value-per-effort item on the board; don't let it queue behind Phase 6 infrastructure.
- Phase 7 items each need a product ruling session first (pay model especially — mirror the D-ruling discipline used for refunds).
