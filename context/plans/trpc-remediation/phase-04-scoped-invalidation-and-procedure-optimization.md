# Plan — Phase 4: Scoped Invalidation & Procedure Optimization

> **Part of:** [tRPC Architecture Remediation Master Plan](./README.md)  
> **Target Workspaces:** `apps/web`, `apps/traveler-app`, `apps/driver-app`, `apps/booth-app`  
> **Status:** Ready for Review & Execution  

---

## 1. What we are building

A fine-grained, surgical cache invalidation model across all client applications and request-level query deduplication for administrative procedures on the server:
1. **Elimination of Global Cache Flushes:** Replacing every occurrence of argument-less `queryClient.invalidateQueries()` with official tRPC v11 scoped filters (`trpc.[router].[procedure].queryFilter(...)` or `trpc.[router].pathFilter()`). This prevents mobile network stampedes, saves battery life, and eliminates screen-wide layout jitter.
2. **Server-Side Request Deduplication for Admin Procedures:** Adding request-scoped memoization (`ctx._cache`) to `adminProcedure` in `apps/web/trpc/init.ts`, matching the existing caching pattern used by `operatorCompanyProcedure`, `driverProcedure`, and `boothProcedure`.

---

## 2. Vocabulary agreed

- **Global Invalidation Anti-Pattern:** Invoking `queryClient.invalidateQueries()` with no parameters. This invalidates every query in the TanStack Query cache, triggering dozens of simultaneous refetch requests regardless of relevance.
- **tRPC `queryFilter()`:** An official `@trpc/tanstack-react-query` v11 helper that produces an exact query filter targeting a single procedure and optional specific input arguments (e.g. `trpc.booking.getHold.queryFilter({ holdId })`).
- **tRPC `pathFilter()`:** An official `@trpc/tanstack-react-query` v11 helper that targets an entire subrouter namespace (e.g. `trpc.booking.pathFilter()`), invalidating only queries belonging to that feature domain.
- **Request-Scoped Cache (`ctx._cache`):** An in-memory `Map` attached to the tRPC context for the duration of a single HTTP request lifecycle, used to memoize expensive database checks across batched query procedures.

---

## 3. Decisions made

1. **Hierarchy of Invalidation Precision:**
   - **Rule 1:** Where a mutation affects a single known entity (e.g. updating a trip stop or releasing a seat hold), use `queryClient.invalidateQueries(trpc.[router].[procedure].queryFilter(exactArgs))`.
   - **Rule 2:** Where a mutation alters domain state affecting multiple related queries (e.g. creating a booking), use `queryClient.invalidateQueries(trpc.[router].pathFilter())`.
   - **Rule 3:** Blanket `queryClient.invalidateQueries()` without arguments is strictly banned via linting rule or code review.
2. **Administrative Middleware Memoization:**
   - **Decision:** Wrap the `prisma.adminStaff.findUnique` query inside `adminProcedure` in `apps/web/trpc/init.ts` with `ctx._cache.get(cacheKey)`.
   - **Reasoning:** Admin dashboard overviews frequently batch 5 to 10 procedures in a single round-trip. Memoizing the admin identity check reduces database queries by up to 80% per batch.

---

## 4. Assumptions

- `trpc` options proxy is properly typed and available via `useTRPC()` across all call sites (enabled by Phase 1).
- Subrouters are structured to allow hierarchical path filtering (e.g. `trpc.booking` encompasses all booking procedures).

---

## 5. Implementation steps

### Step 1: Add `ctx._cache` Memoization to `adminProcedure` (`apps/web/trpc/init.ts`)

