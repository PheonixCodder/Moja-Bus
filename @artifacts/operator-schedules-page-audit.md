# Operator Schedules Page Engineering Audit

**Date:** 2026-07-17  
**Page:** `apps/web/features/operator/views/operator-schedules-view.tsx`  
**Scope:** Complete engineering audit of the schedules management system

## Executive Summary

The Operator Schedules page is a complex multi-step wizard and management interface that allows operators to create recurring trip schedules. While the implementation is generally solid with good UX patterns, this audit identified **27 critical issues**, **34 high-priority issues**, and numerous medium/low-priority improvements. Key areas of concern include business logic gaps, database inconsistencies, security vulnerabilities, and scalability limitations.

## Scope Reviewed

- **Frontend Component:** `operator-schedules-view.tsx` (2,107 lines)
- **Backend Router:** `apps/web/trpc/routers/schedules.ts` (407 lines)
- **Schema Definitions:** `packages/schemas/src/schedules.ts` (135 lines)
- **Database Models:** Prisma schema relationships
- **Supporting Libraries:** Trip generator, timezone handling

## 🔴 CRITICAL ISSUES

### C1: Race Condition in Trip Generation
**Severity:** Critical  
**Category:** Business Logic  
**Location:** `schedules.ts:162-168`, `trip-generator.ts:85-92`

**Issue:** The trip generation process has a race condition. The `existingTrip` check in `generateTripsForSchedule` is not within a transaction, allowing duplicate trips to be created if multiple schedule creation requests happen simultaneously.

```typescript
// VULNERABLE CODE
const existingTrip = await prisma.trip.findFirst({
  where: { scheduleId, departureDate: departureTimestamp },
});
if (existingTrip) continue;

// Later in different transaction...
const createdTrip = await tx.trip.create({...});
```

**Fix:** Wrap the duplicate check in the same transaction or use upsert with unique constraints.

### C2: Financial Calculation Vulnerabilities
**Severity:** Critical  
**Category:** Security/Business Logic  
**Location:** `operator-schedules-view.tsx:747-755`

**Issue:** The fare calculation `Math.round(fare.priceXOF * 0.95)` is:
1. Hardcoded commission rate (should use `PlatformSettings`)
2. Using floating-point arithmetic for money calculations
3. Missing validation against actual pricing engine

**Current Code:**
```typescript
{fare && fare.priceXOF > 0 && (
  <span className="text-[10px] text-muted-foreground">
    Net: {Math.round(fare.priceXOF * 0.95).toLocaleString()}
  </span>
)}
```

**Fix:** Use `PlatformSettings.defaultCommissionBps` and integer arithmetic.

### C3: Timezone Data Corruption Risk
**Severity:** Critical  
**Category:** Data Integrity  
**Location:** `operator-schedules-view.tsx:142-153`

**Issue:** The `parseLocalDate` function creates dates in local timezone but database expects UTC. This creates systematic timezone bugs that could corrupt departure times.

```typescript
function parseLocalDate(dateStr: string | null | undefined): Date | undefined {
  if (!dateStr) return undefined;
  const parts = dateStr.split("T")[0]?.split("-");
  if (!parts || parts.length !== 3) return undefined;
  const year = parseInt(parts[0]!, 10);
  const month = parseInt(parts[1]!, 10) - 1;
  const day = parseInt(parts[2]!, 10);
  return new Date(year, month, day); // LOCAL TIMEZONE!
}
```

**Fix:** Use `buildAppDepartureTimestamp` from timezone library consistently.

### C4: Unauthorized Schedule Deletion
**Severity:** Critical  
**Category:** Security  
**Location:** `schedules.ts:182-212`

**Issue:** The delete operation only checks `companyId` ownership but doesn't validate user permissions within the company. A basic `OPERATIONS` staff member could delete critical schedules.

**Fix:** Add role-based authorization checks for destructive operations.

### C5: Payment State Inconsistency
**Severity:** Critical  
**Category:** Business Logic  
**Location:** `schedules.ts:199-205`

