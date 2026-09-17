# PostHog Audit — Module 02: Detailed Findings

## 1. Architectural Findings by Application

### 1.1 `apps/web` (Next.js 16 Web & API)

#### Finding WEB-01: Incomplete Pageview Tracking in Next.js App Router
- **Location**: `apps/web/components/posthog-provider.tsx`
- **Issue**: `posthog.init` sets `capture_pageview: true`. In Next.js App Router with client-side transitions (via `next-intl/navigation` or `next/link`), `capture_pageview: true` only records the initial page load. Subsequent soft navigations across `/search`, `/booking/[id]`, `/dashboard/*`, etc., are missed or recorded with stale page titles and URLs.
- **Remediation**: Set `capture_pageview: 'always'` or disable automatic pageview in config and create a dedicated `<PostHogPageView />` component using `usePathname()` and `useSearchParams()` from `next/navigation` wrapped in `<Suspense>`.

#### Finding WEB-02: Zero User Identification & Group Analytics Link
- **Location**: `apps/web/app/[locale]/layout.tsx` and auth hooks
- **Issue**: Although `person_profiles: "identified_only"` is enabled in `posthog.init()`, `posthog.identify()` is never called anywhere in `apps/web`.
- **Impact**: PostHog will drop or separate user profile attributes. Better Auth provides rich session info (`user.id`, `user.email`, `user.phone`, `user.role`, `user.activeCompanyId`), but none of this is mapped into PostHog. Furthermore, multi-tenant B2B operator analytics require `posthog.group('company', companyId)`, which is also entirely absent.

#### Finding WEB-03: Zero Custom Event Instrumentation
- **Location**: Entire `apps/web/features/`
- **Issue**: There is not a single `posthog.capture()` call across web booking, seat selection, checkout, operator dispatch, fleet management, or ticket validation.
- **Impact**: Product funnels, drop-off analysis, conversion rates from search to checkout, and operator activity cannot be tracked.

#### Finding WEB-04: Missing Reverse Proxy / Ingest Rewrite (Ad-Blocker Vulnerability)
- **Location**: `apps/web/next.config.ts`
- **Issue**: Client browsers send analytics directly to the PostHog Cloud domain (`NEXT_PUBLIC_POSTHOG_HOST`).
- **Impact**: Popular ad blockers (uBlock Origin, Brave Shields, AdBlock Plus) intercept and block direct calls to `*.posthog.com`, causing 15–30% telemetry loss. PostHog Cloud recommends setting up a reverse proxy via Next.js rewrites.

#### Finding WEB-05: Missing Environment Variables in `.env.example`
- **Location**: `apps/web/.env.example`
- **Issue**: `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` are consumed in `components/posthog-provider.tsx` but are completely undocumented in `apps/web/.env.example`.

---

### 1.2 `apps/traveler-app` (Passenger React Native Expo)

#### Finding TRV-01: Provider Mounted but 0% Event Instrumentation
- **Location**: `apps/traveler-app/app/_layout.tsx` & `lib/posthog.ts`
- **Issue**: `posthog-react-native` is initialized and wrapped around the root component, but `posthog.capture()` is never invoked anywhere across search, seat selection, checkout, payment, or ticket viewing.
- **Impact**: The app sends generic session heartbeats if configured, but zero domain events exist.

#### Finding TRV-02: No Screen Tracking for Expo Router
- **Location**: `apps/traveler-app/app/_layout.tsx`
- **Issue**: React Native mobile apps do not have browser URLs. Screen tracking in Expo Router requires listening to route changes (`usePathname()` or navigation container state) and calling `posthog.screen(pathname)`.
- **Impact**: PostHog dashboards cannot break down user sessions by mobile screens (`/search`, `/booking/[scheduleId]`, `/checkout`, `/tickets`).

#### Finding TRV-03: No User Identification Bridge
- **Location**: `apps/traveler-app/features/auth/`
- **Issue**: When a traveler logs in via phone/email OTP, `posthog.identify()` is never called with the user ID or metadata, leaving all mobile sessions unlinked to user profiles.

---

### 1.3 `apps/driver-app` (Driver React Native Expo)

#### Finding DRV-01: Dead SDK Dependency in `package.json`
- **Location**: `apps/driver-app/package.json` (line 66: `"posthog-react-native": "^4.61.4"`)
- **Issue**: The dependency is included in `package.json`, but grep confirms it is **never imported, configured, or initialized** anywhere in `apps/driver-app/app/` or `apps/driver-app/features/`.
- **Impact**: Dead code / bundle bloat. Zero analytics on driver onboarding, shift start/end, offer acceptance/counter-offers, or trip execution.

#### Finding DRV-02: Missing Environment Configuration
- **Location**: `apps/driver-app/.env.example`
- **Issue**: `EXPO_PUBLIC_POSTHOG_KEY` and `EXPO_PUBLIC_POSTHOG_HOST` are missing from the example environment file.

---

### 1.4 `apps/booth-app` (Terminal POS React Native Expo)

#### Finding BTH-01: Total Absence of PostHog SDK
- **Location**: `apps/booth-app/package.json`
- **Issue**: `posthog-react-native` is not listed in `dependencies`.
- **Impact**: Zero visibility into physical ticketing counter metrics: cash vs POS reconciliation, agent ticket issuance volume, terminal performance, or station operational speed.

#### Finding BTH-02: Missing Environment Configuration
- **Location**: `apps/booth-app/.env.example`
- **Issue**: No PostHog environment variables are declared or documented.
