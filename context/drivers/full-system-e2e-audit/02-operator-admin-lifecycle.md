# 02 — Operator + Admin Driver Lifecycle Audit

> **Audit date:** 2026-08-22 · **Method:** full read of `trpc/routers/drivers.ts` (3,150 lines), `lib/driver-assignment.ts`, assignment/verification regions of `trips.ts` + `admin.ts`, all operator drivers/marketplace/offers views & components, admin verification-hub + marketplace-control views, driver-related migrations, notification outbox helpers. Every claim cites `file:line`.
> **Scope:** recruitment (operator-added path), roster management, verification, marketplace discovery, availability signals, offer board (send/negotiate/expire), trip assignment + conflict engine, admin Phase-14 controls, per-event notifications.

---

## Flow traces

### T1. Operator recruits a driver (`createDriver` + binding confirm + credential handoff)

1. `operator-drivers-view.tsx:100-105` shows "Onboard Driver" gated by `canCreate||canUpdate` (from `drivers.getPermissions`, `drivers.ts:289-298`). Modal collects fullName, phone, email, badgeNumber, licenseNumber, licenseCategory (default D), yearsOfExperience (default 3), licenseExpiryDate (default +365 d), employmentType, notes (`add-driver-modal.tsx:64-78, 201-351`). Document URLs are schema-supported but **not collected** by this modal (→ F-OP-16).
2. Server dedupes `User` by lowercased email OR exact phone, including active affiliations (`drivers.ts:516-533`). On hit with falsy `confirmBinding` → CONFLICT `EXISTING_USER_BINDING_REQUIRED::<maskedName>|<maskedPhone>|<maskedEmail>|<hasProfile>` (`drivers.ts:535-546`).
3. Client parses the error string into a confirmation dialog showing the masked identity (`add-driver-modal.tsx:92-106, 357-407`) and resubmits with `confirmBinding:true` (`:112-119`). No silent stranger-binding path remains.
4. New accounts get `role:"DRIVER"` placeholder users (`drivers.ts:554-562`) — ERP gates test OPERATOR/ADMIN so no staff access. **No Operator row is created** (`drivers.ts:641-643`; migration `phase17_driver_operator_cleanup` soft-deletes legacy rows and re-roles placeholders; `company-recipients.ts:16-19` excludes `role != DRIVER` from fan-out; invite-sheet `INVITABLE_ROLES` omits DRIVER). Remediation 17.3 verified FIXED end-to-end.
5. License uniqueness enforced pre-create (`drivers.ts:585-595`) + DB unique constraint. Affiliation upserted re-hire-safe (resets `isVerified:false`) `drivers.ts:615-639`.
6. Success renders a handoff step: phone-OTP login instructions for the driver's number with Share/Copy (`add-driver-modal.tsx:121-144, 159-191`) plus `accountCreated` vs "linked to existing account" copy. Response also returns `existingCompanies` (`drivers.ts:645-655`) though the modal never renders it.

### T2. Roster management

`listDrivers` (`drivers.ts:300-415`): WHERE = active affiliation to `ctx.companyId` (+ employmentType), optional status / verificationStatus / licenseCategory filters, insensitive OR-search over name/email/phone/licenseNumber; createdAt desc; skip/take pagination (default 50, max 100); returns `total/totalPages` AND server-side `groupBy` KPI aggregates under the SAME where (**P3-4 FIXED**, `:386-405`). `getDriver` requires any affiliation with the requesting company and scopes returned affiliations + shifts to `ctx.companyId` (**P2-9 FIXED**, `:422-506`). HYBRID labels render correctly in roster (`operator-drivers-view.tsx:267-271`) and passport (`driver-detail-view.tsx:135-139`) — **P3-3 FIXED**.

### T3. Verification

Operator `verifyDriver` requires `drivers:verify` + an **active** affiliation else FORBIDDEN (**P1-3 FIXED**, `drivers.ts:727-749`); flips platform-wide verification fields (`:751-761`) and syncs `isVerified` on own-company affiliations (`:763-771`). Admin path: `admin.verifyDriver` APPROVE→VERIFIED+AVAILABLE, REJECT→REJECTED+OFFLINE, SUSPEND→SUSPENDED+SUSPENDED (`admin.ts:2872-2916`) behind bare `adminProcedure` — no permission key, no audit row, no driver notification (→ F-OP-09).

### T4. Marketplace discovery

