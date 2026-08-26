# 04 — Operator Roster: Adding, Editing, Verifying, Offboarding Drivers

> Audit date: 2026-08-26 · Sources: `add-driver-modal.tsx`, `operator-drivers-view.tsx`, `driver-detail-view.tsx`, `driver-roster-actions.tsx`, `verify-driver-dialog.tsx` (all under `apps/web/features/operator/`), server logic in `drivers.ts`.

## 1. How an operator adds a driver (`AddDriverModal` → `drivers.createDriver`)

Entry: "Onboard Driver" button on `/dashboard/operator/drivers` (gated client-side by `canCreate||canUpdate`; server enforces `drivers:create`).

Form fields (`add-driver-modal.tsx:283-529`): fullName*, phone*, email* (CI phone format; defaults licenseCategory D, expiry +1y, yearsOfExperience 3, employmentType EXCLUSIVE_INTERCITY), badgeNumber (optional), licenseNumber* (globally unique), license class B/C/D/E*, licence photo front + back (image/PDF upload through Phase-15 private storage purposes — see 14-documents), operational notes. Medical doc is NOT collectable in this modal (server accepts it; only wizard collects it).

Flow states:
1. **Binding conflict** (`EXISTING_USER_BINDING_REQUIRED::name|phone|email|hasProfile`): masked identity dialog "This person is already a driver on Moja" → operator confirms → re-send with `confirmBinding:true`. No silent stranger-binding (P1-7).
2. **Ambiguous binding** (`AMBIGUOUS_BINDING::email::phone`): email and phone match TWO different accounts — hard stop, no confirm path; operator must correct a field (F-OP-12).
3. **Credential handoff step**: after success, modal shows share/copy login instructions ("install Moja Ride Driver app, log in with phone X via SMS code") — guided handoff instead of auto-invite (Phase 17 D3). `accountCreated` vs "linked to existing account" messaging.
4. Server side (one transaction): user find-or-create (role **DRIVER**, placeholder account, zero ERP access) → DriverProfile find-or-create (licence uniqueness CONFLICT) → affiliation upsert (rehire clears terminatedAt). No Operator row ever (Phase 17 D2).

Result state: driver appears on roster with `verificationStatus=PENDING` (or whatever their profile already had), `status=OFFLINE`.

## 2. Roster list UX (`operator-drivers-view.tsx`)

- KPI cards: total / On Duty / Verified / Pending — from `listDrivers.stats` groupBy under the SAME filters (P3-4).
- Filters (all server-side): debounced search (name/email/phone/licence), status (incl. SUSPENDED — F-OP-15), verification status, contract type, licence class.
- Rows: avatar, name → passport link, DriverStatusBadge, LicenseExpiryBadge (amber ≤30d / red expired), contact, licence number+class, rating star, current bus plate when ON_TRIP, employment label ("Intercity Exclusive"/"Hybrid (Multi-Mode)"/"Urban Contractor"), Verified/Pending chip.
- Pagination: accumulate pattern (page batches merged, dedup by id; reset on filter change) — F-OP-04.
- Row menu: View Full Passport / Verify License (when not VERIFIED and canVerify).

## 3. Driver Passport page (`[id]` → `driver-detail-view.tsx`)

- Header: avatar, name, status badge, licence-expiry badge, Verified/Pending Compliance chip, phone/email, company badge number, Employment Model card, roster actions.
- TrustBadges strip (computed on read: Top Rated/Safe Driver/Veteran).
- Career stats card: averageRating, totalReviews, totalTripsCompleted, totalDistanceKm, safetyScore.
- Tabs: **Credentials & License** (number/class/expiry/experience, medical clearance date, affiliated since, affiliation notes) · **Trip History** (active-trip card only — historical trip list NOT implemented here despite tab name; see gap register) · **Reviews** (latest 10 w/ driver/vehicle/punctuality sub-ratings + content) · **Insights** (`getDriverAnalytics` → recharts trend/distribution/anomaly counts).

### ⚠️ Gap found during audit
`drivers.getDriver` presigns compliance docs into `licenseFrontUrl/licenseBackUrl/medicalDocUrl` precisely so dossiers render (`drivers.ts:588-616`), but **the operator passport view never renders these URLs anywhere** — grep confirms zero usages outside the router and add-modal upload. The promised "License Document Inspector" (build-plan 02.05) exists only on the ADMIN verification dialog. Operators approve licences sight-unseen unless they use the admin surface (which they don't have). Document preview belongs on this page.

## 4. Edit & Remove (`DriverRosterActions`)

- Edit dialog (canUpdate): licence number/category/expiry, badge number, notes → `drivers.updateDriver`. Note: cannot edit employmentType or upload replacement docs from this UI (server supports both; UI doesn't expose them).
- Remove-from-roster (canDelete): destructive confirm explains consequences (disappears from roster/comboboxes/urgent feed immediately, driver notified, profile+ratings intact, rehire possible). Disabled mid-run client-side AND refused server-side with CONFLICT (`deleteDriverAffiliation`). Atomic offboard + driver notification.

## 5. Verification from the operator seat (`VerifyDriverDialog` → `drivers.verifyDriver`)

Checklist copy (license valid, class D/E standard, identity match) + optional rejection reason; Approve→VERIFIED / Reject→REJECTED. Server guards recap: active-roster only (cross-company → FORBIDDEN, P1-3); VERIFIED requires ≥1 compliance doc (F-OP-16 — a document-less rubber stamp is impossible, which makes §3's missing doc rendering more acute: the operator approves without seeing what they approve); SUSPEND/REJECT tear down run state; VERIFIED-after-SUSPEND parks at AVAILABLE; per-company `isVerified` flips.

Note: the dialog exposes VERIFIED/REJECTED only — SUSPENDED is reachable via the ADMIN hub, not this operator dialog (server enum accepts it; operator UI never sends it).

## 6. Confirmation flows summary (user question: "how are they confirmed?")

Two independent confirmations exist BY DESIGN:
1. **Roster membership** — instant on `createDriver` (operator's own action; binding-confirm protects identity).
2. **Platform compliance verification** — `verificationStatus PENDING→VERIFIED`, settable by (a) the owning operator via VerifyDriverDialog (roster-scoped), or (b) platform admins via the Admin Verification Hub (see 03-verification module). Dispatch eligibility, shift-start, marketplace listing all key off VERIFIED.

## 7. Gaps

1. Missing document rendering on operator passport (above) — highest-value quick win in this module.
2. No operator-side path to attach/replace medical docs post-onboarding (updateDriver supports it; no UI).
3. Trip History tab shows only the active trip; no completed-run history query wired.
4. No bulk onboarding (CSV/import) — one-by-one only.
5. Hardcoded English strings throughout drivers UIs (no useTranslations) — inconsistent with repo i18n convention elsewhere.
