# Plan — Phase 1: Type Safety & TypeScript Unification

> **Part of:** [tRPC Architecture Remediation Master Plan](./README.md)  
> **Target Workspaces:** `apps/web`, `apps/traveler-app`, `apps/driver-app`, `apps/booth-app`, root `package.json`  
> **Status:** Ready for Review & Execution  

---

## 1. What we are building

A complete restoration of compile-time end-to-end type safety between the Next.js tRPC backend and all three React Native Expo client applications (`traveler-app`, `driver-app`, `booth-app`). This is achieved by:
1. Harmonizing the TypeScript compiler version across all monorepo workspaces to eliminate duplicate virtual store resolutions of `@trpc/server` in `pnpm-lock.yaml`.
2. Eliminating the nominal brand symbol collision that broke `createTRPCContext<AppRouter>()` in React Native.
3. Removing the emergency type bypasses (`trpcClient={getTrpcClient() as any}` in `traveler-app` and `driver-app`, and `as unknown as Parameters<typeof TRPCProvider>[0]["trpcClient"]` in `booth-app`).
4. Completely removing all 12+ manual `interface TypedTRPC` shims and restoring native, uncasted `const trpc = useTRPC()` inference across all components and custom hooks.

---

## 2. Vocabulary agreed

- **Nominal Brand Symbol Mismatch:** An error in TypeScript when two different package installations define `unique symbol` types (e.g. `_procedure: unique symbol` in `@trpc/server`). Even though the type structures match, TypeScript treats them as mutually incompatible because they originate from different module instances.
- **pnpm Virtual Store Bifurcation:** When different workspaces specify different peer dependency ranges (e.g. `typescript: "^5"` vs `typescript: "~6.0.3"`), pnpm isolates them into distinct directories in `.pnpm/`, preventing deduplication.
- **`TypedTRPC` Shim:** A local developer workaround where manual TypeScript interfaces (`interface TrpcMutation`, `interface TrpcQuery`) were constructed inside client files to mock procedure types instead of inheriting them from `AppRouter`.
- **Compile-Time Contract Invariant:** The architectural guarantee that if a backend procedure changes its name, input parameters, or output type, the TypeScript compiler will immediately fail in every client application that calls it before any code can be built or deployed.

---

## 3. Decisions made

