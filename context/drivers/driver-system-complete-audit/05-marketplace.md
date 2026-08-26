# 05 — Driver Marketplace (supply-side discovery)

> Audit date: 2026-08-26 · Sources: `drivers.ts` Phase-9 sections, `operator-marketplace-view.tsx`, `marketplace-driver-card.tsx`, `driver-public-profile-sheet.tsx`, `send-offer-dialog.tsx`, admin controls in `admin.ts` + admin marketplace view.

## 1. Listing model

- **Auto-listing**: every VERIFIED driver with `servicePreference.isAvailableForHire=true` and `isSuspended=false` is discoverable. There is no separate "listed" flag; the availability toggle IS the listing switch (locked decision 2026-08-21: auto-list all verified, opt-out model).
- Drivers control visibility entirely from the driver app (preferences screen; see 03-driver-registration for the wizard and 12 for app details). `setServicePreference` upserts; `isAvailableForHire` explicitly set, never auto-flipped.
- Privacy: `minMonthlyRateCFA` is private — excluded from every operator-facing select (verified at `drivers.ts:2510,2661`).

## 2. Operator discovery (`/dashboard/operator/drivers/marketplace` → `operators.listMarketplaceDrivers`... actually `drivers.listMarketplaceDrivers`)

- Query params persisted via nuqs: `licenseCategory`, `preferredType`, `cityBase`, `minRating`, `minSafetyScore` (5 filters incl. two float sliders) — `operator-marketplace-view.tsx:218-221`.
- Server filtering: VERIFIED + available + non-suspended + preferredType/cityBase contains-insensitive + minRating/minSafetyScore gte; **excludes drivers already exclusively affiliated with the requester** (NOT some affiliation EXCLUSIVE_INTERCITY active); ordering featured-first → rating → tripsCompleted.
- Response hygiene: raw affiliation rows replaced with boolean `isOnMyRoster` (P3-1) which disables the Send-Offer CTA on own-roster drivers; trustBadges computed server-side per driver.
- Pagination accumulate (same pattern as roster).

## 3. Public profile sheet (`getPublicDriverProfile`)

Single-driver card data: identity (fullName, phone, photo), licence class, experience, ratings/safety/trips/distance, verifiedAt, full affiliation history (company names/slugs + employment types + hire/terminate dates), service preference (availability, type, city base, routeExperience strings, featured), trust badges, `isOnMyRoster`.

**Conditional redaction (F-OP-10)**: if off-market (`!isAvailableForHire || isSuspended`) the response NULLS contact, history, stats and returns only {id, name, verificationStatus} — an operator holding a stale link sees "Off Market" CTA, never leaked contact data of someone who stepped away. One response shape both branches (typed `PublicDriverProfileView`).

## 4. Offer entry point

Card/profile-sheet → `SendOfferDialog` (employment type select, salary CFA, proposed start date, note) → `drivers.sendEmploymentOffer` (guards in 06-offers). Disabled when `isOnMyRoster`. Success invalidates marketplace + sent-offers lists.

## 5. Platform-level marketplace governance (Phase 14, admin side)

- Permission keys `marketplace:read|manage` (admin-staff catalog; sidebar gating; ADMIN template seeded so non-super-admins keep the hub — Phase 25 lesson).
- `setDriverMarketplaceStatus`: FEATURE (cap 20 concurrent featured slots) / UNFEATURE / SUSPEND (**mandatory reason**, releases featured slot) / RESTORE; writes ActivityLog + outbox notifications `driver-marketplace-featured/-suspended` to the driver; day-bucketed idempotency keys (F-NF-13).
- `listMarketplaceAdminDrivers` includes suspended/off-market rows (moderation needs the invisible).
- `getMarketplaceHealth`: funnel metrics (verified → available → hired), time-to-hire, counter-rate analytics.
- `listAllOffers`: platform-wide offer audit browser with negotiation timelines (Phase 14).
- Admin UI: `/dashboard/admin/drivers/marketplace` health strip + Drivers/Offers tabs (details in 03-verification module's sibling — see audit file 03b/admin module).

## 6. Route-experience reality check (user question: "how do they select which routes they work on")

Today: free-text `routeExperience String[]` on preferences (e.g. "Abidjan–Bouaké"), edited in the driver app; displayed as chips on marketplace cards; **no matching engine** against actual Route entities (origin/dest terminal cities). The "route-experience matching engine (terminal cities ↔ declared routes)" is explicitly post-launch roadmap. Operators filter by cityBase text only.

## 7. Strengths

- Clean privacy boundary (salary never leaves driver-owned surfaces).
- Redaction-on-off-market is a rare-in-practice thoughtful touch (stale links degrade gracefully).
- Featured-slot cap prevents pay-to-top abuse once monetized.

## 8. Gaps

1. `cityBase`/`routeExperience` are unvalidated free text — typos fragment filters ("Abidjan" vs "abj").
2. No structured route matching (roadmap item) — marketplace cannot answer "who has driven Abidjan→Bouaké".
3. No marketplace search by name/phone for operators (filters only).
4. Availability toggle has no cooldown/undo window; a driver toggling off mid-negotiation silently redacts profiles operators may be viewing (acceptable but worth surfacing as toast on operator side).
5. HYBRID drivers appear under either preferredType filter but there's no "show hybrid only" nuance beyond exact enum match.
