# Phase 01: Security, Authentication & Origins Hardening

> **Phase Focus**: Fix Auth Protocol Mismatch, Register Trusted Origins, Implement Phone/Email OTP, and Harden Boot Gate  
> **Defects Resolved**: `BTH-P0-01`, `BTH-P0-02`, `BTH-P1-07`  

---

## 1. Problem Definition & Root Causes

1. **Protocol Mismatch (`BTH-P0-01`)**: `apps/web/lib/auth-server.ts:91` has `emailAndPassword: { enabled: false }`. The entire Moja Ride monorepo standardizes on passwordless OTP authentication. However, `apps/booth-app/app/(auth)/login.tsx` attempts `authClient.signIn.email({ email, password })`, failing with 400 Bad Request.
2. **Untrusted Production Scheme (`BTH-P0-02`)**: `apps/web/lib/trusted-origins.ts:31` lists only `traveler-app://` and `driver-app://`. Production Better Auth rejects all mobile requests bearing `Origin: mojabooth://`.
3. **Missing Client Plugins**: `apps/booth-app/lib/auth-client.ts` only initializes `expoClient()`, lacking `emailOTPClient()` and `phoneNumberClient()`.
4. **Offline Cold Boot Lockout (`BTH-P1-07`)**: `apps/booth-app/app/index.tsx` forces agents to `/(auth)/login` if network connectivity fails during `getMyProfile`, violating the offline fail-open mandate.

---

## 2. Implementation Specifications

### Step 1: Register `mojabooth://` in Server Trusted Origins
File: `apps/web/lib/trusted-origins.ts`
```typescript
/** Shipped mobile builds register these custom schemes on every platform. */
export const APP_SCHEMES = [
  "traveler-app://",
  "driver-app://",
  "mojabooth://",
] as const;
```

### Step 2: Equip Booth Auth Client with OTP Plugins
File: `apps/booth-app/lib/auth-client.ts`
```typescript
import {
  emailOTPClient,
  phoneNumberClient,
  inferAdditionalFields,
} from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import {
  expoClient,
  getSetCookie,
  hasBetterAuthCookies,
} from "@better-auth/expo/client";

const AUTH_STORAGE_PREFIX = "booth-app";
const AUTH_COOKIE_STORAGE_KEY = `${AUTH_STORAGE_PREFIX}_cookie`;

export function getBaseUrl(): string {
  if (process.env["EXPO_PUBLIC_API_URL"]) {
    return process.env["EXPO_PUBLIC_API_URL"];
  }
  return "https://moja-bus-web.vercel.app";
}

const baseURL = getBaseUrl();

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    emailOTPClient(),
    phoneNumberClient(),
    inferAdditionalFields,
    expoClient({
      scheme: "mojabooth",
      storage: SecureStore,
      storagePrefix: AUTH_STORAGE_PREFIX,
    }) as unknown as { id: "expo"; $Infer: {} },
  ],
});

export function getAuthCookieHeader(): string {
  const client = authClient as typeof authClient & {
    getCookie?: () => string;
  };
  return client.getCookie?.() ?? "";
}

export function getExpoOriginHeader(): string {
  const rawScheme =
    Constants.expoConfig?.scheme ?? Constants.platform?.scheme ?? "mojabooth";
  const scheme = Array.isArray(rawScheme) ? rawScheme[0] : rawScheme;
  return Linking.createURL("", { scheme });
}

export async function syncAuthCookiesFromResponse(
  response: Response,
): Promise<void> {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie || !hasBetterAuthCookies(setCookie, "better-auth")) {
    return;
  }
  const prev =
    (await SecureStore.getItemAsync(AUTH_COOKIE_STORAGE_KEY)) ?? "{}";
  const next = getSetCookie(setCookie, prev);
  await SecureStore.setItemAsync(AUTH_COOKIE_STORAGE_KEY, next);
}

export async function ensureAuthCookiesFresh(): Promise<void> {
  try {
    await authClient.getSession();
  } catch {}
}

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;

export const { useSession, signOut } = authClient;

export async function refreshSession() {
  const sessionAtom = authClient.$store?.atoms?.["session"];
  const refetch = sessionAtom?.get()?.refetch;
  if (refetch) {
    await refetch();
  }
}
```

### Step 3: Implement Modern Phone/Email OTP Login Screen
File: `apps/booth-app/app/(auth)/login.tsx`
- Replace the legacy email/password form with the multi-step OTP screen ported from `apps/traveler-app/features/auth/screens/login.tsx`.
- **Step 1 (Identifier Input)**:
  - Cashier enters their phone number (e.g., `0701020304` or `+225...`) or work email.
  - Automatically identifies format: if numbers/starts with `+225`, sends Phone OTP via `authClient.phoneNumber.sendOtp`; if email, sends Email OTP via `authClient.emailOtp.sendVerificationOtp`.
- **Step 2 (6-Digit OTP Verification)**:
  - 6-box OTP entry with auto-focus and tactile haptic feedback on each digit.
  - Submits to `authClient.phoneNumber.verify` or `authClient.signIn.emailOtp`.
  - On success: triggers `BoothFeedback.successScan()` and navigates to `/`.

### Step 4: Harden Boot Gate with Fail-Open Offline Support
File: `apps/booth-app/app/index.tsx`
```typescript
export default function BootGate() {
  const { data: session, isPending: sessionLoading } = useSession();
  const trpc = useTRPC();
  const { terminal, setProfile, setProfileLoaded, profile, profileLoaded } =
    useSessionStore();

  const { data: profileData, isPending: profileLoading, isError: profileError } = useQuery(
    trpc.booth.getMyProfile.queryOptions(undefined, {
      enabled: !!session?.user,
      retry: 1,
      staleTime: 5 * 60 * 1000,
    }),
  );

  useEffect(() => {
    if (!session?.user || profileLoading) return;

    if (profileData) {
      setProfile(profileData);
      setProfileLoaded(true);
    } else if (profileError) {
      // FAIL-OPEN: If profile exists in persistent sessionStore, use it!
      // Do not block offline cashier during terminal outages.
      if (profile) {
        setProfileLoaded(true);
      } else {
        setProfile(null);
        setProfileLoaded(true);
      }
    }
  }, [session, profileLoading, profileData, profileError, profile, setProfile, setProfileLoaded]);

  if (sessionLoading || (profileLoading && !profile)) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={IconColors.brand} />
      </View>
    );
  }

  if (!session?.user) {
    return <Redirect href="/(auth)/login" />;
  }

  if (profileLoaded && !profile) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!terminal) {
    return <Redirect href="/terminal-select" />;
  }

  return <Redirect href="/(tabs)" />;
}
```

---

## 3. Verification & Acceptance Criteria

- [ ] **Probe 1.1**: Run `curl -H "Origin: mojabooth://" https://moja-bus-web.vercel.app/api/auth/ok` and verify 200 OK (CORS allowed).
- [ ] **Probe 1.2**: Enter a registered operator phone number in `booth-app`, receive SMS OTP, verify code, and successfully authenticate.
- [ ] **Probe 1.3**: Enter a registered operator email in `booth-app`, receive email OTP, verify code, and successfully authenticate.
- [ ] **Probe 1.4**: Turn on Airplane Mode after first login. Force quit the app and cold boot. Verify that the app fails open to the tab shell / terminal screen instead of kicking the cashier back to login.
