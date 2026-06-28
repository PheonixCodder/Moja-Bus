# Code Standards

## Styling & Framework Conventions
- **React Components**: Define components using functional components with explicit TypeScript interfaces for props. Prefer named exports (`export function Button() {}`) for helper/UI components to improve refactoring ease and import clarity. Use default exports only where Next.js App Router conventions mandate them (`layout.tsx`, `page.tsx`, `error.tsx`).
- **Tailwind Organization**: Write utility classes in a logical sequence: Layout (flex, grid, block), Sizing (w-, h-), Spacing (p-, m-), Typography (text-), Colors & Backgrounds (bg-, text-color), Borders (border-, rounded-), and Interactivity/Transitions (transition-, hover-, duration-).
- **Dynamic Classes**: Utilize the `cn` helper (combining `clsx` and `tailwind-merge`) to conditionally join Tailwind utility classes without specificity conflicts.
- **State Allocation**: Prefer local page state and Next.js URL query parameters (`searchParams`) for UI filters, tab selections, and list searching to maintain shareable app states. Resort to Context Providers only for broad application contexts (e.g., authentication, global theme).

## Naming Conventions
- **React Components**: PascalCase (e.g., `InvoiceTable.tsx`, `MetricCard.tsx`).
- **Files & Pages**: kebab-case (e.g., `create-invoice-modal.tsx`, `route.ts`).
- **Hooks**: camelCase prefixed with "use" (e.g., `useInvoiceData.ts`).
- **Prisma Schema Tables / Columns**: CamelCase for Prisma model names but mapped to snake_case for PostgreSQL tables using `@map` or `@@map` declarations (e.g., `stripeCustomerId` maps to `stripe_customer_id` in PostgreSQL).
- **Environment Variables**: UPPER_SNAKE_CASE (e.g., `DATABASE_URL`, `STRIPE_WEBHOOK_SECRET`).

## Rules & Patterns
- **TypeScript Strictness**: Keep strict compiler flags active. Do not bypass compiler type checking with `any`. Make use of union types and assertions only when necessary.
- **Server Action Contract**: Every Server Action must return a standardized JSON structure with consistent types:
  ```typescript
  type ActionResponse<T> = 
    | { success: true; data: T } 
    | { success: false; error: string };
  ```
- **Error Boundaries**: Handle unexpected page runtime errors gracefully using Next.js `error.tsx` boundaries at layout levels. Use standard `try-catch` blocks within all API Handlers and Server Actions to return readable messages instead of spilling raw system logs to client screens.
- **Console Instrumentation**: Prefix application console statements with the origin module in brackets (e.g., `console.error('[Stripe Webhook Error]', error)` or `console.log('[PostHog Event]', eventName)`) to simplify telemetry analysis.
