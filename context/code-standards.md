# Code Standards & Engineering Guidelines

## 1. TypeScript & Static Typing
- Use TypeScript with strict mode enabled.
- Avoid `any` unless wrapping an untyped external dependency, and always document the exception.
- Provide explicit return types on exported services, tRPC router procedures, and database helper functions.
- Keep domain types in `@moja/types` or `@moja/schemas` to enable seamless contract parity across `web`, `traveler-app`, and `driver-app`.

---

## 2. Framework & UI Conventions
- **Web (`apps/web`)**:
  - Follow shadcn/ui composition conventions with Tailwind CSS.
  - Separate server components/pages from client components (mark client-side interactives with `'use client'`).
  - Use `nuqs` for type-safe URL search parameter management.
  - Access backend state via `@/trpc/client`.
- **Mobile (`apps/traveler-app` and `apps/driver-app`)**:
  - Use Expo Router with file-based routing and typed route links.
  - Style with NativeWind utility classes matching design tokens from `@moja/theme`.
  - Handle offline and poor network states gracefully with optimistic updates and local caches.
- **Shared Components (`packages/ui`)**:
  - Keep shared UI primitive, headless, and accessible.
  - Never import app-specific business logic or routers inside `@moja/ui`.

---

## 3. API & Procedure Standards (tRPC)
- Every procedure must validate inputs with Zod schemas.
- Route procedure authorization must use appropriate middleware:
  - `publicProcedure`: Unauthenticated public routes (trip search, schedule views).
  - `protectedProcedure`: Authenticated user required.
  - `operatorProcedure`: Enforces valid `companyId` tenancy.
  - `driverProcedure`: Enforces active authenticated driver profile.
  - `adminProcedure`: Enforces super admin or specific admin staff permission keys.
- Never write raw SQL queries with `$queryRawUnsafe`. Use Prisma Client models or parameterized `$queryRaw` with typed template literals.

---

## 4. Notifications & Outbox Pattern
- Transactional messages (cancellations, refunds, delays, verification notices) MUST be enqueued to `NotificationOutbox` inside Prisma `$transaction` blocks.
- Background worker sweeps the outbox every minute and dispatches to Novu.
- Use stable, day-bucketed transaction IDs (`txId`) for deduplication where appropriate.

---

## 5. Naming Conventions & Code Style
- **Files & Directories**: `kebab-case` for general files (e.g. `driver-doc-preview.tsx`, `booking-detail.tsx`).
- **Components**: `PascalCase` (e.g. `DriverDocPreview`, `BookingCard`).
- **Functions & Hooks**: `camelCase` (e.g. `useDriverLocation`, `mintDriverDocUrl`).
- **Database Tables & Fields**: `snake_case` in database, mapped to `camelCase` in Prisma models.
- **Linting & Formatting**: Follow Biome configuration (`biome check --write`).
