# Phase 3: Observability Polish & Deprecation Lifecycle

> **Phase:** 3 of 3  
> **Master Plan:** [`context/plans/trpc-remediation-v3/README.md`](file:///C:/dev/moja-buss/context/plans/trpc-remediation-v3/README.md)  
> **Scope:** `apps/web`, documentation & router governance

---

## 1. Problem Statement

1. **Inaccurate Transport Source Header in Client SSR:**
   In [`apps/web/trpc/client.tsx`](file:///C:/dev/moja-buss/apps/web/trpc/client.tsx#L56), the `headers()` function sets:
   ```ts
   "x-trpc-source": typeof window === "undefined" ? "rsc" : "client",
   ```
   `client.tsx` is marked `"use client"`. When `typeof window === "undefined"` is true, execution occurs during **SSR of a Client Component**, not React Server Component execution (which is exclusively in `server.tsx`).
2. **Deprecation Lifecycle & Monorepo Governance:**
   Deprecated aliases in [`apps/web/trpc/routers/public.ts`](file:///C:/dev/moja-buss/apps/web/trpc/routers/public.ts) (`getNotificationToken`, `registerPushToken`, `markNotificationAsRead`) and [`apps/web/trpc/routers/operator.ts`](file:///C:/dev/moja-buss/apps/web/trpc/routers/operator.ts) (`...operatorSettingsProcedures`) must be maintained for backwards compatibility with existing native app installations while documenting their eventual end-of-life.

---

## 2. Implementation Steps

### Step 3.1: Correct Source Header in Web Client
In [`apps/web/trpc/client.tsx`](file:///C:/dev/moja-buss/apps/web/trpc/client.tsx):
* Update the `headers` link configuration:
```ts
headers() {
  return {
    "x-trpc-source": typeof window === "undefined" ? "ssr" : "client",
  };
}
```

### Step 3.2: Formalize Server Alias Deprecations
In [`apps/web/context/trpc-router-map.md`](file:///C:/dev/moja-buss/apps/web/context/trpc-router-map.md):
* Explicitly document the deprecation lifecycle:
  * `public.getNotificationToken` -> canonical `notifications.getNotificationToken`
  * `public.registerPushToken` -> canonical `notifications.registerPushToken`
  * `public.markNotificationAsRead` -> canonical `notifications.markNotificationAsRead`
  * `operator.<settingProcedure>` -> canonical `operator.settings.<settingProcedure>`
* Verify that server-side router files keep `@deprecated` JSDoc annotations so developer IDEs flag any new usages while preserving runtime availability for older mobile binary builds in production.

---

## 3. Verification Criteria

1. Verify through server logging or network inspection that requests from web client SSR carry `"x-trpc-source": "ssr"`, while browser client requests carry `"x-trpc-source": "client"`.
2. Verify `pnpm turbo typecheck` and `pnpm turbo lint` exit code 0 across all workspaces.
3. Verify that all documentation in `context/trpc-router-map.md` accurately reflects active and deprecated routes.
