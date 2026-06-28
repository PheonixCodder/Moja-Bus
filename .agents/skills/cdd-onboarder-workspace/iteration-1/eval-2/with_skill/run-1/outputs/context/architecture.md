# Architecture

## Tech Stack
- Next.js (App Router), Supabase (Auth & DB), Tailwind CSS, Shadcn UI, Stripe

## Data Models
- `Plants`: id, name, description, price, imageUrl, stock
- `Orders`: id, userId, total, status, stripePaymentIntentId
