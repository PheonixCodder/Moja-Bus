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
- Prisma is hosted inside the shared package `packages/db`.
- Use the lazy database client creator `getPrismaClient()` from `@moja/db` to access the database.
- Keep all database procedures and mutations encapsulated within tRPC server procedures (`apps/web/trpc/routers`).
- Financial amounts and balances are strictly cast as `BigInt` inside the DB schema. Downcast them to `Number()` only at the tRPC boundary, and ensure inputs pass `Number.isSafeInteger()` before persisting.

## API Client and State
- Use tRPC client procedures (`@/trpc/client`) as the main API layer for the web app.
- tRPC internally uses React Query/TanStack Query for server state caching.
- Use Zustand for local UI state only.

## Payments
- Treat Orange Money, MTN MoMo, and Wave as the primary payment providers.
- Keep payment integration behind API services and provider adapters.
- Use a stable abstraction so the web and mobile apps do not know provider internals.

## Notifications
- We use the **Novu SDK** (`@novu/node`) for cross-channel notification orchestration (Email, SMS, Push, In-App).
- Ensure all dynamic variables passed to Novu email templates are properly escaped using `escapeHtml()` to prevent injection attacks.
- Treat SMS as the reliability backstop when data is weak or unavailable.
