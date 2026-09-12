# Plan: Traveler-App Profile Auth Flow Parity with Web

## Problem Statement

When a new user signs up in `apps/traveler-app/app/(auth)/login.tsx`, the auth flow only shows a single "name" field on the profile step and after saving goes directly to `/(tabs)` — the home tab. It is **missing**:

1. **Preferred Seat**, **Preferred Class**, and **Marketing Opt-In** fields on the profile step
2. **Saving preferences** via `trpc.passenger.updatePreferences` (only `authClient.updateUser({ name })` is called)
3. **Checking for existing TRAVELER users missing a name** — the web app does this server-side (`user.role === "TRAVELER" && !user.name`), but the traveler-app only checks `isNewUser` based on `createdAt` within 10 seconds
4. **`inferAdditionalFields` plugin** on the traveler auth-client (needed for proper session data)

The traveler-app already has the **infrastructure** to fix this — `hooks/use-personal-info.ts` provides `useUpdatePersonalInfo` and `usePersonalInfo` that call `trpc.passenger.updatePreferences` and `trpc.passenger.getPreferences`, and the `AppRouter` type includes the `passenger` router with `updatePreferences`.

---

## Current State

### Web App (`apps/web`) — Working Correctly

| Step | What Happens | File |
|------|-------------|------|
| **Input** | User enters email/phone | `passenger-auth-flow.tsx:476-518` |
| **OTP** | User enters 6-digit code | `passenger-auth-flow.tsx:660-717` |
| **Profile** | Name + Seat + Class + Marketing | `passenger-auth-flow.tsx:720-839` |
| **Submit** | `authClient.updateUser({ name })` + `trpc.passenger.updatePreferences.mutate({ fullName, preferredSeat, preferredClass, marketingOptIn })` | `passenger-auth-flow.tsx:379-403` |
| **Redirect** | `router.push(resolvePostAuthPath("/dashboard"))` | `passenger-auth-flow.tsx:75-88` |

- **Server-side check**: `login/page.tsx` checks `user.role === "TRAVELER" && !user.name` → sets `initialStep: "profile"`
- **Auth client**: Has `inferAdditionalFields<typeof auth>()` plugin
- **Schema**: `PassengerProfile` has `marketingOptIn`, `preferencesJson` (stores seat/class/dob), `stripeCustomerId`
- **TRPC**: `updatePreferences` mutation saves to both `user.fullName` and `passengerProfile.preferencesJson`

### Traveler App (`apps/traveler-app`) — Broken

| Step | What Happens | File |
|------|-------------|------|
| **Input** | User enters email/phone | `features/auth/screens/login.tsx` |
| **OTP** | User enters 6-digit code | `features/auth/screens/login.tsx` |
| **Profile** | **Only Name** field | `features/auth/screens/login.tsx:349-371` |
| **Submit** | `authClient.updateUser({ name: fullName.trim() })` only | `features/auth/screens/login.tsx:202-226` |
| **Redirect** | `router.replace(destination)` → `/(tabs)` (home) | `features/auth/screens/login.tsx:220` |
| **isNewUser** | Only checks `createdAt` within 10 seconds | `features/auth/screens/login.tsx:175-176` |

- **No server-side check** for existing travelers missing names
- **No `inferAdditionalFields`** on auth-client
- **No seat/class/marketing** fields or logic
- **No `updatePreferences` call** on profile completion
- **No `useTRPC`** usage in the login screen (uses `authClient` directly)

---

## Files to Modify

### 1. `apps/traveler-app/lib/auth-client.ts`
- **Add**: `inferAdditionalFields` import from `better-auth/client/plugins`
- **Add**: `inferAdditionalFields` to the `createAuthClient` plugins array
- **Why**: Web app has this; needed for proper session data including additional user fields

### 2. `apps/traveler-app/features/auth/screens/login.tsx` — **Main changes**

#### 2a. Imports & State additions
```tsx
// Add imports:
import { useTRPC } from "@/lib/trpc";
import { useMutation } from "@tanstack/react-query";

// Add state:
const trpc = useTRPC();
const [preferredSeat, setPreferredSeat] = useState<"WINDOW" | "AISLE" | "NONE">("NONE");
const [preferredClass, setPreferredClass] = useState<"ECONOMY" | "STANDARD" | "VIP">("ECONOMY");
const [marketingOptIn, setMarketingOptIn] = useState(false);
```

#### 2b. Add `updatePreferencesMutation`
```tsx
const updatePreferencesMutation = useMutation(
  trpc.passenger.updatePreferences.mutationOptions({
    onSuccess: () => {
      router.replace(destination as any);
      router.refresh();
    },
    onError: (err) => {
      setMessage(err.message || t("failedToUpdate"));
      setIsPending(false);
    },
  }),
);
```

