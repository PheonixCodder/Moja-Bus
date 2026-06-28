# Project Overview

## About the Project
Moja Bus is a digital intercity travel platform for Cote d'Ivoire. The v1 product has three active surfaces: passenger web, passenger mobile, and operator/admin web.

## The Problem It Solves
Long-distance road travel is still fragmented, physical, and manual. Passengers cannot reliably see schedules, seat availability, or prices ahead of time. Operators rely on paper logs and local workflows that leak inventory and revenue. Staff and drivers need a shared system that works even when connectivity is weak.

## Main Personas
- Travelers who search, compare, book, pay, and carry tickets on web or mobile.
- Operators and admins who manage KYC, fleet, routes, schedules, manifests, and finance.
- Future staff users who may later receive dedicated agent or driver tools, but not in v1.

## Pages and Surfaces
- `operator-web/` - operator/admin dashboard for onboarding, fleet, routes, schedules, manifests, sales, and finance.
- `aggregator-web/` - passenger web for public search, comparison, booking, payment, and history.
- `traveler-app/` - passenger mobile app for search, seat selection, checkout, wallet, and offline tickets.
- `agent-app/` - deferred legacy staff surface, not part of v1 product scope.
- `driver-app/` - deferred legacy staff surface, not part of v1 product scope.
- `apps/api/` - server API, auth, persistence, payments, notifications, and shared business rules.

## Navigation
- Passenger web should use a simple public search and booking flow with lightweight navigation and no dashboard chrome.
- Passenger mobile should use a task-first stack with only the minimal tabs needed for search, tickets, and account.
- Operator/admin web should use a left sidebar plus top utility bar for dense operational work.

## Core User Flow
1. An operator registers the business, stations, fleet, routes, schedules, and prices.
2. A traveler searches from origin to destination and compares departures across operators.
3. The traveler selects a trip, chooses seats, enters passenger details, and pays or reserves.
4. The app issues a digital ticket and stores it locally for offline access.
5. The operator/admin dashboard manages inventory, manifests, walk-in sales, and finance.
