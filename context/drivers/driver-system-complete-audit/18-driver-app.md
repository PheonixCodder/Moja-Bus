# 18 — Driver App Surface (`apps/driver-app`, Expo 57 / RN 0.86)

> Audit date: 2026-08-26 · Sources: `apps/driver-app/**` (app/, lib/, stores/, components/, features/, locales/, __tests__/).

## 1. Route map

`(auth)/`: `login` (Better Auth **phone OTP**: `authClient.phoneNumber.sendOtp` → `verify`, login.tsx:81,131), wizard `register/{index,license,documents,carrier,status}`, `preferences` (post-verification marketplace gate).
Root: `index` boot screen; `notifications` (Novu inbox); `_layout` providers.
`(tabs)/`: `trips` (dispatch list), `live` (run control center), `scanner` (QR check-in), `offers` (offer board inbox), `profile` (career passport + shift toggle + affiliations), `earnings`. Plus `/trip/[id]/manifest`.

## 2. Boot gate (`app/index.tsx`)

session check → raw-fetch `drivers.getMyServicePreference` with the session cookie (deliberately dependency-free) → no preference row ⇒ one-time `(auth)/preferences` gate, else `(tabs)/trips`. Fail-open on error. Note the gate keys on *preference existence*, NOT verification status — a PENDING driver lands on trips and simply cannot start runs/shifts (server gates); approval watching happens on `register/status` (10 s poll of `getMyVerificationStatus`).

## 3. Self-registration wizard (4 steps, zustand store `stores/driver-registration.ts`)

1. **Personal** (`register/index.tsx`): camera selfie (expo-image-picker, quality 0.7), full legal name*, phone*, years experience.
2. **License** (`register/license.tsx`): number*, category B/C/D/E, expiry date, front+back photos.
3. **Documents** (`register/documents.tsx`): national ID number, medical clearance doc photo.
4. **Carrier** (`register/carrier.tsx`): optional carrier invite code (= company slug or id) + employment type choice.

Submission via `drivers.registerDriver`; document uploads go through `lib/driver-doc-upload.ts` → `storage.presignUpload` (user-scoped private purposes `driver-license-front/back`, `driver-selfie`, `driver-medical-doc`) → PUT → object key stored (never `file://`). Failed upload blocks Continue (Phase 15). Server-side identity hygiene: name/avatar self-owned; phone change requires re-verification (`PHONE_REVERIFICATION_REQUIRED` structured error parsed by the wizard); `employmentType` seeds both servicePreference AND the carrier affiliation when an invite code matches an ACTIVE company (`drivers.ts:1339-1365`).

⚠️ **Bug found in audit:** `register/index.tsx:116` renders a raw `<div>` inside the RN tree ("Header Intro" block) — same Android-crash class fixed at `earnings.tsx` (P0-5) and `documents.tsx` (Phase 15 rider). Step 1 will crash/fail to render on device until changed to `<View>`.

## 4. Marketplace preferences screen (`(auth)/preferences.tsx`)

Availability switch (`isAvailableForHire`), employment-type cards (fr-first copy, en toggle), base-city hub chips from shared `CIV_CITY_HUBS` (@moja/schemas) + manual input, route-experience free-text chips (max 20, deduped). **`minMonthlyRateCFA` is always sent `null` from this UI** — the private salary field has no collection UI anywhere (schema-only capability). Skip persists a minimal off-market record so the gate doesn't loop. Save → `setServicePreference` → tabs.

## 5. Dispatch & trip execution

