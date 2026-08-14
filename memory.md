# Memory — Passenger Mobile App Build

Last updated: 2026-08-02

## What was built

**Contact/Inquiries feature (2026-08-02):**

- **DB**: New `ContactInquiry` model (`contact_inquiry` table) + `ContactInquiryStatus` enum (NEW/IN_PROGRESS/RESOLVED/CLOSED). Fields: name, email, phone?, subject, message, status, userId? (null = guest), ipAddress?, userAgent?, adminNote?, resolvedById?/resolvedAt?. Synced via `prisma db push` (project uses db push, NOT migrate — no migrations dir exists)
- **Schemas** (`packages/schemas/src/contact.ts`): submitInquirySchema, adminListInquiriesSchema, adminGetInquirySchema, adminUpdateInquiryStatusSchema
- **tRPC** (`apps/web/trpc/routers/contact.ts`, registered in `_app.ts` as `contact`): `submitInquiry` (publicProcedure, rate-limited 5/email/hour, captures `ctx.user?.id` server-side + IP/UA), `listInquiries`/`getInquiry`/`updateInquiryStatus` (adminProcedure)
- **Contact form** (`features/contact/components/contact-form.tsx`): replaced mailto hack with `trpc.contact.submitInquiry`, added optional phone field, error + submitting states
- **Admin UI**: `/dashboard/admin/contact/inquiries/page.tsx` + `features/admin/views/admin-inquiries-view.tsx` (status filter, search, table w/ Logged in/Guest badge, pagination) + `features/admin/components/inquiries/inquiry-detail-drawer.tsx` (full message, note saving, status actions)
- **Sidebar**: New "Support" section with "Inquiries" item (LifeBuoy icon)
- Messages added: `adminDashboard.nav.inquiries`, `adminDashboard.sections.support`, `adminDashboard.inquiries.*`, contact form keys (labelPhone, submitting, submitError, new successBody)

## Decisions made

**Onboarding flow + font loading + tRPC + Settings page + Tab bar:**

- **Fonts**: Loaded Montserrat (Regular, Medium, SemiBold, Bold) via `@expo-google-fonts/montserrat` in root layout
- **AsyncStorage**: Added dependency + `onboarding-storage.ts` with `hasSeenOnboarding()` and `markOnboardingSeen()`
- **Tab Bar**: Replaced custom implementation with `react-native-motion-tabs` library MotionTabBar
- **tRPC**: Established client with `httpBatchLink` + `superjson`, forwards Better Auth session via `authClient.getCookie()`
- **Settings page**: Rebuilt with finance-app-inspired design — ProfileHeader, WalletCard, TopUpButton, QuickActions, MenuSection
- **Onboarding**: Created 5 animated scenes (Splash → Ride Moja → Track Trip → Pay Securely → Welcome) adapted from onboarding-example template with Montserrat fonts and Feather icons
- **Shared UI**: Animated NextButton (arrow → "Get Started"), TopBar (back + skip), page indicator dots
- **Routing**: New `(onboarding)` route group, root index.tsx gates onboarding before auth on first launch

## Decisions made

- `@expo-google-fonts/montserrat` for font loading (cleaner than manual TTF)
- `@/assets/*` alias for image imports
- Feather icons from `@expo/vector-icons` (not `react-native-vector-icons/MaterialIcons`)
- Brand pink `#ee237c` primary color throughout
- `react-native-safe-area-context` used for safe area insets in onboarding
- Onboarding shown only before auth, first launch only (AsyncStorage flag)
- Final "Get Started" navigates to login screen
- Light mode only throughout app

## Problems solved

- Image path resolution: Changed from relative `../../assets/images/` to alias `@/assets/images/`
- Font loading: Returns `null` while loading (could add splash screen in future)
- Onboarding scene arrangement: 5-page animation matching template's 0→0.2→0.4→0.6→0.8 value progression

## Current state

- Montserrat fonts loaded at app startup
- 5 onboarding scenes with smooth Animated transitions
- AsyncStorage flag gates onboarding (first launch only)
- Tab bar, tRPC, and settings page all wired
- `turbo test` passes (all tests)
- TypeScript compiles clean

## Expo + Better Auth audit fixes (2026-08-06)

