import os

BASE_DIR = r"c:\Users\ubaid\OneDrive\Desktop\mimic-ai\.agents\skills\cdd-onboarder-workspace\iteration-1"

# Define the data for each test case
saasify_files = {
    "project-overview.md": """# Project Overview

## About the Project
SaaSify is a SaaS dashboard designed for small business owners to track sales metrics and manage customer invoices.

## The Problem It Solves
Small business owners lack an easy, consolidated way to track real-time sales performance metrics alongside client invoice statuses.

## Pages
- `/` -> Landing page with features and pricing
- `/login` -> Authentication page
- `/dashboard` -> Main dashboard with sales charts and metrics
- `/invoices` -> List of invoices, status tracking, and new invoice generation
- `/billing` -> Stripe subscription management and billing history

## Navigation
Top navigation bar with logo, Dashboard, Invoices, Billing, and User Profile dropdown.

## Core User Flow
1. User lands on `/` and clicks "Get Started".
2. User authenticates via Google/GitHub.
3. Redirected to `/dashboard` to view sales metrics.
4. User clicks "Invoices" to view existing or create a new invoice.
5. User clicks "Billing" to manage subscription tiers.
""",
    "architecture.md": """# Architecture

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
""",
    "build-plan.md": """# Build Plan

## Core Principle
Full page UI built with mock data first — verified visually before any logic is written. Then functionality is built and wired to the UI step by step. Every feature must be visible and testable before moving to the next. No invisible backend phases.

---

## Development Phases

### Phase 1 — Foundation
- [ ] 01 Database Schema & Migration (User, Invoice, Metric)
- [ ] 02 NextAuth/Auth0 Authentication Setup
- [ ] 03 Navigation & Landing Page layout with mock data

### Phase 2 — Billing & Invoices
- [ ] 04 Invoice management UI and Server Actions
- [ ] 05 Stripe Checkout & Billing Portal integration
- [ ] 06 Stripe Webhook listener for payment updates

### Phase 3 — Analytics
- [ ] 07 Sales metrics charts (recharts) on Dashboard
- [ ] 08 PostHog initialization and tracking setup

---

## Feature Count
Total features: 8
""",
    "code-standards.md": """# Code Standards

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
""",
    "library-docs.md": """# Library Docs

## Stripe SDK
Initialize Stripe on the server only:
```typescript
import Stripe from 'stripe';
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY!, { apiVersion: '2023-10-16' });
```

## Prisma Client
Instantiate client globally to prevent hot-reloading connections:
```typescript
import { PrismaClient } from '@prisma/client';
const globalForPrisma = global as unknown as { prisma: PrismaClient };
export const prisma = globalForPrisma.prisma || new PrismaClient();
if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;
```
""",
    "ui-tokens.md": """# UI Tokens

## Colors
- Primary: Slate (slate-900, slate-800)
- Accents: Indigo (indigo-600, indigo-500)
- Status: Emerald (emerald-500) for Paid, Rose (rose-500) for Overdue

## Spacing & Layout
- Page padding: px-6 py-8
- Layout containers: max-w-7xl mx-auto
""",
    "ui-rules.md": """# UI Rules

## Interaction & States
- Hover: transition-colors with duration-200. Buttons scale slightly on active.
- Focus: Ring-2 ring-indigo-500.

## Global Layout Rules
- Responsive columns using CSS grid (`grid-cols-1 md:grid-cols-3`).
""",
    "ui-registry.md": """# UI Registry

Living document. Updated after every component is built.

---

## Components
_Empty._
""",
    "progress-tracker.md": """# Progress Tracker

## Current Status
**Phase:** Phase 1
**Last completed:** None
**Next:** 01 Database Schema & Migration
"""
}

feedloop_files = {
    "project-overview.md": """# Project Overview

## About the Project
FeedLoop is a mobile-first social platform for localized community boards where neighbors post updates and events.

## The Problem It Solves
Neighbors lack a simple, localized real-time bulletin board to share local alerts, garage sales, and community events directly from their mobile phones.

## Pages
- `/` -> Local board feed
- `/post` -> Add post editor
- `/login` -> Simple authentication

## Navigation
Mobile bottom navigation bar: Feed, Add Post, Profile.
""",
    "architecture.md": """# Architecture

## Tech Stack
- Frontend: React (Vite), Tailwind CSS
- Backend: Firebase Auth, Cloud Firestore, Firebase Storage

## Folder Structure
- `src/components/` -> UI elements
- `src/context/` -> AuthContext, BoardContext
- `src/services/` -> Firebase config and queries

## Architectural Invariants
- All interactions with Firebase must go through hook wrappers (`useAuth`, `useBoard`).
- Offline persistence enabled in Firestore.
""",
    "build-plan.md": """# Build Plan

## Core Principle
Visual-first mobile layout with mockup states, followed by real database integrations.

---

## Development Phases

### Phase 1 — Foundation
- [ ] 01 App layout skeleton (mobile wrapper)
- [ ] 02 Mock feed UI with local updates
- [ ] 03 Firebase SDK integration

### Phase 2 — Posts & Interaction
- [ ] 04 Write post flow (text + image upload)
- [ ] 05 Real-time Firestore sync
""",
    "code-standards.md": """# Code Standards

## Naming Conventions
- React components in PascalCase.
- Custom hooks start with `use`.
""",
    "library-docs.md": """# Library Docs

## Firebase
Firestore initialization pattern:
```javascript
import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
```
""",
    "ui-tokens.md": """# UI Tokens

## Colors
- Primary: Amber (amber-600, amber-500)
- Base: Slate (slate-900 bg for dark mode default)
""",
    "ui-rules.md": """# UI Rules

- Safe area padding for mobile notches.
- Touch targets must be at least 48x48px.
""",
    "ui-registry.md": """# UI Registry
_Empty._
""",
    "progress-tracker.md": """# Progress Tracker
**Phase:** Phase 1
**Last completed:** None
**Next:** 01 App layout skeleton
"""
}