- `trips.tsx`: `getMyTrips` 30 s poll (dual-mode INTERCITY/URBAN filter chips, P3-13); Start Run calls `drivers.startTrip`, stores `telemetryToken` (via `setTelemetryAuthToken`) + binds ACTIVE_TRIP_ID_KEY, then `startBackgroundLocationTracking(driverProfileId, tripId)` — real identity threaded since P0-1 (no more `"drv_active"`).
- `components/urgent-dispatch-gate.tsx`: polls `getMyUrgentDispatches` every 60 s over all tabs; full-screen modal (features/dispatch) shows carrier/plate/route/countdown/passenger count; Acknowledge → `acknowledgeUrgentDispatch` (server-persisted; survives reinstall).
- `live.tsx` (control center): server-truth active run via `getMyProfile.currentTrip`; zombie-stop watcher ends background tracking + clears token if dispatch closes/cancels the run mid-flight (F-DV-04); Mapbox navigation canvas (`DriverNavigationMap`) with real stop corridor from tripStops (terminals with coords only) + Mapbox Directions polyline via `fetchRouteDirections` (24 h tile/route cache `mapbox-cache-core`; missing token fails LOUD in prod builds P2-14; straight-line fallback ⇒ `isApproximate` ⇒ "Itinéraire approximatif" chip and ETA suppressed — F-TM-17); speedometer HUD from foreground `watchPositionAsync` (5 s / 10 m) with 110 km/h overspeed banner; honest whole-route ETA from Directions durationSeconds ("Fixed 5 s" label); delay-reporting modal (minutes 1–600, reasons TRAFFIC/BREAKDOWN/WEATHER/POLICE_CHECKPOINT/ACCIDENT/OTHER mirroring schema, optional note) → `reportTripDelay` (P3-12); Complete Run → `completeTrip` then tracking stop + token clear (failure keeps tracking alive — never orphan a run).
- NOTE vs design docs: there is NO per-stop arrival/departure checklist in the current live screen (overview promised waypoint tap-through); `TripStop.actualArrival/actualDeparture` are not written by any driver surface — segment timestamps exist in schema only.
- `manifest.tsx`: `getMyTripManifest` with search by name/phone/reference; seat labels, boarding badges, origin/dest terminals. No ticketTokens client-side (server strips them).
- `scanner.tsx`: binds each scan to ACTIVE_TRIP_ID_KEY from AsyncStorage; `checkInPassenger` mutation (+ `manualCheckInPassenger` fallback; batch sync endpoint exists server-side for offline queue UI — roadmap item "offline scan-queue UI").

## 6. Offers board & notifications

- `offers.tsx`: inbox w/ live badge, tabs active/history, counter sheet (salary/start/note), exclusive-conflict consent dialog (parses `EXCLUSIVE_CONFLICT_REQUIRED::names` → confirm → re-send ACCEPT with `confirmExclusiveSwitch:true`, P0-4), expiry countdowns; `markMyOffersSeen` on view; `respondToOffer`.
- Push: `hooks/use-push-token.ts` registers with Novu (`public.registerPushToken`, append semantics for dual-app users); bell + `app/notifications.tsx` inbox; tap-navigation via client-side identifier→route map (`lib/notification-routes.ts` — offers→/(tabs)/offers, dispatch/trips→/(tabs)/trips; map wins over stored redirect, cross-surface redirects never followed — F-NF-15).

## 7. Status, shifts, earnings, profile

- `profile.tsx`: duty toggle → `toggleShift {onDuty, serviceType?}` (ledger-backed; VERIFIED+licence gates server-side), career passport stats, trust badges, affiliations list, edit-profile dialog (name/avatar free, phone gated).
- `earnings.tsx`: `getMyEarnings` — today/week estimates from shift minutes × PlatformSettings rate, labeled **Estimation** with `isPlaceholderRate` flag (D5 ruling; per-affiliation pay-rate model is roadmap), recent shifts labeled per carrier (global-across-carriers scope is a recorded ruling).
- SUSPENDED drivers: read-only surface + suspended status screen; telemetry stops (zombie-stop).

## 8. Cross-cutting

- **State**: zustand store only for registration; everything else react-query. Telemetry module state is module-level singletons + AsyncStorage (driver id, trip id, token, offline queue).
- **i18n**: i18next + expo-localization, locales `en` + `fr`, French-first copy in many screens; parity test `__tests__/i18n-parity.test.ts`.
- **Tests** (`__tests__/`): telemetry-core (chunking/backoff/harsh-braking physics), mapbox-cache-core envelope/TTL, notification-routes mapping, i18n parity. Runner wired into turbo (first mobile suite, Phase 10).
- **Map stack**: @rnmapbox/maps exact-pin 10.3.5 (EAS build proof = pending staging leg); logo/attribution compliance enforced Phase 30 across both mobile apps.

## 9. Gaps

1. `<div>` crash bug at register/index.tsx:116 (above) — ship-blocker for new-driver onboarding on Android.
2. No per-stop progress checklist (design-doc promise; TripStop actuals unused by mobile).
3. Offline scan-queue UI absent though `batchSyncCheckIns` ships server-side.
4. Preferences gate fail-open means a network error at first boot skips marketplace onboarding silently.
5. `minMonthlyRateCFA` collected nowhere despite being modeled as private field.
6. Adaptive cadence labels exist (STATIONARY/HIGH_RATE health) but the location task itself runs fixed 5 s/10 m — battery-adaptive intervals remain cosmetic.
