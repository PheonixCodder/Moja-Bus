# PostHog Audit — Module 01: System Map & Inventory

## 1. Application Inventory & SDK Matrix

```
                      ┌──────────────────────────────────────────────────────────┐
                      │              PostHog Cloud (SaaS Ingestion)              │
                      │  US: https://us.i.posthog.com  |  EU: https://eu.i.posthog.com │
                      └────────────────────────────▲─────────────────────────────┘
                                                   │
        ┌──────────────────────────┬───────────────┴──────────────┬──────────────────────────┐
        │                          │                              │                          │
┌───────┴─────────┐       ┌────────┴─────────┐          ┌────────┴─────────┐       ┌────────┴─────────┐
│    apps/web     │       │ apps/traveler-app│          │ apps/driver-app  │       │  apps/booth-app  │
├─────────────────┤       ├──────────────────┤          ├──────────────────┤       ├──────────────────┤
│ Next.js 16      │       │ Expo SDK 57 (RN) │          │ Expo SDK 57 (RN) │       │ Expo SDK 57 (RN) │
│ posthog-js      │       │ posthog-react-   │          │ posthog-react-   │       │ NO PostHog SDK   │
│ ^1.410.6        │       │ native ^4.61.4   │          │ native ^4.61.4   │       │                  │
├─────────────────┤       ├──────────────────┤          ├──────────────────┤       ├──────────────────┤
│ • Provider mounted│     │ • Client created │          │ • Dependency in  │       │ • Completely     │
│ • No custom evts│       │ • Provider wrapped│         │   package.json   │       │   missing        │
│ • No user ident │       │ • No custom evts │          │ • NOT imported   │       │                  │
│ • No proxy      │       │ • No user ident  │          │ • NOT mounted    │       │                  │
└─────────────────┘       └──────────────────┘          └──────────────────┘       └──────────────────┘
```

### Detailed Component Inventory

| Target App | Directory | SDK Dependency | Provider / Mounting Location | Current Configuration |
| :--- | :--- | :--- | :--- | :--- |
| **Web** | `apps/web` | `posthog-js: ^1.410.6` | `components/posthog-provider.tsx`<br>Mounted in `app/[locale]/layout.tsx` | - `person_profiles: "identified_only"`<br>- `capture_pageview: true`<br>- `capture_pageleave: true`<br>- Uses `NEXT_PUBLIC_POSTHOG_KEY` & `NEXT_PUBLIC_POSTHOG_HOST` |
| **Traveler App** | `apps/traveler-app` | `posthog-react-native: ^4.61.4` | `lib/posthog.ts`<br>Mounted in `app/_layout.tsx` | - `new PostHog(API_KEY, { host: HOST })`<br>- Uses `EXPO_PUBLIC_POSTHOG_KEY` & `EXPO_PUBLIC_POSTHOG_HOST` |
| **Driver App** | `apps/driver-app` | `posthog-react-native: ^4.61.4` | None (`package.json` only) | - **Unused**. Never imported or instantiated in any source file. |
| **Booth App** | `apps/booth-app` | None | None | - **Not installed**. Zero PostHog footprint. |

---

## 2. Environment Variables Matrix

To connect to **PostHog Cloud** without self-hosting, the following environment configuration is required:

| App | Required Variable | Recommended PostHog Cloud Value (US) | Recommended PostHog Cloud Value (EU) | Documented in `.env.example`? |
| :--- | :--- | :--- | :--- | :--- |
| **`apps/web`** | `NEXT_PUBLIC_POSTHOG_KEY` | `phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx` | `phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx` | ❌ **No** (Missing from `apps/web/.env.example`) |
| **`apps/web`** | `NEXT_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` (or rewrite `/ingest`) | `https://eu.i.posthog.com` (or rewrite `/ingest`) | ❌ **No** (Missing from `apps/web/.env.example`) |
| **`apps/traveler-app`** | `EXPO_PUBLIC_POSTHOG_KEY` | `phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx` | `phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx` | ✅ Yes (`apps/traveler-app/.env.example`) |
| **`apps/traveler-app`** | `EXPO_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | `https://eu.i.posthog.com` | ✅ Yes (`apps/traveler-app/.env.example`) |
| **`apps/driver-app`** | `EXPO_PUBLIC_POSTHOG_KEY` | `phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx` | `phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx` | ❌ **No** (Missing from `apps/driver-app/.env.example`) |
| **`apps/driver-app`** | `EXPO_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | `https://eu.i.posthog.com` | ❌ **No** (Missing from `apps/driver-app/.env.example`) |
| **`apps/booth-app`** | `EXPO_PUBLIC_POSTHOG_KEY` | `phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx` | `phc_xxxxxxxxxxxxxxxxxxxxxxxxxxxx` | ❌ **No** (Missing from `apps/booth-app/.env.example`) |
| **`apps/booth-app`** | `EXPO_PUBLIC_POSTHOG_HOST` | `https://us.i.posthog.com` | `https://eu.i.posthog.com` | ❌ **No** (Missing from `apps/booth-app/.env.example`) |

---

## 3. PostHog Ingestion & Client Architecture Gaps

1. **Next.js App Router SPA Route Changes**:
   - In Next.js App Router (`apps/web`), standard page transitions do not trigger a full browser reload.
   - `posthog-js` default `capture_pageview: true` captures the initial SSR landing, but does not track client-side navigation without a `usePathname` / `useSearchParams` hook listener or `<PostHogPageView />` component.
2. **Ad-Blocker Prevention (Web)**:
   - For PostHog Cloud, direct requests to `us.i.posthog.com` or `eu.i.posthog.com` are routinely blocked by client ad blockers (~15-30% of web traffic).
   - PostHog Cloud best practice is configuring a Next.js rewrite rule in `apps/web/next.config.ts` to proxy ingestion requests (e.g. `/ingest/:path*` -> `https://us.i.posthog.com/:path*`).
3. **User Identification Bridge**:
   - None of the apps link the logged-in user from Better Auth (`authClient.useSession()`) or driver/booth sessions to PostHog (`posthog.identify()`).
   - All events are currently anonymous or disconnected across sessions.
4. **Mobile Screen Tracking**:
   - In Expo Router (`traveler-app`, `driver-app`, `booth-app`), navigation events are not automatically logged to PostHog as `$screen` views. `PostHogProvider` requires active navigation state tracking.
