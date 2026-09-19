# Phase 01 — Server Context & Route Observability

> **Authority:** [`context/audits/trpc-audit/15-findings-and-recommendations.md`](file:///C:/dev/moja-buss/context/audits/trpc-audit/15-findings-and-recommendations.md) (`TRPC-WEB-001`, `TRPC-WEB-003`, `TRPC-WEB-002`)  
> **Target Files:**
> - `apps/web/trpc/server.tsx`
> - `apps/web/app/api/trpc/[...trpc]/route.ts`
> - `apps/web/trpc/client.tsx`

---

## 1. Objectives

1. Eliminate redundant session queries in React Server Components by wrapping `createServerContext` in React's `cache()`.
2. Enable request-scoped `_cache` reuse across concurrent server prefetch calls on the same page request.
3. Capture uncaught procedure exceptions (`INTERNAL_SERVER_ERROR`) in server logs via `fetchRequestHandler`'s `onError` callback.
4. Harden client SSR base URL resolution to recognize `process.env.VERCEL_URL` and `process.env.NEXT_PUBLIC_APP_URL`.

---

## 2. Implementation Steps

### Step 1: Wrap `createServerContext` in `cache()` (`apps/web/trpc/server.tsx`)
In `apps/web/trpc/server.tsx`, replace the unmemoized `createServerContext` function with a `cache(...)` wrapped getter:

```typescript
// BEFORE:
async function createServerContext() {
  return createContextFromHeaders(await headers());
}

// AFTER:
export const createServerContext = cache(async () => {
  return createContextFromHeaders(await headers());
});
```

#### Why This Works:
React's `cache()` memoizes the result of the async function for the lifetime of a single React Server Component request. When a page triggers multiple `queryClient.fetchQuery` or `prefetch` calls, `createServerContext` runs once. The resulting `ctx` (containing `user`, `prisma`, and `_cache`) is shared across all procedure calls in that request, allowing `operatorCompanyProcedure`, `adminProcedure`, and `driverProcedure` to hit `ctx._cache` on the 2nd..Nth call without touching the database.

---

### Step 2: Add `onError` Handler to API Route (`apps/web/app/api/trpc/[...trpc]/route.ts`)
Update `apps/web/app/api/trpc/[...trpc]/route.ts` to attach an `onError` hook to `fetchRequestHandler`:

```typescript
import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/trpc/routers/_app";
import { createContextFromHeaders } from "@/trpc/init";

const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async (opts) => {
      return createContextFromHeaders(req.headers, opts.resHeaders);
    },
    onError({ error, path }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error(`[tRPC 500 Error] Uncaught error on procedure '${path}':`, error);
      }
    },
  });

export { handler as GET, handler as POST };
```

---

### Step 3: Support Vercel and Public App URLs (`apps/web/trpc/client.tsx`)
Update `getBaseUrl()` in `apps/web/trpc/client.tsx` to conform to official tRPC Next.js App Router guidelines:

```typescript
function getBaseUrl() {
  if (typeof window !== "undefined") {
    return "";
  }
  if (process.env["VERCEL_URL"]) {
    return `https://${process.env["VERCEL_URL"]}`;
  }
  return process.env["NEXT_PUBLIC_APP_URL"] ?? "http://localhost:3000";
}
```

---

## 3. Verification & Acceptance Criteria

1. **Compilation Proof**: Run `pnpm --filter web typecheck` and verify exit code 0.
2. **Context Deduplication Test**:
   - Temporarily place `console.log("[Context] createContextFromHeaders executed")` inside `createContextFromHeaders`.
   - Load `/dashboard/operator` (which prefetches `getOnboardingStatus` and `getMyPermissions`).
   - Confirm in terminal logs that `createContextFromHeaders` prints exactly **once** instead of twice.
3. **Error Logging Test**:
   - Hit a route that triggers a 500 error; verify the procedure name and error stack appear in terminal output.
