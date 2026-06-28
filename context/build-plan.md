# Build Plan

## Core Principle
Build visible UI first with mock data, then wire behavior behind it. Every phase should produce something testable and reviewable before the next phase starts.

## Development Phases

### Phase 1 - Foundation
- [x] Context system and workspace rules
- [x] Shared auth/session foundation
- [x] Shared theme and cross-platform UI baseline
- [ ] Search domain contract and API client shape
- [ ] Passenger web shell and passenger mobile shell alignment

### Phase 2 - Operator Core
- [ ] KYC and company onboarding
- [ ] Fleet management
- [ ] Route and schedule builder
- [ ] Live manifest and inventory ledger
- [ ] Cash and mobile money finance views
- [ ] Admin permissions and operator role boundaries

### Phase 3 - Traveler Core
- [ ] Search and filters
- [ ] Trip detail and seat map
- [ ] Checkout and payment
- [ ] Digital ticket wallet
- [ ] Booking history and notifications
- [ ] Offline ticket access and local storage

### Phase 4 - Deferred Staff Modules
- [ ] Agent walk-in sales and offline sync
- [ ] Driver trip assignment and QR check-in
- [ ] Driver status and incident reporting

### Phase 5 - Hardening
- [ ] SMS fallback
- [ ] Push notifications
- [ ] Error handling and observability
- [ ] Performance and offline resilience

## Feature Count
- Foundation: 5 items
- Operator Core: 6 items
- Traveler Core: 6 items
- Deferred Staff Modules: 3 items
- Hardening: 4 items
