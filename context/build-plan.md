# Build Plan

## Core Principle

**Build visible UI first with mock data, then wire behavior behind it.** Every phase should produce something testable and reviewable before the next phase starts.

---

## Development Approach

### UI-First Development
1. Design the screens with mock data
2. Get stakeholder approval on the visual experience
3. Implement the backend API
4. Connect the UI to real data
5. Test end-to-end

### Domain-Driven Development
Each domain (Search, Booking, Fleet, etc.) is built as a complete vertical slice:
- API endpoints
- Frontend components
- State management
- Tests

### Incremental Value
Each phase delivers **shippable value**:
- Phase 1: Foundation (infrastructure)
- Phase 2: Discovery (passengers can search)
- Phase 3: Booking (passengers can book)
- Phase 4: Operations (operators can manage)
- Phase 5: Hardening (polish and scale)

---

## Phased Development Plan

---

### 🏗️ Phase 1 - Foundation (COMPLETED ✅)
*Duration: Completed | Team: All | Priority: Critical*

**Goal**: Establish the technical foundation and shared infrastructure.

| Task | Status | Owner | Notes |
|------|--------|-------|-------|
| Context system and workspace rules | ✅ | - | Documentation complete |
| Shared auth/session foundation | ✅ | - | Better Auth integrated |
| Shared theme and cross-platform UI baseline | ✅ | - | Primary: #ee237c, Font: Montserrat |
| Root workspace and app setup | ✅ | - | Turbo + pnpm configured |
| Shared shadcn UI package | ✅ | - | Mirrored from demo-ui |
| Aggregator web dashboard shell | ✅ | - | With sidebar and nested pages |
| Aggregator web auth views | ✅ | - | Moja Ride content + Google login |
| Mobile app shell | ✅ | - | Expo Router + auth-shell |
| Context onboarding files | ✅ | - | All docs updated |

**Deliverables**:
- ✅ Working development environment
- ✅ Authentication flow for web and mobile
- ✅ Dashboard shells with navigation
- ✅ Shared component library
- ✅ Complete project documentation

---

### 🔍 Phase 2 - Discovery & Search (NEXT - Start Immediately)
*Duration: 3-4 weeks | Team: 2-3 developers | Priority: Highest*

**Goal**: Enable passengers to discover and compare bus trips.

#### Sprint 2.1 - Search API & Contract
| Task | Status | Priority |
|------|--------|----------|
| Define search API endpoint (`GET /api/v1/trips/search`) | ⏳ | High |
| Define request schema (from, to, date, filters) | ⏳ | High |
| Define response schema (trip list with metadata) | ⏳ | High |
| Define sorting options (price, departure, duration, rating) | ⏳ | High |
| Define filtering options (bus type, amenities, price range) | ⏳ | Medium |
| Implement Zod schemas for search | ⏳ | High |
| Create API client types for search | ⏳ | Medium |

#### Sprint 2.2 - Search Backend
| Task | Status | Priority |
|------|--------|----------|
| Implement trip search service | ⏳ | High |
| Implement database queries for search | ⏳ | High |
| Add indexes for search performance | ⏳ | High |
| Implement Redis caching for search results | ⏳ | Medium |
| Implement pagination | ⏳ | High |
| Handle edge cases (no results, invalid params) | ⏳ | Medium |

#### Sprint 2.3 - Search Frontend (Web)
| Task | Status | Priority |
|------|--------|----------|
| Create search form component | ⏳ | High |
| Create location autocomplete | ⏳ | High |
| Create date picker | ⏳ | High |
| Create search results page | ⏳ | High |
| Create trip card component | ⏳ | High |
| Implement filter sidebar | ⏳ | Medium |
| Implement sort controls | ⏳ | Medium |
| Implement empty state | ⏳ | Low |
| Implement loading states | ⏳ | Low |
| Connect to mock data | ⏳ | High |

#### Sprint 2.4 - Search Frontend (Mobile)
| Task | Status | Priority |
|------|--------|----------|
| Create search screen | ⏳ | High |
| Implement location autocomplete (mobile) | ⏳ | High |
| Implement date picker (mobile) | ⏳ | High |
| Create results list | ⏳ | High |
| Create trip card (mobile) | ⏳ | High |
| Implement filter modal | ⏳ | Medium |
| Connect to mock data | ⏳ | High |

