# Architecture

## Overview

Moja Ride is a **multi-application, two-sided marketplace platform** with a **service-oriented monolith architecture**. The system connects passengers with bus operators through multiple frontend applications backed by a central API and shared packages.

---

## Tech Stack

### Frontend
| Application | Framework | Language | Styling | State | Navigation |
|-------------|-----------|----------|---------|-------|------------|
| Passenger Web | Next.js 16 | TypeScript | Tailwind CSS 4 | Zustand | Next.js App Router |
| Passenger Mobile | Expo SDK 56 | TypeScript | NativeWind | Zustand | Expo Router |
| Operator Portal | Next.js 16 | TypeScript | Tailwind CSS 4 | Zustand | Next.js App Router |
| Admin Dashboard | Next.js 16 | TypeScript | Tailwind CSS 4 | Zustand | Next.js App Router |

### Backend
| Component | Technology | Purpose |
|-----------|------------|---------|
| API Server | Next.js tRPC Router | Unified server procedures API layer |
| ORM | Prisma 7 | Database access (located in `packages/db`) |
| Database | PostgreSQL | Primary data storage |
| Cache | Redis (ioredis) | Session storage, rate limiting |
| Auth | Better Auth | Authentication, sessions (managed in `apps/web/lib/auth-server`) |
| Validation | Zod 4 | Request/response/procedure input validation |
| File Storage | Local/S3 | Bus images, documents |
| Real-time | Socket.io | Live updates (optional) |

### DevOps & Tooling
| Area | Technology |
|------|------------|
| Monorepo | Turbo 2.x | Build orchestration |
| Package Manager | pnpm 10 | Dependency management |
| TypeScript | 6.x | Type checking |
| Linter/Formatter | Biome | Code quality |
| Git Hooks | Husky | Pre-commit checks |

---

## Folder Structure

```
moja-buss/
├── apps/
│   ├── app/                    # Passenger Mobile (Expo/React Native)
│   │   ├── app/                # Expo Router routes
│   │   │   ├── (auth)/         # Auth screens
│   │   │   ├── (tabs)/         # Main tabs: search, tickets, profile
│   │   │   └── _layout.tsx
│   │   ├── src/
│   │   │   ├── components/     # Reusable mobile components
│   │   │   │   └── auth-shell.tsx
│   │   │   ├── constants/      # Theme, config
│   │   │   ├── hooks/          # Custom hooks
│   │   │   ├── lib/            # Utilities
│   │   │   └── types/          # TypeScript types
│   │   └── package.json
│   │
│   ├── web/                    # Passenger Web + Operator Portal + tRPC API Server
│   │   ├── app/
│   │   │   ├── (auth)/         # Public auth pages
│   │   │   ├── api/
│   │   │   │   ├── auth/[...all] # Better Auth endpoint
│   │   │   │   └── trpc/[trpc]   # tRPC endpoint
│   │   │   ├── dashboard/      # Operator dashboard
│   │   │   │   ├── bookings/   # Booking management
│   │   │   │   ├── fleet/      # Fleet management
│   │   │   │   ├── routes/     # Route management
│   │   │   │   ├── schedules/  # Schedule management
│   │   │   │   ├── revenue/    # Revenue dashboard
│   │   │   │   └── settings/   # Operator settings
│   │   │   ├── search/         # Public trip search
│   │   │   └── layout.tsx
│   │   ├── trpc/               # tRPC setup and router procedures
│   │   │   ├── routers/        # individual routers (fleet, trips, routes, etc.)
│   │   │   ├── client.tsx      # React/Client wrapper
│   │   │   ├── server.tsx      # Server-side caller
│   │   │   └── init.ts         # tRPC initialization
│   │   └── package.json
│   │
│   └── api/                    # Legacy REST API (DEPRECATED - Planning for removal)
│
├── packages/
│   ├── ui/                     # Shared UI components (shadcn)
│   │   └── src/components/ui/
│   ├── theme/                  # Design system (tokens, colors)
│   ├── auth/                   # Authentication utilities
│   ├── schemas/                # Zod validation schemas
│   ├── db/                     # Database client (Prisma Schema & Client Client Creator)
│   │   ├── prisma/
│   │   │   ├── schema.prisma   # Single Prisma schema
│   │   │   └── seed.ts         # Seed script
│   │   └── src/
│   │       └── index.ts        # getPrismaClient() wrapper
│   ├── api-client/             # API client for frontend (Legacy fetch client)
│   ├── shared/                 # Shared utilities
│   └── config/                 # Configuration
│
└── context/                    # Project documentation
```

---

## Domain Models

### Core Entities
- **User** - All platform users (passengers, operators, admins)
- **Company** - Bus operator business
- **Bus** - Individual vehicles in fleet
- **Route** - Path between cities with stops
- **Schedule** - Recurring trip pattern
- **Trip** - Individual journey instance
- **Seat** - Individual seat on a bus
- **Booking** - Passenger reservation
- **Ticket** - Digital travel document
- **Payment** - Financial transactions
- **Review** - Passenger feedback

---

## API Design

### tRPC API Structure
The server API is built using **tRPC procedures** exposed via `apps/web` under `/api/trpc`. Procedures are grouped under namespaces corresponding to domains.

