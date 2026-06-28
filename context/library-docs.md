# Library Docs

## Next.js
- Use App Router.
- Prefer server components by default.
- Add client components only when interactivity requires them.
- Passenger web and operator web should consume `@moja/ui` and the shared theme tokens.

## shadcn/ui
- Web only.
- Generated components belong in `packages/ui`.
- Match existing component patterns before introducing new variants.
- Keep shadcn aligned with Tailwind v4 and the shared theme package.

## Expo and NativeWind
- Passenger mobile only in v1.
- Import shared theme tokens from `@moja/theme`.
- Use NativeWind class names for layout and styling.
- Keep local offline storage and ticket access in the mobile app where needed.

## Prisma
- Prisma is used only in `apps/api`.
- Use the lazy Prisma client from the db package.
- Keep all database writes behind repositories or service boundaries.

## API Client and State
- Use `@moja/api-client` as the shared HTTP layer.
- Use React Query for server state.
- Use Zustand for local UI state only.

## Payments
- Treat Orange Money, MTN MoMo, and Wave as the primary payment providers.
- Keep payment integration behind API services and provider adapters.
- Use a stable abstraction so the web and mobile apps do not know provider internals.

## Notifications
- Default to Expo push notifications plus SMS fallback.
- Treat SMS as the reliability backstop when data is weak or unavailable.

## Deferred Staff Apps
- Agent and driver apps remain in the repo as deferred surfaces, but they are not part of the 3-app v1 product context.
- If they return later, treat them as separate mobile modules with their own contracts and offline rules.