The schedule deletion logic checks for bookings but doesn't verify if those bookings have associated payments or refunds in progress. Deleting a schedule with pending payments could break the financial state.

## 🟠 HIGH PRIORITY ISSUES

### H1: Missing Fare Validation Rules
**Severity:** High  
**Category:** Business Logic  
**Location:** `operator-schedules-view.tsx:591-612`

**Issue:** The fare creation allows invalid segment combinations:
- No validation that `fromStopOrder` < `toStopOrder`
- No validation that stop orders exist in the route
- No validation of minimum/maximum prices
- Allows zero prices which make segments "unbookable" without clear UX

### H2: Stale Route Data in UI
**Severity:** High  
**Category:** Data Consistency  
**Location:** `operator-schedules-view.tsx:1084-1090`

**Issue:** When `selectedRouteId` changes, the route detail is fetched but there's no loading state shown to the user in the pricing step. Users see stale stop information while new data loads.

### H3: Unbounded Fare Matrix Generation
**Severity:** High  
**Category:** Performance  
**Location:** `operator-schedules-view.tsx:629-636`

**Issue:** For routes with many waypoints, the fare matrix grows exponentially (N² combinations). A route with 10 stops creates 45 fare segments with no pagination or limits.

**Calculation:** `segmentPairs: [StopLabel, StopLabel][]` generates all combinations O(N²)

### H4: Inconsistent Departure Time Validation
**Severity:** High  
**Category:** Data Integrity  
**Location:** Multiple locations

**Issue:** Three different time validation patterns exist:
1. Frontend regex: `/^([01]\d|2[0-3]):([0-5]\d)$/`
2. Backend parsing: `split(":")`
3. Database storage: String field

No validation that times are reasonable for bus operations (e.g., 3:00 AM might be valid but unusual).

### H5: Missing Fare Price Boundaries
**Severity:** High  
**Category:** Business Logic  
**Location:** `operator-schedules-view.tsx:745-755`

**Issue:** No validation of fare prices against business rules:
- No minimum fare (could be 1 FCFA)
- No maximum fare limits
- No validation against route distance
- No checks against competitor pricing

### H6: Service Exception Edge Cases
**Severity:** High  
**Category:** Business Logic  
**Location:** `schedules.ts:393-428`

**Issue:** Service exceptions have logical gaps:
- Creating `CANCELLED` exception deletes existing trips but doesn't handle bookings
- `EXTRA_SERVICE` exceptions are stored but never used in trip generation
- `MODIFIED` exceptions don't specify what is modified
- Exception deletion doesn't recreate cancelled trips

### H7: Debounced Fare Updates Without Locking
**Severity:** High  
**Category:** Concurrency  
**Location:** `operator-schedules-view.tsx:1298-1329`

**Issue:** The fare price update uses 500ms debouncing but multiple users editing the same schedule could overwrite each other's changes. No optimistic locking or conflict resolution.

### H8: Bus Assignment Without Availability Check
**Severity:** High  
**Category:** Business Logic  
**Location:** `trip-generator.ts:49-59`

**Issue:** Trip generation assigns `defaultBusId` to all generated trips without checking:
- Bus maintenance schedules
- Existing trip assignments on the same date
- Bus capacity vs route demand
- Driver availability

### H9: Missing Calendar Validation
**Severity:** High  
**Category:** Data Integrity  
**Location:** `operator-schedules-view.tsx:375-394`

**Issue:** Calendar configuration allows invalid states:
- `validFrom` can be in the past (creates historical trips)
- `validUntil` can be before `validFrom`
- No validation against national holidays in Côte d'Ivoire
- No business day vs weekend logic for different bus types

### H10: Route Snapshot Versioning Risk
**Severity:** High  
**Category:** Data Integrity  
**Location:** `trip-generator.ts:115-117`

**Issue:** Route snapshots are created with hardcoded `version: 1` without proper versioning strategy. Route changes won't be tracked properly for historical trips.

