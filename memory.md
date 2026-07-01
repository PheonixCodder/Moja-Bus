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
- Removed old route-based page files and components.

## Next Step
- Implement the passenger search API endpoint (`GET /api/v1/trips/search`) and build the web and mobile passenger search UIs (Phase 2 Discovery & Search).

## Session Note
- Replaced all legacy Select components across all operator views (onboarding, fleet, schedules, dispatcher trips, terminals) with searchable Combobox components.
- Upgraded onboarding locations step city field to query CI cities dynamically from the database and updated the backend routes and Zod schemas to map and save `cityId`.
- Upgraded the schedule wizard date picker inputs to use Popover-based shadcn Calendars (`@moja/ui/components/ui/calendar`).
- Unified workspace formatting using Biome and verified successful TS typecheck builds.
- Fixed 5 critical database mutation discrepancies (methods, paths, properties, and date/enum validation schemas) between the web client and backend API.
- Completely removed placeholder Driver assignments/IDs from the Trip database table, models, schemas, and UI (saving layout DRIVER_AREA).
- Implemented a Stripe/Vercel-style Company Settings (Control Center) view and routes supporting Profile forms, bank details, compliance document cards (decoupled upload adapter), a vertical verification pipeline, and a Company Health progress card.
- Mounted settings page at `/dashboard/operator/settings` and integrated a real-time verification status badge into the operator sidebar header.

