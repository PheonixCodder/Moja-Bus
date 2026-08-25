# 04 — Driver Trip Execution: Runs, Scanner, Shifts, Earnings, Offers Audit

> **Audit date:** 2026-08-22 · **Method:** full read of driver-facing procedures in `trpc/routers/drivers.ts`, cross-checked against `apps/driver-app` screens (trips/live/scanner/offers/earnings) read first-hand by the lead auditor. Every claim cites `file:line`.
> **Scope:** trips list & run lifecycle (start/complete/delay) · scanner + manifest + batch sync · shift ledger & earnings · driver-side offers · urgent dispatch feed.

---

## Flow traces

### 1. Trips list
`getMyTrips` (`drivers.ts:1047-1143`) — junction query through TripDriverAssignment; windows from server-local midnight: TODAY = departs today ∧ status ∈ {SCHEDULED, BOARDING, DEPARTED}; UPCOMING = >endOfDay ∧ SCHEDULED; COMPLETED = ARRIVED any date; ALL = no filter (**includes CANCELLED** — noted); serviceType filter real since P3-13 (:1087-1089). Payload `{assignmentId, role, trip(full include bus/company/tripStops+terminals), passengerCount}`; PRIMARY/RELIEF/CONDUCTOR all included; default limit 20.

### 2. Run lifecycle
- **startTrip** (:1422-1486): assignment exists (ANY role incl. RELIEF/CONDUCTOR, :1425-1437); trip status ∈ {SCHEDULED, BOARDING, DELAYED, DEPARTED} (:1450-1457 — DEPARTED = resume, preserves original actualDeparture); **no departure-window tolerance** (can start days early); `initialOdometerKm` accepted and dropped. Effects in tx: trip DEPARTED + actualDeparture; driver ON_TRIP + currentTripId. Response mints the HMAC dispatch token (:1484). Re-mint path `getTelemetryToken` :1492-1522 exists but has zero client callers (→ F-TM-06).
- **completeTrip** (:1524-1590): requires exactly DEPARTED (:1551-1559); tx sets ARRIVED + actualArrival, driver AVAILABLE + currentTripId null + totalTripsCompleted++; then `finalizeTripArrival` stamps booking.completedAt and fans out review requests (`trip-arrival.ts`). **Shift tripsCompleted counter never incremented anywhere** (dead column).
- **reportTripDelay** (:1592-1744): reason enum matches client set; minutes 1..600; statuses {SCHEDULED, BOARDING, DELAYED, DEPARTED}; anti-spam via prior DELAY anomaly ping within 5 min; writes synthetic anomaly ping + Novu `passenger-trip-delayed` per CONFIRMED booking w/ hour-granular transactionId. **Does NOT write Trip.delayMinutes nor status=DELAYED** → F-DV-09.
- **Stranding hole** → F-DV-04: only start/complete write currentTripId; operator-cancelled DEPARTED trips leave drivers ON_TRIP forever (completeTrip refuses non-DEPARTED; TODAY list drops the cancelled trip so the app can't even attempt completion); verification SUSPENDED blocks every call incl. completion/reporting.
- `broadcastTripAnnouncement` (:1746-1765): validated no-op echo — no persistence, no fan-out (stub).

### 3. Scanner / manifest / batch sync
- `checkInPassenger` (:1278-1352): exact durable-token lookup (:1281-1300); optional tripId mismatch → BAD_REQUEST but app never sends it (`scanner.tsx:86-88`); blocks CANCELLED/REFUND_PENDING/EXPIRED but allows **PENDING_PAYMENT**; idempotent alreadyBoarded response; atomic boardedAt/checkedInAt update. No URL unwrapping of the issued QR payload → **F-DV-02 = F-PS-03 launch blocker**. **No assignment/tenancy binding at all** → F-IN-01.
- `manualCheckInPassenger` (:1354-1395): booking∈trip guard only; **no status guard**.
- `batchSyncCheckIns` (:1397-1420): ≤200 items; no trip binding, no status guard, per-item swallow. **Zero client consumers** — offline scan queue remains unbuilt (roadmap).
- Manifest `getMyTripManifest` (:1192-1276): assignment check; CONFIRMED|COMPLETED bookings; insensitive search over name/phone/reference; boardedCount computed; payload **includes each passenger's durable ticketToken** (:1264).

### 4. Shifts & earnings
- `toggleShift` (:1767-1836): companyId fallback = `companyAffiliations[0]` with **unordered include** → nondeterministic for multi-affiliated drivers (:1777-1778); open path creates a shift WITHOUT closing/checking an existing open one → duplicate open ledgers possible (:1789-1796); close takes latest open shift **regardless of requested company** (:1806-1818); closing with nothing open still flips OFFLINE silently. Schema drift: `driverShiftToggleSchema` requires companyId, router re-declares it optional (schemas:189-194 vs drivers.ts:1769-1773). → F-DV-07.
- `getMyEarnings` (:1855-1896): last 30 shifts bound the "week" bucket (>30-shift weeks undercount); open shift pays 0 until closed; today/week = round(minutes × **hardcoded 50 XOF/min**) (:1888-1889) — placeholder math confirmed, no pay-rate model anywhere. Sunday-start week assumed. → F-DV-11.

### 5. Driver-side offers
`respondToOffer` (:2724-2865): ownership → lazy expiry → actionable-status checks; ACCEPT exclusive-conflict error built exactly as `EXCLUSIVE_CONFLICT_REQUIRED::<names|…>` (:2769-2787), client retries with confirmExclusiveSwitch (P0-4 FIXED verified both ends); `resolveAcceptance` terminates conflicting exclusives w/ EXCLUSIVE_ENDED events + displaced-company notices, upserts affiliation re-hire-safe, AFFILIATION_CREATED event, notifies hirer. COUNTER: salary 1k–10M int, ISO date parsed UTC-midnight, note ≤2000, rolling +7 d expiry (:2828-2838). DECLINE driver-only on PENDING/COUNTERED; WITHDRAWN operator-only. `markMyOffersSeen` firstViewedAt + VIEWED events (:2498-2530). Badge count = ACTIVE total from getMyOffers — whose silent EXPIRED sweep bypasses audit/notification (**F-OP-05/F-DV-13**).

### 6. Urgent dispatch feed
`getMyUrgentDispatches` (:2652-2721): PRIMARY/RELIEF only, SCHEDULED/DELAYED/BOARDING, unarchived, window [now−15 min, now+2 h], take 5 unordered. Payload includes pre-formatted fr-FR UTC departure string (client must parse localized text). Comment promises "unacknowledged" runs but **no ack storage exists server-side** — acking is purely AsyncStorage client-side; modal re-fires every poll within the window → F-DV-14.

## Findings

| ID | Sev | Finding | Evidence | Fix sketch |
|---|---|---|---|---|
| **F-DV-02 (= F-PS-03)** | **P1** | Passenger QR encodes `${APP_URL}/tickets/{token}`; scanner passes raw string; checkInPassenger exact-matches token → EVERY standard gate scan fails. Parser fix exists for operator-web only | booking-read-service.ts:472; scanner.tsx:77-89; drivers.ts:1281-1300 vs signed-access-tokens.ts:74-99 | Shared parseTicketToken in schema preprocess or procedure head |
| **F-DV-03 (= F-IN-01)** | **P1** | Check-in family lacks tenancy/status guards: no assignment check on any path; manual+batch skip status guards; PENDING_PAYMENT boardable via scan; manifest leaks durable ticketTokens usable against public ticket pages | drivers.ts:1278-1420, :1264 | Active TripDriverAssignment required; CONFIRMED-only (+grace); stop returning tokens |
| **F-DV-04** | **P1** | No owner for operational state outside start/complete: cancellation/replacement/suspension strand drivers ON_TRIP forever w/ currentTripId set; ghost buses persist in getLivePositions; suspended mid-run drivers can't even complete | :1472/:1574 only writers; completeTrip refuses non-DEPARTED :1551-1559; init.ts:286-291 | Clear currentTripId + force AVAILABLE/OFFLINE on cancel/reassign/suspend flows; SUSPENDED ⇒ read-only surface |
| F-DV-07 | P2 | Shift ledger company attribution nondeterministic (unordered affiliations[0]) + asymmetric open/close (double-open possible; close ignores company) | drivers.ts:1777-1818 | orderBy hiredAt desc; reject double-open; bind close to company |
| F-DV-09 | P2 | Driver-reported delay never persists to Trip row (no delayMinutes/status=DELAYED/departure shift) — dispatch boards, TODAY lists, traveler ETAs, urgent window all still show original time; delay lives only in an anomalyReason string | drivers.ts:1659-1737 vs schema.prisma:1585 | Write Trip updates mirroring operator formalization path |
| F-DV-11 | P3 | Earnings: hardcoded ×50 XOF/min; take:30 caps week bucket; open shift pays 0; Sunday-start assumed; no pay-rate model | drivers.ts:1855-1896 | SQL aggregates over unbounded windows; configurable rate |
| F-DV-13 | P3 | Lazy expiry sweeps diverge from audited cron path (silent updateMany, no events/notices) — audit-trail race | :2445-2452, :2873-2880 vs expireOfferIfDue:100-161 | Route sweeps through expireOfferIfDue semantics |
| F-DV-14 | P3 | Urgent-dispatch acknowledgement doesn't exist server-side (re-fires each poll); departureTime returned as pre-formatted fr-FR string forcing locale parsing | :2649-2721 | Ack column/table or lastDismissedAt; return ISO timestamp |
| F-DV-15 | P3 | Verification gate protects dispatch eligibility, not operation: PENDING/REJECTED drivers retain full runtime surface (shifts, runs, check-ins, delays); admin marketplace SUSPEND leaves app access intact — policy undocumented | init.ts:286-291; admin.ts:2991-3042 | Explicitly decide; minimum: block startTrip/toggleShift for non-VERIFIED |

Also noted (unassigned): odometer inputs accepted then discarded (schemas:269,275); broadcast stub; updateDriver lets operators overwrite status incl. SUSPENDED arbitrarily (:693); createDriver reactivation keeps stale terminatedAt (:631-638); getMyTrips ALL returns CANCELLED trips.

## Prior-findings scorecard (this domain)

| Prior ID | State |
|---|---|
| P0-1 identity threading | ✅ FIXED |
| P0-2 Complete Run wiring | ✅ FIXED (verified live.tsx ↔ completeTrip end-to-end) |
| P0-4 consent retry | ✅ FIXED |
| P3-12 delay-modal submission | ✅ FIXED (submits; but persistence gap F-DV-09 is new scope) |
| P3-13 dual-mode filter | ✅ FIXED |
| Offline scan queue (roadmap) | ❌ STILL ABSENT — batchSyncCheckIns unconsumed |

**Severity roll-up:** P1×3 · P2×2 · P3×4.
