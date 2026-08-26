# 03 — Verification & Approval (admin hub + operator path)

> Audit date: 2026-08-26 · Sources: `admin.ts:2817-3526`, `admin-driver-verifications-view.tsx`, `driver-verification-dialog.tsx`, `dashboard-driver-marketplace.tsx`, operator twin in `drivers.verifyDriver`.

## 1. Two verification actors, one platform gate

| | Operator (`drivers.verifyDriver`) | Admin (`admin.verifyDriver`) |
|---|---|---|
| Scope guard | driver on requester's ACTIVE roster (P1-3 IDOR fix) | any profile (platform-wide) |
| IAM | `drivers:verify` (operator catalog) | `drivers:verify.manage` + page gated by `drivers:verify.read` (Phase 25 F-OP-09; ADMIN role template seeded) |
| Actions | VERIFIED / REJECTED (+ reason); enum also allows SUSPENDED but no operator UI sends it | APPROVE / REJECT (reason REQUIRED in UI, defaulted server-side "Document compliance requirements not met.") / SUSPEND |
| Run-state handling | SUSPEND/REJECT tear down via `suspendDriverOperationalState`; restore→AVAILABLE only if not mid-run | APPROVE keeps mid-run status (never stomps a live run); REJECT/SUSPEND converge run state atomically |
| Audit | — (no activity log row on operator path!) | `DRIVER_VERIFY_{ACTION}` adminStaffActivityLog INSIDE the tx with metadata+targetUserId |
| Driver notice | none from this procedure | durable outbox `DRIVER_VERIFICATION_OUTCOME` in-tx (the dialog always claimed "Displayed to Driver" — now true) |

Both paths refuse APPROVE/VERIFIED with ZERO compliance documents (`PRECONDITION_FAILED`; F-OP-16). Both flip per-company affiliation `isVerified` (operator path does; admin flip is profile-level only).

## 2. Admin Verification Hub UX (`/dashboard/admin/drivers/verifications`)

- KPI strip of three clickable cards → sets the filter: Pending Review / Verified Active / Rejected-Incomplete (counts from server).
- Filters: search (name/phone/email/licence), status ALL/PENDING/VERIFIED/REJECTED/SUSPENDED, licence class. Fixed limit 50 / offset 0 (no pagination UI — see gaps).
- Table: driver avatar+name+phone, licence number+class badge, first carrier affiliation ("Independent Pool" when none), experience yrs, status badge, submitted date, **Review Dossier** button.
- Dossier dialog (`DriverVerificationDialog`): demographics header (avatar/name/phone/email/class/experience), licence number + expiry card, carrier card (first affiliation + employmentType fallback CONTRACTOR_URBAN), **Submitted Documents grid rendering presigned license front/back images** (https-only render guard; legacy `file://` URIs show "Legacy device URI — ask the driver to re-upload"; missing shows placeholder). NOTE: the medical doc URL is presigned and counts for the approve-gate but has NO preview tile in the dialog.
- Footer actions: Suspend Driver (amber) · Reject Application → inline reason form ("Displayed to Driver") → Confirm Rejection · Approve Driver License (emerald; disabled until ≥1 doc present client-side mirroring F-OP-16).

## 3. Downstream effects of an approval

`verificationStatus=VERIFIED` unlocks: shift start (`toggleShift` gate), trip start (`startTrip` gate), dispatch eligibility (`listAssignableDrivers` filters VERIFIED), marketplace listing potential (once driver toggles availability), urgent-dispatch feed. `verifiedAt`/`verifiedById → User("DriverVerifiedBy")` recorded. Nightly `expire-driver-licenses` cron later flips VERIFIED→EXPIRED when `licenseExpiryDate` passes, with month-bucketed 30-day warning notices.

## 4. Marketplace moderation (same admin area, `/dashboard/admin/drivers/marketplace`)

- Health strip via `getMarketplaceHealth`: verified/available/pending/employed/featured(+cap)/suspended counters, offer funnel by status (groupBy), avg time-to-hire hours + avg first-response hours ($queryRawUnsafe parameterized), counter-rate %.
- Drivers tab: `listMarketplaceAdminDrivers` (VERIFIED only; filters AVAILABLE/FEATURED/SUSPENDED/OFF_MARKET + search; includes suspended/off-market unlike operator view; activeAffiliation count; trustBadges). Row actions FEATURE (cap MAX_FEATURED_DRIVERS enforced server-side w/ count check) / UNFEATURE / SUSPEND (reason mandatory at schema level) / RESTORE via `setDriverMarketplaceStatus`; each writes `MARKETPLACE_*` activity log; FEATURE/SUSPEND notify the driver through the outbox; SUSPEND releases the featured slot.
- Offers tab: `listAllOffers` audit browser — filter by status/search company or driver, negotiation timeline (last 10 events with actorType/salary/note/timestamps), live flag.

## 5. Gaps

1. **No pagination** on the verifications queue (limit 50 hard-coded, offset never advanced) — silent truncation past 50 pending.
2. Medical document has no preview tile despite being gate-relevant.
3. Operator verify path writes no activity log (asymmetry with admin path).
4. No bulk approve/reject; no assignment queue (who-reviewes-what).
5. No re-verification workflow after EXPIRED (cron flips status; a human must find the row and re-approve after doc refresh — no reminder loop to operators).
6. Approve button disabled-state uses presigned URLs presence — correct proxy, but a legacy http URL would pass the client gate while being unverifiable imagery.
