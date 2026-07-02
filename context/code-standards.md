# Code Standards

## Styling and Framework Conventions
- Use TypeScript with strict types and explicit return types on exported factories and service boundaries.
- Keep UI components small, composable, and platform-specific.
- Passenger and operator web should follow shadcn conventions and shared Tailwind tokens.
- Passenger mobile should use NativeWind classes and shared theme tokens.
- Keep admin features inside the operator web role system instead of a separate application.

## Naming Conventions
- Components: PascalCase
- Hooks and utilities: camelCase
- Routes and route folders: lowercase with clear domain names
- Database models and columns: match Prisma and SQL conventions

## Rules and Patterns
- Keep shared packages pure and free of runtime app dependencies.
- Use tRPC client procedures (`@/trpc/client`) for all data queries and mutations inside web app views instead of `@moja/api-client` or ad hoc fetch.
- Use Zod for validation at procedure inputs and DB mutation schemas.
- Access the database client exclusively via `getPrismaClient()` from `@moja/db` inside tRPC routers and server procedures. Do not import DB client directly on client-side components.
- Keep passenger web and passenger mobile aligned at the contract level, not by sharing UI code.
- Avoid `any` unless a third-party type hole cannot be avoided and is documented.
- Keep user-facing errors clear and operationally useful.
