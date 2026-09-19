# Phase 1: CORS, Monorepo Dependencies & Validation Baseline

> **Phase:** 1 of 3  
> **Master Plan:** [`context/plans/trpc-remediation-v3/README.md`](file:///C:/dev/moja-buss/context/plans/trpc-remediation-v3/README.md)  
> **Scope:** `apps/web`, `packages/shared`, `apps/booth-app`

---

## 1. Problem Statement

1. **CORS Missing on HTTP `GET`/`POST`:**
   In [`apps/web/app/api/trpc/[...trpc]/route.ts`](file:///C:/dev/moja-buss/apps/web/app/api/trpc/%5B...trpc%5D/route.ts), the `OPTIONS` handler returns `Access-Control-Allow-Origin` and `Access-Control-Allow-Credentials: true`. However, `fetchRequestHandler` in `route.ts` lacks `responseMeta`. When a cross-origin web client (such as Expo Web running on `localhost:8081`) sends the subsequent `POST` or `GET` request, `fetchRequestHandler` returns no CORS headers, causing the browser to block the response.
2. **Phantom Dependencies in `@moja/shared`:**
   [`packages/shared/src/trpc/create-mobile-trpc.tsx`](file:///C:/dev/moja-buss/packages/shared/src/trpc/create-mobile-trpc.tsx) imports `@tanstack/react-query`, `@trpc/client`, `@trpc/server`, `@trpc/tanstack-react-query`, `react`, `react-native`, and `superjson`. However, [`packages/shared/package.json`](file:///C:/dev/moja-buss/packages/shared/package.json) defines zero dependencies or peerDependencies.
3. **Zod Version Inconsistency:**
   [`apps/booth-app/package.json`](file:///C:/dev/moja-buss/apps/booth-app/package.json) specifies `"zod": "^3.24.0"`, whereas root `package.json`, `packages/schemas`, and `apps/web` use `"zod": "^4.4.3"`.

---

## 2. Implementation Steps

### Step 1.1: Add `responseMeta` to Next.js tRPC Route Handler
In [`apps/web/app/api/trpc/[...trpc]/route.ts`](file:///C:/dev/moja-buss/apps/web/app/api/trpc/%5B...trpc%5D/route.ts):
* Configure `responseMeta` in `fetchRequestHandler`:
```ts
const handler = (req: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req,
    router: appRouter,
    createContext: async (opts) => {
      return createContextFromHeaders(req.headers, opts.resHeaders);
    },
    responseMeta() {
      const origin = req.headers.get("origin");
      if (!origin) return {};
      return {
        headers: {
          "Access-Control-Allow-Origin": origin,
          "Access-Control-Allow-Credentials": "true",
        },
      };
    },
    onError({ error, path }) {
      if (error.code === "INTERNAL_SERVER_ERROR") {
        console.error(
          `[tRPC 500 Error] Uncaught error on procedure '${path}':`,
          error,
        );
      }
    },
  });
```

### Step 1.2: Declare Peer Dependencies in `@moja/shared`
In [`packages/shared/package.json`](file:///C:/dev/moja-buss/packages/shared/package.json):
* Add `peerDependencies` and `peerDependenciesMeta` for all packages consumed by `src/trpc/`:
```json
"peerDependencies": {
  "@tanstack/react-query": "^5.0.0",
  "@trpc/client": "^11.0.0",
  "@trpc/server": "^11.0.0",
  "@trpc/tanstack-react-query": "^11.0.0",
  "react": "^18.0.0 || ^19.0.0",
  "react-native": "*",
  "superjson": "^2.0.0"
},
"peerDependenciesMeta": {
  "@tanstack/react-query": { "optional": true },
  "@trpc/client": { "optional": true },
  "@trpc/server": { "optional": true },
  "@trpc/tanstack-react-query": { "optional": true },
  "react-native": { "optional": true },
  "superjson": { "optional": true }
}
```

### Step 1.3: Align Zod Version in Booth App
In [`apps/booth-app/package.json`](file:///C:/dev/moja-buss/apps/booth-app/package.json):
* Upgrade `"zod": "^3.24.0"` to `"zod": "^4.4.3"`.

---

## 3. Verification Criteria

1. Run `pnpm install` and verify package resolutions succeed without peer dependency warnings.
2. Run `pnpm turbo typecheck` and confirm all 14 packages exit code 0.
3. Test a simulated cross-origin `POST` request with an `Origin: http://localhost:8081` header against `/api/trpc` and verify that `Access-Control-Allow-Origin: http://localhost:8081` and `Access-Control-Allow-Credentials: true` are present on the response.
