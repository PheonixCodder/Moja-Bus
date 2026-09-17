# PostHog Audit — Module 05: Phased Remediation Plan

This plan outlines the engineering steps to bring all four applications in the monorepo into full PostHog Cloud operational status.

---

## Phase 1: Environment & Setup Harmonization
- [ ] **Document Environment Variables**: Add `NEXT_PUBLIC_POSTHOG_KEY` and `NEXT_PUBLIC_POSTHOG_HOST` to `apps/web/.env.example`.
- [ ] **Document Mobile Environments**: Add `EXPO_PUBLIC_POSTHOG_KEY` and `EXPO_PUBLIC_POSTHOG_HOST` to `apps/driver-app/.env.example` and `apps/booth-app/.env.example`.
- [ ] **Install Missing SDK**: Add `posthog-react-native` to `apps/booth-app/package.json`.
- [ ] **Configure Ingest Proxy (Web)**: Configure Next.js rewrites in `apps/web/next.config.ts` for `/ingest/:path*` pointing to the PostHog Cloud instance (e.g. `https://us.i.posthog.com`).

---

## Phase 2: Provider & Lifecycle Setup across All Apps
- [ ] **Web SPA Tracking**: Create `components/posthog-pageview.tsx` with `usePathname` and `useSearchParams` inside `<Suspense>` in `apps/web`.
- [ ] **Web PostHogProvider Enhancement**: Update `apps/web/components/posthog-provider.tsx` to handle `/ingest` proxy and include `<PostHogPageView />`.
- [ ] **Driver App Setup**: Create `apps/driver-app/lib/posthog.ts` and wrap `apps/driver-app/app/_layout.tsx` in `<PHProvider>`.
- [ ] **Booth App Setup**: Create `apps/booth-app/lib/posthog.ts` and wrap `apps/booth-app/app/_layout.tsx` in `<PHProvider>`.
- [ ] **Mobile Screen Tracking Hook**: Implement an Expo Router screen tracking listener (`usePostHogScreenTracking()`) in `traveler-app`, `driver-app`, and `booth-app`.

---

## Phase 3: Identity & Session Linking
- [ ] **Web Auth Sync**: Add an effect in web auth or root dashboard layout that invokes `posthog.identify(user.id, { email, role, phone })` upon session load, and `posthog.reset()` on logout.
- [ ] **Operator Group Linking**: Call `posthog.group('company', companyId)` on operator dashboard views.
- [ ] **Traveler App Identity**: Call `posthog.identify()` upon successful OTP verification in `apps/traveler-app/features/auth/`.
- [ ] **Driver App Identity**: Call `posthog.identify()` with driver profile status upon boot in `apps/driver-app`.
- [ ] **Booth Agent Identity**: Call `posthog.identify()` with agent ID and assigned terminal ID in `apps/booth-app`.

---

## Phase 4: Business Funnel Instrumentation
- [ ] **Passenger Funnel**: Instrument `trip_searched`, `seats_selected`, `checkout_started`, and `booking_completed` across `apps/web` and `apps/traveler-app`.
- [ ] **Driver Funnel**: Instrument `driver_offer_accepted`, `driver_trip_started`, `passenger_checked_in`, and `driver_trip_completed` in `apps/driver-app`.
- [ ] **Booth Funnel**: Instrument `counter_ticket_issued` and `shift_reconciled` in `apps/booth-app`.
- [ ] **Feature Flags**: Optionally wire PostHog feature flags for selective rollout of experimental pricing or new payment methods.