`listMarketplaceDrivers` (`drivers.ts:2057-2167`): WHERE `VERIFIED` AND `servicePreference.{isAvailableForHire:true, isSuspended:false}` + optional preferredType equality + cityBase contains-insensitive + NOT(own active EXCLUSIVE_INTERCITY affiliation) + licenseCategory equality + rating/safety minimums; ORDER BY featured desc → averageRating desc → totalTripsCompleted desc; max 50/page. **Salary privacy holds**: `minMonthlyRateCFA` absent from every operator-facing select (`:2019-2028, 2127-2135`); returned only to the driver themself (`:1968-1973`) and admins (`admin.ts:3126`). Own-roster detection computed server-side with raw affiliation rows stripped (`:2137-2155`); card disables Send Offer ("On Your Roster", `marketplace-driver-card.tsx:126, 267-278`) — **P3-1 FIXED at card level** (sheet-level gap → F-OP-06). Trust badges computed-on-read: TOP_RATED (≥4.8 ∧ ≥10 reviews), SAFE_DRIVER (score ≥95), VETERAN (≥500 trips) (`driver-scoring.ts:84-106`). Availability signals (`isAvailableForHire/preferredType/cityBase/routeExperience`) surface as display chips only — **no route↔trip matching engine exists anywhere** (grep confirms display-only usage).

### T5. Offer board

Send: `sendEmploymentOffer` (`drivers.ts:2278-2438`) inside an interactive transaction — VERIFIED check (`:2302`), hireable+suspended checks (`:2310`), active-affiliation rejection (`:2317-2331`), caps 25 sent / 20 received (`schemas/drivers.ts:353-354`, checks `:2347-2359`); creates offer + SENT event + outbox `driver-offer-received`; P2002 from partial unique index mapped to friendly CONFLICT (`:2424-2435`). Respond (driver): `respondToOffer` (`:2724-2865`) — lazy expiry first (`expireOfferIfDue :100-161` writes EXPIRED event + both-side notifications); ACCEPT enforces one-active-exclusive via `EXCLUSIVE_CONFLICT_REQUIRED::<names|…>` unless `confirmExclusiveSwitch` (`:2771-2787`); `resolveAcceptance` (`:169-286`) auto-terminates conflicting exclusives with EXCLUSIVE_ENDED events + `driver-affiliation-ended` notifications to displaced companies, upserts the affiliation re-hire-safe, writes AFFILIATION_CREATED, notifies hiring company. DECLINE and COUNTER symmetric; counter refreshes rolling 7-day expiry (`:2836`); operator mirror `respondToCounterOffer` ACCEPT_COUNTER/DECLINE_COUNTER/COUNTER_BACK (`:2941-3086`). Withdraw (`:3089-3149`), markSeen (`firstViewedAt` + VIEWED events `:2498-2530`), Seen chips (`operator-sent-offers-view.tsx:345-350`), <24 h red countdown. Cron `api/cron/expire-offers`: claim-style guard + authoritative EXPIRED event + both-side outbox notices + 24 h expiring-soon lookahead, cron-auth gated.

### T6. Trip assignment

`assignDriver` (`trips.ts:1476-1776`): requires `trips:update`; trip owned+unarchived; status ∈ SCHEDULED/DELAYED/BOARDING (`:1517`); driver on active roster (`:1540`) and VERIFIED (`:1553`); license gate B<C<D<E vs `BusType.requiredLicenseCategory` (`:1560-1567`); duplicate-role guard; transaction locks trip row then driver row `FOR UPDATE` (`:1585-1590`), same order in unassign (`:1841-1846`); replace-consent errors `PRIMARY_ASSIGNED::<name>` / `RELIEF_ASSIGNED::<name>` consumed by `driver-assignment-rows.tsx:82-101` which retries with `replacePrimary:true` after confirm; conflict engine `getDriverTripConflict` runs inside the tx — ±16 h scan window, 45-min turnaround buffer, intervals from stored `estimatedArrival` → distance/35 kmh → static fallbacks 480/120 min (`driver-assignment.ts:21-40, 73-74`); DB backstops = partial unique indexes `trip_driver_assignment_one_primary_per_trip` / `_one_relief_per_trip` (phase-18 migration incl. historical-dup repair) turning residual races into clean P2002 CONFLICT (`trips.ts:1686-1721`); notifies assigned driver (urgent variant ≤2 h) and displaced driver. `unassignDriver` blocks DEPARTED only (`:1810-1815` → F-OP-11), syncs Trip columns null. CONDUCTOR junction-only supported. `listAssignableDrivers` (`drivers.ts:2541-2646`) returns per-driver `licenseOk/conflict/rolesOnTrip`; combobox disables ineligible entries with reasons. Delay: shifts departure/arrival/stops then re-checks each PRIMARY/RELIEF assignment and enqueues `operator-driver-assignment-conflict` throttled per trip+conflict+UTC-day (`trips.ts:979-1029`, `dispatch.ts:125-167`) — **P3-5 FIXED**. Urgent feed `getMyUrgentDispatches` (`drivers.ts:2652-2721`): PRIMARY/RELIEF only (CONDUCTOR excluded), SCHEDULED/DELAYED/BOARDING, window [now−15 min, now+2 h], take 5.

