# Library Docs

Project-specific usage patterns for every third-party library in this project. This file only covers how we use each library in this specific project — rules, patterns, and constraints.

Read the relevant section before implementing any feature that touches these libraries.

---

## Prisma (ORM)
We use Prisma to communicate with our PostgreSQL database.

### Initialization & Singleton Pattern
To prevent creating redundant database connections during development hot reloads, the Prisma Client is cached globally in `lib/prisma.ts`:
```typescript
import { PrismaClient } from '@prisma/client';

const prismaClientSingleton = () => {
  return new PrismaClient();
};

type PrismaClientSingleton = ReturnType<typeof prismaClientSingleton>;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClientSingleton | undefined;
};

export const prisma = globalForPrisma.prisma ?? prismaClientSingleton();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```

### Key Rules
- **Import Location**: Always import the singleton as `import { prisma } from '@/lib/prisma'`.
- **Query Scoping**: Every write, update, delete, or read query for business data must include the user's ID inside the query filter. Example:
  ```typescript
  const invoices = await prisma.invoice.findMany({
    where: { userId: currentUserId },
    include: { items: true },
  });
  ```
- **Relational Integrity**: Always use transaction blocks (`prisma.$transaction`) when creating or modifying parent-child documents like `Invoice` and `InvoiceItem` concurrently to prevent orphan records.

---

## Stripe (Payments & Invoicing)
We use Stripe to collect invoice payments and handle customer subscriptions.

### Initialization
Initialized in `lib/stripe.ts` using the official Stripe Node.js SDK:
```typescript
import Stripe from 'stripe';

if (!process.env.STRIPE_SECRET_KEY) {
  throw new Error('STRIPE_SECRET_KEY is missing from environment variables.');
}

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, {
  apiVersion: '2023-10-16', // Ensure sticky SDK API version
  typescript: true,
});
```

### Client Redirects to Checkout
We generate checkout pages server-side and pass the redirection URL to the client:
```typescript
const session = await stripe.checkout.sessions.create({
  payment_method_types: ['card'],
  line_items: [{ price_data: { ... }, quantity: 1 }],
  mode: 'payment',
  success_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices?status=success`,
  cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/dashboard/invoices?status=cancelled`,
});
```

### Stripe Webhooks Validation
Webhook event payloads must verify signatures using the raw request buffer to avoid parsing discrepancies.
```typescript
import { NextResponse } from 'next/server';
import { stripe } from '@/lib/stripe';

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get('stripe-signature') as string;
  
  let event;
  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    );
  } catch (err) {
    return NextResponse.json({ error: 'Webhook signature verification failed' }, { status: 400 });
  }
  // Process event...
}
```

---

## PostHog (Analytics)
We use PostHog to track product engagement, page metrics, and funnel conversion rates.

### Client Provider Setup
Wrap the app layout in a client-side provider `components/providers/PostHogProvider.tsx`:
```typescript
'use client';
import posthog from 'posthog-js';
import { PostHogProvider } from 'posthog-js/react';

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
    capture_pageview: false, // Pageviews captured manually in router transitions
  });
}

export function AppPostHogProvider({ children }: { children: React.ReactNode }) {
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
```

### Server-Side Tracking & Event Flush
For server-side actions (e.g. tracking payment confirmations), we initialize the Node PostHog client, capture the event, and flush immediately:
```typescript
import { PostHog } from 'posthog-node';

export const posthogNode = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
  host: process.env.NEXT_PUBLIC_POSTHOG_HOST || 'https://app.posthog.com',
});

// Within a Server Action or Webhook Route
posthogNode.capture({
  distinctId: userId,
  event: 'invoice_paid',
  properties: { amount: invoiceAmount },
});
await posthogNode.shutdownAsync(); // Flush event queues
```