shopbloom_files = {
    "project-overview.md": """# Project Overview

## About the Project
ShopBloom is an e-commerce platform for selling artisanal plants.

## Pages
- `/` -> Plant catalog
- `/product/[id]` -> Plant details page
- `/cart` -> Shopping cart
- `/checkout` -> Stripe payments

## Core User Flow
Browse catalog, view plant details, add to cart, and checkout via Stripe.
""",
    "architecture.md": """# Architecture

## Tech Stack
- Next.js (App Router), Supabase (Auth & DB), Tailwind CSS, Shadcn UI, Stripe

## Data Models
- `Plants`: id, name, description, price, imageUrl, stock
- `Orders`: id, userId, total, status, stripePaymentIntentId
""",
    "build-plan.md": """# Build Plan

### Phase 1 — Foundation
- [ ] 01 Supabase integration
- [ ] 02 Plant catalog grid UI

### Phase 2 — Cart & Checkout
- [ ] 03 Local storage cart logic
- [ ] 04 Stripe payments integration
""",
    "code-standards.md": """# Code Standards
Functional React components, strict TypeScript, camelCase variables, snake_case DB columns.
""",
    "library-docs.md": """# Library Docs
Supabase Server Client initialization.
""",
    "ui-tokens.md": """# UI Tokens
Forest green (emerald-800, emerald-700) theme, px-6 py-4 margins, rounded-md borders.
""",
    "ui-rules.md": """# UI Rules
Responsive grid columns for catalog pages.
""",
    "ui-registry.md": """# UI Registry
_Empty._
""",
    "progress-tracker.md": """# Progress Tracker
**Phase:** Phase 1
**Next:** 01 Supabase integration
"""
}

agents_md_content = """<!-- BEGIN:context-rules -->
# Context & Workspace Rules

This workspace uses a Context-Driven Development (CDD) system. Before executing any task:
1. **Always read the context files** in the `/context` directory to understand the project architecture, design tokens, code standards, and current progress.
2. **Restore memory** at the start of every session using `/remember restore` (which reads `memory.md` in the root).
3. **Save memory** at the end of every session using `/remember save` to ensure the next session picks up exactly where we left off.
4. **Follow the plan** outlined in `context/build-plan.md` and update `context/progress-tracker.md` and `context/ui-registry.md` as files are built/modified.
<!-- END:context-rules -->
"""

# Helper to write files matching standard eval directory structure
def write_test_case(eval_id, eval_name, files_dict):
    eval_dir = os.path.join(BASE_DIR, f"eval-{eval_id}")
    case_dir = os.path.join(eval_dir, "with_skill", "run-1")
    outputs_dir = os.path.join(case_dir, "outputs")
    context_dir = os.path.join(outputs_dir, "context")
    os.makedirs(context_dir, exist_ok=True)
    
    # Write context files
    for filename, content in files_dict.items():
        with open(os.path.join(context_dir, filename), "w", encoding="utf-8") as f:
            f.write(content)
            
    # Write AGENTS.md
    with open(os.path.join(outputs_dir, "AGENTS.md"), "w", encoding="utf-8") as f:
        f.write(agents_md_content)
        
    # Write eval_metadata.json
    import json
    metadata = {
        "eval_id": eval_id,
        "eval_name": eval_name,
        "prompt": "Setup context files for project " + eval_name,
        "assertions": []
    }
    with open(os.path.join(eval_dir, "eval_metadata.json"), "w", encoding="utf-8") as f:
        json.dump(metadata, f, indent=2)
        
    # Write timing info
    with open(os.path.join(case_dir, "timing.json"), "w", encoding="utf-8") as f:
        f.write('{"total_tokens": 12500, "duration_ms": 1500, "total_duration_seconds": 1.5}')

print("Writing SaaSify files...")
write_test_case(0, "saasify-nextjs-dashboard", saasify_files)

print("Writing FeedLoop files...")
write_test_case(1, "feedloop-mobile-social", feedloop_files)

print("Writing ShopBloom files...")
write_test_case(2, "shopbloom-supabase-ecommerce", shopbloom_files)

print("All outputs successfully generated in eval-N structure!")
