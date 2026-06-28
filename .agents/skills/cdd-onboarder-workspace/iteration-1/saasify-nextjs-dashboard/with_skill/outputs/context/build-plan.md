# Build Plan

## Core Principle
Full page UI built with mock data first — verified visually before any logic is written. Then functionality is built and wired to the UI step by step. Every feature must be visible and testable before moving to the next. No invisible backend phases.

---

## Development Phases

### Phase 1 — Foundation (Auth, DB schema, Home layout)
- [ ] 01 **Database Schema & Migration**: Set up PostgreSQL connection, write Prisma schema (User, Invoice, InvoiceItem), run migrations, and write a seed script with mock data.
- [ ] 02 **Authentication Setup**: Install NextAuth.js, configure NextAuth API route handlers, write session providers, and design a custom, elegant login page at `/login`.
- [ ] 03 **Navigation & Shell Layout**: Design a sticky top navbar for the landing page (`/`) and a premium collapsible navigation sidebar and top header bar for the `/dashboard` app shell.

### Phase 2 — Billing & Invoices (Stripe Checkout & Billing Dashboard)
- [ ] 04 **Invoice Management UI**: Build the layout for `/dashboard/invoices` using mock data, featuring a list table, invoice search, status pill badge filters, and a "Create Invoice" modal overlay.
- [ ] 05 **Invoice Functional Wiring**: Create Server Actions for fetching, filtering, creating, and deleting invoices in the database via Prisma, connecting them to the Invoice UI.
- [ ] 06 **Stripe Checkout Integration**: Write an API Route Handler to generate Stripe Checkout sessions for invoices and expose checkout URLs to customers.
- [ ] 07 **Stripe Webhooks & Invoice Updates**: Build the `/api/webhooks/stripe` route handler to listen for `checkout.session.completed` events, updating invoice status to `PAID` in the DB.
- [ ] 08 **Billing Dashboard & Stripe Portal**: Design the `/dashboard/billing` page UI and write a Server Action to generate Stripe Customer Portal sessions for subscription adjustments.

### Phase 3 — Analytics (Charts & Metrics Stats)
- [ ] 09 **Dashboard Overview KPI Cards**: Design the UI dashboard dashboard page (`/dashboard`) showing cards for revenue, unpaid invoices, conversion rate, and recent activities using mock data first.
- [ ] 10 **Dashboard Data Wiring**: Fetch live statistics via optimized Prisma aggregation queries to replace mock data in the dashboard overview panels.
- [ ] 11 **PostHog Integration & Tracking**: Install PostHog React providers, write initialization helpers, and trigger custom event tracking for actions like user signup, invoice creation, and checkout initiation.
- [ ] 12 **Detailed Analytics Visualizations**: Construct the `/dashboard/analytics` page layout and integrate interactive data charts (revenue bar charts, invoice payment time intervals area charts).

---

## Feature Count
- **Phase 1 (Foundation)**: 3 checklist items (01 - 03)
- **Phase 2 (Billing & Invoices)**: 5 checklist items (04 - 08)
- **Phase 3 (Analytics)**: 4 checklist items (09 - 12)
- **Total Features**: 12 items