#### Auth (Better Auth Endpoints under `/api/auth`)
Better Auth handles the authentication endpoints natively:
- `signUp.email` / `signIn.email` / `signOut` / `verifyEmail` / `sendVerificationEmail`

#### Trips (`trips` router)
- `trips.list` - Query trips filterable by status, route, and date
- `trips.byId` - Query details for a specific trip (manifest, seat maps)
- `trips.assignBus` - Mutation to update bus assignment on a trip
- `trips.delay` - Mutation to log delays in minutes
- `trips.cancel` - Mutation to cancel a single trip run
- `trips.updateStatus` - Mutation to progress trip lifecycle (BOARDING -> DEPARTED -> ARRIVED)

#### Fleet (`fleet` router)
- `fleet.addBus` - Mutation to register a new bus
- `fleet.list` - Query all buses for the operator
- `fleet.busTypes` - Query standard bus templates
- `fleet.layouts` - Query seat layout templates

#### Routes & Waypoints (`routes` router)
- `routes.create` - Mutation to define a route and stops
- `routes.list` - Query routes list
- `routes.cities` - Query seeded Ivory Coast cities
- `routes.terminals` - Query operator bookable terminals

#### Schedules (`schedules` router)
- `schedules.create` - Mutation to create recurring/one-time schedules (triggers 14-day trip generator)
- `schedules.list` - Query schedules
- `schedules.addException` - Mutation to cancel/modify trips inside a range

#### Staff (`staff` router)
- `staff.list` - Query operator company staff list
- `staff.create` - Mutation to invite/add new staff member
- `staff.updateRole` - Mutation to change staff roles

---

## Architectural Invariants

### Core Principles

1. **Apps Never Instantiate Prisma Directly**
   - Database access is managed exclusively by `@moja/db` through the `getPrismaClient()` helper.
   - Client components and client-side code must NEVER import `@moja/db` or the Prisma client directly.

2. **tRPC Server Procedures Contain Business Logic**
   - Next.js server-side procedures inside `apps/web/trpc/routers` act as the database gateway and own authorization checks, transaction orchestration, validation, and business logic.
   - The Express application (`apps/api`) is deprecated and is no longer the API gateway.

3. **Shared Packages Stay Platform-Neutral**
   - No React Native code in web packages.
   - No web-specific code in mobile packages.

4. **Separation of Concerns**
   - UI views and forms inside React client files.
   - Procedure definitions and schema validations (Zod) in tRPC routers and `@moja/schemas`.
   - Data mutations wrapped in transactions inside tRPC procedures.

5. **Data Flow**
   ```
   Client View Component → tRPC Hooks Client → tRPC Router Endpoint (apps/web) → DB Client (@moja/db) → PostgreSQL
   ```

6. **Offline Support**
   - Mobile app stores tickets locally.
   - Sync with server when connection restored.

---

## Security Architecture

### Authentication
- Better Auth for session management
- JWT tokens with short expiry (15-30 minutes)
- Refresh tokens with long expiry (7-30 days)
- Secure, HttpOnly, SameSite cookies
- CSRF protection

### Authorization
- Role-based access control (RBAC)
- Roles: PASSENGER, OPERATOR, OPERATOR_STAFF, ADMIN
- Resource-level permissions

### Data Protection
- Password hashing with bcrypt
- Input validation on all endpoints
- HTTPS everywhere (TLS 1.3)

---

## Service Boundaries

The API is organized into domain-specific services:
- **Auth Service** - Authentication and sessions
- **User Service** - User management
- **Operator Service** - Company management
- **Fleet Service** - Bus and seat management
- **Route Service** - Route management
- **Schedule Service** - Trip scheduling
- **Booking Service** - Reservations
- **Payment Service** - Financial transactions
- **Notification Service** - Alerts and updates

---

## Performance Considerations

### Caching Strategy
| Data | Cache | TTL | Invalidation |
|------|-------|-----|--------------|
| Search results | Redis | 5 min | New trip creation |
| Route data | Redis | 1 hour | Route update |
| User sessions | Redis | 7 days | Logout |

### Database Optimization
- Indexes on all foreign keys
- Indexes on all searchable fields
- Connection pooling
- Query optimization (avoid N+1)

---

## Deployment Architecture

### Development
- `apps/app/` → Expo Dev Server (port 8081 / default expo ports)
- `apps/web/` → Next.js Dev Server (port 3000) - hosts both UI and tRPC/Better-Auth endpoints
- `apps/api/` → Express Server (port 4000) (DEPRECATED - Planning for removal)

### Production
- `apps/web/` → Vercel (Edge/Serverless functions hosting UI pages + tRPC endpoints + Better-Auth handler)
- `apps/app/` → Expo EAS (iOS & Android)
- Database → PlanetScale/Neon (Serverless PostgreSQL)
- Cache → Upstash Redis
- File Storage → AWS S3 / Cloudflare R2

---

## Summary

This architecture provides:
- Clear separation of concerns
- Scalable foundation
- Excellent developer experience
- Platform-neutral shared code
- Offline support for mobile
- Two-sided marketplace capabilities
- Complete business management system