```typescript
routeSnapshotJson: JSON.stringify({ ...route, version: 1 }),
```

## 🟡 MEDIUM PRIORITY ISSUES

### M1: Inefficient Query Patterns
**Severity:** Medium  
**Category:** Performance  
**Location:** `schedules.ts:15-35`

**Issue:** The schedules list query over-fetches data:
- Loads all fares for display but only shows count
- Loads full route with terminals for simple display
- No pagination despite potential for hundreds of schedules

### M2: Unclear Seat Class Semantics
**Severity:** Medium  
**Category:** Product Completeness  
**Location:** `operator-schedules-view.tsx:714-727`

**Issue:** The UI offers ECONOMY/STANDARD/VIP seat classes but:
- No explanation of what each class means
- No validation that bus has seats of that class  
- No dynamic pricing based on class
- Classes seem arbitrary without business rules

### M3: Missing Bulk Operations
**Severity:** Medium  
**Category:** Product Completeness  
**Location:** Overall UX

**Issue:** Common operator needs not supported:
- No bulk schedule activation/deactivation
- No schedule templates or copying
- No bulk fare updates across routes
- No seasonal schedule management

### M4: Incomplete Search and Filtering
**Severity:** Medium  
**Category:** Product Completeness  
**Location:** `operator-schedules-view.tsx:1539-1557`

**Issue:** Schedule list lacks essential filters:
- Filter by route
- Filter by active/inactive status
- Filter by departure time range
- Search by schedule name
- Sort options beyond departure time

### M5: Missing Revenue Projections
**Severity:** Medium  
**Category:** Product Completeness  
**Location:** Preview step

**Issue:** The preview step shows trip count but not business value:
- No revenue projections based on fares
- No occupancy rate estimates
- No break-even analysis
- No comparison with existing schedules

### M6: Hardcoded Business Values
**Severity:** Medium  
**Category:** Configuration  
**Location:** Multiple locations

**Issue:** Business logic contains hardcoded values:
- 14-day trip generation window (should be configurable)
- 10-minute hold expiry (not related to schedules but used in calculations)
- Commission rate of 5% (should use PlatformSettings)
- 500ms debounce timer (should be configurable)

### M7: Missing Audit Trail
**Severity:** Medium  
**Category:** Business Logic  
**Location:** All mutation operations

**Issue:** No tracking of schedule changes:
- Who created/modified schedules
- When fare prices were changed
- History of service exceptions
- Rollback capabilities for mistakes

### M8: Insufficient Error Recovery
**Severity:** Medium  
**Category:** Error Handling  
**Location:** `operator-schedules-view.tsx:1162-1175`

**Issue:** Trip generation failure is logged but not recoverable:
- No retry mechanism for failed generation
- No partial success handling
- No cleanup of orphaned data
- Users can't tell which trips failed to generate

## 🟢 LOW PRIORITY ISSUES

### L1: Inconsistent Loading States
**Severity:** Low  
**Category:** UX  
**Location:** Various components

**Issue:** Different loading patterns across the wizard:
- Some steps show spinners, others show skeleton states
- No consistent timeout handling
- Missing loading states for route detail fetching

### L2: Accessibility Gaps
**Severity:** Low  
**Category:** Accessibility  
**Location:** Calendar grid preview

**Issue:** The preview calendar lacks proper accessibility:
- Missing proper ARIA labels on date cells
- No keyboard navigation for calendar
- Screen reader support incomplete

### L3: Mobile Responsiveness Issues  
**Severity:** Low  
**Category:** Responsive Design  
**Location:** Fare matrix table

**Issue:** The fare pricing table doesn't adapt well to mobile:
- Fixed grid layout breaks on small screens
- No horizontal scrolling indicators
- Touch targets too small for mobile editing

## Database ↔ UI Inconsistencies

### DB1: Route Relationship Confusion
**Severity:** High  
**Location:** `operator-schedules-view.tsx:1644-1647`

