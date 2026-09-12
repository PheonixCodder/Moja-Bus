# Module 02: Authentication & Security Deep-Dive

> **Audit Context**: Better Auth Setup, Session Lifecycle & Security Architecture  
> **Target Files**: `apps/booth-app/lib/auth-client.ts`, `apps/booth-app/app/(auth)/*`, `apps/booth-app/app/index.tsx`, `apps/booth-app/app/_layout.tsx`, `apps/web/lib/auth-server.ts`, `apps/web/lib/trusted-origins.ts`  
> **Comparative Targets**: `apps/traveler-app/lib/auth-client.ts`, `apps/traveler-app/features/auth/*`, `apps/traveler-app/app/index.tsx`, `apps/traveler-app/app/_layout.tsx`, `apps/driver-app/lib/auth-client.ts`  

---

## 1. The Core Authentication Paradox (P0 Blocker)

The authentication setup in `apps/booth-app` is fundamentally broken at the protocol level. A severe mismatch exists between the client login implementation and the server's Better Auth engine.

### Server Configuration (`apps/web/lib/auth-server.ts`)
```typescript
// apps/web/lib/auth-server.ts:90-92
emailAndPassword: {
  enabled: false, // <-- PASSWORD AUTH IS GLOBALLY DISABLED ACROSS MOJA RIDE
},
plugins: [
  expo(),
  emailOTP({ ... }),
  phoneNumber({ ... }),
]
```

### Client Implementation (`apps/booth-app/app/(auth)/login.tsx`)
```typescript
// apps/booth-app/app/(auth)/login.tsx:31-34
const result = await authClient.signIn.email({
  email: email.trim().toLowerCase(),
  password, // <-- ATTEMPTS PASSWORD AUTHENTICATION
});
```

### Resulting Defect:
When an agent attempts to log in using the email and password form in `apps/booth-app`, Better Auth on the server immediately rejects the request with HTTP 400 Bad Request / "Method not enabled". **No staff member can log in to the booth app under any circumstances.**

---

## 2. Production Origin & Scheme Rejection (P0 Blocker)

Better Auth enforces strict CORS and Origin headers through `trustedOrigins`. In `apps/web/lib/trusted-origins.ts`:

```typescript
// apps/web/lib/trusted-origins.ts:31
/** Shipped mobile builds register these custom schemes on every platform. */
export const APP_SCHEMES = ["traveler-app://", "driver-app://"] as const;
```

In `apps/booth-app/app.json`:
```json
"scheme": "mojabooth",
```

In `apps/booth-app/lib/auth-client.ts`:
```typescript
export function getExpoOriginHeader(): string {
  const rawScheme =
    Constants.expoConfig?.scheme ?? Constants.platform?.scheme ?? "mojabooth";
  const scheme = Array.isArray(rawScheme) ? rawScheme[0] : rawScheme;
  return Linking.createURL("", { scheme }); // Produces mojabooth://
}
```

### Resulting Defect:
Because `mojabooth://` is **completely absent from `APP_SCHEMES`**, `buildTrustedOrigins()` never trusts the booth app in production environments. Any request originating from a compiled production build of `booth-app` is rejected at the HTTP gateway by Better Auth's CSRF/Origin validation middleware.

---

## 3. Client Plugin Suite Comparison

| Plugin / Capability | Traveler App (`apps/traveler-app/lib/auth-client.ts`) | Driver App (`apps/driver-app/lib/auth-client.ts`) | Booth App (`apps/booth-app/lib/auth-client.ts`) | Status in Booth App |
| :--- | :---: | :---: | :---: | :--- |
| `expoClient` | Yes (`storagePrefix: "traveler-app"`) | Yes (`storagePrefix: "driver-app"`) | Yes (`storagePrefix: "booth-app"`) | Configured |
| `emailOTPClient` | Yes | Yes | **MISSING** | **Fatal Defect**: Cannot request or verify Email OTP |
| `phoneNumberClient` | Yes | Yes | **MISSING** | **Fatal Defect**: Cannot use Phone OTP |
| `inferAdditionalFields` | Yes | No | **MISSING** | Missing typed user metadata inference |
| `refreshSession()` helper | Yes (subscribes to atom updates) | Yes (subscribes to atom updates) | **MISSING** | Session refresh must fall back to full `getSession()` |

---

## 4. Boot Gate & Startup Redirects Comparison

