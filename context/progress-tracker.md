# Progress Tracker

**Update this file after every completed feature.** Any agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

| Field | Value |
|-------|--------|
| **Phase** | **v2 audit remediation — ALL 39 PHASES (00–38) COMPLETE ✅ (2026-08-25).** Every one of the 93 findings is closed in code. Phases 00–31 + 34+35 executed in tracked sessions; 32, 33's remaining legs, 36, 37, 38 landed via parallel sessions and were code-verified into the record on 2026-08-25. What remains is NON-CODE: staging probes per `12-release-checklist.md` (incl. Phase 35's header dump / geo-capture / browser-scanner QA / OTP regression / CSP console review), CSP enforcement flip once QA is clean, EAS build proof for the rnmapbox pair. |
| **Last major milestone** | Phases 28+29 (telemetry parity + observability), 30 (mobile map compliance/cache), 31 (driver data honesty) executed same-day; review residue (4th attribution surface, ack-reset ruling, earnings scoping ruling) closed in-session. Gates 19/19 · web 496 · driver-app 14. |
| **Next priority** | ~~All remediation phases~~ ✅ COMPLETE — the track is now **staging & release**: run the Gate A/B/C probes in `full-system-e2e-audit/12-release-checklist.md` against a converged environment, flip CSP from report-only to enforcing after a zero-violation console pass, EAS build proof for the rnmapbox JS/native pin, and the physical-device legs (camera scan, Novu 3-channel delivery, Paystack checkout, push tap-routing QA on all three surfaces). ~~Neon merge-window deploy~~ ✅ DONE 2026-08-25. |

### Changes Made (2026-08-15 — discounts):
- ✅ Discount Prisma models + PricingSnapshot columns; schemas; feature flags; engine + services + tRPC routers
- ✅ Web + traveler-app checkout promo/voucher UX (i18n wired); wallet confirm nets credits correctly
- ✅ Admin `/dashboard/admin/marketing/campaigns`; Operator `/dashboard/operator/promotions`; sidebars + en/fr nav keys
- ✅ Promo ledger + referral cron/abuse; marketing summary + aging; campaign performance + CSV export
- ✅ Novu triggers (voucher, referral, pause, budget, expiry, campaign-starting); FAQ + Terms stacking/credits/referrals EN/FR
- ✅ `prisma db push` completed; Phase 21 polish (funnel bars, opt-in notify, traveler `/referrals`)
- ⏳ Novu dashboard sync; staging smoke / GA (env kill switches removed — always-on)
### What works end-to-end today

- **Passenger:** Search on `/` → book seats → per-seat passengers → **Paystack card/MoMo/Wallet** → digital ticket + public `/tickets/[token]` page → dashboard bookings/tickets/wallet → Redesigned Passenger Dashboard → Receives Novu Notifications
- **Operator:** Onboarding → fleet/routes/schedules → dispatch board → manifest (segment occupancy, check-in, QR scanner) → bookings list → Overview Dashboard → Redesigned Onboarding Flow → Receives Novu Notifications → Requests Withdrawals via Wallet → **Staff IAM** (role templates + per-user permission overrides) → Revenue CSV exports
- **Auth:** Email/password, Google, OTP verify, password reset (passenger + operator)
- **Admin:** Verifies companies, manages treasury (Novu Alerts on failure), manual settlements

### Known gaps (not blocking dev/demo)

- Mobile traveler-app: search/booking audit tracker largely closed (`context/trackers/traveler-app-search-booking-audit.md`) — remaining deferred: M8 mobile-callback, L3 multi-deck; manual device QA pending
- Deferred: dual-control CASH, OTP bank reveal, heatmaps, monolith splits — _reviews UI + bulk ops now in progress via Phase 7 low-issues (L11, L7)_
- **Discounts:** always-on (env kill switches removed); operational control via campaign status + referral program `isActive`; remaining is QA + Novu sync + GA

---

## Milestone Log (newest first)

### Sales cutoff — departed trips no longer bookable (2026-08-26)

- **Bug:** the entire passenger funnel had no `now` comparison — search listed already-departed trips on today's date (and any past date via URL), and trip-details/seat-map/createHold accepted them via direct link. Status hygiene doesn't cover it: auto-generated trips nobody flipped stay SCHEDULED forever.
- **Ruling:** 30-minute sales cutoff — a trip is bookable iff `departureTime >= now + 30min` (last possible 15-min hold expires at/before departure). User-confirmed product decision.
- **Enforcement (one shared rule, two choke points):**
  - NEW `apps/web/features/booking/lib/sales-cutoff.ts` (`SALES_CUTOFF_MINUTES=30`, `isPastSalesCutoff`, `salesCutoffInstant`).
  - `buildTripWhere(..., now?)` clamps EVERY lower bound (plain branch + per-window MORNING/LATE_NIGHT ranges; fully-closed windows collapse to an impossible condition). `findTrips`/`findTripsInWindow` pass server `now` ⇒ search + cheapestByDate strip covered; past `?date=` URLs return zero rows for free. Builder stays pure when `now` omitted.
  - `TripDetailsService.getTripDetails` throws BAD_REQUEST "Sales for this trip have closed" past the cutoff ⇒ one guard covers details + seat map + createHold.
  - Zero UI changes needed (date strip already renders/disables null-price cells; form picker blocks past dates).
- **Tests:** new `features/booking/lib/__tests__/sales-cutoff.test.ts` (+6, registered in package.json test list); `search-where.test.ts` +7 fixed-`now` clamp cases. Web suite 570/570 green; web tsc --noEmit clean.

### v2 Full-System Audit → 39-Phase Execution Plan (2026-08-23)

Audit: `context/drivers/full-system-e2e-audit/` (93 findings; per-finding evidence in domain files 02–10, catalog in 11, gates in 12).
Plan: one file per phase (`phase-00…phase-38`) in the same folder — each phase = one focused session with tasks, acceptance criteria, staging probe. **Every finding ID maps to exactly one phase.**

**Wave 1 — Foundation**
- [x] **Phase 00** DB reproducibility & migration drift *(F-DV-01 P0)* — ✅ COMPLETE (2026-08-23): six untracked dirs committed + enum-repair ×2 + `20260823235959_phase00_schema_convergence`; clean-volume replay drift-0; Neon migrated via backup branch (recovered from db-push-mixed reality with guarded idempotent SQL). Sole remaining leg: custom-server (deploy/) introspection + its own migrate run.
- [x] **Phase 01** CI quality gate *(F-IN-05, F-IN-06)* — ✅ COMPLETE (2026-08-23): deploy.yml gate = typecheck (traveler-app included) → `turbo test` → lint; 56/56 suites wired, 0 orphans; local red/green proven (exit 1 broken / 0 restored). User actions pending: CI e2e red/green on next master push + branch-protection required checks (`quality-gate`, `drift-check`).

**Wave 2 — Launch blockers (Gate A)** — all code-complete 2026-08-23; service-level probes 6/6 passed vs converged real-PG scratch (`apps/web/scripts/probe-phases-02-06.ts`)
- [x] **Phase 02** Scanner reads issued tickets *(F-PS-03/DV-02)* — shared `parseTicketToken` in `@moja/schemas` (URL-wrapped/`?token=`/JSON/bare); 20-case contract matrix.
- [x] **Phase 03** Check-in authorization binding *(F-IN-01/DV-03)* — `DriverCheckInService.assertBoardable` 4-guard pipeline on scan/manual/batch; manifest tokens removed; 30-case suite.
- [x] **Phase 04** Payment verification ownership *(F-PS-01)* — `verifyAndConfirmForUser/System` split, ownership asserted pre-Paystack; orphan rescue credits hold owner; top-up binding pulled forward.
- [x] **Phase 05** Refund channel truthfulness *(F-PS-02 — decision required)* — removal arm ratified: PAYSTACK rejected at policy+service layers, WALLET-only self-cancel, zero phantom obligations.
- [x] **Phase 06** Driver run-state lifecycle (no stranded ON_TRIP) *(F-DV-04)* — convergence on cancel/operator-ARRIVED/suspend; shift-aware post-run status; zombie-telemetry stop; SUSPENDED read-only surface.
- [x] **Phase 07** Passenger notice schema repairs + contract-test harness *(F-NF-01/02)* — truthful cancelled payload; both delay paths outbox-unified; 9-case contract harness with audit-defect tripwires.
- [x] **Phase 08** Subscriber identity completion (8 audiences → user.id) *(F-NF-03)* — all nine sites re-keyed; Date.now() txIds stabilized; harness extended to 19 cases / 11 workflows.
- [x] **Phase 09** Realtime transport posture decision *(F-TM-01/IN-04, TM-10 — decision required)* — Option B ratified: v1 HTTP-only; localhost default removed (skip-unless-set); reconnect budgeted; dormancy+revival checklists.

**Wave 3 — Hardening (P2 clusters)** — all code-complete 2026-08-23
- [x] **Phase 10** Telemetry client resilience *(TM-04/05/06)* — chunked ≤100 drain w/ preserved remainder; deceleration-severity braking (D5 correction); 401 re-mint + `needsReauth`; flush decoupled from WS-open; pure `telemetry-core.ts` suite.
- [x] **Phase 11** Gateway authz & fleet channel *(TM-02/03)* — signed `c` claim at both mints; enforced-mode subscribe restricted to claims-derived rooms; fleet publish flows under enforcement; operator-subscriber revival-gated.
- [x] **Phase 12** Driver HUD ground truth *(TM-11)* — real GPS watch; honest Directions-based ETA; simulator deleted.
- [x] **Phase 13** Roster management completeness *(OP-02/04)* — passport Edit/Remove dialogs + mid-run CONFLICT guard + roster-removed outbox workflow; accumulate pagination; F-IN-02 ride-along.
- [x] **Phase 14** Dispatch eligibility gates *(OP-03, DV-12/15, IN-02/OP-13)* — trip-aware licence gates vs `estimatedArrival`; VERIFIED-only operate policy; nightly expiry cron; expiry badges.
- [x] **Phase 15** Registration documents & preferences pipeline *(DV-05)* — wizard presign uploads via 4 private purposes; `nationalIdNumber` persisted; affiliated flag + dossier presigned GETs.
- [x] **Phase 16** Driver-domain server guardrails *(DV-06/08/10, NF-16)* — updateMyStatus one-authority matrix; INVITABLE_STAFF_ROLES excludes DRIVER server-side; E.164 phone + structured reverify error; OTP log gated.
- [x] **Phase 17** Delay persistence & shift ledger *(DV-09/07)* — reportTripDelay mirrors operator formula exactly; deterministic ledger + partial-unique-index migration incl. duplicate repair.
- [x] **Phase 18** Traveler money UX parity *(PS-04/05/06)* — per-seat refund quote in cancel dialog; deep-link `/booking/[reference]`; dead wallet router deleted.
- [x] **Phase 19** Review integrity *(PS-07/08/09)* — CTA → existing past-bookings route; explicit-only ReviewSheet (nulls omitted); completedAt submit gate.
- [x] **Phase 20** Offer-notification keys & email CTAs *(NF-04/09, DV-13)* — recipient-scoped txIds inside the 5 helpers + conflict alert; lazy sweeps via `expireOfferIfDue`; `dashboardUrl()` fixes operator-pointing CTAs.
- [x] **Phase 21** Push tap-routing & device registry *(NF-05/06)* — expo.data overrides ×18 workflows (11 traveler + 7 driver); driver handler routing; `credentials.append` merge.
- [x] **Phase 22** Notification operations *(NF-07/08/10)* — CAMPAIGN_BUDGET_EXHAUSTED wired via outbox; admin-bank-account-pending DELETED (F-NF-08 ruling executed, registry zero unexplained); every-minute crontab proven + cadence-guard test.

