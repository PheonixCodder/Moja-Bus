# 11 — Consolidated Findings Catalog (P0 → P3)

> **Audit date:** 2026-08-22 · Deduplicated across all six domain audits. Severity: **P0** = ship-blocker (system cannot deploy/work for new environments or core loop broken) · **P1** = fix before ANY public traffic · **P2** = fix before marketing push / first two weeks · **P3** = polish/backlog. Full evidence in the referenced domain file.
>
> **Totals: 1 × P0 · 10 × P1 · 31 × P2 · 51 × P3 = 93 unique findings** (six auditors produced 98 finding records; 5 were cross-domain duplicates of the same defect, deduplicated here — e.g. F-PS-03 ≡ F-DV-02 scanner QR mismatch, F-IN-01 ≡ F-DV-03 check-in binding).

---

## 🔴 P0 — Ship blocker (1)

| ID | Finding | Domain file | One-line fix |
|---|---|---|---|
| **F-DV-01** | Committed migration tree cannot reproduce the DB: baseline SQL creates enum values (`EN_ROUTE/ON_BREAK/IN_REVIEW`, `SHARED_CONTRACTOR/CASUAL`, license `A..E`) that schema+code never use, while the real values (`ON_DUTY/ON_TRIP/RESTING/EXPIRED`, `CONTRACTOR_URBAN/HYBRID`, `B..E`) appear in NO committed migration; five later migration dirs are untracked in git. Fresh `migrate deploy` rejects every ON_TRIP/ON_DUTY write and lacks service-preference/offer tables — entire driver backend dead on clean deploy | 03 | Commit untracked migrations + enum repair migration + CI drift check |

## 🟠 P1 — Before any public traffic (10)

| ID | Finding | Domain file |
|---|---|---|
| **F-PS-03 / F-DV-02** | Driver QR scanner cannot read issued tickets (QR = URL-wrapped token, server exact-matches raw token) → every gate scan fails; flagship driver flow broken end-to-end | 06 / 04 |
| **F-IN-01 / F-DV-03** | Check-in family has no trip-assignment/tenancy binding and skips status guards on 2 of 3 paths — any driver can board other companies' tickets; unpaid/cancelled boardable; manifest leaks durable ticket tokens | 09 / 04 |
| **F-PS-01** | `booking.verifyPayment` has no ownership assertion — reference holders can confirm someone else's hold AND reassign bookings to their own account | 06 |
| **F-PS-02** | PAYSTACK refund channel never calls Paystack, maps to "COMPLETED", invisible in admin OWED queue — passenger told refunded while card never credited | 06 |
| **F-DV-04** | No owner for driver operational state outside start/complete — cancelled/replaced/suspended runs strand drivers ON_TRIP forever w/ ghost buses in live positions; suspended drivers fully locked out mid-run | 04 |
| **F-TM-01 / F-IN-04** | WS gateway hosted by NO production artifact (Docker runs standalone Next) — prod is HTTP-only ingest; client reconnects futilely every 5 s all trip | 05 / 09 |
| **F-IN-05** | CI deploys master with zero tests/lint (typecheck-only gate; traveler-app excluded even from that); ~440 tests exist ungated; four suites not wired into any runner | 09 |
| **F-NF-01** | `passenger-trip-cancelled` payload violates own Zod schema → flagship cancellation notice dead in prod (row marked SENT anyway) | 08 |
| **F-NF-02** | Operator-initiated delay notification fails schema validation (driver variant works) — passengers never notified of operator delays; failure swallowed | 08 |
| **F-NF-03** | Subscriber split persists for 8 logged-in audiences (role-changed, suspended/restored, payout-resolved/failed, treasury-failure, acceptance-alert invitation-path, profile-updated, review-submitted) — security-critical in-app/push silently dropped | 08 |

## 🟡 P2 — Early-launch hardening (31)

