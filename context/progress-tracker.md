# Progress Tracker

**Update this file after every completed feature.** Any agent reading this should immediately know what is done, what is in progress, and what is next.

---

## Current Status

**Phase:** Operator ERP Platform Complete — Moving to Passenger Search & Booking Flow
**Last Major Milestone:** All Operator dashboard views (Fleet, Routes, Schedules, Dispatch Board) fully built and wired to real API endpoints
**Next Priority:** Passenger Trip Search (Search endpoint + Web UI + Mobile UI)


---

## Overall Progress Summary

### ✅ Foundation (COMPLETED - 100%)
The base infrastructure, shared packages, and authentication system are fully established.

- [x] **Workspace Setup**
  - [x] Monorepo structure with Turbo
  - [x] pnpm workspaces configured
  - [x] TypeScript configuration across all packages
  - [x] Shared configuration packages

- [x] **Shared Foundation**
  - [x] `@moja/theme` - Design tokens (colors, spacing, typography)
  - [x] `@moja/ui` - Shared shadcn components for web
  - [x] `@moja/auth` - Authentication utilities
  - [x] `@moja/schemas` - Zod validation schemas
  - [x] `@moja/db` - Prisma client and database utilities
  - [x] `@moja/api-client` - API client for frontend apps
  - [x] `@moja/shared` - Shared utilities and types
  - [x] `@moja/config` - Configuration management

- [x] **Authentication System**
  - [x] Better Auth integration
  - [x] Email/password registration with OTP verification
  - [x] Google social login (web)
  - [x] Native Google sign-in (mobile)
  - [x] Session management
  - [x] Password reset flow
  - [x] Email verification

- [x] **App Shells**
  - [x] Mobile app shell with Expo Router
  - [x] Mobile auth-shell component (the file you have open)
  - [x] Web app shell with Next.js App Router
  - [x] Web dashboard shell with sidebar
  - [x] Nested dashboard pages (search, bookings, tickets, settings)

- [x] **Context Documentation**
  - [x] project-overview.md - Complete vision and scope
  - [x] architecture.md - Technical and business architecture
  - [x] progress-tracker.md - This file
  - [x] build-plan.md - Phased development plan
  - [x] code-standards.md - Coding conventions
  - [x] ui-tokens.md - Design system tokens
  - [x] ui-rules.md - UI guidelines

---

### ✅ Platform Data Layer (COMPLETED)
Platform-seeded reference data powering all operator and passenger features.

- [x] **Cities Database** (`City` model)
  - [x] 35 Côte d'Ivoire cities seeded with lat/lng, region, district
  - [x] 7 major hubs flagged (Abidjan, Bouaké, Yamoussoukro, etc.)
  - [x] `GET /api/v1/routes/cities` endpoint for operator dropdowns

- [x] **Bus Types & Seat Layout Templates**
  - [x] 7 bus types seeded (Coaster, Sprinter, Yutong, Higer, King Long, HiAce)
  - [x] 5 platform-default seat layouts seeded (22, 18, 47, 55, 15 seat configs)
  - [x] Grid-based seat template generation (row × col → label e.g. "2B")
  - [x] `GET /api/v1/fleet/bus-types` endpoint
  - [x] `GET /api/v1/fleet/layouts` endpoint (platform defaults + operator custom)

- [x] **Terminal Management** (`CompanyLocation` with `isTerminal` flag)
  - [x] Operator depots from onboarding promoted to bookable passenger terminals
  - [x] `cityId` FK links each terminal to canonical `City`
  - [x] `GET /api/v1/routes/terminals` endpoint (operator-scoped, `isTerminal=true`)

---

### ✅ Operations Backend (COMPLETED)
Full API backend for the Operator ERP platform.

- [x] **Trip Generator Service** (`lib/trip-generator.ts`)
  - [x] Auto-generates 14-day rolling `Trip` records on schedule creation
  - [x] Respects `ServiceCalendar` day-of-week flags
  - [x] Instantiates `TripStop` records from `RouteWaypoint` offsets
  - [x] Instantiates `TripSeat` records from bus `Seat` roster

- [x] **Schedule Calendar & Exceptions** (`ServiceCalendar`, `ServiceException`)
  - [x] Per-day recurrence flags (Mon–Sun)
  - [x] `validFrom` / `validUntil` date window
  - [x] Exception types: CANCELLED, EXTRA_SERVICE, MODIFIED
  - [x] Exception reasons: Holidays (Islamic, Christian, National), Strike, Weather, Maintenance
  - [x] `POST /api/v1/schedules/:id/exceptions` auto-cancels pre-generated trips

- [x] **Fare Matrix** (`Fare` model)
  - [x] Per seat class (ECONOMY, STANDARD, VIP)
  - [x] Per segment (from/to stop order indices — supports intermediate boarding)
  - [x] Fare types: FIXED, PROMO, HOLIDAY_SURGE, EARLY_BIRD
  - [x] Prices stored in XOF (CFA Francs)