### T7. Admin Phase-14 controls

`setDriverMarketplaceStatus` (`admin.ts:2968-3081`): `requireAdminPermission("marketplace:manage")`; FEATURE cap 20 counting non-suspended (`:3000-3008`), SUSPEND mandatory reason (superRefine `schemas/drivers.ts:465-473`) and frees the featured slot (`:3029-3032`), RESTORE guarded; activity log entry with reason+metadata (`:3052-3060`); FEATURE/SUSPEND notify the driver through the durable outbox. Health funnel `getMarketplaceHealth` (`:3177-3251`) rendered with cap badge + funnel strip (`admin-marketplace-view.tsx:349-414`). Offers audit browser `listAllOffers` (`:3256-3329`) with expandable negotiation timelines. Sidebar gating: verifications ungated, marketplace behind `marketplace:read` (`admin-sidebar.tsx:256-265`).

---

## Verified-working strengths

- **P1-3 FIXED** — cross-company verifyDriver → FORBIDDEN (`drivers.ts:735-749`).
- **P1-7 FIXED** — binding-confirm protocol end-to-end; masked identity; explicit opt-in only.
- **17.3 FIXED** — zero Operator rows for roster drivers; `UserRole.DRIVER` + two-step migration; recipient helper excludes DRIVER; invite UI drops DRIVER role.
- **P2-9 / P3-3 / P3-4 FIXED** — company-scoped passport, HYBRID labels, server-aggregated KPI strip.
- **18.3 FIXED** — ordered FOR UPDATE locks on both mutations + partial unique indexes (with data-repair migration) as authoritative backstop; P2002 surfaced as actionable message.
- **P3-5 FIXED** — delay-shifted departures re-validate assignments w/ day-throttled operator alerts.
- **P3-6 FIXED** — bus-assigned notices ride the outbox keyed by user.id.
- Salary privacy provably holds everywhere operator-facing; rolling expiry / Seen chips / expiry-window mechanics coherent; all 18 driver/marketplace/dispatch workflow IDs referenced by the outbox exist and are registered.
- Marketplace pages server-prefetched (SSR) with URL-synced filters and accumulate-style load-more on the grid.

## Findings