| # | ID | Title | File |
|---|---|---|---|
| 1 | F-TM-02 | Operator fleet channel never published under enforcement | 05 |
| 2 | F-TM-03 / F-IN-03 | WS room subscription unauthorized — cross-tenant position disclosure | 05 |
| 3 | F-TM-04 | Offline ping queue wedges permanently >100 pings (server cap vs unbounded client flush) | 05 |
| 4 | F-TM-05 | Harsh-brake detection mathematically can't fire at 5 s cadence | 05 |
| 5 | F-TM-06 | Telemetry token re-mint endpoint dead; 24 h expiry ends telemetry silently | 05 |
| 6 | F-TM-11 | Driver HUD simulated motion claims "Live Telemetry Active"; adaptive intervals not implemented | 05 |
| 7 | F-IN-02 / F-OP-13 | updateDriver accepts terminated affiliations — cross-tenant platform-wide writes post-departure | 09 / 02 |
| 8 | F-IN-06 | Four test suites orphaned from runners (outbox, staff-hierarchy, authorize, roles) | 09 |
| 9 | F-OP-01 | "Live Fleet Map" is a simulated radar page promising real-time tracking | 02 |
| 10 | F-OP-02 | Operators cannot edit or offboard drivers (procedures exist, zero UI) — rosters immortal | 02 |
| 11 | F-OP-03 | License expiry never enforced/warned anywhere — lapsed licenses stay assignable | 02 / 03 |
| 12 | F-OP-04 | Roster hardcodes page 1/limit 50, no pager — >50-driver companies lose visibility | 02 |
| 13 | F-DV-05 | Registration drops employmentType+nationalId; device `file://` URIs stored as doc URLs; no driver upload purpose — self-registered drivers unverifiable | 03 |
| 14 | F-DV-06 | updateMyStatus ungated side door (mid-run RESTING/OFFLINE; ledgerless ON_DUTY) | 03 |
| 15 | F-DV-07 | Shift ledger nondeterministic company attribution; double-open shifts possible | 04 |
| 16 | F-DV-08 | Staff-invite surface can resurrect deleted DRIVER Operator rows | 03 |
| 17 | F-DV-09 | Driver-reported delay never persists to Trip row — boards/ETAs/urgent windows stale | 04 |
| 18 | F-DV-10 | Phone hygiene: +225 lock client-only; register overwrites canonical identity from unverified input; OTP logged; role client-writable | 03 |
| 19 | F-PS-04 | Traveler cancel dialog shows group-total as refund, cancels one seat (P2-12 unresolved on traveler) | 06 |
| 20 | F-PS-05 | Wallet top-up confirmation unreachable (meta.userId missing; correct procedure dead code) | 06 |
| 21 | F-PS-06 | Push deep-links route to nonexistent `/bookings/{ref}` — ticket-ready taps 404 | 06 |
| 22 | F-NF-08 | admin-bank-account-pending still registered with zero triggers and no documented ruling | 08 |
| 23 | F-PS-07 | Review-request email CTA links to nonexistent review route | 07 |
| 24 | F-PS-08 | Traveler review sheet sends implicit 5s — mass-inflates driver scores vs Phase-13 semantics | 07 |
| 25 | F-PS-09 | submitReview lacks completed-trip validation — future trips rateable via API | 07 |
| 26 | F-NF-04 | Shared idempotency keys drop offer/conflict fan-out to all but first operator per company | 08 |
| 27 | F-NF-05 | Push tap-routing dead on both apps (payload never forwarded as Expo data) | 08 |
| 28 | F-NF-06 | Push credential registration last-writer-wins — driver+traveler apps break each other | 08 |
| 29 | F-NF-07 | campaign-budget-exhausted true orphan (helper uncalled, hook console.logs) | 08 |
| 30 | F-NF-09 | Review/welcome/signup email CTAs 404 or hardcode hosts; missing locale prefixes | 08 |
| 31 | F-NF-10 | Hourly outbox cadence caps durability (~60 min worst-case latency incl. receipts/refunds/urgent) | 08 |

## 🟢 P3 — Polish / backlog (51)

**Operator/Admin (11)** — detail in 02: lazy-expiry sweeps bypass audit (F-OP-05) · sheet CTA ignores roster state (F-OP-06) · sent-offers Load-more replaces list (F-OP-07) · notification key collisions on equal counters + Date.now() keys (F-OP-08) · admin verification no permission/log/notification (F-OP-09) · public profile leaks suspended drivers' contacts (F-OP-10) · unassign allowed post-arrival (F-OP-11) · createDriver non-transactional/OR-match ambiguity (F-OP-12) · N+1 conflict queries + unordered takes (F-OP-14) · roster filter gaps incl. SUSPENDED (F-OP-15) · operator-added drivers arrive document-less (F-OP-16). *(F-OP-13 merged into P2 #7.)*