- [x] **Trip Operations API**
  - [x] `GET /api/v1/trips` — filterable by status, route, date range
  - [x] `GET /api/v1/trips/:id` — full detail with seat map and stops
  - [x] `PATCH /api/v1/trips/:id/assign` — swap bus or assign driver/assistant
  - [x] `PATCH /api/v1/trips/:id/delay` — log delay minutes, cascade to stops
  - [x] `PATCH /api/v1/trips/:id/cancel` — cancel individual trip run
  - [x] `PATCH /api/v1/trips/:id/status` — lifecycle: BOARDING → DEPARTED → ARRIVED

---

### 🚧 Core Domains (IN PROGRESS)
The main business functionality that makes Moja Ride valuable to passengers.

#### Search Domain (NEXT PRIORITY)
- [ ] **Search API Contract**
  - [ ] Define search endpoint (`GET /api/v1/trips/search`)
  - [ ] Define request parameters (from, to, date, filters)
  - [ ] Define response structure (trip list with metadata)
  - [ ] Define sorting options (price, time, rating)
  - [ ] Define filtering options (bus type, amenities, etc.)

- [ ] **Search Backend**
  - [ ] Implement trip search service (query `Trip` + `TripStop` by terminal pair)
  - [ ] Implement caching strategy (Redis)
  - [ ] Implement pagination
  - [ ] Implement performance optimization

- [ ] **Search Frontend (Web)**
  - [ ] Search form component (from/to city, date)
  - [ ] Search results page
  - [ ] Filter sidebar
  - [ ] Sort controls
  - [ ] Trip card component
  - [ ] Empty state
  - [ ] Loading states

- [ ] **Search Frontend (Mobile)**
  - [ ] Search screen
  - [ ] Date picker
  - [ ] Location autocomplete
  - [ ] Results list
  - [ ] Filter modal

- [x] **Route Management**
  - [x] Route CRUD API
  - [x] Route creation UI (operator)
  - [x] Route list with stops
  - [ ] Route analytics

- [x] **Schedule Management**
  - [x] Schedule CRUD API
  - [x] Recurring schedule logic
  - [x] Schedule creation UI (wizard)
  - [x] Schedule calendar view (preview calendar)

#### Fleet Domain
- [ ] **Fleet Management API**
  - [x] Bus CRUD endpoints
  - [x] Seat layout management
  - [ ] Bus image upload
  - [ ] Fleet analytics

- [x] **Fleet Management UI**
  - [x] Add bus form
  - [x] Bus list view
  - [x] Bus detail view
  - [x] Seat map editor

#### Operator Domain
- [x] **Operator Registration**
  - [x] Refactored company onboarding to single-page flow `/dashboard/operator/onboarding`
  - [x] Added durable onboarding state tracking in Prisma
  - [x] Built snapshot, step-save, and finalize API endpoints
  - [ ] Admin verification UI
  - [ ] Verification email notifications

- [x] **Operator Dashboard Shell**
  - [x] Operator dashboard with complete onboarding routing guards
  - [x] Overview dashboard
  - [x] Fleet management section
  - [x] Route management section
  - [x] Schedule management section
  - [x] Booking management section (Live dispatch manifest & check-in)
  - [x] Global Quick Actions header component
  - [ ] Revenue analytics
  - [ ] Staff management

#### Booking Domain
- [ ] **Booking Flow**
  - [ ] Trip selection
  - [ ] Seat selection UI
  - [ ] Passenger details form
  - [ ] Payment integration
  - [ ] Booking confirmation

- [ ] **Seat Management**
  - [ ] Real-time seat availability
  - [ ] Seat holding mechanism
  - [ ] Double-booking prevention
  - [ ] Seat status tracking

- [ ] **Ticket System**
  - [ ] Digital ticket generation
  - [ ] QR code generation
  - [ ] Offline ticket storage (mobile)
  - [x] Ticket validation (operator) (Live dispatch manifest check-in)

#### Payment Domain
- [ ] **Payment Gateway Integration**
  - [ ] Mobile Money (MTN, Orange, Moov)
  - [ ] Credit/Debit card
  - [ ] Cash payment option
  - [ ] Wallet system

- [ ] **Payment Processing**
  - [ ] Payment initiation
  - [ ] Payment verification
  - [ ] Refund processing
  - [ ] Payment history

#### Passenger Domain
- [ ] **Passenger Profile**
  - [ ] Profile management
  - [ ] Booking history
  - [ ] Notification preferences
  - [ ] Payment methods

- [ ] **Digital Wallet**
  - [ ] Balance tracking
  - [ ] Transaction history
  - [ ] Top-up functionality

#### Review Domain
- [ ] **Review System**
  - [ ] Submit reviews
  - [ ] Rating aggregation
  - [ ] Review moderation
  - [ ] Company responses

#### Notification Domain
- [ ] **Notification System**
  - [ ] Push notifications (mobile)
  - [ ] Email notifications
  - [ ] SMS notifications (fallback)
  - [ ] In-app notifications

