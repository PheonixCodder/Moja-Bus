# Moja-Bus — tRPC Architecture Remediation Master Plan

> **Authority:** Derived from [`context/audits/trpc-audit/`](file:///C:/dev/moja-buss/context/audits/trpc-audit/README.md)  
> **Benchmark:** Official tRPC v11.19.0 Standards ([`app-references/trpc`](file:///C:/dev/moja-buss/app-references/trpc))  
> **Target Workspaces:** `apps/web`, `apps/traveler-app`, `apps/driver-app`, `apps/booth-app`  
> **Directory:** `context/plans/trpc-remediation/`

---

## 1. Executive Mission

The purpose of this 5-phase remediation program is to transition the Moja-Bus tRPC architecture from its current compromised state (nominal type breaks, `as any` bypasses, monorepo boundary leakage, and blanket query flushes) into an enterprise-grade, fully type-safe, resilient distributed system strictly compliant with official tRPC v11 patterns.

---

## 2. Phase Breakdown & Execution Sequence

```
                                      ┌────────────────────────────────────────────────────────┐
                                      │             PHASE 1: TYPE SYSTEM RESTORATION            │
                                      │   Unify TypeScript (5.9.3 vs 6.0.3), collapse pnpm     │
                                      │   stores, eliminate `as any` and manual `TypedTRPC`    │
                                      └───────────────────────────┬────────────────────────────┘
                                                                  │
                                                                  ▼
                                      ┌────────────────────────────────────────────────────────┐
                                      │             PHASE 2: MONOREPO BOUNDARY ENFORCEMENT     │
                                      │   Sanitize `tsconfig.json` path leaks (`../web/*`),   │
                                      │   establish `@moja/web/trpc/router` contract export    │
                                      └───────────────────────────┬────────────────────────────┘
                                                                  │
                                                                  ▼
                                      ┌────────────────────────────────────────────────────────┐
                                      │             PHASE 3: MOBILE AUTH & CACHE LIFECYCLE     │
                                      │   Purge QueryCache on logout in Driver & Booth apps,   │
                                      │   eliminate cold-boot 401 token hydration race        │
                                      └───────────────────────────┬────────────────────────────┘
                                                                  │
                                                                  ▼
                                      ┌────────────────────────────────────────────────────────┐
                                      │             PHASE 4: SCOPED INVALIDATION & CACHING     │
                                      │   Replace blanket `invalidateQueries()` with filters,  │
                                      │   add `ctx._cache` memoization to `adminProcedure`     │
                                      └───────────────────────────┬────────────────────────────┘
                                                                  │
                                                                  ▼
                                      ┌────────────────────────────────────────────────────────┐
                                      │             PHASE 5: ROUTER DECOMPOSITION & DOCS       │
                                      │   Deconstruct 5,321-line `drivers.ts` monolith,        │
                                      │   nest `operatorSettingsRouter`, sync router registry  │
                                      └────────────────────────────────────────────────────────┘
```

---

## 3. Dedicated Plan Index

| Document | Phase | Primary Objective | Key Target Files |
| :--- | :---: | :--- | :--- |
| [phase-01-type-safety-and-typescript-unification.md](file:///C:/dev/moja-buss/context/plans/trpc-remediation/phase-01-type-safety-and-typescript-unification.md) | **Phase 1** | Unify TypeScript compiler, remove `as any` casts, delete manual `TypedTRPC` shims across mobile apps. | `package.json`, `apps/*/package.json`, `apps/*/lib/trpc.tsx`, 12+ hooks |
| [phase-02-monorepo-packaging-and-boundary-enforcement.md](file:///C:/dev/moja-buss/context/plans/trpc-remediation/phase-02-monorepo-packaging-and-boundary-enforcement.md) | **Phase 2** | Sanitize `tsconfig.json` paths (`"@/*": ["./*"]`), formalize `@moja/web` package export, prevent Node.js leaks. | `apps/*/tsconfig.json`, `apps/web/package.json`, `apps/*/lib/trpc.tsx` |
| [phase-03-mobile-auth-and-cache-lifecycle-hardening.md](file:///C:/dev/moja-buss/context/plans/trpc-remediation/phase-03-mobile-auth-and-cache-lifecycle-hardening.md) | **Phase 3** | Flush `queryClient` on sign out in Driver and Booth apps, guard initial query execution until auth readiness. | `driver-app/.../profile-view.tsx`, `booth-app/.../profile.tsx`, `apps/*/app/_layout.tsx` |
| [phase-04-scoped-invalidation-and-procedure-optimization.md](file:///C:/dev/moja-buss/context/plans/trpc-remediation/phase-04-scoped-invalidation-and-procedure-optimization.md) | **Phase 4** | Replace argument-less `invalidateQueries()` with `queryFilter()` / `pathFilter()`, memoize `adminProcedure`. | `apps/web/trpc/init.ts`, booking, driver, and booth mutation hooks |
| [phase-05-modularize-monolithic-routers-and-docs.md](file:///C:/dev/moja-buss/context/plans/trpc-remediation/phase-05-modularize-monolithic-routers-and-docs.md) | **Phase 5** | Break down `drivers.ts` (5,321 lines) into modular subrouters, fix `operator.ts` subrouter nesting, update docs. | `apps/web/trpc/routers/drivers.ts`, `operator.ts`, `context/trpc-router-map.md` |

---

## 4. Architectural Invariants (Non-Negotiables)

1. **End-to-End Type Safety:** No manual type shims, no `as any`, no nominal symbol coercion. Renaming any procedure or changing any input schema in `_app.ts` MUST immediately break the TypeScript build across all 4 applications.
2. **Zero Direct Web Imports in Bundles:** React Native Metro bundlers must never resolve files from `apps/web` except strictly through exported types.
3. **No Unfiltered Cache Drops:** `queryClient.invalidateQueries()` without arguments is strictly forbidden across the monorepo.
4. **Session Isolation:** A shared tablet or phone must never retain user or operational cache data across `signOut()`.
5. **Zero Downtime / Zero Regressions:** API contracts and wire protocols must remain backwards-compatible throughout the migration.
