# Implementation Plan — Complete PostHog Cloud Integration across Moja Bus Monorepo

## 1. What We Are Building
We are building an end-to-end, production-grade PostHog Cloud integration (EU Region: `https://eu.i.posthog.com`) across all four applications in the Moja Bus monorepo:
1. **`apps/web`** (Next.js 16, App Router)
2. **`apps/traveler-app`** (React Native, Expo SDK 57)
3. **`apps/driver-app`** (React Native, Expo SDK 57)
4. **`apps/booth-app`** (React Native, Expo SDK 57)

This will be powered by a new shared package, **`packages/analytics`**, providing strongly-typed event contracts, event validation, identity synchronization helpers, and automated screen/pageview tracking.

---

## 2. Language We Agreed On
- **PostHog Cloud EU**: Dedicated ingestion at `https://eu.i.posthog.com`, assets at `https://eu-assets.i.posthog.com`, and dashboard at `https://eu.posthog.com`.
- **Web Ad-Blocker Reverse Proxy**: Next.js rewrites in `apps/web/next.config.ts` mapping `/ingest/:path*` to `https://eu.i.posthog.com` and `/ingest/static/:path*` to `https://eu-assets.i.posthog.com`.
- **Direct Mobile Ingestion**: Mobile apps (`traveler-app`, `driver-app`, `booth-app`) communicate directly with `https://eu.i.posthog.com`.
- **Identity & Group Linking**: Linking Better Auth sessions (`user.id`, `role`, `phone`, `email`) and multi-tenant operator companies (`posthog.group('company', companyId)`).
- **Fail-Open Posture**: If PostHog environment keys are missing (local testing or offline), the apps must run smoothly without throwing exceptions.

---

## 3. Decisions Made
- **Decision 1 — Shared Package (`packages/analytics`)**: Created a dedicated workspace package to hold the shared event taxonomy, Zod schemas, TypeScript types, and common tracking contracts to keep the entire monorepo DRY and type-safe.
- **Decision 2 — Cloud Region & Ingestion Strategy**: PostHog Cloud **EU region** is selected. Web uses Next.js `/ingest` rewrites; mobile apps connect directly to the EU cloud endpoint.
- **Decision 3 — Navigation & Screen Tracking**: Next.js 16 uses a Suspense-wrapped `<PostHogPageView />` hook component (`usePathname` + `useSearchParams`). Mobile apps use an Expo Router screen tracking hook emitting `$screen` events on tab and stack changes.

---

## 4. Assumptions
- PostHog project API keys will be provided by the operator in their respective environment files (`NEXT_PUBLIC_POSTHOG_KEY` for web, `EXPO_PUBLIC_POSTHOG_KEY` for mobile).
- High-frequency GPS telemetry (`/api/v1/telemetry/ping`) will remain on the internal database pipeline and will not be spammed directly into PostHog.

---

## 5. How to Build It (Ordered Implementation Steps)

### Step 1: Create `packages/analytics`
1. Initialize `packages/analytics` with `package.json`, `tsconfig.json`, and Biome config.
2. Define domain event taxonomies with TypeScript and Zod:
   - **Passenger events**: `trip_searched`, `search_results_viewed`, `trip_selected`, `seats_selected`, `checkout_started`, `payment_initiated`, `booking_completed`, `ticket_viewed`.
   - **Driver events**: `driver_onboarding_step_completed`, `driver_offer_viewed`, `driver_offer_accepted`, `driver_offer_rejected`, `driver_trip_started`, `passenger_checked_in`, `driver_trip_completed`.
   - **Booth events**: `terminal_session_started`, `counter_ticket_issued`, `shift_reconciled`.
   - **Operator events**: `operator_route_created`, `operator_trip_dispatched`, `operator_refund_issued`.
3. Export common typed helpers and identity mapping types.
4. Add `@moja/analytics` to root `pnpm-workspace.yaml` (if needed) and link in all 4 apps.

### Step 2: Configure `apps/web` (Next.js 16)
1. Update `apps/web/.env.example` to document `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST`.
2. Configure Next.js rewrites in `apps/web/next.config.ts`:
   - `/ingest/static/:path*` -> `https://eu-assets.i.posthog.com/static/:path*`
   - `/ingest/:path*` -> `https://eu.i.posthog.com/:path*`
3. Update `apps/web/components/posthog-provider.tsx`:
   - Support `/ingest` proxy.
   - Include `<PostHogPageView />` using `usePathname` & `useSearchParams` inside `<Suspense>`.
   - Support `defaults: '2026-05-30'` and EU cloud fallback.
4. Add Better Auth identity synchronization in the authenticated layout to call `posthog.identify()` on login and `posthog.reset()` on logout.
5. Instrument key passenger web events (`trip_searched`, `booking_completed`) and operator actions.

### Step 3: Configure `apps/traveler-app` (Passenger Expo)
1. Add `@moja/analytics` dependency to `apps/traveler-app/package.json`.
2. Update `apps/traveler-app/.env.example` with EU cloud default: `https://eu.i.posthog.com`.
3. Enhance `apps/traveler-app/lib/posthog.ts` with fail-open safety and typed capture helpers.
4. Add Expo Router `$screen` tracking hook in `apps/traveler-app/app/_layout.tsx`.
5. Wire `posthog.identify()` to the OTP authentication flow in `features/auth/`.
6. Instrument passenger search, seat selection, checkout, and ticket viewing events.

### Step 4: Configure `apps/driver-app` (Driver Expo)
1. Add `@moja/analytics` dependency to `apps/driver-app/package.json`.
2. Document `EXPO_PUBLIC_POSTHOG_KEY` and `EXPO_PUBLIC_POSTHOG_HOST` in `apps/driver-app/.env.example`.
3. Create `apps/driver-app/lib/posthog.ts` mirror of the client setup.
4. Wrap `apps/driver-app/app/_layout.tsx` with `<PostHogProvider>` and enable Expo Router screen tracking.
5. Wire `posthog.identify()` upon driver login/profile resolution.
6. Instrument driver onboarding steps, offer accept/reject, trip start, and passenger QR check-in.

### Step 5: Configure `apps/booth-app` (Booth Expo)
1. Install `posthog-react-native` and add `@moja/analytics` to `apps/booth-app/package.json`.
2. Document `EXPO_PUBLIC_POSTHOG_KEY` and `EXPO_PUBLIC_POSTHOG_HOST` in `apps/booth-app/.env.example`.
3. Create `apps/booth-app/lib/posthog.ts`.
4. Wrap `apps/booth-app/app/_layout.tsx` with `<PostHogProvider>` and enable Expo Router screen tracking.
5. Wire `posthog.identify()` with booth agent ID and terminal ID.
6. Instrument ticket sales (`counter_ticket_issued`) and cash reconciliation (`shift_reconciled`).

### Step 6: Verification & Quality Gate
1. Run `pnpm typecheck` across the entire monorepo (`web`, `traveler-app`, `driver-app`, `booth-app`, `packages/analytics`).
2. Run `biome check` to ensure formatting and linting pass.
3. Test fail-open behavior when keys are omitted.
4. Update and complete `context/audits/posthog-integration/06-release-checklist.md`.