---

### 📋 Admin Domain
- [ ] **Admin Dashboard**
  - [ ] Platform overview
  - [ ] Company verification queue
  - [ ] User management
  - [ ] Dispute resolution
  - [ ] Analytics dashboard
  - [ ] System settings

- [ ] **Content Management**
  - [ ] City/location management
  - [ ] Announcement system
  - [ ] FAQ management
  - [ ] Help center

---

### 🎨 UI/UX Polish
- [ ] **Design System Completion**
  - [ ] Finalize brand colors
  - [ ] Create component library
  - [ ] Define interaction patterns
  - [ ] Accessibility audit

- [ ] **Responsive Design**
  - [ ] Mobile-first web experience
  - [ ] Tablet optimization
  - [ ] Desktop optimization

- [ ] **Localization**
  - [ ] French translation
  - [ ] English translation
  - [ ] RTL support (if needed)

---

## Decision Log

### Product Decisions
1. **Product Name**: Moja Ride (confirmed)
2. **Target Market**: Côte d'Ivoire intercity bus transportation
3. **Platform Type**: Two-sided marketplace + ERP system
4. **Apps**: Passenger Web, Passenger Mobile, Operator Portal, Admin Dashboard
5. **Revenue Model**: Commission-based (percentage of each booking)
6. **Payment Methods**: Mobile Money (primary), Cards, Cash
7. **Offline Support**: Mobile app supports offline ticket access

### Technical Decisions
1. **Monorepo**: Using Turbo for build orchestration
2. **Package Manager**: pnpm for efficient dependency management
3. **Frontend Web**: Next.js 16 with App Router
4. **Frontend Mobile**: Expo SDK 56 with Expo Router
5. **Backend**: Express.js with Prisma ORM
6. **Database**: PostgreSQL
7. **Cache**: Redis (ioredis)
8. **Auth**: Better Auth for session management
9. **Validation**: Zod 4 for request/response validation
10. **Styling Web**: Tailwind CSS 4 + shadcn/ui
11. **Styling Mobile**: NativeWind + Tailwind CSS
12. **State Management**: Zustand

### Business Decisions
1. **Verification Required**: All operators must be verified by admin
2. **Seat Management**: Real-time with double-booking prevention
3. **Digital Tickets**: QR code-based with offline access
4. **Notifications**: Push (primary), SMS (fallback)
5. **Brand Colors**: Primary #ee237c (pink/magenta), Font: Montserrat
6. **Currency**: West African CFA Franc (XOF)

### Deferred Features (v2+)
- Agent app for staff at stations
- Driver app for bus drivers
- Multi-country expansion
- Train/ferry integration
- Cargo shipping
- Subscription passes
- Loyalty program
- API for third-party integrations

---

## Current Sprint Focus

### Immediate Next Steps (Priority Order)

1. **🔥 CRITICAL: Search Domain**
   - Define and implement search API
   - Create search UI for both web and mobile
   - This unlocks the core passenger value proposition

2. **Operator Portal Foundation**
   - Company registration flow
   - Basic fleet management
   - Route and schedule creation

3. **Booking Flow MVP**
   - Trip selection → Seat selection → Checkout
   - Payment integration (start with Mobile Money)
   - Digital ticket generation

4. **Core UI Components**
   - Trip card
   - Seat map
   - Booking form
   - Ticket display

---

## Blockers & Risks

### Current Blockers
- None identified - foundation is solid

### Potential Risks
1. **Payment Integration Complexity**
   - Mobile Money gateways may have API limitations
   - Mitigation: Start with simplest provider, add others later

2. **Real-time Seat Management**
   - Preventing race conditions on seat booking
   - Mitigation: Use database transactions + optimistic locking

3. **Offline Sync Complexity**
   - Mobile app offline ticket access and sync
   - Mitigation: Use Expo's offline capabilities + custom sync logic

4. **Operator Adoption**
   - Convincing operators to digitize their business
   - Mitigation: Demonstrate clear ROI, provide onboarding support

---

## Success Criteria

### MVP Launch (Target: 3 months)
- [ ] 5+ bus operators onboarded
- [ ] 100+ registered passengers
- [ ] 100+ completed bookings
- [ ] 90%+ booking success rate
- [ ] <5% error rate on core flows

### Phase 1 Complete (Target: 6 months)
- [ ] 20+ operators onboarded
- [ ] 10,000+ registered passengers
- [ ] 10,000+ monthly bookings
- [ ] 4.5+ average app store rating
- [ ] 95%+ system uptime

---

## How to Use This File

1. **Before Starting Work**: Read this file to understand current state
2. **After Completing a Task**: Update the corresponding checkbox
3. **When Blocked**: Add blocker to the Blockers section
4. **When Making Decisions**: Add to Decision Log
5. **When Planning**: Use this to identify next priorities

**Last Updated**: June 30, 2026
**Updated By**: Antigravity (AI assistant)
