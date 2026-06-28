# Memory

## Current Working State
- Project: Moja Bus
- Context scaffold: created
- Current product identity: intercity travel marketplace for Cote d'Ivoire
- Phase direction: operator first, then traveler booking
- Product scope: 3 active apps - passenger web, passenger mobile, operator/admin web
- Placeholder brand palette: teal primary with gold accent
- Shared shadcn UI now lives in `packages/ui` and mirrors the `demo-ui` component set for the monorepo apps

## Recent Decisions
- Passenger web should support search and booking
- Operator web includes operator and admin controls
- Passenger mobile keeps the full booking flow with offline ticket access
- Notifications use Expo push plus SMS fallback
- Aggregator-web now mirrors the demo-ui dashboard shell under `/dashboard` and uses nested section pages for search, bookings, tickets, and settings

## Next Step
- Define and build the search domain context and implementation plan

## Session Note
- Confirmed the app is an intercity travel marketplace for Cote d'Ivoire with passenger web, passenger mobile, and operator/admin web as the active v1 surfaces.
- Current auth state: `apps/api` has custom phone/password JWT auth only; `apps/aggregator-web` and `apps/traveler-app` are still starter shells with no real auth flow wired in yet.
- Updated recommendation direction: adopt Better Auth in `apps/api` as the single auth server and mirror the `demo-ui` flow in `apps/aggregator-web` and `apps/traveler-app` rather than building a second custom auth stack.
- Implemented the Better Auth rollout for traveler web and mobile:
  - `apps/api` now mounts Better Auth on the Express backend with email/password, Google social login, and OTP-based email verification.
  - `apps/web` now has login, signup, verify-email, forgot-password, reset-password, and dashboard flows.
  - `apps/app` now has native Google SDK + ID token login, email/password auth, verify-email, password reset, and dashboard routes.
  - Email verification is required for email/password signup/login.
- Existing Google and email/password accounts are linked by email when possible.
- `apps/aggregator-web` now imports the shared shadcn UI from `packages/ui` instead of a local app copy.
- Aggregator-web auth copy now says Moja Bus and includes the shared Google social login component.
