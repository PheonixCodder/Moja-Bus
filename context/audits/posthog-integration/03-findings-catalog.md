# PostHog Audit — Module 03: Findings Catalog & Gap Register

This register ranks all findings by severity (P0–P3) per the repository standard defined in `context/audits/README.md`.

## Severity Register

| ID | Sev | App Scope | Title | Description | Remediation Target |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **GAP-01** | **P1** | `apps/web` | Ingest Ad-Blocker Vulnerability | Web client directly pings `*.posthog.com` rather than using a reverse proxy. 15-30% of desktop and mobile browser events will be dropped. | Add Next.js rewrites to `apps/web/next.config.ts` for `/ingest/:path*` to forward to Cloud host. |
| **GAP-02** | **P1** | `apps/web`, `apps/traveler-app`, `apps/driver-app`, `apps/booth-app` | Zero User Identity Linkage | Users sign in via Better Auth OTP or carrier tokens, but `posthog.identify()` is never called. Sessions cannot be tied to users or cohorts. | Add identity listener components/hooks in auth layouts to sync session state to PostHog. |
| **GAP-03** | **P2** | `apps/driver-app` | Dead SDK Dependency | `posthog-react-native` is installed in `package.json` but is never imported, initialized, or wired to root layout. | Mirror `apps/traveler-app` PostHog client setup in `apps/driver-app/lib/posthog.ts` and wrap `_layout.tsx`. |
| **GAP-04** | **P2** | `apps/booth-app` | Completely Absent SDK | `apps/booth-app` has no PostHog dependency or setup. Terminal ticket sales and cash reconciliation are unmonitored. | Install `posthog-react-native` in `apps/booth-app`, instantiate client, wrap `_layout.tsx`. |
| **GAP-05** | **P2** | `apps/web` | App Router SPA Navigation Blindspot | `capture_pageview: true` fails on Next.js App Router client-side transitions. Soft navigations are not captured. | Add `<PostHogPageView />` using `usePathname` and `useSearchParams` inside `<Suspense>`. |
| **GAP-06** | **P2** | `apps/traveler-app`, `apps/driver-app`, `apps/booth-app` | Missing Mobile Screen Tracking | Mobile navigation in Expo Router does not emit screen view events to PostHog. | Add an Expo Router screen tracking hook that emits `posthog.screen(name)` on route transition. |
| **GAP-07** | **P2** | All Apps | Zero Custom Business Event Instrumentation | Critical business moments (trip search, seat selection, checkout, payment, driver offer accept/reject, cash ticket issued) are uncaptured. | Implement typed capture helpers using shared taxonomy across web and mobile. |
| **GAP-08** | **P3** | `apps/web`, `apps/driver-app`, `apps/booth-app` | Undocumented Cloud Env Vars in `.env.example` | Missing PostHog environment keys in `.env.example` for 3 out of 4 apps. | Document `NEXT_PUBLIC_POSTHOG_KEY` / `HOST` and `EXPO_PUBLIC_POSTHOG_KEY` / `HOST` across all `.env.example` files. |
| **GAP-09** | **P3** | `apps/web` | Missing B2B Group Analytics | Bus operators manage fleet and schedules, but `posthog.group('company', companyId)` is not invoked. | Set company groups on operator dashboard route transitions. |