1. **TypeScript Target Version:**
   - **Decision:** Harmonize the entire monorepo to `"typescript": "^5.8.0"` (or harmonize root and `apps/web` with Expo SDK 57's supported TypeScript version).
   - **Reasoning:** In `pnpm-lock.yaml`, both `5.9.3` and `6.0.3` exist because `apps/web` specified `"^5"` while Expo apps specified `"~6.0.3"`. By aligning all workspaces to use the exact same TypeScript specifier, pnpm will resolve a single unified instance of `@trpc/server`, collapsing the virtual store split and restoring symbol brand equality.
2. **Zero Tolerance for Type Assertions in Client Setup:**
   - **Decision:** Delete `as any` and `as unknown as Parameters<...>` entirely from `lib/trpc.tsx`. If `tsc` reports any error on `<TRPCProvider trpcClient={getTrpcClient()} queryClient={queryClient}>`, the build must fail until the underlying type contract is resolved cleanly.
3. **Elimination of All `TypedTRPC` Interfaces:**
   - **Decision:** Delete every instance of `interface TypedTRPC` and `as unknown as TypedTRPC`. Components must directly invoke `const trpc = useTRPC()` and consume `trpc.[router].[procedure].queryOptions()` or `mutationOptions()`.

---

## 4. Assumptions

- React 19.2.3 and Expo SDK 57 are compatible with the unified TypeScript compiler version.
- The 26 backend subrouters in `apps/web/trpc/routers/` do not contain unresolvable recursive types that would trigger `TS7056` (excessively deep type instantiation) once full inference is restored.
- All procedure names and payload types currently accessed via `TypedTRPC` shims correspond to active backend procedures in `apps/web/trpc/routers/`. Any discrepancies uncovered during shim removal are genuine bugs that must be corrected.

---

## 5. Implementation steps

### Step 1: Harmonize TypeScript in All `package.json` Files

#### A. In Root `package.json`
```diff
// package.json (Line 37)
   "devDependencies": {
     "@biomejs/biome": "^2.5.1",
     "@types/node": "^26.0.1",
     "husky": "^9.1.7",
     "lint-staged": "^17.0.8",
     "tsx": "^4.22.4",
     "turbo": "^2.10.0",
-    "typescript": "^6.0.3"
+    "typescript": "^5.8.0"
   },
```

#### B. In `apps/web/package.json`
```diff
// apps/web/package.json (Line 105)
   "devDependencies": {
...
     "tailwindcss": "^4",
     "tsx": "^4.22.4",
-    "typescript": "^5"
+    "typescript": "^5.8.0"
   }
```

#### C. In `apps/traveler-app/package.json`
```diff
// apps/traveler-app/package.json (Line 123)
   "devDependencies": {
...
     "prettier": "^3.8.3",
     "prettier-plugin-tailwindcss": "^0.8.0",
-    "typescript": "~6.0.3"
+    "typescript": "^5.8.0"
   }
```

#### D. In `apps/driver-app/package.json`
```diff
// apps/driver-app/package.json (Line 98)
   "devDependencies": {
...
     "prettier": "^3.8.3",
     "prettier-plugin-tailwindcss": "^0.8.0",
-    "typescript": "~6.0.3"
+    "typescript": "^5.8.0"
   }
```

#### E. In `apps/booth-app/package.json`
```diff
// apps/booth-app/package.json (Line 111)
   "devDependencies": {
...
     "prettier": "^3.8.3",
     "prettier-plugin-tailwindcss": "^0.8.0",
-    "typescript": "~6.0.3"
+    "typescript": "^5.8.0"
   }
```

#### F. Update Lockfile
Run:
```powershell
pnpm install
```
Verify deduplication:
```powershell
pnpm why typescript
```
*Criteria:* Output must show exactly 1 version of TypeScript across all workspaces.

---

### Step 2: Remove Type Bypasses in `lib/trpc.tsx`

#### A. Traveler App (`apps/traveler-app/lib/trpc.tsx`)
```diff
 export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
   return (
-    <TRPCProvider trpcClient={getTrpcClient() as any} queryClient={queryClient}>
+    <TRPCProvider trpcClient={getTrpcClient()} queryClient={queryClient}>
       {children}
     </TRPCProvider>
   );
 }
```

#### B. Driver App (`apps/driver-app/lib/trpc.tsx`)
```diff
 export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
   return (
-    <TRPCProvider trpcClient={getTrpcClient() as any} queryClient={queryClient}>
+    <TRPCProvider trpcClient={getTrpcClient()} queryClient={queryClient}>
       {children}
     </TRPCProvider>
   );
 }
```

#### C. Booth App (`apps/booth-app/lib/trpc.tsx`)
```diff
 export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
   return (
     <TRPCProvider
-      trpcClient={
-        getTrpcClient() as unknown as Parameters<typeof TRPCProvider>[0]["trpcClient"]
-      }
+      trpcClient={getTrpcClient()}
       queryClient={queryClient}
     >
       {children}
     </TRPCProvider>
   );
 }
```

---

### Step 3: Remove All `TypedTRPC` Shims Across Mobile Apps

Search and replace the manual shims across all identified locations:

#### 1. In `apps/traveler-app/hooks/use-push-token.ts`:
```diff
- interface TrpcMutation<TInput, TOutput> {
-   mutationOptions: (opts?: {
-     onSuccess?: (data: TOutput) => void;
-     onError?: (error: any) => void;
-   }) => any;
- }
- interface TypedTRPC {
-   notifications: {
-     registerPushToken: TrpcMutation<{ token: string; platform: string }, { success: boolean }>;
-   };
- }
- const trpc = useTRPC() as unknown as TypedTRPC;
+ const trpc = useTRPC();
```

#### 2. In `apps/traveler-app/hooks/use-wallet.ts`:
```diff
- interface TrpcQuery<TInput, TOutput> {
-   queryOptions: (input?: TInput) => any;
- }
- interface TypedTRPC {
-   wallet: {
-     getBalance: TrpcQuery<void, { balance: number; currency: string }>;
-   };
- }
- const trpc = useTRPC() as unknown as TypedTRPC;
+ const trpc = useTRPC();
```

#### 3. In `apps/traveler-app/components/notification-bell.tsx`:
```diff
- const trpc = useTRPC() as unknown as TypedTRPC;
+ const trpc = useTRPC();
```

#### 4. In `apps/traveler-app/hooks/use-personal-info.ts` & `use-reviews.ts`:
```diff
- const trpc = useTRPC() as unknown as TypedTRPC;
+ const trpc = useTRPC();
```

#### 5. In `apps/driver-app/hooks/use-push-token.ts`, `components/notification-bell.tsx`, `app/_layout.tsx`:
```diff
- const trpc = useTRPC() as unknown as TypedTRPC;
+ const trpc = useTRPC();
```

#### 6. In `apps/booth-app/hooks/use-push-token.ts`, `components/notification-bell.tsx`, `app/_layout.tsx`:
```diff
- const trpc = useTRPC() as unknown as TypedTRPC;
+ const trpc = useTRPC();
```

---

## 6. Verification and Testing

### 1. Static Typecheck Pass
Run type checking across all four applications in parallel:
```powershell
pnpm turbo typecheck
```
*Expected Outcome:* All 4 projects pass with `0 errors`.

### 2. Proof of Contract Failure (Regression Test)
Perform a controlled verification test to prove end-to-end type safety is active:
1. Temporarily modify `apps/web/trpc/routers/notifications.ts`:
   ```typescript
   // Change input field from 'token' to 'devicePushToken'
   registerPushToken: protectedProcedure.input(z.object({ devicePushToken: z.string() }))
   ```
2. Run `pnpm --filter traveler-app typecheck`.
3. *Expected Outcome:* The build MUST fail with:
   `Property 'token' does not exist in type '{ devicePushToken: string; }'`.
4. Revert the temporary test change.
