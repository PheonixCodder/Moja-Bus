# Architecture

## Tech Stack
- **Framework**: Next.js 14 (App Router, React Server Components, Server Actions)
- **Styling**: Tailwind CSS
- **Database**: PostgreSQL (hosted on Supabase or Neon)
- **ORM**: Prisma Client & CLI
- **Authentication**: NextAuth.js (or Auth.js) with Google/Email passwordless providers
- **Payments**: Stripe (Checkout, Customer Portal, Webhooks)
- **Analytics**: PostHog (PostHog React Provider & Node SDK)

## Folder Structure
```text
saasify/
├── app/                  # Next.js App Router Pages & API Route Handlers
│   ├── (auth)/           # Authentication routes (login, register)
│   ├── (dashboard)/      # Authenticated dashboard app shell routes
│   │   ├── dashboard/    # Main panel UI (/dashboard)
│   │   ├── invoices/     # Invoices listing & detail views
│   │   ├── billing/      # Subscription settings & Stripe portal trigger
│   │   ├── analytics/    # Deep dive PostHog analytics integration
│   │   └── layout.tsx    # Dashboard sidebar/header shell layout
│   ├── api/              # API Route Handlers (Stripe webhooks, PostHog proxies)
│   │   └── webhooks/
│   │       └── stripe/   # Stripe webhook handler
│   ├── layout.tsx        # Root layout (fonts, providers)
│   └── page.tsx          # Public marketing landing page
├── components/           # Shared UI components
│   ├── ui/               # Primitive base components (buttons, inputs, cards)
│   ├── dashboard/        # Dashboard metrics and dashboard-specific panels
│   ├── invoices/         # Invoice creation modal, invoice table lists
│   └── navigation/       # Sidebar and Top navigation components
├── hooks/                # Custom React Hooks
├── lib/                  # Initialization logic for clients/servers
│   ├── prisma.ts         # Prisma Client singleton
│   ├── stripe.ts         # Stripe client setup & helpers
│   └── posthog.ts        # PostHog client configuration
├── prisma/               # Database schemas and migration files
│   └── schema.prisma     # Core database schema definitions
└── types/                # Core TypeScript type definitions and interfaces
```

## Data Models
We use Prisma to map PostgreSQL tables. Key models include:

### User / Account Models
```prisma
model User {
  id                    String    @id @default(uuid())
  name                  String?
  email                 String    @unique
  emailVerified         DateTime?
  image                 String?
  createdAt             DateTime  @default(now())
  updatedAt             DateTime  @updatedAt
  
  // Stripe integration fields
  stripeCustomerId       String?   @unique
  stripeSubscriptionId   String?   @unique
  stripePriceId          String?
  stripeCurrentPeriodEnd DateTime?
  
  // Relations
  invoices              Invoice[]
}
```

### Invoicing Models
```prisma
enum InvoiceStatus {
  PAID
  PENDING
  OVERDUE
  DRAFT
}

model Invoice {
  id             String        @id @default(uuid())
  invoiceNumber  String        @unique // Format: INV-YYYY-XXXX
  customerName   String
  customerEmail  String
  amount         Decimal       @db.Decimal(10, 2)
  status         InvoiceStatus @default(PENDING)
  dueDate        DateTime
  createdAt      DateTime      @default(now())
  updatedAt      DateTime      @updatedAt
  
  // Relations
  userId         String
  user           User          @relation(fields: [userId], references: [id], onDelete: Cascade)
  items          InvoiceItem[]
}

model InvoiceItem {
  id          String   @id @default(uuid())
  description String
  quantity    Int      @default(1)
  price       Decimal  @db.Decimal(10, 2)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  invoiceId   String
  invoice     Invoice  @relation(fields: [invoiceId], references: [id], onDelete: Cascade)
}
```

## Architectural Invariants
1. **Multi-Tenant Scoping**: EVERY database query fetching user data (e.g. Invoices, Payments, User Info) MUST be scoped to the currently authenticated user's ID (`userId` fetched from NextAuth/Auth.js). Never allow queries without a strict `where: { userId }` clause.
2. **Server-Side DB Access**: Database access must only take place in Server Components, Server Actions, or API Route Handlers. Never import Prisma Client inside client-side components (designated by `'use client'`).
3. **Stripe Webhook Signature Verification**: All Stripe webhook endpoints must verify the request signature (`stripe-signature`) using the raw request body and the local webhook secret. Do not parse JSON prior to verification.
4. **Separation of Stripe and Database State**: Always treat Stripe as the source of truth for subscription status. The local DB fields (`stripeSubscriptionId`, `stripeCurrentPeriodEnd`) serve as a high-performance cache and must only be updated via verified Stripe webhook events (e.g., `customer.subscription.created`, `customer.subscription.updated`).
