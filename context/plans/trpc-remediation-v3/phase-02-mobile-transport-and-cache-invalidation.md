# Phase 2: Mobile Transport Resilience & Cache Sync

> **Phase:** 2 of 3  
> **Master Plan:** [`context/plans/trpc-remediation-v3/README.md`](file:///C:/dev/moja-buss/context/plans/trpc-remediation-v3/README.md)  
> **Scope:** `packages/shared`, `apps/traveler-app`, `apps/driver-app`, `apps/booth-app`

---

## 1. Problem Statement

1. **Batched 207 Multi-Status Bypasses Silent 401 Refresh:**
   In [`packages/shared/src/trpc/create-mobile-trpc.tsx`](file:///C:/dev/moja-buss/packages/shared/src/trpc/create-mobile-trpc.tsx#L122), `fetchWithAuth` only checks `if (response.status === 401)`. In tRPC batching, if multiple requests are batched and one fails with `UNAUTHORIZED`, the HTTP response status code is `207 Multi-Status`. The client does not detect the 401 inside the 207 payload and skips token rotation.
2. **Unauthenticated Session Keepalive Leaks:**
   `AuthSessionKeepAlive` in `create-mobile-trpc.tsx` fires `ensureAuthCookiesFresh()` every 4 minutes unconditionally, polling `/api/auth/get-session` even when the user is completely logged out.
3. **Deprecated Notification Token Calls:**
   All three mobile root layouts (`apps/traveler-app/app/_layout.tsx`, `apps/driver-app/app/_layout.tsx`, and `apps/booth-app/app/_layout.tsx`) query `trpc.public.getNotificationToken` instead of canonical `trpc.notifications.getNotificationToken`.
4. **Missing Query Invalidation in Booth App:**
   In [`apps/booth-app/app/sell/payment.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/payment.tsx), successful cash sales transition screens without invalidating terminal bookings or reconciliation queries.

---

## 2. Implementation Steps

### Step 2.1: Robust 401 Silent Refresh on 207 Multi-Status
In [`packages/shared/src/trpc/create-mobile-trpc.tsx`](file:///C:/dev/moja-buss/packages/shared/src/trpc/create-mobile-trpc.tsx):
* Check for 401 status OR 207 Multi-Status containing `UNAUTHORIZED` (error code `-32001` or `UNAUTHORIZED` in response JSON) before retrying the request:
```ts
async function isUnauthorizedResponse(res: Response): Promise<boolean> {
  if (res.status === 401) return true;
  if (res.status === 207) {
    try {
      const cloned = res.clone();
      const body = await cloned.json();
      if (Array.isArray(body)) {
        return body.some(
          (item) =>
            item?.error?.data?.code === "UNAUTHORIZED" ||
            item?.error?.data?.httpStatus === 401,
        );
      }
    } catch {
      return false;
    }
  }
  return false;
}
```
* Update `fetchWithAuth`:
```ts
let response = await request();
await syncAuthCookiesFromResponse(response);

if (await isUnauthorizedResponse(response)) {
  await ensureAuthCookiesFresh();
  response = await request();
  await syncAuthCookiesFromResponse(response);
}

return response;
```

### Step 2.2: Guard Keepalive Against Unauthenticated Polling
In [`packages/shared/src/trpc/create-mobile-trpc.tsx`](file:///C:/dev/moja-buss/packages/shared/src/trpc/create-mobile-trpc.tsx):
* Inspect `getAuthCookieHeader()`. If no cookie exists, skip interval polling:
```ts
const refreshIfAuthed = () => {
  if (getAuthCookieHeader()) {
    void ensureAuthCookiesFresh();
  }
};
```
* Use `refreshIfAuthed` in `startInterval` and `AppState` change listener.

### Step 2.3: Migrate Mobile Layouts to Canonical `notificationsRouter`
In:
* [`apps/traveler-app/app/_layout.tsx`](file:///C:/dev/moja-buss/apps/traveler-app/app/_layout.tsx#L39)
* [`apps/driver-app/app/_layout.tsx`](file:///C:/dev/moja-buss/apps/driver-app/app/_layout.tsx#L43)
* [`apps/booth-app/app/_layout.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/_layout.tsx#L45)

Replace:
```ts
...trpc.public.getNotificationToken.queryOptions(undefined, {
  staleTime: Infinity,
})
```
With:
```ts
...trpc.notifications.getNotificationToken.queryOptions(undefined, {
  staleTime: Infinity,
})
```

### Step 2.4: Invalidate Terminal Bookings on Booth Cash Sale
In [`apps/booth-app/app/sell/payment.tsx`](file:///C:/dev/moja-buss/apps/booth-app/app/sell/payment.tsx):
* Obtain `queryClient = useQueryClient()` and `trpc = useTRPC()`.
* On successful sale (line ~212):
```ts
queryClient.invalidateQueries(trpc.booth.pathFilter());
```

---

## 3. Verification Criteria

1. Execute `pnpm turbo typecheck` to verify zero type regressions across mobile packages.
2. Verify in React Native debug logs that background keepalive does not fire when no auth cookie is present in `SecureStore`.
3. Verify that `trpc.notifications.getNotificationToken` returns valid Novu tokens with subscriber hash across Traveler, Driver, and Booth apps.
4. Verify that creating a cash sale in Booth App immediately updates the bookings count in the bookings tab.