| ID | Sev | Finding | Evidence | Fix sketch |
|---|---|---|---|---|
| **F-OP-01** | **P2** | "Live Fleet Map" is a simulated radar, not a map: CSS radial-dot grid + animated ping circle + lat/lng text; no tile library in the file — while page metadata promises "Real-time live map tracking". Data wiring real (10 s poll of getLivePositions). | operator-fleet-map-view.tsx:137-223; drivers/map/page.tsx:8-11; operator-drivers-view.tsx:93-98 | Embed a real map w/ driver markers or relabel page until one ships |
| **F-OP-02** | **P2** | Operators cannot edit or offboard drivers: `updateDriver`/`deleteDriverAffiliation` have ZERO UI consumers; detail view read-only. Departed drivers stay on active roster forever — keep appearing in listAssignableDrivers, keep receiving scoped data | grep: only verifyDriver consumed; drivers.ts:658-725, 776-795 | Add Edit + Remove actions on passport page (permission-gated) + affiliation-ended notification |
| **F-OP-03** | **P2** | License expiry NEVER enforced or warned: assignDriver gates only VERIFIED, never reads licenseExpiryDate; verifyDriver likewise; no cron touches it. A lapsed-license driver remains assignable + urgent-dispatchable despite the verify dialog's own checklist claiming otherwise | trips.ts:1553-1567; drivers.ts:751-761; verify-driver-dialog.tsx:79 | Add `licenseExpiryDate > now` to assign gate + licenseOk; roster/passport expiry badges; nightly cron flip |
| **F-OP-04** | **P2** | Roster hardcodes page 1 / limit 50, no pager UI despite server support → companies with >50 drivers silently lose visibility of rows 51+, incl. pending-verifications | operator-drivers-view.tsx:59-67; drivers.ts:407-414 | Reuse marketplace load-more pattern |
| F-OP-05 | P3 | *(prior P3-2 partially fixed)* Bulk lazy-expiry sweeps in `getMyOffers`/`listSentOffers` flip due offers to EXPIRED via bare updateMany — no audit event, no notification; first sweep wins and mutes the offer forever | drivers.ts:2445-2452, 2873-2880 vs expireOfferIfDue:100-161 | Route both sweeps through expireOfferIfDue |
| F-OP-06 | P3 | *(prior P3-1 residual)* Public-profile-sheet Send Offer CTA always enabled; getPublicDriverProfile doesn't return isOnMyRoster; card-only disable | driver-public-profile-sheet.tsx:336-348; drivers.ts:1985-2030 | Extend response + mirror disabled state |
| F-OP-07 | P3 | Sent-offers "Load more" REPLACES the list instead of appending — first 20 offers vanish | operator-sent-offers-view.tsx:237, 500-518 | Accumulate-pages pattern |
| F-OP-08 | P3 | Offer-notification idempotency keys can collide: counter keys use salaryCFA only → equal-amount re-counter dropped silently (the exact multi-round scenario); marketplace keys use Date.now() → zero replay protection | outbox/driver-offers.ts:63,100; marketplace-admin.ts:11,29 | Include round number/event id in keys |
| F-OP-09 | P3 | Admin driver verification: bare adminProcedure (no permission key), no activity log, no driver notification on approve/reject (dialog claims reason "Displayed to Driver" but nothing pushes it) | init.ts:205-233; admin.ts:2872-2916; driver-verification-dialog.tsx:226 | Admin permission key + activity log + outbox workflow |
| F-OP-10 | P3 | `getPublicDriverProfile` gates only on VERIFIED — suspended/off-market drivers remain fully contactable (name+phone+history) to any operator holding an id | drivers.ts:1985-2030 | Require isAvailableForHire ∧ ¬isSuspended, or redact |
| F-OP-11 | P3 | unassignDriver blocked only post-DEPARTURE — ARRIVED/CANCELLED runs can be rewritten after the fact (manifest attribution/history) | trips.ts:1810-1815 | Match assignDriver's allowed-status set |
| F-OP-12 | P3 | createDriver not transactional (orphan role-DRIVER user on mid-failure); OR-match can hit user A by phone while email belongs to user B — confirm dialog shows only one identity | drivers.ts:554-639, 516-521 | $transaction; consistent match field(s) |
| F-OP-13 | P3 | getDriver/updateDriver accept TERMINATED affiliations while verify requires active — ex-affiliation operators retain platform-wide write access (license/status/SUSPEND) to shared drivers | drivers.ts:422-428, 663-668 vs 735-741 | Require active affiliation for updateDriver |
| F-OP-14 | P3 | Hot-path hygiene: N+1 conflict query per roster driver per combobox open; candidate scan take:50 unordered; urgent feed take:5 unordered → nondeterministic results possible | drivers.ts:2607-2634, 2659-2669; driver-assignment.ts:115 | Batch-compute overlaps; deterministic orderBy |
| F-OP-15 | P3 | Roster filter gaps: SUSPENDED missing from status dropdown; verificationStatus/employmentType filters unexposed; `canAssign` advertises drivers:assign while assignDriver enforces trips:update (catalog drift) | operator-drivers-view.tsx:164-171; drivers.ts:296 vs trips.ts:1479 | Expose filters; align key semantics |
| F-OP-16 | P3 | Operator-added drivers arrive with NO verification documents (modal collects none) → operator self-verification is a rubber stamp; admin dossier renders empty-photo placeholders | add-driver-modal.tsx:201-351; driver-verification-dialog.tsx:184-217 | Surface document upload in modal, or block VERIFY until docs exist |

---

## Prior-findings scorecard (this domain)

| Prior ID | State |
|---|---|
| P1-3 verifyDriver IDOR | ✅ FIXED |
| P1-7 credential handoff + silent binding | ✅ FIXED (D3 guided handoff shipped) |
| P2-1 / 17.3 DRIVER over-provisioning | ✅ FIXED end-to-end |
| P2-8 / 18.3 assignment race safety | ✅ FIXED (locks + partial unique indexes + repair migration) |
| P2-9 passport scoping | ✅ FIXED |
| P3-1 own-roster CTA | 🟡 PARTIAL (card yes, sheet no — F-OP-06) |
| P3-2 lazy-expiry parity | 🟡 PARTIAL (cron+lazy path yes, list sweeps no — F-OP-05) |
| P3-3 HYBRID labels · P3-4 KPI aggregates | ✅ FIXED |
| P3-5 delay revalidation · P3-6 bus-assigned outbox | ✅ FIXED |

**Severity roll-up:** P2×4 · P3×12.