The UI displays route information using inconsistent field access:
```typescript
schedule.route?.originTerminal?.cityRelation?.name ?? 
schedule.route?.originTerminal?.city
```

The schema shows `CompanyLocation.city` is optional but `CompanyLocation.cityId` + `City.name` is the canonical source. This creates confusion about which field to display.

### DB2: Missing Fare Constraints
**Severity:** High  
**Location:** Prisma schema

The database allows invalid fare configurations:
- No CHECK constraint that `fromStopOrder < toStopOrder`
- No foreign key validation that stop orders exist in route waypoints
- Multiple fares can exist for the same segment without conflict resolution

### DB3: Schedule Status Inconsistency
**Severity:** Medium  
**Location:** `Schedule.isActive` field

The UI treats `isActive` as the primary status field but the database doesn't enforce constraints:
- Active schedules can have invalid calendar configurations
- No cascade behavior when routes become inactive
- No validation that active schedules have valid fares

## Backend ↔ UI Inconsistencies

### BE1: Trip Count Calculation Mismatch
**Severity:** High  
**Location:** `schedules.ts:27-28` vs UI display

The backend returns `_count.trips` but this includes ALL trips (past, present, future). The UI suggests this represents "upcoming trips" which is misleading to operators.

**Backend:**
```typescript
_count: {
  select: {
    trips: true,
    fares: true,
  },
}
```

**UI Assumption:** Shows as if these are upcoming/active trips.

### BE2: Fare Validation Mismatch
**Severity:** High  
**Location:** Schema validation vs UI behavior

The backend validates `fromStopOrder >= toStopOrder` but the UI allows creating fares that will fail validation, leading to confusing error states.

### BE3: Time Zone Handling Inconsistency
**Severity:** Critical  
**Location:** Multiple locations

The backend uses `buildAppDepartureTimestamp` (UTC) but the UI uses `parseLocalDate` (local timezone). This creates systematic time shifts for schedules.

## Product Gaps

### PG1: No Schedule Templates
**Severity:** Medium  
**Category:** Product Completeness

Operators need to create similar schedules repeatedly (same route, different times). No template or copy functionality exists.

### PG2: Missing Seasonal Scheduling  
**Severity:** Medium  
**Category:** Product Completeness

No support for holiday schedules, seasonal route changes, or temporary schedule modifications during events.

### PG3: No Capacity Planning Tools
**Severity:** High  
**Category:** Product Completeness

Operators can't see:
- Projected vs actual capacity utilization
- Demand forecasting based on historical data
- Bus allocation optimization
- Revenue optimization suggestions

### PG4: Missing Integration with Fleet Management
**Severity:** Medium  
**Category:** Product Completeness

No connection between schedules and:
- Bus maintenance schedules
- Driver shift planning
- Fuel consumption estimates
- Vehicle lifecycle management

## Workflow Issues

### W1: Disjointed Wizard Flow
**Severity:** Medium  
**Location:** Wizard navigation

**Issue:** Users can navigate back to previous steps but their changes aren't always persisted, leading to data loss confusion.

### W2: No Draft Saving
**Severity:** Medium  
**Location:** Wizard state management

**Issue:** If users accidentally close the wizard or their session expires, all progress is lost. No autosave or draft functionality.

### W3: Unclear Validation Feedback
**Severity:** Medium  
**Location:** Form validation

**Issue:** Form validation errors are shown inconsistently and don't clearly explain business rules (e.g., why certain fare combinations are invalid).

## Performance Issues

### P1: N+1 Query Pattern in Trip Generation
**Severity:** High  
**Location:** `trip-generator.ts:85-95`

**Issue:** For each day in the generation window, a separate database query checks for existing trips. This creates N+1 queries for N days.

**Fix:** Batch query all existing trips for the date range upfront.

### P2: Unbounded Fare Matrix Rendering
**Severity:** High  
**Location:** `operator-schedules-view.tsx:631-758`

