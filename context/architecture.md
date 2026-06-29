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
| API Server | Express 5.x | REST API, WebSocket support |
| ORM | Prisma 7 | Database access, migrations |
| Database | PostgreSQL | Primary data storage |
| Cache | Redis (ioredis) | Session storage, rate limiting |
| Auth | Better Auth | Authentication, sessions |
| Validation | Zod 4 | Request/response validation |
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
│   ├── web/                    # Passenger Web + Operator Portal
│   │   ├── app/
│   │   │   ├── (auth)/         # Public auth pages
│   │   │   ├── dashboard/      # Operator dashboard
│   │   │   │   ├── bookings/   # Booking management
│   │   │   │   ├── fleet/      # Fleet management
│   │   │   │   ├── routes/     # Route management
│   │   │   │   ├── schedules/  # Schedule management
│   │   │   │   ├── revenue/    # Revenue dashboard
│   │   │   │   └── settings/   # Operator settings
│   │   │   ├── search/         # Public trip search
│   │   │   └── layout.tsx
│   │   └── package.json
│   │
│   └── api/                    # Backend API Server
│       ├── src/
│       │   ├── config/         # Configuration
│       │   ├── routes/         # API routes
│       │   │   ├── auth/       # Authentication
│       │   │   ├── users/      # User management
│       │   │   ├── operators/  # Operator management
│       │   │   ├── bookings/   # Booking operations
│       │   │   ├── trips/      # Trip management
│       │   │   ├── fleets/     # Fleet management
│       │   │   ├── routes/     # Route management
│       │   │   └── payments/   # Payment processing
│       │   ├── services/       # Business logic
│       │   ├── repositories/   # Database access
│       │   └── middleware/     # Express middleware
│       └── prisma/
│           └── schema.prisma
│
├── packages/
│   ├── ui/                     # Shared UI components (shadcn)
│   │   └── src/components/ui/
│   ├── theme/                  # Design system (tokens, colors)
│   ├── auth/                   # Authentication utilities
│   ├── schemas/                # Zod validation schemas
│   ├── db/                     # Database client
│   ├── api-client/             # API client for frontend
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

### REST API Structure
**Base URL**: `/api/v1`

#### Auth
- `POST /auth/register` - Passenger registration
- `POST /auth/register/operator` - Operator registration
- `POST /auth/login` - Login
- `POST /auth/logout` - Logout
- `POST /auth/refresh` - Refresh token
- `POST /auth/verify-otp` - OTP verification
- `GET /auth/me` - Current user

#### Trips & Search
- `GET /trips/search` - Search trips (from, to, date)
- `GET /trips/:id` - Trip details
- `GET /trips/:id/seats` - Seat availability

#### Bookings
- `POST /bookings` - Create booking
- `GET /bookings/me` - My bookings
- `GET /bookings/:id` - Booking details
- `POST /bookings/:id/cancel` - Cancel booking

#### Operators
- `POST /operators` - Register company
- `GET /operators/me` - My company
- `PUT /operators/me` - Update company

#### Fleet
- `POST /buses` - Add bus
- `GET /buses` - List buses
- `GET /buses/:id` - Bus details

#### Routes
- `POST /routes` - Create route
- `GET /routes` - List routes
- `GET /routes/:id` - Route details

#### Schedules
- `POST /schedules` - Create schedule
- `GET /schedules` - List schedules

### Response Structure
```typescript
// Success
{
  data: any,
  meta?: {
    total: number,
    page: number,
    limit: number
  }
}

// Error
{
  error: {
    code: string,
    message: string,
    details?: any
  }
}
```

---

## Architectural Invariants

### Core Principles

1. **Apps Never Talk to Database Directly**
   - All database access MUST go through `apps/api`
   - No direct Prisma imports in frontend apps

2. **API Owns Business Logic**
   - `apps/api` owns persistence, authorization, payment orchestration
   - Business rules and validations live in the API

3. **Shared Packages Stay Platform-Neutral**
   - No React Native code in web packages
   - No web-specific code in mobile packages

4. **Separation of Concerns**
   - UI components in `components/`
   - Business logic in `services/`
   - Database access in `repositories/`
   - Validation in schemas

5. **Data Flow**
   ```
   Frontend → API Client → API Routes → Services → Repositories → Database
   ```

6. **Offline Support**
   - Mobile app stores tickets locally
   - Sync with server when connection restored

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
- `apps/app/` → Expo Dev Server (port 19000-19006)
- `apps/web/` → Next.js Dev Server (port 3000)
- `apps/api/` → Express Server (port 4000)

### Production
- `apps/web/` → Vercel (Edge Network)
- `apps/app/` → Expo EAS (iOS & Android)
- `apps/api/` → Railway/EC2 (Auto-scaled)
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