**Telemetry/Maps (12)** — detail in 05: HTTP jump-gate asymmetry (F-TM-07) · Redis write-only no TTL/GEOADD dead (F-TM-08) · silent mock downgrade + compose omits REDIS_URL (F-TM-09) · reconnect hammering (F-TM-10) · fleet view no map (F-TM-12) · no structured ingest logging / health consumer (F-TM-13) · accuracy gate drops instead of flags (F-TM-14) · latent bookingId wiring behind flag (F-TM-15) · Mapbox attribution disabled (F-TM-16) · eternal route cache + overview=full cost (F-TM-17) · reconcile edge cases (F-TM-18) · rnmapbox JS/native pin mismatch (F-TM-19).

**Driver execution & registration (5)** — detail in 03/04: earnings flat-rate/window bugs (F-DV-11) · license-expiry enforcement + dead EXPIRED states (F-DV-12) · urgent-dispatch ack doesn't exist server-side (F-DV-14) · verification gates dispatch not operation (F-DV-15) · lazy-offer-expiry sweeps bypass audit events (F-DV-13, same root as F-OP-05). *(Plus unassigned notes: odometer inputs discarded, broadcast stub, ALL-filter returns CANCELLED, stale terminatedAt on rehire.)*

**Passenger (7)** — detail in 06/07: booking COMPLETED never written / traveler review entry dead (F-PS-10) · guest capability dead at creation but paid for globally (F-PS-11) · webhook compare not timing-safe + top-up verify unbound (F-PS-13) · notices mostly post-commit best-effort (F-PS-14) · raw bearer token printed under QR (F-PS-15) · rebooking notifier console.log stub (F-PS-16) · hardcoded FR/EN literals on money/review moments (F-PS-12).

**Notifications (6)** — detail in 08: DEAD-retry grants one attempt (F-NF-11) · pause-reason key mismatch (F-NF-12) · marketplace Date.now() keys toggle-spam (F-NF-13) · conflict alert dies for email-less operators (F-NF-14) · in-app lists don't navigate on tap (F-NF-15) · OTP codes logged to stdout (F-NF-16). Plus missing-notification gaps: silent hold expiry, RESTORE/UNFEATURE unnegotified, roster removal unnegotified, refund-failure copy absent.

**Infra/Security (10)** — detail in 09: dual cron schedule sources/dead vercel.json (F-IN-07) · CSRF malformed-Origin INTERNAL (F-IN-08) · unrestricted image optimizer + no CSP (F-IN-09) · Caddy disables geolocation platform-wide (F-IN-10) · env drift TELEMETRY_TOKEN_SECRET/REDIS_URL/CHECKOUT_QUOTE_SECRET/traveler-Novu-var (F-IN-11) · queryRawUnsafe + dead var in reconcile (F-IN-12) · escrow alert dedupe broken + proration approximations (F-IN-13) · artifact residue count-issues-output.txt etc. (F-IN-14) · in-memory rate-limit store single-instance assumption (F-IN-15) · localhost/exp:// permanently trusted origins (F-IN-16).

---

## Prior-audit (40-finding) disposition summary

| Verdict | Count | Notes |
|---|---|---|
| ✅ Verified FIXED with evidence | 24 | All 5 prior P0s + most P1/P2 remediation items (see per-file scorecards) |
| 🟡 PARTIAL | 5 | P2-12 traveler side, P3-1 sheet side, P3-2 list sweeps, P2-7 cadence, P2-14 dummy-token still substituted |
| ❌ Still open / regressed | 3 | P1-5 WS hosting (F-TM-01), P1-3 partially regressed via updateDriver (F-IN-02), offline scan queue roadmap item |
| ⚠️ Open by documented design | 2 | P2-10 fanout single-instance, admin-bank-account-pending (ruling now tracked as F-NF-08) |