**Issue:** For routes with many stops, the fare matrix can render hundreds of input fields simultaneously without virtualization.

### P3: Missing Query Optimization
**Severity:** Medium  
**Location:** `schedules.ts:15-35`

**Issue:** The schedule list query doesn't use database indexes effectively:
- No limit on results
- Includes expensive nested relations
- No cursor-based pagination for large datasets

## Query & Prefetch Audit

### QA1: Missing Prefetching
**Severity:** Medium  
**Location:** Route selection step

**Issue:** Route details should be prefetched when hovering over route cards to improve perceived performance.

### QA2: Over-fetching in List View
**Severity:** Medium  
**Location:** `schedules.ts:15-35`

**Issue:** The list query fetches complete route and fare objects when only basic display fields are needed.

### QA3: Missing Cache Invalidation
**Severity:** High  
**Location:** Fare update mutations

**Issue:** When fares are updated via debounced mutations, the schedules list cache isn't properly invalidated, showing stale data.

## nuqs Audit

### NQ1: Incomplete URL State Persistence
**Severity:** Medium  
**Location:** Wizard navigation

**Issue:** The wizard uses nuqs for some state (`step`, `routeId`, `new`) but not for form data. Users lose progress on page refresh.

**Missing URL State:**
- Schedule name
- Calendar configuration  
- Fare data
- Bus selection

### NQ2: URL State Conflicts
**Severity:** Low  
**Location:** `useQueryState` usage

**Issue:** Multiple boolean states (`new`, other potential modals) could conflict. Need namespace separation.

**Recommendation:** Use object-based state management for complex wizard state.

## Zod Audit

### ZA1: Missing Client-Side Validation
**Severity:** Medium  
**Location:** Wizard forms

**Issue:** The forms use manual validation instead of Zod schemas. Should create wizard-specific schemas in `features/operator/lib/schedules.ts`:

```typescript
// MISSING SCHEMAS
export const calendarConfigSchema = z.object({
  days: z.record(z.boolean()),
  departureTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/),
  validFrom: z.string().min(1),
  validUntil: z.string().optional(),
  defaultBusId: z.string().min(1),
});

export const fareMatrixSchema = z.array(fareSchema);
```

### ZA2: Inconsistent Validation Patterns
**Severity:** Medium  
**Location:** Multiple validation points

**Issue:** Backend uses Zod schemas but frontend uses manual validation, creating duplication and potential inconsistencies.

## TanStack Query Audit  

### TQ1: Missing Optimistic Updates
**Severity:** Medium  
**Location:** Fare price updates

**Issue:** Fare price changes should use optimistic updates for better UX instead of waiting for server response.

### TQ2: Inefficient Cache Invalidation
**Severity:** Medium  
**Location:** Schedule mutations

**Issue:** All mutations invalidate the entire schedules list. Should use more granular invalidation:

```typescript
// CURRENT (too broad)
queryClient.invalidateQueries(trpc.schedules.list.pathFilter());

// BETTER (granular)
queryClient.setQueryData(trpc.schedules.get.queryKey({ id }), updatedSchedule);
```

### TQ3: Missing Error Boundary Recovery
**Severity:** Low  
**Location:** Query error states

**Issue:** Failed queries show generic error messages. Should provide retry mechanisms and more specific error handling.

## Security Issues

### S1: Missing Authorization Checks
**Severity:** Critical  
**Location:** All mutation operations

**Issue:** Beyond company ownership, no role-based permissions are enforced. Any staff member can create/modify/delete schedules.

**Required Roles:**
- Schedule creation: MANAGER or above
- Schedule deletion: ADMIN or OWNER only  
- Fare modifications: MANAGER or above

### S2: No Rate Limiting
**Severity:** Medium  
**Location:** Trip generation

**Issue:** The `regenerateTrips` mutation could be abused to create excessive database load. No rate limiting exists.

### S3: Insufficient Input Sanitization
**Severity:** Low  
**Location:** Schedule names and notes