### Booth App Startup Flow (`apps/booth-app/app/index.tsx` & `_layout.tsx`)
```typescript
// apps/booth-app/app/index.tsx:10-53
export default function BootGate() {
  const { data: session, isPending: sessionLoading } = useSession();
  const trpc = useTRPC();
  const { terminal, setProfile, setProfileLoaded, profile, profileLoaded } = useSessionStore();

  const { data: profileData, isPending: profileLoading } = useQuery(
    trpc.booth.getMyProfile.queryOptions(undefined, {
      enabled: !!session?.user,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    }),
  );

  // Sync profileData to session store
  useEffect(() => { ... }, [profileData]);

  if (sessionLoading || profileLoading) {
    return <ActivityIndicator />;
  }

  if (!session?.user || !profileLoaded || !profile) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!terminal) {
    return <Redirect href="/terminal-select" />;
  }

  return <Redirect href="/(tabs)" />;
}
```

### Traveler App Startup Flow (`apps/traveler-app/app/index.tsx` & `_layout.tsx`)
In `traveler-app`, the startup flow is separated cleanly into:
1. `app/index.tsx`: Simple redirect directly to `/(tabs)`.
2. `app/_layout.tsx`: Wraps navigation in `TRPCReactProvider`, `AuthenticatedNovuProvider`, `ThemeProvider` (`NAV_THEME`), `StatusBar`, `PortalHost`, and deep link handling.
3. Protected tabs and flows guard themselves using feature-level hooks or inline session gates without deadlocking cold boots when offline.

### Critical Deficiencies in Booth Boot Gate:
1. **Network Lockout on Cold Boot**: The booth context overview specifies:
   > *"Network unreachable after retry? Fail-open (allow to tab shell with offline banner). Do NOT block booth staff indefinitely."*
   However, in `apps/booth-app/app/index.tsx`:
   If the device boots offline or network times out, `trpc.booth.getMyProfile` fails (`profileData` is null), `profileLoaded` becomes true while `profile` is null, and line 44 triggers:
   ```typescript
   if (!session?.user || !profileLoaded || !profile) {
     return <Redirect href="/(auth)/login" />;
   }
   ```
   **The app forces the agent to the login screen whenever connectivity is degraded on cold boot!** This completely violates the offline-first requirement. If power or cellular data is down at the terminal, the cashier is locked out and cannot sell offline tickets.
2. **Splash Screen Auto-Hide Race**: In `apps/booth-app/app/_layout.tsx`:
   ```typescript
   SplashScreen.preventAutoHideAsync().catch(() => {});
   ...
   useEffect(() => {
     if (fontsLoaded || fontsError) {
       void SplashScreen.hideAsync();
     }
   }, [fontsLoaded, fontsError]);
   ```
   The layout hides the splash screen as soon as fonts finish loading, exposing the brief white flash and subsequent `ActivityIndicator` in `app/index.tsx`, rather than holding splash until the destination route is ready.

---

## 5. Session Keepalive & Cookie Security

Both `booth-app` and `traveler-app` implement `SESSION_KEEPALIVE_MS = 4 * 60 * 1000` via `AuthSessionKeepAlive()` in `lib/trpc.tsx`. 

However, in `apps/booth-app/lib/auth-client.ts`:
```typescript
export async function syncAuthCookiesFromResponse(response: Response): Promise<void> {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie || !hasBetterAuthCookies(setCookie, "better-auth")) {
    return;
  }
  const prev = (await SecureStore.getItemAsync(AUTH_COOKIE_STORAGE_KEY)) ?? "{}";
  const next = getSetCookie(setCookie, prev);
  await SecureStore.setItemAsync(AUTH_COOKIE_STORAGE_KEY, next);
}
```
**Flaw in Set-Cookie Parsing**: On React Native Android, `fetch` response headers collapse multiple `set-cookie` headers into a single comma-delimited string, or omit expiration attributes. In `apps/booth-app`, if `getCookie()` returns an expired or stale session token while offline, subsequent tRPC mutations throw 401 unauthenticated errors and fail without falling back to local cached credentials.

---

## 6. Auth UX & Design Disconnect vs Traveler App

| Dimension | `apps/traveler-app` Auth (`features/auth/screens/login.tsx`) | `apps/booth-app` Auth (`app/(auth)/login.tsx`) |
| :--- | :--- | :--- |
| **Authentication Flow** | Seamless multi-step: Phone/Email input → OTP verification → Profile onboarding | Bare single-screen form: Email + Password |
| **Input Detection** | Smart detection: auto-identifies Côte d'Ivoire numbers (`+225`, `07`, `05`, `01`) vs email | Dumb inputs: forces email and password |
| **Component Architecture** | Dedicated primitives: `AuthShell`, `AuthField`, `AuthButton`, `OtpInput` | Raw ScrollView with basic inputs |
| **Haptic Polish** | Contextual haptics on digit entry, error shake, and completion | Single tap haptic on error |
| **Error Feedback** | Inline animated error banners with localized error codes | Generic toast error |
| **Design Tokens** | Exact `@moja/theme/tokens` palette (`Palette.rose[500]`, Outfit & Raleway typography) | Hardcoded raw styles and generic classes |