#### Sprint 2.5 - Route & Schedule Management (Operator)
| Task | Status | Priority |
|------|--------|----------|
| Define route schema | ⏳ | High |
| Implement route CRUD API | ⏳ | High |
| Define schedule schema | ⏳ | High |
| Implement schedule CRUD API | ⏳ | High |
| Create route creation UI | ⏳ | Medium |
| Create schedule creation UI | ⏳ | Medium |
| Create route list view | ⏳ | Medium |
| Create schedule calendar view | ⏳ | Low |

**Deliverables**:
- ✅ Working search functionality on web and mobile
- ✅ Passengers can find trips from A to B on date D
- ✅ Passengers can filter and sort results
- ✅ Operators can create and manage routes and schedules
- ✅ Mock data for testing

**Acceptance Criteria**:
- [ ] Search returns relevant results within 500ms
- [ ] Filters work correctly
- [ ] Sorting works correctly
- [ ] Mobile and web search UIs are functional
- [ ] Operators can create at least one route with schedule

---

### 💳 Phase 3 - Booking Flow (After Phase 2)
*Duration: 4-5 weeks | Team: 2-3 developers | Priority: High*

**Goal**: Enable passengers to book trips and receive digital tickets.

#### Sprint 3.1 - Fleet Management
| Task | Status | Priority |
|------|--------|----------|
| Define bus schema | ⏳ | High |
| Define seat schema | ⏳ | High |
| Implement bus CRUD API | ⏳ | High |
| Implement seat management API | ⏳ | High |
| Create seat layout editor | ⏳ | Medium |
| Create bus list view | ⏳ | Medium |
| Create bus detail view | ⏳ | Medium |

#### Sprint 3.2 - Seat Availability & Selection
| Task | Status | Priority |
|------|--------|----------|
| Implement seat availability service | ⏳ | High |
| Prevent double booking logic | ⏳ | High |
| Implement seat holding (temporary reservation) | ⏳ | High |
| Create seat map component (web) | ⏳ | High |
| Create seat map component (mobile) | ⏳ | High |
| Implement seat selection UI | ⏳ | High |

#### Sprint 3.3 - Booking API
| Task | Status | Priority |
|------|--------|----------|
| Define booking schema | ⏳ | High |
| Define passenger schema | ⏳ | High |
| Implement booking creation API | ⏳ | High |
| Implement booking retrieval API | ⏳ | High |
| Implement booking modification API | ⏳ | Medium |
| Implement booking cancellation API | ⏳ | Medium |

#### Sprint 3.4 - Booking Frontend (Web)
| Task | Status | Priority |
|------|--------|----------|
| Create booking flow navigation | ⏳ | High |
| Create passenger details form | ⏳ | High |
| Integrate seat selection | ⏳ | High |
| Create booking confirmation page | ⏳ | High |
| Create booking success page | ⏳ | Medium |

#### Sprint 3.5 - Booking Frontend (Mobile)
| Task | Status | Priority |
|------|--------|----------|
| Create booking flow navigation (mobile) | ⏳ | High |
| Create passenger details form (mobile) | ⏳ | High |
| Integrate seat selection (mobile) | ⏳ | High |
| Create booking confirmation screen | ⏳ | High |
| Create booking success screen | ⏳ | Medium |

#### Sprint 3.6 - Digital Tickets
| Task | Status | Priority |
|------|--------|----------|
| Define ticket schema | ⏳ | High |
| Implement QR code generation | ⏳ | High |
| Create digital ticket component | ⏳ | High |
| Implement offline ticket storage (mobile) | ⏳ | High |
| Create ticket validation API | ⏳ | Medium |

**Deliverables**:
- ✅ Passengers can select seats and book trips
- ✅ Passengers receive digital tickets with QR codes
- ✅ Mobile app stores tickets offline
- ✅ Operators can manage their fleet
- ✅ Seat double-booking is prevented