#### 2c. Update `handleVerifyCode` (lines 136-200)
- After OTP success, check if user is a TRAVELER missing a name (not just `isNewUser`)
- Use `authClient.getSession()` to check `session.user.role === "TRAVELER" && !session.user.name`
- If true OR `isNewUser`, go to profile step; otherwise redirect to `/(tabs)`

#### 2d. Update `handleCompleteProfile` (lines 202-226)
- Add validation: `fullName.trim().length < 2` (already exists)
- Call `authClient.updateUser({ name: fullName.trim() })` first
- Then call `updatePreferencesMutation.mutate({ fullName: fullName.trim(), preferredSeat, preferredClass, marketingOptIn })`
- After both succeed, refresh session and redirect to `/(tabs)`

#### 2e. Update profile step JSX (lines 349-371)
- Add `Select` dropdown for **Preferred Seat** (WINDOW / AISLE / NONE)
- Add `Select` dropdown for **Preferred Class** (ECONOMY / STANDARD / VIP)
- Add `Switch` for **Marketing Opt-In**
- Use the same component patterns as `passenger-auth-flow.tsx` but with the existing `AuthField` / `AuthButton` components

#### 2f. Update `stepConfig` for profile step
- Update title/description to match web's `passenger-auth-flow.tsx`

#### 2g. Update `isPending` calculation
- Include `updatePreferencesMutation.isPending` in the pending state

### 3. `apps/traveler-app/locales/en/auth.json` — Add new translation keys
```json
{
  "preferredSeat": "Preferred Seat",
  "preferredClass": "Preferred Seat Class",
  "profileSeatLabel": "Preferred Seat",
  "profileClassLabel": "Preferred Seat Class",
  "profileMarketingLabel": "Marketing Opt-In",
  "profileSeatNone": "None",
  "profileSeatWindow": "Window",
  "profileSeatAisle": "Aisle",
  "profileClassEconomy": "Economy",
  "profileClassStandard": "Standard",
  "profileClassVip": "VIP",
  "profileMarketingDesc": "Receive updates about new routes and promotions."
}
```

### 4. `apps/traveler-app/locales/fr/auth.json` — Add French translations (same keys)

---

## Files NOT to Modify (already correct)

- `apps/traveler-app/lib/trpc.tsx` — Already has `AppRouter` type with `passenger` router
- `apps/traveler-app/hooks/use-personal-info.ts` — Already has `useUpdatePersonalInfo` and `usePersonalInfo`
- `apps/traveler-app/features/settings/hooks/use-settings-prefetch.ts` — Already uses `trpc.passenger.updatePreferences`
- `packages/schemas/src/passenger.ts` — `updatePreferencesSchema` already has all fields
- `packages/db/prisma/schema.prisma` — `PassengerProfile` already has `marketingOptIn`, `preferencesJson`
- `apps/web/lib/auth-server.ts` — Already has `PassengerProfile` relation via `User` model
- `apps/traveler-app/app/(auth)/login.tsx` — Already renders `LoginView` correctly

---

## Verification Checklist

1. **New user signup** → OTP → Profile with name, seat, class, marketing → `/(tabs)` ✓
2. **Existing TRAVELER without name** → login → OTP → Profile step appears → fills profile → `/(tabs)` ✓
3. **Existing TRAVELER with name** → login → OTP → `/(tabs)` directly ✓
4. **Existing TRAVELER without name** → profile saved → `updatePreferences` mutation succeeds → profile saved to `PassengerProfile.preferencesJson` ✓
5. **Auth client** has `inferAdditionalFields` → session data includes additional fields ✓
6. **Both locales** (en/fr) have all new translation keys ✓
7. **No regression** → existing `authClient.updateUser({ name })` still called for name ✓

---

## Architectural Notes

- The traveler-app's TRPC client (`trpc.tsx`) already connects to the same `AppRouter` that includes `passengerRouter` with `updatePreferences`. No router changes needed.
- The `useUpdatePersonalInfo` hook in `hooks/use-personal-info.ts` can be reused directly, but for this specific flow, using the raw `useMutation` with `trpc.passenger.updatePreferences.mutationOptions()` is more direct and avoids unnecessary re-renders.
- The `isNewUser` detection (10-second window) should be kept as-is and combined with a session check for the "existing traveler without name" case.
- The destination redirect for profile completion should be `/(tabs)` (matching the current behavior and the `destination` variable).
