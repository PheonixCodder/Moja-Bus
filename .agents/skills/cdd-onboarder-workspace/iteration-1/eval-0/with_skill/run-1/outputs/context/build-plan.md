# Build Plan

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