In [apps/web/trpc/init.ts](file:///C:/dev/moja-buss/apps/web/trpc/init.ts) (Lines 218–245):

```diff
 export const adminProcedure = protectedProcedure.use(async ({ ctx, next }) => {
+  const cacheKey = `admin_staff_${ctx.session.user.id}`;
+  let adminStaff = ctx._cache.get(cacheKey);
+
+  if (!adminStaff) {
-    const adminStaff = await prisma.adminStaff.findUnique({
+    adminStaff = await prisma.adminStaff.findUnique({
       where: {
         userId: ctx.session.user.id,
         isActive: true,
       },
     });
+    if (adminStaff) {
+      ctx._cache.set(cacheKey, adminStaff);
+    }
+  }

   if (!adminStaff) {
     throw new TRPCError({
       code: "FORBIDDEN",
       message: "User is not an active admin staff member",
     });
   }

   return next({
     ctx: {
       ...ctx,
       adminStaff,
     },
   });
 });
```

---

### Step 2: Replace Blanket Invalidations in Traveler App

In [apps/traveler-app/features/booking/hooks/use-booking-actions.ts](file:///C:/dev/moja-buss/apps/traveler-app/features/booking/hooks/use-booking-actions.ts):

```diff
 export function useCreateHold() {
   const queryClient = useQueryClient();
+  const trpc = useTRPC();
   return useMutation({
     ...trpc.booking.createHold.mutationOptions(),
     onSuccess: () => {
-      queryClient.invalidateQueries();
+      queryClient.invalidateQueries(trpc.booking.pathFilter());
     },
   });
 }

 export function useConfirmBooking() {
   const queryClient = useQueryClient();
+  const trpc = useTRPC();
   return useMutation({
     ...trpc.booking.confirmBooking.mutationOptions(),
     onSuccess: () => {
-      queryClient.invalidateQueries();
+      queryClient.invalidateQueries(trpc.booking.pathFilter());
+      queryClient.invalidateQueries(trpc.wallet.getBalance.queryFilter());
     },
   });
 }

 export function useReleaseHold() {
   const queryClient = useQueryClient();
+  const trpc = useTRPC();
   return useMutation({
     ...trpc.booking.releaseHold.mutationOptions(),
     onSuccess: () => {
-      queryClient.invalidateQueries();
+      queryClient.invalidateQueries(trpc.booking.pathFilter());
     },
   });
 }
```

---

### Step 3: Replace Blanket Invalidations in Driver App

In [apps/driver-app/features/driver/hooks/use-driver-mutations.ts](file:///C:/dev/moja-buss/apps/driver-app/features/driver/hooks/use-driver-mutations.ts):

```diff
 export function useStartShift() {
   const queryClient = useQueryClient();
+  const trpc = useTRPC();
   return useMutation({
     ...trpc.drivers.startShift.mutationOptions(),
     onSuccess: () => {
-      queryClient.invalidateQueries();
+      queryClient.invalidateQueries(trpc.drivers.getCurrentShift.queryFilter());
+      queryClient.invalidateQueries(trpc.trips.pathFilter());
     },
   });
 }

 export function useEndShift() {
   const queryClient = useQueryClient();
+  const trpc = useTRPC();
   return useMutation({
     ...trpc.drivers.endShift.mutationOptions(),
     onSuccess: () => {
-      queryClient.invalidateQueries();
+      queryClient.invalidateQueries(trpc.drivers.getCurrentShift.queryFilter());
+      queryClient.invalidateQueries(trpc.trips.pathFilter());
     },
   });
 }
```

In [apps/driver-app/features/driver/screens/active-trip-screen.tsx](file:///C:/dev/moja-buss/apps/driver-app/features/driver/screens/active-trip-screen.tsx):
```diff
 onSuccess: () => {
-  queryClient.invalidateQueries();
+  queryClient.invalidateQueries(trpc.trips.getTripManifest.queryFilter({ tripId }));
+  queryClient.invalidateQueries(trpc.trips.getActiveTrip.queryFilter());
 }
```

---

### Step 4: Replace Blanket Invalidations in Booth App

In [apps/booth-app/app/(tabs)/sales.tsx](file:///C:/dev/moja-buss/apps/booth-app/app/(tabs)/sales.tsx):

```diff
 onSuccess: () => {
-  queryClient.invalidateQueries();
+  queryClient.invalidateQueries(trpc.booth.getRecentSales.queryFilter());
+  queryClient.invalidateQueries(trpc.agentCash.getCurrentShift.queryFilter());
 }
```

---

## 6. Verification and Testing

### 1. Database Query Trace on Batched Admin Queries
1. Trigger a batched admin request in Next.js containing 3 admin procedures (e.g. `admin.getStats`, `admin.getRecentAuditLogs`, `admin.getPendingApprovals`).
2. Inspect Prisma SQL query logs.
3. *Expected Outcome:* Exactly **1** query for `SELECT FROM "AdminStaff" WHERE "userId" = ...` is logged instead of 3.

### 2. Network Tab Mobile Invalidation Test
1. Connect mobile debugger to `apps/traveler-app`.
2. Confirm a seat hold.
3. *Expected Outcome:* Only `booking.*` and `wallet.getBalance` queries refetch. Zero requests are sent for user profile, notification count, or static city routes.
