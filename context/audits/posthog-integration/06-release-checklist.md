# PostHog Audit — Module 06: Release Checklist & Verification Gates

Execute these verification gates to validate full PostHog Cloud readiness across the monorepo before closing this audit.

---

## Gate A: Environment & Build Verification
- [x] Environment keys documented in `.env.example` and configured in `.env.local` for `web`, `traveler-app`, `driver-app`, and `booth-app` targeting PostHog EU Cloud (`https://eu.i.posthog.com`).
- [x] `pnpm typecheck` passes cleanly across `@moja/analytics`, `apps/web`, `apps/traveler-app`, `apps/driver-app`, and `apps/booth-app`.
- [x] In `apps/web`, Next.js rewrites configured for `/ingest/:path*` to proxy PostHog EU Cloud requests and protect against browser ad-blockers.
- [x] In mobile apps (`traveler-app`, `driver-app`, `booth-app`), client initialization fails open gracefully when `EXPO_PUBLIC_POSTHOG_KEY` is omitted or empty.

---

## Gate B: Telemetry & Ingestion Probes
- [ ] **Web Initial Pageview**: Opening `http://localhost:3000` emits `$pageview` in PostHog Live Events.
- [ ] **Web SPA Navigation**: Navigating from `/` to `/search` and `/dashboard` generates corresponding `$pageview` events with correct URLs.
- [ ] **Mobile Screen Tracking**: Switching tabs in `traveler-app`, `driver-app`, and `booth-app` emits `$screen` events in PostHog.
- [ ] **Identity Binding**: Logging into each app emits an `$identify` event associating the persistent PostHog distinct ID with the Moja Ride `user.id`.
- [ ] **Session Reset**: Logging out calls `posthog.reset()`, detaching the session from subsequent user activity.

---

## Gate C: Privacy & PII Compliance
- [ ] Telemetry events do **NOT** leak raw bank account numbers, unmasked phone OTP codes, driver license image binary data, or private passwords.
- [ ] Driver GPS coordinates streaming (`/api/v1/telemetry/ping`) remain on the internal telemetry pipeline and are not spammed directly as raw high-frequency events into PostHog (avoiding massive event bill explosion).
- [ ] Person profiles only store identified users (`person_profiles: "identified_only"`).
