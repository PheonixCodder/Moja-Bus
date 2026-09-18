# Phase 03 — CORS Preflight & Expo Web Support

> **Authority:** [`context/audits/trpc-audit/15-findings-and-recommendations.md`](file:///C:/dev/moja-buss/context/audits/trpc-audit/15-findings-and-recommendations.md) (`TRPC-WEB-004`)  
> **Target Files:**
> - `apps/web/app/api/trpc/[...trpc]/route.ts`

---

## 1. Objectives

1. Export an explicit `OPTIONS` HTTP handler from the Next.js App Router tRPC route (`/api/trpc/[...trpc]`).
2. Respond with `204 No Content` and standard CORS preflight headers (`Access-Control-Allow-Origin`, `Access-Control-Allow-Methods`, `Access-Control-Allow-Headers`, `Access-Control-Allow-Credentials`).
3. Unblock web debugging workflows for Expo applications (`npx expo start --web` running on port 8081 or 8082 against the backend on port 3000) and automated cross-origin test suites.

---

## 2. Implementation Steps

### Step 1: Add `OPTIONS` Export to tRPC Catch-All Route

Update `apps/web/app/api/trpc/[...trpc]/route.ts` to implement and export the `OPTIONS` handler alongside `GET` and `POST`:

```typescript
// apps/web/app/api/trpc/[...trpc]/route.ts

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

export function OPTIONS(req: Request) {
	const origin = req.headers.get("origin") ?? "*";

	return new Response(null, {
		status: 204,
		headers: {
			"Access-Control-Allow-Origin": origin,
			"Access-Control-Allow-Methods": "GET, POST, OPTIONS",
			"Access-Control-Allow-Headers":
				"Content-Type, Authorization, x-trpc-source, expo-origin, cookie",
			"Access-Control-Allow-Credentials": "true",
			"Access-Control-Max-Age": "86400",
		},
	});
}

export { handler as GET, handler as POST };
```

#### Why This Works:
When modern web browsers (including Chrome/Safari executing Expo web apps) initiate cross-origin requests that carry custom headers (such as `expo-origin` or `cookie`), they send an initial HTTP `OPTIONS` preflight request. If the server does not export an `OPTIONS` handler, Next.js App Router automatically responds with `405 Method Not Allowed`, aborting the request before the `GET` or `POST` payload can be delivered. Returning HTTP 204 with the validated origin and headers satisfies the browser preflight security check.

---

## 3. Risks & Mitigations

| Risk | Severity | Mitigation |
| :--- | :---: | :--- |
| Permissive CORS in production | Low | Mobile native apps (iOS/Android) bypass browser CORS altogether. For web clients, authentication is strictly verified by session cookies and Better Auth tokens in `createContextFromHeaders`; origin reflection on preflight only satisfies browser transport requirements, while actual mutations require valid session signatures. |
| Incompatible headers | Low | The `Access-Control-Allow-Headers` list includes all headers used by `@trpc/client`, `@moja/auth`, and custom Expo hooks: `Content-Type`, `Authorization`, `x-trpc-source`, `expo-origin`, and `cookie`. |

---

## 4. Verification & Acceptance Criteria

1. **Compilation Proof**:
   ```bash
   pnpm --filter web typecheck
   ```
   Must exit with code 0.

2. **Preflight HTTP Test**:
   Execute a simulated preflight request using PowerShell or curl:
   ```powershell
   Invoke-WebRequest -Uri "http://localhost:3000/api/trpc/public.listOperators" `
     -Method Options `
     -Headers @{
       "Origin" = "http://localhost:8081";
       "Access-Control-Request-Method" = "POST";
       "Access-Control-Request-Headers" = "content-type,expo-origin"
     }
   ```
   Verify:
   - Status code is **204 No Content**.
   - Header `Access-Control-Allow-Origin` matches `http://localhost:8081`.
   - Header `Access-Control-Allow-Methods` includes `GET, POST, OPTIONS`.

3. **Expo Web Runtime Test**:
   - Run `npx expo start --web` in `apps/traveler-app`.
   - Open in browser and verify query calls to backend `/api/trpc/*` succeed without CORS errors in DevTools Console.
