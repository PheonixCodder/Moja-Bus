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
- Use `@moja/api-client` for API access instead of ad hoc fetch logic.
- Use Zod for request and response validation at the API boundary.
- Keep Prisma access inside the API and repository layer.
- Keep passenger web and passenger mobile aligned at the contract level, not by sharing UI code.
- Avoid `any` unless a third-party type hole cannot be avoided and is documented.
- Keep user-facing errors clear and operationally useful.
