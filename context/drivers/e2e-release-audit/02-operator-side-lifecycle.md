# 02 — Operator-Side Lifecycle Audit

> Recruitment ×2 → Offer Board → Affiliation → Roster → Dispatch Assignment → Admin Controls

---

## Flow 1 — Marketplace Discovery — **WIRED**

- `listMarketplaceDrivers` (`drivers.ts:1637-1724`): VERIFIED + `isAvailableForHire` + `!isSuspended` only; excludes drivers exclusively affiliated with the requesting company; featured-first then rating/trips ordering.
- Filters: licenseCategory, preferredType, cityBase (contains-insensitive vs `CIV_CITY_HUBS`), minRating, minSafetyScore — all nuqs URL-persisted (`operator-marketplace-view.tsx:35-41`).
- Card grid server-prefetched (page limit 18); load-more accumulation; contextual empty state.
- Public profile sheet via `getPublicDriverProfile` (`drivers.ts:1559-1626`): full affiliation history, contact, routes — **salary provably excluded** from both operator queries (`drivers.ts:1606,1704`).
- Trust badges (Top Rated / Safe Driver / Veteran) computed-on-read and rendered on card + sheet.

## Flow 2 — Offer Board — **WIRED** (one P0 dead-end on the driver side)

- Send: `sendEmploymentOffer` (`drivers.ts:1836-1997`) inside a serializable transaction — VERIFIED check, availability check, no-active-affiliation guard, caps (25 sent/company, 20 received/driver), DB partial unique index backstop with P2002→CONFLICT mapping.
- Negotiation: unlimited symmetric rounds; every counter refreshes the rolling 7-day expiry; append-only `DriverOfferEvent` audit rows for SENT/VIEWED/COUNTERED_*/ACCEPTED/DECLINED/WITHDRAWN/EXPIRED/AFFILIATION_CREATED/EXCLUSIVE_ENDED.
- Acceptance: `resolveAcceptance` (`drivers.ts:150-232`) auto-terminates conflicting exclusive affiliations (+SYSTEM audit event + notification to each displaced company), upserts the affiliation re-hire-safe, notifies the hiring company's operators.
- Operator dashboard `/dashboard/operator/drivers/offers`: status tabs, salary evolution display, Seen chips (from driver-side `markMyOffersSeen`), counter actions incl. inline Counter-Back form, withdraw.
- ⚠️ Dead-end: see P0-4 in [08-findings](08-findings-catalog-p0-p3.md) — mobile consent retry missing.

## Flow 3 — Operator-Added Drivers (second recruitment path) — **PARTIAL / HAZARDOUS**

- `add-driver-modal.tsx` collects: full name, phone, email, badge number, license number/category/expiry, employment model, notes → `createDriver` (`drivers.ts:424-539`).
- Server behavior: dedupe by email OR phone against existing Users (**silent account binding hazard**, P2), license-number conflict guard, DriverProfile created `verificationStatus: PENDING`, affiliation upserted active, an `Operator` row with role DRIVER is auto-created granting staff powers.
- **No credential handoff exists**: no password, magic link, SMS invite, or code is issued or displayed. A real driver added this way cannot log into the app unless they self-register with the same phone (OTP lands them inside the operator-created account).
- Self-registration path (wizard) is fully functional — see [03-driver-registration-auth.md](03-driver-registration-auth.md).

## Flow 4 — Roster Management & Verification — **WIRED** (one IDOR)

- Roster list filters by active affiliation w/ company scope; KPI strip computed client-side from the loaded page (P3: disagrees with server total beyond 50 rows).
- `verifyDriver` lets operators approve/reject/suspend their own drivers' compliance — but takes a bare `input.id` with **no company-scope check** (P1 cross-tenant IDOR: any operator with `drivers:verify` can flip any platform driver's verification, which gates marketplace visibility and dispatch eligibility everywhere).
- Detail passport shows career stats, credentials, reviews, Insights tab (Phase 13 charts). ⚠️ Header reads affiliations `[0]` unfiltered — urban contractors show another company's badge number/hire date (P2).

## Flow 5 — Trip Assignment (Dispatch Board) — **WIRED**

- Trip-card expanded section hosts bus Combobox + three role rows (Driver/Relief/Conductor) via `DriverAssignmentRows`.
- `trips.assignDriver` guards: trip status ∈ {SCHEDULED, DELAYED, BOARDING}; affiliation + VERIFIED checks; license gate vs `BusType.requiredLicenseCategory` (CI ordering B<C<D<E); same-trip duplicate-role guard; cross-company double-booking engine (45-min turnaround buffer, interval overlap using stored `estimatedArrival` with service-type fallbacks); replace-primary requires explicit consent (client confirm + `replacePrimary` flag + parseable race backstop); displaced driver notified.
- `unassignDriver` blocked post-departure; junction + Trip column kept in sync transactionally.
- Eligibility combobox lists ineligible drivers greyed **with reasons** (license mismatch / already booked / on this trip) via `listAssignableDrivers`.

## Flow 6 — Cross-Affiliation Timing Conflicts — **WIRED** (edge cases noted)

- Engine scans ALL companies (urban contractors multi-affiliate) within ±16h windows, applies the turnaround buffer symmetrically, excludes cancelled/archived/self.
- Edge cases: fallback durations (480/120 min) diverge from fare-derived durations stored at trip creation; candidate scan capped at 50 rows; delay shifts departureDate without revalidating existing assignments (P3).

## Flow 7 — Route Availability Signals — **PARTIAL (display-only)**

- Drivers declare free-text `routeExperience` (≤20 strings) + `cityBase`; operators see chips on cards/sheet and can filter by city hub.
- **No matching engine exists**: nothing joins route terminal cities to declared routes, no scoring boost, no offer-time hint. Matching is entirely human.

## Flow 8 — Notifications to Operators — **WIRED** (one over-inclusion bug)

- Recipients resolved via `companyRecipients` (all active Operators of the company) — but because operator-added drivers get auto-created Operator rows, **rostered drivers also receive company notifications** (P2 spam/disclosure).
- Workflows: operator-offer-countered/accepted/declined/expiring-soon/expired, driver-affiliation-ended — all Outbox-delivered, French-first, deep-linked.
- Seen chips work end-to-end (driver open → firstViewedAt + VIEWED audit → hasBeenSeen chip while live).
- ⚠️ `operator-bus-assigned` (assignBus) is the lone direct `novu.trigger` bypassing outbox guarantees (P3).

## Verified-Working Highlights

Marketplace privacy · anti-spam caps + DB backstop · rolling expiry + claim-guard cron · exclusive-conflict semantics with displaced-company notices · cross-company timing engine · license gate · replace-primary protocol · status guards · permission gating consistency · Seen chips · trust badges · outbox delivery guarantees.
