# Code Standards

## Styling & Framework Conventions
- Next.js functional components using TypeScript.
- Tailwind utility classes organized logically.

## Naming Conventions
- React Components: PascalCase (e.g., `InvoiceCard.tsx`)
- Server Actions & Helpers: camelCase (e.g., `createInvoice.ts`)
- Database Schema: camelCase for models, snake_case for tables/columns

## Rules & Patterns
- Standardize on `try/catch` in Server Actions with structured error responses.
- Define explicit Zod schemas for all form validations.