**Acceptance Criteria**:
- [ ] Booking flow completes in <2 minutes
- [ ] Digital tickets display correctly
- [ ] QR codes are scannable
- [ ] Offline ticket access works (mobile)
- [ ] No double bookings possible

---

### 🏢 Phase 4 - Operator Operations (After Phase 3)
*Duration: 4-5 weeks | Team: 2 developers | Priority: High*

**Goal**: Enable operators to manage their business through the portal.

#### Sprint 4.1 - Operator Registration & Verification
| Task | Status | Priority |
|------|--------|----------|
| Create operator registration flow | ⏳ | High |
| Implement document upload | ⏳ | High |
| Create admin verification queue | ⏳ | High |
| Implement verification email notifications | ⏳ | Medium |
| Create operator dashboard home | ⏳ | Medium |

#### Sprint 4.2 - Booking Management (Operator)
| Task | Status | Priority |
|------|--------|----------|
| Create booking list view | ⏳ | High |
| Create booking detail view | ⏳ | High |
| Implement passenger check-in | ⏳ | High |
| Implement QR code scanning | ⏳ | High |
| Implement manual booking creation | ⏳ | Medium |
| Implement booking modification | ⏳ | Medium |
| Implement booking cancellation | ⏳ | Medium |

#### Sprint 4.3 - Revenue Dashboard
| Task | Status | Priority |
|------|--------|----------|
| Define revenue metrics | ⏳ | High |
| Implement revenue calculation service | ⏳ | High |
| Create revenue dashboard UI | ⏳ | High |
| Create daily/weekly/monthly reports | ⏳ | Medium |
| Implement data export | ⏳ | Low |

#### Sprint 4.4 - Staff Management
| Task | Status | Priority |
|------|--------|----------|
| Define staff schema | ⏳ | Medium |
| Implement staff CRUD API | ⏳ | Medium |
| Create staff list view | ⏳ | Medium |
| Create staff creation form | ⏳ | Medium |
| Implement role-based permissions | ⏳ | Medium |

**Deliverables**:
- ✅ Operators can register and be verified
- ✅ Operators can manage bookings
- ✅ Operators can check in passengers
- ✅ Operators can view revenue reports
- ✅ Operators can manage staff

**Acceptance Criteria**:
- [ ] Operator registration takes <10 minutes
- [ ] Booking management is intuitive
- [ ] Revenue reports are accurate
- [ ] Staff permissions work correctly

---

### 💰 Phase 5 - Payments & Wallet (Parallel with Phase 4)
*Duration: 3-4 weeks | Team: 1-2 developers | Priority: High*

**Goal**: Enable real payments and wallet functionality.

#### Sprint 5.1 - Payment Gateway Integration
| Task | Status | Priority |
|------|--------|----------|
| Research Mobile Money providers | ⏳ | High |
| Select primary payment provider | ⏳ | High |
| Implement payment gateway integration | ⏳ | High |
| Create payment service | ⏳ | High |
| Implement payment initiation API | ⏳ | High |
| Implement payment verification API | ⏳ | High |

#### Sprint 5.2 - Payment Frontend
| Task | Status | Priority |
|------|--------|----------|
| Create payment method selection | ⏳ | High |
| Create Mobile Money payment flow | ⏳ | High |
| Create card payment flow | ⏳ | Medium |
| Create payment confirmation | ⏳ | High |
| Create payment failure handling | ⏳ | Medium |

#### Sprint 5.3 - Digital Wallet
| Task | Status | Priority |
|------|--------|----------|
| Define wallet schema | ⏳ | Medium |
| Implement wallet service | ⏳ | Medium |
| Create wallet UI | ⏳ | Medium |
| Implement top-up functionality | ⏳ | Medium |
| Implement balance tracking | ⏳ | Medium |

#### Sprint 5.4 - Refund System
| Task | Status | Priority |
|------|--------|----------|
| Define refund schema | ⏳ | Medium |
| Implement refund service | ⏳ | Medium |
| Create refund request flow | ⏳ | Medium |
| Implement refund processing | ⏳ | Medium |

**Deliverables**:
- ✅ Passengers can pay with Mobile Money
- ✅ Passengers can pay with cards
- ✅ Wallet system for storing funds
- ✅ Refund processing