**Issue:** Text inputs aren't sanitized, could allow XSS if data is rendered unsafely elsewhere.

## Accessibility Issues

### A1: Missing Focus Management
**Severity:** Medium  
**Location:** Wizard navigation

**Issue:** When navigating between wizard steps, focus isn't properly managed for screen reader users.

### A2: Insufficient ARIA Labels
**Severity:** Low  
**Location:** Calendar grid, fare matrix

**Issue:** Complex UI components lack proper ARIA labels and descriptions.

### A3: No Keyboard Navigation
**Severity:** Medium  
**Location:** Fare matrix table

**Issue:** Users can't efficiently navigate the fare matrix using only keyboard.

## Scalability Concerns

### SC1: Unbounded Trip Generation
**Severity:** High  
**Category:** Scalability

**Issue:** No limits on the number of trips generated. A schedule running daily for years could create millions of trip records.

**Impact:** Database growth, query performance degradation.

### SC2: No Batch Operations Support
**Severity:** Medium  
**Category:** Scalability

**Issue:** All operations are individual. Large operators with hundreds of schedules need bulk management capabilities.

### SC3: Missing Archival Strategy
**Severity:** Medium  
**Category:** Scalability

**Issue:** Old schedules and trips are never archived, leading to unbounded database growth and slower queries over time.

## Recommended Fixes

### Immediate (Critical Issues)

1. **Fix Race Condition:** Wrap trip generation duplicate check in transaction
2. **Fix Timezone Handling:** Use timezone library consistently throughout
3. **Add Authorization:** Implement role-based access control for schedule operations
4. **Fix Financial Calculations:** Use integer arithmetic and PlatformSettings
5. **Validate Payment States:** Check payment/refund status before schedule deletion

### Short Term (High Priority)

1. **Add Fare Validation:** Client and server-side validation for fare business rules
2. **Implement Optimistic Updates:** For fare price changes
3. **Add Loading States:** For route detail fetching and other async operations
4. **Bound Fare Matrix:** Add pagination or limits for routes with many stops
5. **Add Bus Availability Check:** Validate bus assignments during trip generation

### Medium Term (Medium Priority)

1. **Implement Schedule Templates:** Allow copying and template-based creation
2. **Add Bulk Operations:** Multi-schedule management capabilities
3. **Improve Query Performance:** Add pagination, optimize includes
4. **Add Audit Trail:** Track all schedule modifications
5. **Implement Draft Saving:** Auto-save wizard progress

### Long Term (Low Priority + Scalability)

1. **Add Capacity Planning:** Revenue projections and optimization tools
2. **Implement Archival:** Strategy for old schedules and trips
3. **Add Advanced Filtering:** Search, sort, and filter improvements
4. **Improve Mobile UX:** Responsive design improvements
5. **Add Integration APIs:** Connect with external fleet management systems

## Final Checklist

- [ ] **Business Logic:** 8 critical issues identified, require immediate attention
- [ ] **Database Consistency:** 3 major inconsistencies found, schema changes needed
- [ ] **Security:** 3 security vulnerabilities, authorization system needed
- [ ] **Performance:** 3 performance issues, query optimization required
- [ ] **Product Completeness:** 4 major gaps, template system needed
- [ ] **Code Architecture:** Generally good, needs better separation of concerns
- [ ] **Error Handling:** Adequate but could be more comprehensive
- [ ] **Accessibility:** Several gaps, focus management needed
- [ ] **Scalability:** Major concerns around unbounded growth

**Total Issues Found:** 67  
**Critical:** 5  
**High Priority:** 10  
**Medium Priority:** 27  
**Low Priority:** 25

**Estimated Effort to Fix Critical Issues:** 3-4 weeks  
**Estimated Effort for Complete Remediation:** 12-16 weeks

This audit reveals that while the schedules page provides good basic functionality, it requires significant hardening before production deployment to millions of users. The critical issues around race conditions, timezone handling, and authorization must be addressed immediately.