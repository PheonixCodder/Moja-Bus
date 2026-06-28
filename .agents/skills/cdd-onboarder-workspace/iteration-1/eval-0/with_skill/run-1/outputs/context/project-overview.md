# Project Overview

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