**Acceptance Criteria**:
- [ ] Payment success rate > 95%
- [ ] Mobile Money integration works
- [ ] Refunds are processed within 24 hours
- [ ] Wallet balance is accurate

---

### 🎨 Phase 6 - Polish & Hardening (After Core Features)
*Duration: 3-4 weeks | Team: All | Priority: Medium*

**Goal**: Polish the user experience and harden the system.

#### Sprint 6.1 - Notifications
| Task | Status | Priority |
|------|--------|----------|
| Implement push notifications (mobile) | ⏳ | High |
| Implement email notifications | ⏳ | High |
| Implement SMS notifications | ⏳ | Medium |
| Create notification preferences | ⏳ | Medium |
| Create in-app notification center | ⏳ | Medium |

#### Sprint 6.2 - Reviews & Ratings
| Task | Status | Priority |
|------|--------|----------|
| Implement review submission | ⏳ | Medium |
| Implement rating aggregation | ⏳ | Medium |
| Create review UI | ⏳ | Medium |
| Implement review moderation | ⏳ | Low |

#### Sprint 6.3 - Admin Dashboard
| Task | Status | Priority |
|------|--------|----------|
| Create admin dashboard home | ⏳ | Medium |
| Create company verification queue | ⏳ | Medium |
| Create user management | ⏳ | Medium |
| Create dispute resolution UI | ⏳ | Low |
| Create platform analytics | ⏳ | Medium |
| Create system settings | ⏳ | Low |

#### Sprint 6.4 - Performance & Optimization
| Task | Status | Priority |
|------|--------|----------|
| Implement database query optimization | ⏳ | High |
| Add more Redis caching | ⏳ | High |
| Implement image optimization | ⏳ | Medium |
| Implement code splitting | ⏳ | Medium |
| Implement lazy loading | ⏳ | Medium |

#### Sprint 6.5 - Accessibility & Localization
| Task | Status | Priority |
|------|--------|----------|
| Accessibility audit | ⏳ | Medium |
| Implement accessibility fixes | ⏳ | Medium |
| French translation | ⏳ | Medium |
| English translation | ⏳ | Medium |
| RTL support (if needed) | ⏳ | Low |

**Deliverables**:
- ✅ Complete notification system
- ✅ Review and rating system
- ✅ Full admin dashboard
- ✅ Optimized performance
- ✅ Localized for Côte d'Ivoire

**Acceptance Criteria**:
- [ ] All notifications work correctly
- [ ] Reviews are displayed and aggregated
- [ ] Admin can manage the platform
- [ ] Performance metrics meet targets
- [ ] App is accessible

---

### 🚀 Phase 7 - Launch Preparation (Final)
*Duration: 2 weeks | Team: All | Priority: High*

**Goal**: Prepare for production launch.

| Task | Status | Priority |
|------|--------|----------|
| Production deployment setup | ⏳ | High |
| CI/CD pipeline configuration | ⏳ | High |
| Monitoring and logging setup | ⏳ | High |
| Error tracking (Sentry) | ⏳ | High |
| Performance monitoring | ⏳ | Medium |
| Security audit | ⏳ | High |
| Penetration testing | ⏳ | High |
| Load testing | ⏳ | High |
| Beta testing with real users | ⏳ | High |
| Bug fixes from beta | ⏳ | High |
| Launch marketing materials | ⏳ | Medium |
| Operator onboarding materials | ⏳ | Medium |
| Passenger onboarding materials | ⏳ | Medium |

**Deliverables**:
- ✅ Production-ready applications
- ✅ Monitoring and alerting
- ✅ Security-hardened system
- ✅ Beta-tested with real users
- ✅ Launch-ready documentation

---

## Feature Count Summary

| Phase | Features | Duration | Team Size | Status |
|-------|----------|----------|-----------|--------|
| Phase 1 - Foundation | 9 | Completed | All | ✅ |
| Phase 2 - Discovery | 25 | 3-4 weeks | 2-3 | ⏳ |
| Phase 3 - Booking | 25 | 4-5 weeks | 2-3 | ⏳ |
| Phase 4 - Operations | 20 | 4-5 weeks | 2 | ⏳ |
| Phase 5 - Payments | 15 | 3-4 weeks | 1-2 | ⏳ |
| Phase 6 - Polish | 25 | 3-4 weeks | All | ⏳ |
| Phase 7 - Launch | 15 | 2 weeks | All | ⏳ |
| **Total** | **134** | **21-23 weeks** | - | - |