**Wave 4 — Polish (P3 clusters)**
- [x] **Phase 23** Fleet map reality *(OP-01, TM-12)* — ✅ 2026-08-23: real poll-fed react-leaflet map (CARTO dark tiles, ssr-false dynamic import); radar deleted; three-state freshness on markers + roster filter.
- [x] **Phase 24** Offers & marketplace polish *(OP-05/06/07/08)* — ✅ 2026-08-23: sheet Send-Offer disabled when isOnMyRoster; sent-offers accumulate pagination; day-bucketed marketplace keys (F-NF-13 remainder).
- [x] **Phase 25** Admin governance & profile privacy *(OP-09/10)* — ✅ 2026-08-25: `drivers:verify.*` keys + ADMIN template seed; activity log in flip tx; DRIVER_VERIFICATION_OUTCOME durable outbox; conditional public-profile redaction via shared view type.
- [x] **Phase 26** Recruitment path robustness *(OP-11/12/16)* — ✅ 2026-08-25: unassign window mirrored to pre-departure statuses; createDriver $transaction + AMBIGUOUS_BINDING dialog + terminatedAt clear; doc uploads via operator-namespace purposes; APPROVE-without-docs refused both paths.
- [x] **Phase 27** Roster filters & query hygiene *(OP-14/15)* — ✅ 2026-08-25: ONE batched conflict query over pure `findTripConflict` core; SUSPENDED/verification/employment filters; canAssign re-backed to trips:update; licence-expiry select fix ride-along.
- [x] **Phase 28** Telemetry state & validation parity *(TM-07/08/09)* — ✅ 2026-08-25: shared prev-point store on BOTH transports; Redis delete-arm + loud backend honesty; boot retries.
- [x] **Phase 29** Anomaly observability & scoring semantics *(TM-13/14/18)* — ✅ 2026-08-25: LOW_ACCURACY flag-and-persist; JSON forensic logging + health card; segment-fair reconcile + flush locks.
- [x] **Phase 30** Mobile map compliance & cache policy *(TM-15/16/17/19)* — ✅ 2026-08-25: tripId param fixed (payload already had it); attribution ON ×4 surfaces (repo-wide grep caught search-map-view); TTL cache + simplified overview + approximate-flag fallback; rnmapbox exact-pin.
- [x] **Phase 31** Driver app data honesty (+4 unnumbered observations) *(DV-11/14)* — ✅ 2026-08-25: SQL earnings + settings-column rate + honest labeling; server-side dispatch acks + ISO times; odometer/broadcast deletions; ALL-filter fix; D8-a updateDriver.status stripped.
- [x] **Phase 32** Passenger money polish *(PS-13/14/15)* — ✅ landed via parallel session, verified in-tree 2026-08-25: `verifyPaystackSignature` constant-time compare ("Phase 32 (F-PS-13)" at paystack-client.ts:143); traveler ticket-sheet QR caption shows bookingReference, not the raw bearer token ("Phase 32 (F-PS-15)" in ticket-sheet.tsx).
- [x] **Phase 33** Booking taxonomy & guest strategy *(PS-10/11/16)* — ✅ COMPLETE via parallel session, verified in-tree 2026-08-25: F-PS-16 rebooking rides the durable outbox (`passenger-rebooked` workflow + `enqueuePassengerRebooked` + rebooking-service producer + contract-harness row); PS-11 guest claim rebuilt around `phonesMatch` phone-equality predicate with passengerPhone select (booking-read-service.ts); PS-10 COMPLETED taxonomy live in booking-read-service status reads.
- [x] **Phase 34** Notification small-fixes batch *(NF-11/12/13/14/15)* — ✅ 2026-08-25: D34-1a fresh retry budget (+test) · pauseReason rename + campaign-paused harness rows (D34-2b-i follow-up ruling filed in-code: discounts notify family → outbox is its OWN session) · NF-13 pre-closed by Phase 24, same-day re-suspend edge ratified+documented · conflict-alert email optional both sides + ISO busyUntil ride-along (UTC formatting = CI local time) + conflict harness rows · F-NF-15 tap navigation via client-side identifier maps on all THREE surfaces (driver/traveler/web route-map modules; map wins over redirect fallback; cross-surface redirects never followed; suspended-operator no-nav pin on web; driver notifications got own i18n namespace). Mangled `\` comments were a grep rendering artifact — real bytes clean.
- [x] **Phase 35** Web security headers & origins *(IN-08/09/10/16)* — ✅ 2026-08-25: CSRF policy extracted to lib/mutation-origin.ts (malformed→FORBIDDEN not INTERNAL, prod pins https scheme, ALLOWED_ORIGINS explicit-only, dev host-equality preserved; 7-case matrix) · remotePatterns first-party only (cdn + S3_PUBLIC_URL_BASE host parsed at config time), editor surfaces (blog ×3 + banners ×2) → `unoptimized` prop instead of widening allowlist (Google avatars ride plain <img>, unaffected) · Permissions-Policy geolocation=(self), camera=(self), microphone=() on SITE block only (browser QR scanner + geo-capture un-broken) · CSP REPORT-ONLY baseline at Caddy with compose-fed POSTHOG_PUBLIC_HOST/S3_PUBLIC_HOST defaults; enforcement flips after zero-violation staging QA (nonce/hash CSP explicitly deferred to own session) · trustedOrigins prod-gated via lib/trusted-origins.ts (six localhost defaults + exp:// + :8081 dev-only; exp:// dies in prod per ratification, ALLOWED_ORIGINS = documented recovery path; 5-case env-shape tests).
- [x] **Phase 36** Config, crons & artifacts hygiene *(IN-07/11/14)* — ✅ landed via parallel session, verified in-tree 2026-08-25: TELEMETRY_TOKEN_SECRET documented in both .env.example files; tracked junk removed (count-issues-output.txt gone); cron route↔schedule parity guarded by new `cron-hygiene.test.ts`. Residuals folded into staging backlog: CSP-enforcement flip (once QA is zero-violation) and POSTHOG_PUBLIC_HOST/S3_PUBLIC_HOST example entries.
- [x] **Phase 37** Money-path misc hardening *(IN-12/13/15)* — ✅ landed via parallel session, verified in-tree 2026-08-25: release-escrow route has ZERO `$queryRawUnsafe` (tagged queries); escrow ops alert dedupes per day instead of re-paging (F-IN-13 comment at route.ts:263).
- [x] **Phase 38** i18n leakage sweep *(PS-12 + inventory)* — ✅ landed via parallel session, verified in-tree 2026-08-25: web passenger-tickets-view fully i18n'd (t() throughout), traveler tracking screen on useTranslation — both audited leak surfaces covered.

Execution rules live in `13-phased-execution-plan.md` §Execution rules (one session per phase; green gates; tests ship with behavior; migrations rehearsed on clean volume; decision phases ratify first).

### Commercial lifecycle hardening — Phase 00–07 (2026-08-16)

### Commercial lifecycle Phase 07 — outbox / gate (2026-08-16)
- ✅ OutboxMessage + enqueue on commercial Novu events; process-outbox cron; admin retry UI
- ✅ Staging smoke checklist + test matrix docs; D7 confirmed OUT
- ⏳ Staging migrate + smoke sign-off / recon

### Commercial lifecycle Phase 06 — UX/i18n/privacy (2026-08-16)
- ✅ Presentation ticket tokens (`pt`) on success URL; verify checkout session cookie
- ✅ Abidjan day bounds; multi-deck seat map; CONFLICT refresh; wallet CreditLots prefetch
- ✅ Booking dialog / hold countdown / seat legend i18n EN+FR; privacy notes doc

### Commercial lifecycle Phase 05 — product/ops/abuse (2026-08-16)
- ✅ Flag decisions + wiring (combine credit, applyTarget fee, newUser age, expiresOnFirstBooking, requirePaid)
- ✅ Offline refund fulfilment FSM + admin UI; abuse reviewStatus; incentive-status-sweep cron
- ✅ Crypto bulk coupons; company-only voucher; referral fraud toggles persist

### Commercial lifecycle Phase 04 — search/quote concurrency (2026-08-16)
- ✅ maxPathOccupancy (P1-3); BOARDING in search (P2-11)
- ✅ Conditional campaign budget + coupon freeze (P1-19 / P2-7); FINALIZED-only cap eligibility
- ✅ Signed quoteId on getCheckoutPricing; createHold requires quote; UI uses payableXOF

### Commercial lifecycle Phase 03 — hold & payment lifecycle (2026-08-16)
- ✅ `expireOrReleaseHold` + expire-holds cron; reconcile uses same path on fail
- ✅ Trace C: excludeHoldGroupId on quote/preview/refreeze; PaymentTab passes hold id
- ✅ Checkout releaseHold on hard failure; Paystack cancel keeps hold
- ✅ amountXOF sync on Paystack re-init; wallet clash re-check; ExternalPayment.purpose
- ✅ Honest mobile-callback; WalletReservation documented no-writers; sweep-captures scheduled
- ⏳ Staging Trace C + expire + amount-sync demos

### Commercial lifecycle Phase 02 — schema migrations & data repair (2026-08-16)
- ✅ Baseline IF NOT EXISTS migration for discount/referral/voucher/credit/scopes + pricing discount columns (P0-8 / D4)
- ✅ Constraints migration: voucher schedule/company Restrict; payment/refund→hold Restrict; CHECKs NOT VALID
- ✅ Env cutover runbook + state transition matrix; offerId intentional non-unique (P3-16)
- ✅ Repair/inventory scripts: duplicate INITIAL, CANCEL_WITHOUT_REFUND, stuck holds
- ⏳ Staging `migrate deploy` + CHECK VALIDATE + finance-gated --apply

### Commercial lifecycle Phase 01 — incentive ledger & referrals (2026-08-16)
- ✅ Admin/claim grants post PROMO_CREDITS ledger with lot
- ✅ Referral INITIAL edge-scoped idempotency (`referral:{edgeId}:INITIAL`)
- ✅ Voucher redeem burns VOUCHER_LIABILITY (not platform expense)
- ✅ Soft-fail invalid voucher; coupon/auto retained; checkout surfaces error
- ✅ Repair script for underfunded lots (dry-run / apply)
- ⏳ Staging Trace B/E + finance voucher journal spot-check

### Commercial lifecycle Phase 00 — cancel/refund money safety (2026-08-16)
- ✅ D7 locked OUT (no Paystack splits)
- ✅ Settlement provenance for wallet/zero-cash/Paystack; CancellationService no longer requires ExternalPayment SUCCESS
- ✅ Multi-seat: dropped FT unique(externalPaymentId, type); businessIdempotencyKey + per-booking REFUND_* keys
- ✅ Trip cancel failure → REFUND_PENDING + durable Refund FAILED (not CANCEL_WITHOUT_REFUND)
- ✅ Honest statuses: WALLET→COMPLETED, CASH/VOUCHER→PENDING_FULFILMENT; never fake Paystack refund id
- ✅ Passenger cancel channel picker + fee non-refundable copy; ACCOUNT_CLASS.OFFLINE_REFUND_PAYABLE
- ⏳ Staging migration + recon before Phase 01

### Discount / referral / voucher foundation + surfaces (2026-08-15)

- [x] Schema + Zod + flags + engine + quote/freeze/finalize + admin/operator/passenger routers
- [x] Web + mobile checkout promo/voucher UI
- [x] Admin marketing campaigns + operator promotions pages/sidebars
- [ ] Live DB push + flag-on smoke test
- [ ] Phases 15–20 (notifications, analytics, i18n polish, QA, rollout)

### Reverse Geocoding + Foundation SQL Cleanup (2026-08-06)

- [x] **Reverse geocoding for the capture flow** — user-confirmed decisions: OSM **Nominatim public API** (`REVERSE_GEOCODE_BASE_URL` env override), reverse-geocode **at submit time** + store on capture, `accept-language=fr` (data only — UI stays English per language rule).
- [x] **Client** `apps/web/lib/geo/reverse-geocode.ts`: `createReverseGeocoder(deps)` → `reverseGeocode({latitude, longitude})`; valid `User-Agent` (`MojaRide/1.0 (support@mojaride.com)`), 1 req/s shared limiter (`createRateLimiter`), 4 s `AbortController` timeout, 24 h cache keyed by 4-dp-rounded coords, **null on every failure** (network/HTTP/rate-limit/timeout/malformed) so a capture never breaks on Nominatim. `formatNominatimAddress`: `"${house_number} ${road|pedestrian}, ${neighbourhood|suburb|quarter|city|town|municipality}"`, fallback `display_name`.
- [x] **Schema + migration:** `LocationCapture.reverseGeocodedAddress String?`; `20260805000001_add_capture_reverse_geocoded_address` applied + recorded on live Neon (checksum `b0654a7f…`), column verified; `pnpm --filter @moja/db generate` ran.
- [x] **Service:** `CaptureServiceDeps.reverseGeocode?` (default null); `submit` stores + returns `resolvedAddress`; `approveCapture` fill order = `reverseGeocodedAddress?.trim() || formatLocationLabel(...)` (only when `addressLine1` null/placeholder; real addresses untouched); factory wires `createReverseGeocoder()`.
- [x] **UI/i18n:** Resolve drawer "Suggested address" / "No street address found"; capture preview shows `preview.resolvedAddress` + "Street address" subtitle; `en.json` + `fr.json` keys (English in both).
- [x] **Tests:** `reverse-geocode.test.ts` (9) + `capture-service.test.ts` +3 — **245/245 web tests pass** (61 suites). All touched files typecheck clean (sole reported error is the pre-existing unrelated `auth-server.ts expo` leftover; better-auth left untouched).
- [x] **Foundation SQL cleanup (user request):** deleted `apps/web/migrations/001_foundation_constraints.sql` + `_rollback.sql` + empty dir — proven dead: `run-migrations.ts` (only consumer) isn't wired to any npm script; Dockerfile `migrate` stage runs `prisma migrate deploy` only.

### Resolve Capture Button Fix — APPROVED terminal state (2026-08-05)

- [x] **Bug:** after approving a capture, the violet "Resolve Capture" button stayed. Root cause: `approveCapture` never updated the capture's own status (stayed `CONFIRMED`), so `terminals.list`'s live-captures include filter (`status IN OPEN/PENDING_CONFIRMATION/CONFIRMED`) kept returning it; the badge hid (keys off `geoCaptureStatus`) but the button didn't. `rejectCapture` worked because it sets `REJECTED`.
- [x] **Schema:** added `APPROVED` to `LocationCaptureStatus` (`packages/db/prisma/schema.prisma`); new migration `20260805000000_add_capture_approved` (`ALTER TYPE ... ADD VALUE 'APPROVED'`) applied + recorded on the live Neon DB (Prisma checksum = sha256 of file content, verified against `add_geo_capture`); `prisma generate` ran.
- [x] **Service:** `approveCapture` now sets the capture to `APPROVED` inside the transaction; `getInfo`/`submit`/`confirm` reject APPROVED with clear messages.
- [x] **UI:** Resolve button in `terminals-table.tsx` additionally requires `geoCaptureStatus !== "COMPLETE"` (defense-in-depth).
- [x] **Tests:** +3 (confirm/getInfo/submit reject APPROVED); approveCapture asserts capture `APPROVED`. **230/230 tests pass** (60 suites). Web `tsc --noEmit` clean.
- [x] **Verified (user asked):** `apps/web/migrations/001_foundation_constraints.sql` (+`_rollback`) NOT used on live DB — targets PascalCase tables that don't exist; snake_case Prisma schema only. Stale history; ignored.

### Geo Seed Document — Portable SQL Snapshot (2026-08-05)

- [x] User requested a "seed like document" for all cities/municipalities/quartiers. Choices confirmed: **Portable SQL snapshot**, **Everything** (188 cities / 200 municipalities / 3230 quarters incl. PostGIS geometry + coords), **same Neon dev DB**.
- [x] New `packages/db/scripts/export-geo-seed.ts`: reads connected DB (municipalities joined to city name, quarters joined to city + municipality names) → emits `packages/db/seed/geo-seed.sql`. Idempotent `ON CONFLICT DO UPDATE` keyed on natural constraints (`city.name`; `municipality("cityId", name)`; `quarter("municipalityId", name)`); parent ids resolved by name subselects → portable to a fresh DB. Geometry `ST_AsGeoJSON` → `ST_SetSRID(ST_GeomFromGeoJSON(..), 4326)`; `lit()` SQL escaping.
- [x] Fixed mid-task bug: municipality/quarter INSERTs referenced parent-name fields the SELECTs didn't fetch — added `JOIN city` / `JOIN municipality`+`city` so `cityName`/`muniName` are real columns.
- [x] Added `"export:geo-seed": "tsx scripts/export-geo-seed.ts"` to `packages/db/package.json`.
- [x] **Validated**: generated file (3636 lines, ~4 MB, 3 INSERTs: 25 KB city / 3272 KB municipality / 700 KB quarter) executed against the live Neon DB inside `BEGIN ... ROLLBACK` (syntax + upsert keys + geometry round-trip OK) via a throwaway `pg` script (no psql on this box). Deleted the validator + `_probe-geo.ts`.
- [x] **Usage:** `pnpm --filter @moja/db export:geo-seed` to re-generate; `psql "$DATABASE_URL" -f packages/db/seed/geo-seed.sql` to apply (re-runnable; on fresh DB run `db:push`/`migrate deploy` + `CREATE EXTENSION IF NOT EXISTS postgis` first).
- [x] Context files updated (`memory.md`, this tracker). NOTE: `packages/db/src/index.ts:50-52` TS2835 errors pre-existing/unrelated (only `package.json` touched in `packages/db`); `scripts/` excluded from db tsconfig — exporter verified by runtime execution.

### Ivory Coast Geo-Capture — M5 Search/Consumer Audit (2026-08-05)

- [x] **`geo-fixtures.ts`** verified against full importer output (188 cities w/ hub flags, 13 Abidjan communes + 81 quarters, 187 pass-through) — no change needed.
- [x] **New regression tests** `build-search-entries.test.ts` ("full 188-city dataset", +3): every pass-through city → exactly one city-level row (no `City (City)` dup); no municipality row duplicates its city name; composite key unique across full Abidjan quarter set (95 entries).
- [x] **`searchCities`** `take: 10` + composite autocomplete key verified.
- [x] **`getCityDetails`/`getGeoPlaceLabel`/`validate-search-pair`** dataset-agnostic (id/name-based, accent-normalized).
- [x] **`routes.getCities` → Combobox** — covered by M4.
- [x] **Mobile app** (`apps/traveler-app/`) — search is a placeholder shell, zero hard-coded cities.
- [x] **Non-COMPLETE terminals unreachable** — guards verified: `submit` writes only lat/long (city ids stay null until approve); `routes.create/update` reject city-less terminals (`missingCity`); search matches only by city/muni/quarter ids; editor capture mode only for new terminals.
- [x] **Verification:** web `tsc --noEmit` clean; **227/227 tests pass** (60 suites); `next build` ✓; biome clean on changed test file.
- [ ] **M6 (next):** final verification — typecheck, unit suites, manual E2E; update context files.

### Ivory Coast Geo-Capture — M4 Operator UI (2026-08-05)

- [x] **Schema** `packages/schemas/src/routes.ts`: `geoCaptureStatus` (optional `COMPLETE | PENDING_CAPTURE | PENDING_CONFIRMATION`) on `baseTerminalSchema`; `createTerminalSchema.superRefine` skips city/lat/long-required checks when capture pending (`status != null && !== "COMPLETE"`).
- [x] **Router** `apps/web/trpc/routers/terminals.ts`: `list` includes latest active capture; `create` persists `geoCaptureStatus` (default COMPLETE); `update` city-guard only when effective status COMPLETE.
- [x] **Editor** `terminal-editor-sheet.tsx` (rewrite): capture-mode toggle (auto-forced for non-COMPLETE edits) = name + phone + Primary/Active only → `create/update` with `PENDING_CAPTURE` → `captures.createCapture` → link card (copy + WhatsApp + expiry); placeholder address `CAPTURE_ADDRESS_PLACEHOLDER`; PENDING_CONFIRMATION banner; header status badge; standard-mode City/Municipality/Quarter native selects → **Comboboxes** (`locations.searchMunicipalities/searchQuarters`, skipToken), pass-through auto-select kept.
- [x] **Table** `terminals-table.tsx`: `CaptureStatusBadge` (Awaiting capture / Location submitted / Pending approval) + violet "Resolve capture" button when latest capture CONFIRMED → `onResolveCapture`.
- [x] **View** `operator-terminals-view.tsx` (rewrite): CAPTURE filter, `kpi.pendingCaptures` StatCard, Resolve drawer (`getGeoPlaceLabel` skipToken, coords 5dp, accuracy, submitter, device, notes; Approve emerald / Reject destructive; `approveCapture`/`rejectCapture`).
- [x] **Service** `capture-service.ts`: exported `CAPTURE_ADDRESS_PLACEHOLDER`; `approveCapture` auto-fills `addressLine1` from resolved label (`formatLocationLabel`) when null/placeholder, leaves real addresses untouched; `findCaptureInCompany` exposes `locationAddressLine1`.
- [x] **i18n** `capture.*` / `resolve.*` / `kpi.pendingCaptures` in `en.json` + `fr.json` (English in both).
- [x] **Verification:** web `tsc --noEmit` clean (exit 0); **224/224 tests pass** (59 suites; +2 approve-address tests); `next build` ✓; biome clean (repo-conventional `useLiteralKeys`/`noExplicitAny` only).

### Ivory Coast Geo-Capture — M3 Public Capture Page (2026-08-05)

- [x] **Server page** `apps/web/app/[locale]/capture/[token]/page.tsx`: `generateMetadata`; `createCaptureService(getPrismaClient()).getInfo({token})` server-side; TRPCError → friendly expired/rejected/invalid error screens; mirrors the `tickets/[token]` pattern.
- [x] **Client view** `apps/web/features/capture/components/capture-page-view.tsx`: mobile-first branded flow — radar signature (navy disc + brand-pink crosshair + `animate-ping` rings, `motion-reduce:hidden`), terminal/company card, optional name/phone/street-landmark fields → `navigator.geolocation.getCurrentPosition` (enableHighAccuracy / 15s / no cache) → client 150m accuracy gate → `captures.submit` → resolved preview (`formatLocationLabel`, coords + ±accuracy) → `captures.confirm` → success + "waiting for approval". Handles reopen (confirmPrompt / already-done), permission-denied / locate-failed / accuracy / server errors with retry.
- [x] **i18n** `capturePage` namespace in `en.json` + `fr.json` (English in both per language rule).
- [x] **Street/landmark → `notes`** (LocationCapture has no addressLine1 column; schema untouched).
- [x] **Pre-existing build blockers fixed** (user-approved): `features/admin/*` typecheck errors — `redirect-delete-dialog` `?? ""`, `redirects-table` missing `useTranslations` import, `admin-verifications-view` passes `t: columnsT` (namespace `adminDashboard.verificationsColumns`) to `getCompanyColumns`.
- [x] **Verification:** web `tsc --noEmit` fully clean (exit 0); `next build` green (`ƒ /[locale]/capture/[token]`, 125 static pages); **222/222 web tests pass**; biome clean on new files.

### Ivory Coast Geo-Capture — M2 Backend Capture-Link (2026-08-05)

- [x] **`CaptureService`** (`apps/web/features/capture/services/capture-service.ts`): `CAPTURE_TTL_MS = 7d`, `MAX_ACCURACY_METERS = 150`, `defaultSubmitLimiter` (10 req/10 min). Raw 256-bit base64url tokens, single-use, stored raw. Operations: `createCapture` (idempotent — re-shares a live OPEN/PENDING_CONFIRMATION/CONFIRMED attempt), `getInfo` (auto-expires), `submit` (accuracy gate → `token:ip` rate limit → require OPEN → geo-resolve → capture + terminal `PENDING_CONFIRMATION` with tentative coords, one tx; stores device via UA regex / ip / submitter / notes), `confirm` (idempotent → `CONFIRMED`), `approveCapture` (require CONFIRMED + resolved ids → terminal `COMPLETE` + geo-linked + `CAPTURE_APPROVED` ActivityLog + clears token), `rejectCapture` (`REJECTED` + `PENDING_CAPTURE` + `CAPTURE_REJECTED` log), `sweepExpired` (expire stale; terminal reverts COMPLETE if city set else stays PENDING_CAPTURE). `createCaptureService(prisma)` wires the offline resolver (`loadGeoDataset` + `geocodePoint`).
- [x] **Rate limiter** `apps/web/lib/rate-limit.ts`: in-memory fixed-window (`createRateLimiter({windowMs, max, now?, store?})` → `{ok, retryAfterMs}`); injectable store.
- [x] **Shared dataset loader** `apps/web/lib/geo/load-geo-dataset.ts` (`loadGeoDataset(prisma)` via `$queryRaw` + `ST_AsGeoJSON`); `locations.geocodePoint` refactored onto it.
- [x] **`captures` tRPC router** (`trpc/routers/captures.ts`, registered in `_app.ts`): `createCapture`/`approveCapture`/`rejectCapture` (`operatorCompanyProcedure`, `terminals:update`), `getInfo`/`submit`/`confirm` public. IP from `x-forwarded-for` → `x-real-ip`.
- [x] **Cron sweeper** `app/api/cron/sweep-captures/route.ts` (GET, `assertCronAuthorized`) → `sweepExpired()`.
- [x] **Tests:** `lib/__tests__/rate-limit.test.ts` (3) + `features/capture/services/__tests__/capture-service.test.ts` (19), registered in the hardcoded web test list → **222/222 web tests pass**.
- [x] **Verification:** `npx tsc --noEmit` clean (only pre-existing `features/admin/*` errors); biome clean on touched files (one repo-conventional `useLiteralKeys` info). Schema enum comments updated for plan semantics (submitter confirms → `CONFIRMED`, operator approves → `COMPLETE`).

### Ivory Coast Geography Import — M0 Data Pipeline (2026-08-05)

- [x] **PostGIS 3.6.0 installed on Neon** (`CREATE EXTENSION IF NOT EXISTS postgis`); PostgreSQL 18.4 via pooler host. Migrations applied via `prisma migrate diff` → manual SQL → `migrate deploy` (dev hangs on shadow-DB).
- [x] **Migration `20260804000000_add_geo_capture`** applied: `City.pcode/source`; `Municipality.latitude/longitude/geometry(Unsupported)/pcode/source`; `Quarter.latitude/longitude/geometry/externalId/source`; `CompanyLocation.geoCaptureStatus/captureToken/captureExpiresAt`; `LocationCapture` model + `LocationGeoCaptureStatus`/`LocationCaptureStatus` enums (M1 capture-link groundwork); GiST indexes on municipality/quarter geometry.
- [x] **GDAL-free GeoJSON conversion** (`convert-populated-places.ts`): Node `node:sqlite` reads the `.gpkg` (GPB→WKB→GeoJSON) → `ivory_coast_data/populated_places.geojson` (9090 point features).
- [x] **Importer `import-ivory-coast-geo.ts`** exports `runIvoryCoastGeoImport(prisma)`; CLI guard fixed (was double-firing on import). Domain mapping City=urban commune / Municipality=commune / Quarter=quartier. Candidates = OSM city/town ∪ GADM dept capitals ∪ seed cities.
- [x] **Dataset loaded:** 188 cities, 200 municipalities (187 pass-through + 13 Abidjan communes), 3230 quarters (3149 OSM-assigned), geometry on 187 municipalities, 168/510 sous-préfectures linked, 14 districts / 33 regions. Fully idempotent (0 creates on re-run).
- [x] **Abidjan communes embedded** (`ABIDJAN_COMMUNES`, 13 communes / 81 quarters, `source: CURATED`) — importer is the single geographic source of truth. Relabeled from `LEGACY` → `CURATED` (2026-08-05): **0 legacy records remain** in the DB (cities 100% OSM/GADM with coords).
- [x] **Abidjan coordinate backfill (2026-08-05):** `readAbidjanCoords()` reads `ivory_coast_data/abidjan_communes_quarters_osm.csv` (user-supplied + OSM-derived coords) → sets `latitude/longitude` on the 13 Abidjan commune municipalities + their quarters. Sources: full Geofabrik extract `ivory-coast.gpkg` (Node `node:sqlite` + custom GPKG WKB decoder), matching via commune point-in-polygon + name matching, spurious hits manually rejected (Agboville/Bacongo=Frazzaville/Ficgayo-in-Yopougon). DB verified: **13/13 communes + 81/81 quarters have coords** (last 10 filled from user-supplied coords: Adjamé/Monsieur; Attécoubé/Abia, Agbo, Ahongbon, Baco, Dogosso; Treichville/Djelan, Ficgayo, Mobidoum; Yopougon/Nianguan).
- [x] **M1 — Geo-resolution engine (2026-08-05):** `apps/web/lib/geo/geocode-point.ts` — pure, offline `geocodePoint()` (point-in-polygon w/ smallest-area-on-overlap + holes, nearest-quarter within resolved municipality, nearest-municipality fallback). `locations.geocodePoint` tRPC procedure (`$queryRaw` loads `ST_AsGeoJSON(m.geometry)` MultiPolygons + quarter coords). 13 unit tests registered → **200/200 web tests pass**. Smoke-tested against live DB (Cocody/Abobo/Yopougon/Adjamé quarters + Bouaké polygon resolve correctly). No third-party services.
- [x] **M2 (done 2026-08-05):** backend capture-link — see "M2 Backend Capture-Link" milestone above.
- [x] **Hub flags preserved** (`MAJOR_HUBS`: Abidjan, Bouaké, Yamoussoukro, San-Pédro, Daloa, Korhogo, Man); stale legacy pass-through cleanup rule added (removed "Duekoué").
- [x] **`seed.ts` delegates geography** to `runIvoryCoastGeoImport`; removed hardcoded CITIES + MUNICIPALITIES/QUARTERS. Fixed 2 pre-existing latent bugs the refactor exposed (bus-type upsert `where:{name}` → findFirst+create; 7 `findUniqueOrThrow({where:{name}})` → `findFirstOrThrow({companyId:null,name})`). Seed runs end-to-end idempotently.
- [x] **Test fixtures regenerated** (`geo-fixtures.ts`): `seedCities` → 188 cities with hub flags (sourced from DB); `seedAbidjanMunicipalities` verified against DB (13 communes / 81 quarters). Web tests **187/187 pass**.
- [x] **M3-M6 (planned):** public capture share page; operator Combobox + capture mode + approve/reject drawer; search/consumer audit; verification.
- [x] **M3 (done 2026-08-05):** public capture share page — see "M3 Public Capture Page" milestone above.
- [ ] **M4:** operator UI — Combobox migration, capture mode + approve/reject drawer, status badges, i18n.
- [ ] **M5:** search/consumer audit (§8) + tests green.
- [ ] **M6:** verification — typecheck, unit suites, manual E2E; update context files.

### Stops on Map — Shared RouteMapPreview Across Operator + Passenger (2026-08-02)

- [x] **`RouteMapPreview` generalized** (`apps/web/features/operator/components/route-map-preview.tsx`): now accepts a minimal `RouteMapPoint[]` shape (`{id, name, cityName, latitude, longitude}`) instead of full `Terminal`; markers (pink endpoints / purple intermediates) + polyline + popups, midpoint centering, OSM tiles. Exported `RouteMapPoint` type.
- [x] Call sites migrated: `route-form-drawer.tsx` + `admin-route-drawer.tsx` map `Terminal[]` → `RouteMapPoint[]` (city fallback `?? "Côte d'Ivoire"` for nullable `city`).
- [x] **Booking dialog toggle** (`trip-summary-card.tsx`): new `StopsMap` section under the stops timeline — "Show route on map" / "Hide route map" button + lazy-loaded (`ssr:false`) map rendering segment stops; hidden when <2 stops have coordinates. Card is now `"use client"` (both consumers already client). `TripSummaryData.stops[]` gained `latitude`/`longitude`.
- [x] **Booking-details map upgraded** (`booking-route-map.tsx`): renders ALL segment stops via shared `RouteMapPreview` (was origin→dest straight line only); keeps pure-CSS fallback banner + origin/dest floating overlay; leaflet internals delegated to the shared component.
- [x] Data plumbing: `TripDetailsStop` + `PassengerBookingSummary.stops[]` (`PassengerBookingStop`) gained `latitude`/`longitude` in `packages/types/src/booking.ts`; mapped in `trip-details-service.ts` (was already included in the Prisma query) and `booking-read-service.ts` (`bookingInclude` now selects `trip.tripStops` with terminals; `toSummary` filters to the booked segment via `originTripStopId`/`destinationTripStopId` stop orders).
- [x] i18n: `booking.tripSummary.showRouteMap` + `hideRouteMap` added to `en.json` + `fr.json` (English in fr per language rule).
- [x] Verification: web typecheck clean, `@moja/types` typecheck clean, web tests **107/107** pass, both message JSON parse. No server-logic changes — coordinates already fetched.

### Booking Dialog UX Polish — Centered Seat Map + Stops Timeline (2026-08-02)

- [x] **Seat map centered** (`passenger-seat-map.tsx`): legend + board wrapped in `w-max mx-auto` inside the existing `overflow-x-auto` scroll container (flex `justify-center` must live inside the scroller or the left edge clips on overflow); legend `justify-center`; board `inline-block rounded-xl border`.
- [x] **Stops timeline redesign** (`trip-summary-card.tsx`): extended `TripSummaryData.stops[]` with `quarterName`, `scheduledArrival`, `isPickup`, `isDropoff`; new local `StopTag` (emerald Boarding / blue Alight / slate Pickup/Dropoff) + `StopsTimeline` (time column / rail + dot / terminal + location label + badges); replaced old plain-text `<ol>` block. Origin = pink filled dot (departure only), destination = dark filled (arrival only), intermediates = hollow slate (arr + dep when non-null, nulls omitted). Leg duration `≈ Xh Ym` from `nextStop.scheduledArrival − stop.scheduledDeparture` beside the rail. Stop labels via shared `formatLocationLabel` (`format-location-label.ts`).
- [x] **Continue button centered** (`booking-dialog-flow.tsx`): `flex justify-end` → `flex justify-center` on the bottom CTA of the seat-selection step.
- [x] i18n: `booking.tripSummary` keys added to `en.json` + `fr.json` — `arrLabel`, `depLabel`, `boarding`, `alight`, `pickup`, `dropoff`, `legDuration`; removed now-unused `departing` key (only consumer was the old stops list). English text in fr per language rule (existing project pattern for new keys).
- [x] No server changes — `TripDetailsStop` already had `scheduledArrival`/`isPickup`/`isDropoff`; the card's local interface was the only gap.
- [x] Verification: web typecheck clean; web tests **107/107** pass; both message files parse as valid JSON; grep confirms zero remaining `departing` consumers. Timeline renders only in the booking dialog (`showStops` true only there; other `TripSummaryCard` consumers pass `showStops={false}`).

### Urban First-Class — Phase 4: Consistency Layer (2026-08-01)

- [x] **Shared label formatter** `apps/web/lib/format-location-label.ts` (R6): `formatLocationLabel` — urban `"Cocody – Riviera 3"` (quarter when known, city fallback), intercity `"Abidjan (Cocody)"`; `formatCityWithMuni` for operator surfaces. Kills the 4 ad-hoc formats + offer-card-vs-ticket mismatch (B5/B7).
- [x] Applied to all 10 R6 surfaces: offer-card (urban now shows quarter — R8 "show"), trip-summary-card, booking-checkout-form, digital-ticket-card, passenger-tickets-view, booking-route-map, booking-card, booking-details, passenger-trip-card, operator booking-detail-drawer. `Terminal · Quarter` secondary lines unchanged.
- [x] Plumbing: `PassengerBookingSummary.serviceType` + `OperatorBookingListItem.serviceType`; mapped in booking-read-service (`toSummary`) + operator-booking-service (`toListItem`/`toDetail`, include selects `trip.serviceType`).
- [x] **R11:** `StopLabel.municipality` + `buildStopsFromRoute`; pricing-step stops → `Terminal — City (Muni)`; route-card/routes-table/schedule-card → `City (Muni) → City (Muni)`; terminals-table city cell → `City (Muni)`.
- [x] **R12:** `admin.listRoutes` search on `cityRelation.name` (was free-text `city` — B10); copy de-urbanized (admin routes page, routes/terminals metaDescription, noRoutesDesc) in en.json + fr.json.
- [x] **R15:** deleted dead `hero-search-bar.tsx` (v1), `search-hero.tsx`, `route-editor-sheet.tsx` (verified zero imports; live code uses `hero-search-bar-2.tsx`).
- [x] Verification: web typecheck clean (one `exactOptionalPropertyTypes` fix on `LocationLabelParts`); web tests 89/89.
- [x] Audit tracker: status → all phases implemented 2026-08-01; Phase 4 log appended. Deferred sugar: urban price-range hint in `PricingStep`.

### Urban First-Class — Phase 3: Urban Cadence + Badges Everywhere (2026-08-01)

- [x] **Full cadence support (user decision):** `Schedule.departureTimes String[] @default([])` added; `departureTime` kept as primary/first for back-compat; `db:push` + `generate` pushed to Neon.
- [x] Idempotent backfill `packages/db/scripts/backfill-schedule-departure-times.ts` seeded all 6/6 schedules (re-queries for its warning count).
- [x] Schemas: `createScheduleSchema` accepts `departureTimes` or deprecated `departureTime` alias, requires ≥1, transform dedupes+sorts; `updateScheduleBasicSchema.departureTimes` (min 1).
- [x] `schedule-trip-window.ts` cadence-aware: one candidate per departure time per operating day; MODIFIED replaces the day's whole cadence with its override time; CANCELLED skips; EXTRA_SERVICE forces.
- [x] Server: `checkScheduleOverlap` time-set aware (no `departureTime` filter; CONFLICT lists shared times); trip-generator, reconcile, `updateCalendar`, `updateBasic` pass full list with `[departureTime]` fallback; `create` stores `departureTime = departureTimes[0]`.
- [x] Shared `DepartureTimesEditor` (`departure-times-editor.tsx`): time chips, manual add, cadence preset (start / every 15/30/45/60/90 min / end, deduped+merged); used by wizard `calendar-step` + `schedule-edit-drawer`; `CalendarConfig.departureTimes: string[]` (default `["08:00"]`); schedule-card shows up to 3 times then " (+N)".
- [x] **Badges from single source:** `apps/web/components/urban-badge.tsx`; `TripDetails`/`DigitalTicketDTO` gain `serviceType: SearchServiceType`; `bookingInclude` selects `trip.serviceType`; surfaces: trip-summary-card, digital-ticket-card, operator schedule-card, admin-routes-table; operator route-card/routes-table deduped onto shared badge.
- [x] i18n: wizard cadence keys + `markerDesc` `{times}` added to `en.json` + `fr.json` (English text in fr per language rule).
- [x] Verification: web typecheck clean; web tests **89/89** (2 new cadence tests in `schedule-trip-window.test.ts` — existing test file, no package.json script change).
- [x] Audit tracker updated with Phase 3 implementation log; remaining = Phase 4 only.

### Urban First-Class — Phase 2: Search over Level-Aware Places (2026-08-01)

- [x] `features/search/lib/places.ts`: `GeoPlace`, `isUrban` (= same cityId — refinements optional), `placeMatchesTerminal`.
- [x] `features/search/lib/validate-search-pair.ts`: shared pair validation (R2) — quarter↔city holes fixed, one-sided refinements now valid urban searches; used by search-form AND hero.
- [x] `SearchOffer.serviceType` (R1); offer-card `isUrban` reads it — name-equality check deleted.
- [x] Repository: `findTrips(originPlace, destPlace, date)` + `findTripsInWindow` replace `findCandidateTrips`/`findUrbanTrips`.
- [x] Search service: place-based `SearchContext`, single query, `serviceType` from trip snapshot.
- [x] Router: `originQuarterId`/`destinationQuarterId` on search + cheapestByDate; shared `resolveCityId`/`toGeoPlace`; cheapestByDate uses the shared window query (kills `tripWhere: any` branch).
- [x] `fromQuarter`/`toQuarter` nuqs params (R13) — wired through server prefetch, page client, form, date strip, cheapest-by-date hook.
- [x] Popular-chip id bug fixed (R3): `id: ""`, name resolves server-side.
- [x] R4/R14 semantics fixed by design: half-urban can't misroute; single-muni cities searchable; quarters honored end-to-end.
- [x] 16 new unit tests (`search-pair-validation.test.ts`); web suite 87/87 pass; web typecheck clean.

### Urban First-Class — Phase 0+1: Persisted Service Type (2026-08-01)

- [x] Schema: added `ServiceType` enum (INTERCITY/URBAN), `Route.serviceType` + `Trip.serviceType` with indexes; pushed to Neon via `prisma db push`.
- [x] Backfill script `packages/db/scripts/backfill-service-type.ts`: resolved legacy free-text `city` → `cityId`, derived route service types (2 URBAN / 4 INTERCITY), snapped serviceType onto all 89 trips.
- [x] `createTerminalSchema` now requires `cityId` when `isTerminal`; `terminals.ts` auto-assigns pass-through municipality and blocks terminal promotion without a city.
- [x] `routes.ts` derives `serviceType` server-side from terminal cityIds (never names); rejects geo-incomplete terminals and URBAN routes with out-of-city waypoints; re-derives on update.
- [x] `trip-generator.ts` snapshots `route.serviceType` onto new trips.
- [x] Operator UI: route-form-drawer badge is ID-based; route-card/routes-table show persisted "Urban" badge; terminal editor guards terminal-without-city.
- [x] Typecheck (web + schemas) clean; 87/87 web tests pass (16 new Phase 2 tests).
- [x] Phase 2: level-aware search places (fromQuarter/toQuarter, unified repo query, `SearchOffer.serviceType`) — DONE
- [x] Phase 3: urban cadence (departureTimes) + shared badges everywhere — DONE (2026-08-01)
- [x] Phase 4: shared `formatLocationLabel`, admin `cityRelation` search + copy, dead-code removal (R15) — DONE (2026-08-01)

### Notification Workflow Type Error Fixes (2026-08-01)

- [x] Fixed 14 TypeScript errors in `apps/web/features/notifications/workflows/` — 12 TS2322 (`step.push()` return `{ title, body, data }` → `{ subject, body }`) + 2 TS2339 (`bookingReference` missing from payloadSchema in `trip-cancelled.ts` and `trip-delayed.ts`)
- [x] All 12 operator/passenger/payments workflow files updated
- [x] `pnpm --filter web typecheck` passes with 0 errors

### i18n Phase 1 — Public Pages (2026-07-24)

- [x] Installed `next-intl` with i18n routing, middleware, type declarations, message files (EN + FR).
- [x] Wired landing page (11 components), Contact, About, Operators listing, and Operator detail pages.
- [x] Fixed JSON nesting bug (missing `public` block closure caused corrupted parse).
- [x] Merged duplicate `operators` top-level keys, added `operatorProfile` namespace.
- [x] Clean TypeScript compilation (`tsc --noEmit` passes).

### i18n Phase A4-2 — Operator Core ERP Pages (2026-07-24)

- [x] Expanded 4 namespaces (`fleet`, `routes`, `schedules`, `terminals`) with 250+ i18n keys across EN + FR.
- [x] Wired Fleet page: `page.tsx` metadata + `operator-fleet-view.tsx` (all inline components: BusCard, CustomLayoutCard, LayoutPreviewCanvas, LayoutsPanel).
- [x] Wired Routes page: `page.tsx` + view + sub-components (`route-card`, `route-form-drawer`, `delete-route-dialog`, `route-success-panel`).
- [x] Wired Schedules page: `page.tsx` + view + 8 sub-components (`schedule-toolbar`, `schedule-card`, `schedule-success-banner`, `schedule-delete-dialog`, `schedule-edit-drawer`, `wizard-stepper`, `route-picker-step`, `calendar-step`, `pricing-step`, `preview-step`).
- [x] Wired Terminals page: `page.tsx` + view + sub-components (`terminals-table`, `terminal-editor-sheet`).
- [x] Clean TypeScript compilation (only pre-existing errors remain).

### Shadcn UI Date/Time Components & Time Formatting Centralization (2026-07-23)

- [x] Built reusable Shadcn `DatePicker`, `TimePicker`, and `DateTimePicker` components in `@moja/ui/components/ui/`.
- [x] Centralized application date and time formatting module (`apps/web/lib/format-date.ts`) bound to `Africa/Abidjan` (UTC+0).
- [x] Replaced native HTML `<input type="date">`, `<input type="time">`, and `<input type="datetime-local">` across Operator Schedules, Operator Trips Toolbar, Operator Onboarding, Compliance Settings, and Admin Blog Publishing.
- [x] Verified clean TypeScript compilation and component integration across `apps/web`.

### Terminals, Fleet & Seat Layouts Audit Remediation (2026-07-23)

- [x] Wrapped `isPrimary` terminal demotions and location operations in atomic `$transaction` blocks (`terminals.ts`).
- [x] Fixed `deleteBus` soft-delete registration plate mutation bug (`fleet.ts`).
- [x] Wrapped schedule preferred bus disassociation and bus status updates in atomic `$transaction` (`fleet.ts`).
- [x] Added `deletedAt: null` filter to `deleteCustomLayout` bus reference count check (`fleet.ts`).
- [x] Moved seat active booking verification inside `$transaction` for `toggleSeatStatus` (`fleet.ts`).
- [x] Verified clean TypeScript compilation (`tsc --noEmit`).

### ERP Information Architecture & UI/UX Refactoring (2026-07-23)

- [x] Refactored monolithic views (`operator-routes-view.tsx`, `operator-terminals-view.tsx`, `operator-fleet-view.tsx`, `layout-builder-sheet.tsx`) into modular sub-components.
- [x] Extracted `RoutesTable`, `RouteEditorSheet`, `TerminalsTable`, `TerminalEditorSheet`, `BusesTable`, `BusEditModal`, and `SeatGridMatrix`.
- [x] Added accidental form dismissal protection (`isDirty` checks) on all drawer sheets and modal dialogs.
- [x] Added `overflow-x-auto` responsive table containers and created reusable `<AccessDeniedCard />` component for IAM fallbacks.
- [x] Verified full TypeScript compilation clean (`tsc --noEmit`).

### Operator Audit Remediation (2026-07-19)

- [x] Escrow release posts `ESCROW_RELEASE` ledger + reserved solvency; fail-closed without snapshot
- [x] CASH/VOUCHER cancel clawback; card confirm idempotency; withdraw metadata / reserved UI
- [x] Trips: block `updateStatus` CANCELLED; harden cancel/assign/check-in; SQL `q`
- [x] Hold ownership; Abidjan/en formatters; inactive schedule blocks holds
- [x] Trip/exception uniques; generator company-scoped bus; schedule reconcile on calendar/exceptions
- [x] Route terminal ownership; terminal deactivate guard; last full-route fare; createBus schema
- [x] Bank recipient reset; role templates (OPERATIONS `trips:cancel`, FINANCE `bookings:read`); demotion reset; invite URL omitted in prod
- [x] Revenue Abidjan buckets; trips/schedules nuqs wired; bookings/ledger CSV export
- [x] Tracker: `artifacts/operator-audit-remediation-tracker.md`

### Phase 7 — Low Priority Issues (2026-07-19)

- [x] L2 check-in idempotent; L3 Novu refund `refundStatus` payload; L4 Novu hosted `<Preferences/>`
- [x] L6 bookings/ledger CSV export; L9 Suspense skeletons; L12 TripStop actual times; L13 `SeatStatus` deprecation comment
- [x] L14 onboarding `bankVerified` + honest two-stage verification sub-step; L15 withdraw 1-based pagination
- [ ] In progress: L1 `trips.get` split, L5 operator search coverage, L7 bulk check-in/cancel, L8 a11y pass, L10 stale docs, L11 operator reviews UI
- [x] Tracker: `artifacts/operator-dashobard-audit-fix-phases/`

### Enterprise Staff IAM (2026-07-19)

- [x] Shared permission catalog + role templates in `@moja/schemas`
- [x] Prisma `StaffInvitation.permissions` + operator permission audit fields + backfill migration
- [x] Thin `requirePermission` on operator routers; staff invite/edit grant-subset rules
- [x] Staff UI permission matrix (invite + edit); sidebar gated on real keys
- [x] Removed parallel rbac/enhanced-procedures/AuthorizationProvider kit
- [x] Unit tests for OWNER bypass and grant escalation
- [x] Staff UI composition: one component per file; `staffParsers` wired via `useQueryStates`

### Passenger Dashboard Redesign (2026-07-13)

- [x] Overhauled the passenger dashboard layout to integrate a sticky glassmorphic header (`backdrop-blur-md bg-background/50 sticky top-0 z-50 border-b`) with `SidebarTrigger`, custom Command Search Dialog (`⌘K`), and integrated `NotificationInbox`.
- [x] Redesigned the `DashboardSidebar` component matching the exact structures, grouping labels, support cards, active path link indicators, and ellipsis footer menus of `best-dashboard-setup`.
- [x] Resolved button nesting hydration error (`<button> cannot contain a nested <button>`) and Radix prop warnings by switching to the `render` prop on `DropdownMenuTrigger` and `DropdownMenuItem`.
- [x] Fixed snap-open animation issues on all Base UI popups/dialogs by defining custom variants (`data-open`, `data-closed`), keyframes, and transition utilities inside the Tailwind v4 globals stylesheet.
- [x] Resolved Novu Inbox popover clipping by removing `overflow-hidden` from the layout header and adding `z-9999` classes.
- [x] Completely redesigned the main overview page (`DashboardView`) using a 2-column workspace layout.
- [x] Query accurate ledger account balance from the database using FinancialAccountService.
- [x] Built the `TravelStatsChart` Client Component rendering monthly trip activity as a responsive, styled area chart.
- [x] Built the `WalletQuickDeposit` Client Component supporting card/mobile money top-ups via Paystack and rendering a 3-row mini ledger.
- [x] Built the `SavedCompanions` Component rendering a list of saved passenger contacts.
- [x] Built the `DashboardQuickSearch` Client Component embedding an autocomplete route finder inside the welcome panel.
- [x] Built the `LiveBoardingPass` Client Component rendering gate QR check-ins and departure countdowns on travel days.
- [x] Adjusted the Upcoming Trips (`SessionsPanel`) search button background and neon glow shadow to match Moja's signature brand pink.
- [x] Restructured recent bookings into a timeline displaying terminals, dates, operator details, and QR ticket buttons.
- [x] Verified full type safety on the `web` workspace.

### Payment System, Novu Integration & BigInt Migration (2026-07-11)


- [x] Implemented comprehensive Novu notification workflows (13 triggers) for Passenger, Operator, and Admin flows.
- [x] Integrated `escape-html` globally across all notification payloads to prevent XSS injection.
- [x] Completed the digital Wallet system (Top-ups via Paystack, Checkouts, Withdrawals) with robust transaction client context to prevent partial state on failures.
- [x] Migrated all financial Prisma schema columns to `BigInt` (replacing `Int`) for precise XOF calculations.
- [x] Hardened the `AccountingEngine` by explicitly verifying `Number.isSafeInteger(amount)` on ledger entries.
- [x] Fortified Paystack API integration with network timeouts (`AbortSignal`) and intelligent failure state management (reserving funds as `PENDING` rather than permanently settling during network faults).
- [x] Completed a full, systematic workspace-wide code review and fixed 37 individual edge cases (UI, types, database bounds).

### Passenger & Operator Onboarding Redesigns (2026-07-09)

- [x] Redesigned the passenger dashboard layout, tickets view, settings profile, and wired stats.
- [x] Overhauled the operator onboarding multi-step form flow, branding steps, and status verification checks.

### Operator Overview Dashboard Redesign & TS Error Resolutions (2026-07-09)

- [x] Overhauled the Operator root `/dashboard` Overview page with a premium, responsive layout.
- [x] Implemented and wired `getDashboardMetrics` tRPC query returning live operational statistics (Revenue, Bookings, occupancy rate, and active fleet counts).
- [x] Built the Today's departures Dispatch board and Live booking activity stream sections.
- [x] Created an interactive Ticket verification and Boarding check-in dialog modal with support for ticket tokens and booking reference fallback lookup.
- [x] Resolved all TypeScript compiler errors across the workspace, achieving 100% type safety on both `web` and `app` packages.

### Real Operator Revenue Analytics (2026-07-08)

- [x] Defined and implemented `getRevenueAnalytics` tRPC procedure aggregating real bookings and dynamic pricing snapshots.
- [x] Built the `RevenueKpiCards` showing Total Revenue, Total Bookings, Avg Booking Value, and Avg Occupancy.
- [x] Created `RevenueChart` to visualize aggregated XOF daily revenue using Recharts.
- [x] Implemented `RevenueLedgerTable` to list line-item bookings and `TopRoutesTable` to sort routes by booking volume.
- [x] Integrated `nuqs` for robust URL-based date range state management (`from` / `to`).
- [x] Added `error.tsx` in `(dashboard)` to elegantly trap missing operator/company initialization errors avoiding full-page SSR crashes.
- [x] Removed placeholder operator dashboard revenue components and replaced with real connected UI.

### Paystack Bank Routing & Refund System Integration (2026-07-07)

- [x] Refactored Settlement bank list logic in `paystack-client.ts` to dynamically fetch banks matching the active Paystack Merchant Secret Key's country (Ghana, Nigeria, Kenya) instead of hardcoding Côte d'Ivoire.
- [x] Built graceful fallback for account holder name resolution via Paystack's verify API; if resolution fails or returns Currency/Region error, it prompts the operator for a manual name entry instead of failing completely.
- [x] Refactored `CancellationService.cancelBooking` to secure authorization checks across Passenger, Operator, and Admin roles.
- [x] Fully integrated Paystack Refund API (`PaystackProvider.refund`) to execute refunds on original payment methods.
- [x] Enforced base ticket price refunding, keeping platform passenger convenience fees non-refundable.
- [x] Built automated local mock refunding logic to simulate successful transactions when checkout runs under MOCK provider.
- [x] Added visual Cancel Booking & Refund modal dialogs to both Passenger Ticket Detail view and Operator Booking Drawer.
- [x] Fixed React button-in-button render prop warning on operator bookings view.

### Landing Page UI & Search Autocomplete Fixes (2026-07-06)

- [x] Removed Deals link, updated Contact to point to `/contact`.
- [x] Redesigned Explore popover: 2-column list of 10 popular routes with clean typography and hover transitions, pre-populating with today's date parameter.
- [x] Enabled search bar autocomplete to submit typed name strings as query parameters directly.
- [x] Added server-side name-resiliency to resolve city name strings to CUIDs inside `locationsRouter.getCityDetails` and `searchRouter.search` (matching accents/symbols automatically).
- [x] Replaced the mock popular routes section with a premium value propositions grid (`HomeFeatures`) detailing Seat Selection, Mobile Money, SMS/QR boarding, and Verified Operators. Deleted the old routes file.
- [x] Redesigned operator list (`HomeOperatorsClient`) with a professional directory layout featuring asymmetrical card lines, gold ratings tags, premium initials placeholders, and slide-in hover arrow links.
- [x] Overhauled the "How it Works" section (`HomeHowItWorks`) into a responsive curve timeline: shows a horizontal layout with dashed connector lines on desktop, which collapses into a left-aligned vertical stepper with vertical connector lines on mobile. Features layered number badges (`01`-`05`) and animated circles that zoom their icons when hovered.
- [x] Overhauled Call to Action (`HomeCta`) to replicate the reference sweeping card structure on brand pink background, displaying app screenshots side-by-side inside clean borderless card frames.
- [x] Standardized homepage layout backgrounds (alternating `bg-white` and `bg-slate-50` with uniform `py-32` vertical paddings) and section headings (Montserrat `font-extrabold` and `fontSize: clamp(2rem, 4vw, 2.75rem)`).
- [x] Created `<PublicPageShell />` component and refactored all public sub-pages (`about`, `contact`, `help`, `operators`, `privacy`, `terms`) to use the new standardized hero shell.

### Paystack Payments + HoldGroup Aggregate (2026-07-05)

- [x] `HoldGroup`, `PricingSnapshot`, `Payment` 1:1, `PaymentAttempt`, `PaymentEvent`, `WebhookEvent`
- [x] `PlatformSettings` + `CommissionDistanceTier` (admin distance bands by `Route.distanceKm`)
- [x] `OperatorLedgerEntry` (append-only) + `Refund`; settlement export + manual payout API
- [x] Pricing: 5% commission + 2.5% convenience fee (admin-configurable, distance tiers)
- [x] `PaymentService` + Paystack Initialize/Verify/Webhook; `BookingConfirmationService` (idempotent)
- [x] Checkout: Paystack popup with redirect fallback; resume payment from dashboard pending tab
- [x] Email receipt on confirmation; cancellation (cash/voucher) with ledger debit
- [x] `Company.paystackSubaccountCode` for v2 per-operator split at Initialize
- [x] `pricing-resolver.test.ts`; validate-paystack-split.mjs manual test script
- [x] Paystack test-mode split + refund validation (run script before v2 go-live)
- [x] Admin UI for commission tiers + settlement

### Saved Passengers + Per-Seat Booking (2026-07-04)

- [x] `SavedPassenger` model + `Booking.holdGroupId` / `savedPassengerId` (Prisma)
- [x] `passenger` tRPC: `listSaved`, `createSaved`, `updateSaved`, `deleteSaved`, `ensureProfile`
- [x] `createHold` per-seat passengers; confirm/release/payment group by `holdGroupId`
- [x] `/dashboard/passengers` — saved contacts CRUD UI + sidebar link
- [x] Checkout: per-seat saved passenger picker, apply-to-all, guest manual entry
- [x] Booking list/cards show per-seat passenger names for multi-seat groups
- [x] `hold-group.test.ts` + legacy phone-grouping fallback for old bookings

### Trip Manifest Segments + Scanner + Flicker Fix (2026-07-04)

- [x] `trip-segments.ts` — consecutive segment builder, overlap occupancy, per-segment seat status
- [x] Manifest drawer: per-segment occupancy bars + `SegmentSeatGrid` (compact read-only)
- [x] Trip cards show live `_count.bookings` passengers (not stale `trip.bookedSeats`)
- [x] `trips.list` includes booking count for dispatch cards
- [x] Manifest `useQuery` for `trips.get` — no flicker refetch loop
- [x] `TicketScanner` — stable DOM id, layout-effect timing, disabled while loading
- [x] 8 unit tests for segment overlap logic

### Operator Booking Operations — Phase 3.5 (2026-07-03)

- [x] `OperatorBookingService` + `operator.listBookings`, `getBooking`, `checkInBooking`
- [x] Company-scoped check-in with optional `tripId` guard; idempotent re-check-in
- [x] Manifest drawer: check-in stats, manual check-in, QR scanner
- [x] `/dashboard/operator/bookings` — Today / Upcoming / Past + search
- [x] `trips.get` booking segment includes (origin/destination stops)
- [x] `parse-ticket-token` + operator booking service unit tests

### Passenger Dashboard + QR Ticket Fix (2026-07-03)

- [x] Phone-based booking access + lazy claim (`normalize-phone`, `booking-read-service`)
- [x] `userId` attached on `confirmBooking` when logged in
- [x] `/dashboard/bookings` and `/dashboard/tickets` wired (upcoming / pending / past)
- [x] `PassengerTripCard`, `passenger-bookings-view`, `passenger-tickets-view`
- [x] Public ticket page `/tickets/[token]` + browser redirect from verify API
- [x] QR payload points to `/tickets/{token}` (not verify JSON URL)

### Passenger Booking Phase 2 (2026-07-03)

- [x] `TripSummaryCard` on book page
- [x] Multi-seat selection via `?passengers=` (1–6) search → checkout
- [x] `listMyBookings`, `getBooking`, `getTicket`, `getTicketByToken`
- [x] `DigitalTicketCard`, ticket detail view, verify API route
- [x] Payment abstraction: `Payment` model, `initiatePayment`, method selector, mock provider

### Passenger Booking Flow — Web MVP (2026-07-03)

- [x] `booking` tRPC: `getTripDetails`, `getSeatAvailability`, `createHold`, `confirmBooking`, `releaseHold`
- [x] Segment-aware seat availability (shared overlap logic with search)
- [x] `PassengerSeatMap` (grid matches Prisma seat model)
- [x] `/book/[offerId]` + success page; `OfferCard` links from search
- [x] Mock payment confirm flow; `segment-overlap` unit tests

### Operator Beta Hardening (2026-07-03)

- [x] Wave 1: Honest verification/status UI, Abidjan trip generator tests, schedule fare UX
- [x] Wave 1: Onboarding auth guard, Suspense hydration, back-nav confirm
- [x] Wave 2: Bank AES-256-GCM encryption, masked API, `revealBankAccount`, `BankAccessLog`
- [x] Wave 3: Schedule exceptions API + UI, atomic route waypoints, activity logging
- [x] Wave 4: Fleet filter/KPI, sidebar triggers, parallel terminal prefetches, `z.any()` cleanup (partial)

### Audit Remediation (Production Blockers)

- [x] Create **Seat Layout Builder** (drag-and-drop grid interface for defining custom seating)
- [x] Update **Add Vehicle Modal** to consume both platform and custom layout templates
- [x] Setup "Layouts" tab in Fleet view for operators to manage their configurations submit + terms persistence
- [x] Sprint 4: Suspense boundaries + staff RBAC + delete/ownership guards
- [x] Sprint 5: Route edit UI + `isTerminal` bookable terminal filter

---

## Domain Status

### Foundation — COMPLETE

- [x] Monorepo (Turbo + pnpm), shared packages (`@moja/ui`, `@moja/db`, `@moja/schemas`, `@moja/types`, `@moja/config`, `@moja/theme`)
- [x] Better Auth: email/password, Google, OTP verify, password reset, sessions
- [x] Web app shell (Next.js 16 App Router), operator + passenger dashboard layouts
- [x] Mobile app shell (Expo Router) — auth shell only
- [x] Context documentation (`context/*`, `memory.md`, workspace rules)

### Platform Data Layer — COMPLETE

- [x] 35 CI cities seeded (`City` model, hubs, regions)
- [x] Bus types + seat layout templates (platform defaults)
- [x] `CompanyLocation` terminals (`isTerminal`, `cityId` FK)
- [x] tRPC: `routes.cities`, `fleet.busTypes`, `fleet.layouts`, `routes.terminals`

### Operations Backend — COMPLETE

- [x] Trip generator (14-day rolling, calendar + exceptions, `TripStop` / `TripSeat`)
- [x] `ServiceCalendar` + `ServiceException` (holidays, cancel, extra service)
- [x] Fare matrix (segment, seat class, XOF, fare types)
- [x] `trips` API: list, get, assignBus, delay, cancel, updateStatus

### Search Domain — MOSTLY COMPLETE (web)

- [x] `search.search` tRPC + `SearchService` + `TripSearchReadRepository`
- [x] Segment-aware offers, filters (operators, amenities, time, max price), sort, pagination
- [x] **Web UI on `/`:** hero, form, city autocomplete, filters sidebar, results, `OfferCard` → book
- [x] nuqs URL state for search params
- [ ] Mobile search UI

### Fleet Domain — COMPLETE (core)

- [x] Bus CRUD, seat layout templates, seat map editor
- [x] `operator-fleet-view` — list, add bus, seat preview
- [x] Fleet analytics

### Routes & Schedules — COMPLETE (enterprise)

- [x] Route CRUD + waypoints + map preview
- [x] Schedule CRUD + calendar + fare matrix + exceptions UI
- [x] Preferred bus persistence, shared trip-window helper, rolling `generate-trips` cron
- [x] Safe CANCELLED exceptions (refund path for booked trips), EXTRA_SERVICE / MODIFIED generation
- [x] Retire vs hard-delete semantics, IAM-safe list load, list filters/pagination (nuqs)
- [x] `operator-routes-view`, composed `operator-schedules-view` + `components/schedules/*`
- [x] Route analytics

### Operator Portal — MOSTLY COMPLETE

- [x] Single-page onboarding (`/dashboard/operator/onboarding`) with durable step state
- [x] Dashboard shell: fleet, routes, schedules, trips, terminals, staff, settings, bookings
- [x] Dispatch board (`operator-trips-view`) — split components, nuqs filters/`scheduleId`/`manifest`, IAM-safe fleet load, Abidjan date grouping, bus-only assign, status graph (board/depart/arrive/delay/cancel), guest-aware trip cancel refunds
- [x] Bookings list — SQL pagination, nuqs filters, `operator.cancelBooking` + `bookings:update`, guest WALLET refund disabled
- [x] Staff management UI (`operator-staff-view`) — invite, roles, activity
- [x] Settings: company profile, documents, bank (encrypted), verification checklist
- [x] Terminals management (`operator-terminals-view`)
- [x] Revenue / analytics dashboard (KPIs, Charts, Ledger, Top Routes)
- [x] Admin verification queue UI
- [ ] Verification email notifications (beyond Resend staff invites)

### Booking Domain — MOSTLY COMPLETE (web)

- [x] Trip selection via search → `/book/[offerId]`
- [x] Seat selection UI (`PassengerSeatMap`, multi-seat 1–6)
- [x] Per-seat passenger details (saved passengers + manual guest)
- [x] Hold mechanism (10 min), double-booking prevention (transaction + overlap)
- [x] Seat status: AVAILABLE / HELD / SOLD / BLOCKED (segment-aware)
- [x] Booking confirmation + success page
- [x] Real payment integration via Paystack
- [x] Refunds

### Ticket System — COMPLETE (web)

- [x] Digital tickets with QR (`DigitalTicketCard`, `ticketToken`)
- [x] Public human-readable ticket `/tickets/[token]`
- [x] Operator check-in via QR scanner + manual button
- [x] Ticket verify API (JSON for scanners, HTML redirect for browsers)
- [ ] Offline ticket storage (mobile)

### Passenger Domain — COMPLETE

- [x] Saved passengers (`/dashboard/passengers`, max 20, self profile auto-seed)
- [x] Booking history (`/dashboard/bookings`)
- [x] Ticket wallet (`/dashboard/tickets`)
- [x] Phone-based ownership + lazy claim for guest bookings
- [x] Dashboard home stats (wired to real counts)
- [x] Profile / notification preferences
- [x] Digital wallet and top-ups

### Payment Domain — COMPLETE

- [x] `Payment` model + provider registry + `initiatePayment` / `assertHoldPaid`
- [x] Paystack primary provider integration (initialize, verify, webhook)
- [x] Refunds API mapping through Paystack
- [x] Checkout UI and payment state handling
- [x] BigInt DB migration and arithmetic safety
- [x] Wallet checkout, top-ups, and operator withdrawals

### Admin Domain — MOSTLY COMPLETE

- [x] Admin dashboard / verification queue
- [x] Company approve/reject workflow UI
- [x] Platform settings and commission configurations
- [x] User and settlement management
- [ ] Dispute resolution
- [x] Platform analytics

### Review Domain — COMPLETE

- [x] `Review` model is stub only (no rating/content fields in use)

### Notification Domain — COMPLETE

- [x] Integrated Novu `@novu/node` SDK for robust multi-channel orchestration.
- [x] Passenger notifications: Booking confirmed, payment failed, refund processed, trip canceled, trip delayed.
- [x] Operator notifications: Booking received, withdrawal requested, withdrawal processed, withdrawal failed.
- [x] Admin notifications: New company verification, treasury network failure, operator settlement pending.
- [x] HTML escaping on all dynamic payload attributes.
- [x] Resend email for auth OTP + staff invitations

### Mobile App — MINIMAL

- [x] Expo shell + auth flows
- [ ] Passenger search, booking, tickets
- [ ] Offline ticket access

---

## tRPC Router Inventory

| Router | Status | Notes |
|--------|--------|-------|
| `search` | Live | Trip discovery |
| `booking` | Live | Hold, pay, tickets, my bookings |
| `passenger` | Live | Saved passengers |
| `trips` | Live | Operator dispatch + manifest |
| `operator` | Live | Onboarding, company, verification, bookings |
| `fleet` | Live | Buses, layouts, types |
| `routes` | Live | Routes, cities, terminals |
| `schedules` | Live | Schedules, fares, exceptions |
| `staff` | Live | Team management |
| `terminals` | Live | Terminal CRUD |
| `locations` | Live | City details for search UI |
| `captures` | Live | Capture-link token lifecycle (public getInfo/submit/confirm + operator create/approve/reject) |
| `invitation` | Live | Staff invite accept flow |

---

## Decision Log (unchanged)

### Product
1. **Moja Ride** — CI intercity bus marketplace + operator ERP
2. Commission-based revenue; Mobile Money primary payment target
3. Apps: Passenger Web (live), Operator Portal (live), Mobile (shell), Admin (planned)
4. QR digital tickets with offline access goal on mobile

### Technical
1. Monorepo: Turbo + pnpm
2. Web: Next.js 16, tRPC, Prisma, PostgreSQL, Better Auth, Tailwind 4 + shadcn
3. Mobile: Expo SDK 56 + NativeWind
4. Segment occupancy derived from bookings — **not** `trip.bookedSeats`
5. Booking snapshots: `passengerName` / `passengerPhone` on each `Booking` row at hold time
6. Multi-seat holds grouped by `holdGroupId` (legacy: phone + trip + expiry)

### Deferred (v2+)
Agent app, driver app, multi-country, cargo, subscriptions, loyalty, public API

---

## Recommended Next Steps (priority order)

### 1. Booking ownership hardening
- Decide: keep silent phone lazy-claim vs explicit phone + OTP
- Document choice in `context/architecture.md`

### 2. Performance & hardening
- Redis cache for `search.search` (optional until traffic)
- E2E smoke test script for book → pay → ticket → operator check-in

### 3. Mobile passenger MVP
- Port search + booking flow to Expo (reuse tRPC client)
- Offline ticket storage

---

## Blockers & Risks

| Risk | Mitigation |
|------|------------|
| Payment gateway API complexity | Start with one provider; mock stays for dev |
| Seat race conditions | Already using DB transactions + overlap checks |
| Operator adoption | Admin verification + clear onboarding ROI |
| Stale progress docs | Update this file after each milestone |

---

## Success Criteria (MVP)

| Metric | Target | Current |
|--------|--------|---------|
| Operators onboarded | 5+ | Dev/staging only |
| Registered passengers | 100+ | Not tracked |
| Completed bookings | 100+ | Dev testing |
| Booking success rate | 90%+ | Not measured |
| Unit tests (web) | Green | 43 passing |

---

## How to Use This File

1. **Before starting work** — read Current Status + Recommended Next Steps
2. **After completing a feature** — add a dated milestone block at the top of Milestone Log
3. **Update domain checkboxes** when a whole area moves forward
4. **When blocked** — add to Blockers & Risks
5. **End of session** — run `/remember save` and sync this file

**Last updated:** 2026-08-05  
**Updated by:** Ivory Coast geo-capture — M3 public capture page (M2 backend capture-link before it)
