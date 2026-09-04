# Phase 3: Mobile App Auth & Navigation

> **File**: `context/plans/unified-driver-conductor-system/03-mobile-driver-app-auth-and-navigation.md`  
> **Target App**: `apps/driver-app`  
> **Status**: Ready for Implementation  

---

## 1. Objectives

1. Enforce strict login/boot gating in `apps/driver-app`:
   - Allow `User.role === "DRIVER"`.
   - Allow `User.role === "OPERATOR"` **if and only if** their staff `role === "CONDUCTOR"`.
   - Block `User.role === "OPERATOR"` with other staff roles (Admin, Manager, Finance, Dispatcher) with an informative toast directing them to the Web Portal.
   - Block all other roles (`TRAVELER`, `ADMIN`) with an unauthorized toast and log them out.
2. Implement dynamic tab bar visibility:
   - Drivers see: *Trajets*, *Offres*, *En direct* (HUD/GPS), *Scanner*, *Passeport*.
   - Conductors see: *Trajets*, *Scanner*, *Passeport* (*En direct* and *Offres* are completely hidden).
3. Tailor Trip Card action buttons:
   - Conductors see only *[ Voir Manifeste ]* and *[ Embarquement ]*.
   - Primary Drivers see *[ Voir Manifeste ]*, *[ Embarquement ]*, and *[ Démarrer le trajet ]* / *[ Reprendre ]*.
   - Relief Drivers see *[ Voir Manifeste ]*, *[ Embarquement ]*, and *[ Prendre le volant ]*.

---

## 2. Implementation Details

### A. Auth & Boot Gate (`apps/driver-app/app/index.tsx`)

Update the boot flow to check both Driver identity and Conductor staff status:

```typescript
import { authClient, ensureAuthCookiesFresh } from "@/lib/auth-client";
import { getTrpcClient } from "@/lib/trpc";
import { Toast } from "@/components/Toast"; // or showToast helper

async function evaluateUserSession(): Promise<{
  allowed: boolean;
  userType: "DRIVER" | "CONDUCTOR" | null;
  errorMessage?: string;
}> {
  await ensureAuthCookiesFresh();
  const session = await authClient.getSession();
  const user = session?.data?.user;

  if (!user) return { allowed: false, userType: null };

  // 1. Check if Driver
  if (user.role === "DRIVER") {
    return { allowed: true, userType: "DRIVER" };
  }

  // 2. Check if Operator Staff
  if (user.role === "OPERATOR") {
    const trpc = getTrpcClient();
    try {
      const staffProfile = await trpc.staff.getMyStaffProfile.query();
      if (staffProfile?.role === "CONDUCTOR") {
        return { allowed: true, userType: "CONDUCTOR" };
      }
      return {
        allowed: false,
        userType: null,
        errorMessage: "Ce compte administrateur/gestionnaire doit être utilisé sur le portail web Moja Ride.",
      };
    } catch {
      return {
        allowed: false,
        userType: null,
        errorMessage: "Impossible de vérifier le profil membre du personnel.",
      };
    }
  }

  // 3. Any other role (TRAVELER, ADMIN)
  return {
    allowed: false,
    userType: null,
    errorMessage: "Accès réservé à l'équipage de bord (Chauffeurs et Convoyeurs).",
  };
}
```

If `allowed === false` and `errorMessage` is present:
- Trigger toast with `errorMessage`.
- Call `authClient.signOut()`.
- Route to `/(auth)/login`.

---

### B. User Mode Context (`apps/driver-app/contexts/user-mode-context.tsx`)

Provide the active mode (`"DRIVER"` vs `"CONDUCTOR"`) to the whole React Native component tree:

```typescript
import React, { createContext, useContext, useState, useEffect } from "react";

type UserMode = "DRIVER" | "CONDUCTOR" | null;

const UserModeContext = createContext<{
  mode: UserMode;
  setMode: (mode: UserMode) => void;
  isConductor: boolean;
  isDriver: boolean;
}>({
  mode: null,
  setMode: () => {},
  isConductor: false,
  isDriver: false,
});

export function UserModeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setMode] = useState<UserMode>(null);

  return (
    <UserModeContext.Provider
      value={{
        mode,
        setMode,
        isConductor: mode === "CONDUCTOR",
        isDriver: mode === "DRIVER",
      }}
    >
      {children}
    </UserModeContext.Provider>
  );
}

export const useUserMode = () => useContext(UserModeContext);
```

---

### C. Dynamic Tab Visibility (`apps/driver-app/app/(tabs)/_layout.tsx` & `components/TabBar.tsx`)

In `components/TabBar.tsx`, filter visible tabs based on `mode`:

```typescript
const ALL_TABS: TabConfig[] = [
  { name: "trips", labelKey: "trips", icon: Bus01Icon, roles: ["DRIVER", "CONDUCTOR"] },
  { name: "offers", labelKey: "offers", icon: Briefcase01Icon, roles: ["DRIVER"] },
  { name: "live", labelKey: "live", icon: Navigation01Icon, roles: ["DRIVER"] },
  { name: "scanner", labelKey: "scanner", icon: QrCode01Icon, roles: ["DRIVER", "CONDUCTOR"] },
  { name: "profile", labelKey: "profile", icon: User02Icon, roles: ["DRIVER", "CONDUCTOR"] },
];

export function TabBar({ state, navigation }: any) {
  const { isConductor } = useUserMode();

  // Filter tabs: Conductors only see trips, scanner, profile
  const visibleTabs = ALL_TABS.filter((tab) =>
    isConductor ? tab.roles.includes("CONDUCTOR") : tab.roles.includes("DRIVER")
  );
  
  // Render animated tabs based on visibleTabs...
}
```

---

### D. Action Buttons in `features/trips/components/trip-card.tsx`

```typescript
const { isConductor } = useUserMode();

// 1. Manifest is visible to everyone
<Button title={t("btnManifest")} onPress={() => router.push(`/trip/${trip.id}/manifest`)} />

// 2. Boarding Scanner is visible to everyone
{(isBoardable || isDeparted) && (
  <Button title={t("btnBoarding")} onPress={handleOpenBoardingScanner} />
)}

// 3. Driving actions — hidden completely for conductors
{!isConductor && (
  <>
    {isDeparted && role === "RELIEF" && (
      <Button title={t("btnTakeOver")} onPress={() => onTakeOverTrip?.(trip.id)} />
    )}
    {isDeparted && role === "PRIMARY" && (
      <Button title={t("btnResume")} onPress={() => router.push("/(tabs)/live")} />
    )}
    {isBoardable && role === "PRIMARY" && (
      <Button title={t("btnStart")} onPress={() => onStartTrip(trip.id)} />
    )}
  </>
)}
```