---

## Parallel Development Streams

To accelerate development, some work can happen in parallel:

### Stream 1: Core Passenger Experience
- Phase 2 (Search)
- Phase 3 (Booking)
- Phase 6 (Polish)

### Stream 2: Core Operator Experience
- Phase 4 (Operations)
- Phase 5 (Payments)
- Phase 6 (Polish)

### Stream 3: Platform & Infrastructure
- Phase 1 (Foundation)
- Phase 6 (Admin, Performance)
- Phase 7 (Launch Prep)

---

## Milestone Definitions

### MVP (Minimum Viable Product)
**Target: After Phase 3 (8-9 weeks from now)**

- Passengers can search for trips
- Passengers can view trip details
- Passengers can book trips (with mock payment)
- Passengers receive digital tickets
- Operators can register
- Operators can create routes and schedules
- Operators can manage basic bookings

**MVP Launch Criteria**:
- 5+ operators onboarded
- 100+ registered passengers
- 100+ completed bookings (mock payment)
- Core flows work end-to-end

### Beta Launch
**Target: After Phase 5 (12-13 weeks from now)**

- Everything in MVP
- Real payment integration (Mobile Money)
- Wallet system
- Refund processing
- Basic notifications

**Beta Launch Criteria**:
- 10+ operators onboarded
- 500+ registered passengers
- 500+ completed bookings (real payment)
- <5% error rate on payments

### Public Launch (v1.0)
**Target: After Phase 7 (21-23 weeks from now)**

- Everything in Beta
- Full admin dashboard
- Complete notification system
- Reviews and ratings
- Performance optimized
- Localized
- Production hardened

**Public Launch Criteria**:
- 20+ operators onboarded
- 5,000+ registered passengers
- 5,000+ completed bookings
- 4.5+ average rating
- 95%+ system uptime

---

## Testing Strategy

### Testing Pyramid
```
        ┌─────────┐
        │  E2E    │  ~10 tests
        ├─────────┤
        │ Integration │ ~50 tests
        ├─────────┤
        │ Unit    │ ~200 tests
        └─────────┘
```

### Test Coverage Targets
- Unit tests: >80% coverage
- Integration tests: >70% coverage
- E2E tests: All critical user flows

### Testing Tools
- Unit: Jest + Testing Library
- Integration: Jest + Supertest
- E2E: Cypress or Playwright
- Mobile: React Native Testing Library + Detox

---

## Quality Gates

Each feature must pass these gates before merging:

1. **Code Quality**
   - ✅ Biome linter passes
   - ✅ TypeScript compiles without errors
   - ✅ No `any` types (unless documented)
   - ✅ Follows code standards

2. **Testing**
   - ✅ Unit tests for business logic
   - ✅ Integration tests for API endpoints
   - ✅ E2E tests for user flows
   - ✅ All tests pass

3. **Code Review**
   - ✅ At least 1 approval
   - ✅ Security review for sensitive features
   - ✅ Performance review for heavy features

4. **Documentation**
   - ✅ API endpoints documented
   - ✅ Complex logic documented
   - ✅ Decisions documented in context files

5. **User Experience**
   - ✅ Design review for UI changes
   - ✅ Accessibility check
   - ✅ Mobile responsiveness check

---

## Summary

**Total Estimated Duration**: 21-23 weeks (~5-6 months)
**Current Phase**: Phase 1 Complete, Starting Phase 2
**Next Milestone**: MVP in 8-9 weeks

**Priority Order**:
1. Phase 2 - Discovery & Search (START NOW)
2. Phase 3 - Booking Flow
3. Phase 4 - Operator Operations
4. Phase 5 - Payments & Wallet
5. Phase 6 - Polish & Hardening
6. Phase 7 - Launch Preparation

This plan provides a **clear roadmap** from the current state to a **fully launched platform** serving passengers and operators across Côte d'Ivoire.
