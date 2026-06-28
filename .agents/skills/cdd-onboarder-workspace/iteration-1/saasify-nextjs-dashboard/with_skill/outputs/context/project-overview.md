# Project Overview

## About the Project
SaaSify is a premium SaaS dashboard application designed specifically for small business owners. It provides a centralized platform to track real-time sales metrics, manage and issue customer invoices, and analyze customer behaviors.

## The Problem It Solves
Small business owners often struggle with fragmented tools: using one system for invoicing, another for payment processing, and Excel sheets or raw databases for tracking sales metrics. SaaSify consolidates these features into a unified, elegant interface. By connecting Stripe for seamless payments and billing and PostHog for product and user analytics, business owners gain clear visibility into their revenue, pending invoices, and growth trends without the cognitive load of navigating multiple platforms.

## Pages
- `/` -> Public landing page highlighting features, pricing models, and CTA for registration.
- `/login` -> Clean authentication gateway (Login & Sign Up options).
- `/dashboard` -> The main overview panel showing key business KPIs (e.g., Monthly Recurring Revenue, Active Invoices, Recent Payments, Quick Actions).
- `/dashboard/invoices` -> A detailed invoices list with search, status filters (Paid, Pending, Overdue), and a "Create Invoice" modal interface.
- `/dashboard/invoices/[id]` -> Detailed view of a single invoice, displaying line items, client details, payment logs, and access to payment links.
- `/dashboard/billing` -> Subscription and payment settings showing the user's current SaaSify plan, billing history, and a link to the Stripe Customer Portal.
- `/dashboard/analytics` -> Specialized charts and data visualizations for sales trends, customer acquisition, and invoice fulfillment times.

## Navigation
- **Landing Page Navigation**: Sleek, sticky top navbar with brand logo, links to features/pricing, and "Sign In" / "Get Started" call-to-actions.
- **App Shell Navigation**:
  - A persistent, responsive left-hand sidebar containing the navigation menu (Dashboard, Invoices, Billing, Analytics).
  - Collapsible on mobile viewports into a bottom navigation bar or a slide-out drawer menu.
  - Top header bar displaying breadcrumbs, search, notification alerts, and a user profile dropdown (with access to settings and log out).

## Core User Flow
1. **Landing & Registration**: User visits `/`, reads about SaaSify, and clicks "Get Started" to sign up on `/login`.
2. **First-Time Setup**: User completes onboarding, enters basic company details, and lands on `/dashboard`.
3. **Invoice Creation**: User navigates to `/dashboard/invoices`, clicks "New Invoice", fills out customer and line item details, and saves.
4. **Customer Payment**: SaaSify generates a Stripe Checkout link. The customer pays online via card, ACH, or Apple Pay.
5. **Dashboard Reflection**: Once payment succeeds, Stripe Webhooks update the invoice status to "Paid" in the PostgreSQL DB via Prisma. The dashboard metrics update in real-time.
6. **Analytics Deep-Dive**: The user checks `/dashboard/analytics` to view detailed charts showing sales performance and invoice fulfillment speeds.
7. **Billing Management**: The user manages their own SaaSify subscription on `/dashboard/billing` using the Stripe Billing Portal.
