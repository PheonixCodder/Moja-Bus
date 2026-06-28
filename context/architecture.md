# Architecture

## Tech Stack
- TypeScript across the repo.
- Next.js 16 and React 19 for web.
- Expo SDK 56, Expo Router, and React Native 0.85 for mobile.
- Express API with Prisma 7 and PostgreSQL.
- Tailwind CSS 4, shadcn/ui for web, NativeWind for mobile.
- Shared workspace packages for config, schemas, theme, UI, API client, shared logic, and db access.

## Folder Structure
```text
apps/
  operator-web/   # operator/admin web
  aggregator-web/ # passenger web
  traveler-app/   # passenger mobile
  agent-app/      # deferred legacy staff surface
  driver-app/     # deferred legacy staff surface
  api/
packages/
  ui/
  theme/
  schemas/
  config/
  db/
  api-client/
  shared/
```

## Data Models
- Auth: users, roles, access tokens, refresh tokens.
- Operator domain: companies, stations, fleet, routes, schedules, pricing, manifests, finance, admin permissions.
- Traveler domain: search results, trips, seats, bookings, payments, tickets, notifications, trip history.
- Legacy staff domain: walk-in sales, offline sync, trip check-in, QR scans, trip status updates.

## Architectural Invariants
- Apps never talk to the database directly.
- `apps/api` owns persistence, authorization, payment orchestration, and notification triggers.
- Shared packages must stay platform-neutral and pure.
- Web UI lives in `packages/ui`; mobile UI relies on `@moja/theme` and NativeWind.
- All seat, booking, and ticket state changes must flow through the API.
- Offline ticket access must work without network connectivity after a successful sync or booking.
- Agent and driver workflows stay deferred until the 3-app product needs them again.
