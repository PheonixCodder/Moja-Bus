# Memory

## Current Working State
- Project: Moja Ride
- Context scaffold: created and updated
- Current product identity: intercity bus marketplace + operator ERP for Côte d'Ivoire
- Phase direction: operator onboarding first, then traveler booking and search
- Product scope: 3 active apps - passenger web, passenger mobile, operator/admin web
- Brand palette: primary pink/magenta (`#ee237c`) with Montserrat font
- Shared shadcn UI now lives in `packages/ui` and is integrated with workspace applications

## Recent Decisions
- Consolidated operator onboarding from 7 route-based pages to a single canonical `/dashboard/operator/onboarding` page.
- Tracked operator onboarding lifecycle using the database (on the `Operator` model) with status enum (`NOT_STARTED`, `IN_PROGRESS`, `COMPLETED`).
- Secured operator dashboard `/dashboard/operator` and onboarding route `/dashboard/operator/onboarding` using Next.js server-side page guards.
- Cleaned up the folder structures by moving onboarding components, API calls, hooks, and views into a separated feature module `apps/web/features/operator`.
- Completely shifted from `apps/api` to `apps/web` (Next.js serverless API routes with tRPC procedure queries/mutations) and planning for total removal of the deprecated Express server in future phases.
- Shifted the database schema, migrations, and prisma client instantiator completely to `packages/db`.

## Next Step
- Implement the passenger search tRPC procedure query (`trips.search`) and build the web and mobile passenger search UIs (Phase 2 Discovery & Search).

## Session Note
- Aligned all workspace context files (`architecture.md`, `build-plan.md`, `code-standards.md`, `library-docs.md`, `ui-registry.md`, `progress-tracker.md`) to reflect the new tRPC procedure API layer, the centralization of database management in `packages/db`, and deprecation of the Express REST API.
- Deduplicated the page headers in all 10 passenger and operator auth views inside `apps/web/features/auth/views` by introducing a shared `AuthHeader` component. Applied the premium pill-badge style from `operator-signup-view.tsx` ("for Business" / "Passenger Portal") universally.
- Fixed the `UNAUTHORIZED` error on accepting staff invitations. Changed the tRPC `invitation.accept` procedure to `publicProcedure`, which updates the user's `emailVerified` to `true` and upgrades their role to `OPERATOR` inside a transaction. Updated the React `InvitationView` handler to perform registration, accept the invitation, and then sign in sequentially.
- Fixed a type error in `apps/web/app/invite/page.tsx` related to `resolvedSearchParams` index signatures.
- Fixed workspace formatting using Biome (`pnpm format`).
- Verified that all workspace packages and apps build cleanly via TypeScript checks, save for pre-existing configuration type mismatches.

