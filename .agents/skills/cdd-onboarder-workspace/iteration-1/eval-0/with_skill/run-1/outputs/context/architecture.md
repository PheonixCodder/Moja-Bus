# Architecture

## Tech Stack
- Frontend: Next.js (App Router), React, Tailwind CSS
- Database: PostgreSQL, Prisma ORM
- Services: Stripe (Billing), PostHog (Analytics)

## Folder Structure
- `app/` -> Routing and page components
- `components/` -> Reusable UI components
- `lib/` -> Initialization of Prisma, Stripe, PostHog clients
- `prisma/` -> Database schema definition and migrations

## Data Models
- `User`: id, email, name, stripeCustomerId, stripeSubscriptionId
- `Invoice`: id, userId, clientName, amount, status (paid/unpaid/overdue), dueDate
- `Metric`: id, userId, revenue, invoicesCount, date

## Architectural Invariants
- Database operations must only occur in Server Components or Server Actions.
- All database queries must be scoped to the authenticated `user_id`.
- Stripe webhook events must be validated using the signing secret.