- Fixed `trustedOrigins` scheme mismatch: `app.json` has `"scheme": "traveler-app"` (with hyphen) but `trustedOrigins` had `"travelerapp://"` (without hyphen). Changed to `"traveler-app://"`.
- Added missing `expo-network` dependency to traveler-app per official Expo integration docs.
- Deleted dead `expo-client-plugin.ts` (was dropping `getCookie` from Expo plugin actions).
- Removed unused `createExpoPlugin` import from `auth-client.ts`.
- Removed unused `nextCookies` import from `auth-server.ts`.
- Aligned `@better-auth/expo` version: traveler-app `^1.6.20` → `^1.6.22` (matches web app).
- Added `storagePrefix: "traveler-app"` to `expoClient()` config.
- Added `as any` type assertions for `expoClient()` plugin and `authClient.getCookie()` to resolve known `@better-auth/expo` type incompatibilities with `createAuthClient`.
- `auth-client.ts` now uses `expoClient()` directly (not wrapped in custom `createExpoPlugin`).
- `trpc.tsx` uses `(authClient as any).getCookie()` in `httpBatchLink` headers callback.

## Next session starts with

- Test the onboarding flow end-to-end: launch app → see onboarding → tap through → land on login
- Build out Home/search page
- Build out Bookings page
- Build out Tickets page

## Staff permissions audit (2026-08-06)

- Completed full audit of staff permissions: wrote 11 audit files into `context/trackers/staff-permissions-audit/` (01–11 + README)
- Converted `10-consolidated-findings.md` to live tracker with Status column
- CRITICAL (C1, C2) and HIGH (H1–H4) findings: all fixed and marked Done
- MEDIUM (M1–M20) findings: all fixed and marked Done
- All changes typecheck clean for `apps/web` and `packages/schemas`
- Key changes: `bookings:cancel` key added, `withdrawals:create` added to FINANCE template, `trips:cancel` enforced in schedules.ts, bank mutations OWNER-only, `financials:view` replaces company-membership check in storage.ts, session revocation on suspend/remove, `getHoldPricing` ownership assertion, client-side permission gating across staff/withdraw/settings/sidebar/quick-actions/routes/terminals views

## Open questions

- Need final Moja Ride branded illustrations (currently using placeholder images from the template)

## Web deployment fix (2026-07-28)

- Root cause of Vercel build failure: `node-linker=hoisted` in `.npmrc` creates broken NTFS junctions (or symlinks on Linux) in workspace `node_modules` directories pointing to non-existent `.pnpm/store` paths. Binaries like `prisma`, `next`, `tsx` resolve through these broken junctions and fail with `MODULE_NOT_FOUND`.
- Fix: Changed scripts in `packages/db/package.json` and `apps/web/package.json` to use direct paths (`node ../../node_modules/<pkg>/dist/bin/<cmd>`) bypassing broken junctions.
- Files changed: `packages/db/package.json` (postinstall + all prisma/tsx scripts), `apps/web/package.json` (build script)
- `.npmrc` was NOT modified — kept as `node-linker=hoisted`

## Traveler search audit fixes (2026-08-13)

- Updated `apps/traveler-app/features/search/screens/search.tsx`: DateStrip geo props, same-city validation, default sort BEST, deep-link label resolution via getCityDetails/getGeoPlaceLabel, route param sync, richer offer mapping + activeOperators for FiltersSheet, passengers clamped 1–6.

## Post-audit bugfixes still needed then fixed (2026-08-13)

**Diagnosis (user report + screenshot):** Audit tracker marked H4/H5 done, but two issues remained on device:

1. Guest seat → login only restored offer/seats into passenger sheet; from/to/date/`isSubmitted` were not restored and `returnTo` had no search query params → blank search on return.
2. Paystack success still fell back to payment ref `moja_${holdId}_…` when `bookingReferences[0]` missing → success page REF wrong → boarding pass `Failed to load ticket`. Screenshot showed exactly that long `moja_…` REF.

**Fixes landed:**
- `stores/pending-checkout.ts`: persist full `search` snapshot + `buildSearchReturnTo`; hydration flag
- `search.tsx`: save snapshot on guest continue; encoded `returnTo` with from/to/date; restore after hydrate + reopen passenger form
- `passenger-form-sheet.tsx`: keep `heldBookingRefs` from `createHold`; success navigation prefers `MR-…` refs only; never navigate with `moja_` (fallback → My Bookings)

**Next:** Rebuild/reinstall debug APK and QA both flows on device.
## Traveler UX batch (2026-08-13)

- View Ticket / success primary CTA -> Tickets tab (multi-ticket)
- Pending detail: hide pay when hold expired; Search again CTA
- Reviews: enriched getUserReviews (company + operator response); submit requires companyId
- Settings profile hero -> personal-info; avatar preview modal then Edit
- Notifications redesign + mark one/all read via Novu client
- Login OTP: {{identifier}} i18n; AuthShell top-weighted + keyboard avoid
