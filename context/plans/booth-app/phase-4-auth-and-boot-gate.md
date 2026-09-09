# Phase 4 — Auth, Boot Gate & Terminal Select

> **Status**: ✅ Complete  
> **Depends on**: Phase 3 (app scaffold), Phase 2 (router exists)  
> **Blocks**: Phase 5  
> **Completed**: 2026-09-07 — boot gate, login, terminal-select all implemented; typecheck + lint pass

---

## Objective

Implement the full authentication flow: Better Auth client, tRPC client, root layout, login screen, 5-step boot gate, terminal select screen, and the Zustand session store with AsyncStorage persistence.

---

## 4.1 — `apps/booth-app/lib/auth-client.ts`

Same pattern as `apps/driver-app/lib/auth-client.ts`.

```typescript
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";
import Constants from "expo-constants";

const BASE_URL =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_BETTER_AUTH_URL ??
  "http://localhost:3000";

// SecureStore-backed storage for auth tokens on native.
// Falls back to in-memory on web (not a supported platform for booth app).
const secureStorage = {
  getItem: async (key: string) => {
    if (Platform.OS === "web") return null;
    return SecureStore.getItemAsync(key);
  },
  setItem: async (key: string, value: string) => {
    if (Platform.OS === "web") return;
    await SecureStore.setItemAsync(key, value);
  },
  removeItem: async (key: string) => {
    if (Platform.OS === "web") return;
    await SecureStore.deleteItemAsync(key);
  },
};

export const authClient = createAuthClient({
  baseURL: BASE_URL,
  storage: secureStorage,
});

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session["user"];
```

---

## 4.2 — `apps/booth-app/lib/trpc.ts`

```typescript
import { createTRPCReact } from "@trpc/react-query";
import { httpBatchLink } from "@trpc/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import superjson from "superjson";
import React, { useState } from "react";
import Constants from "expo-constants";
import type { AppRouter } from "../../../apps/web/trpc/routers/_app";

export const trpc = createTRPCReact<AppRouter>();

const API_URL =
  Constants.expoConfig?.extra?.apiUrl ??
  process.env.EXPO_PUBLIC_API_URL ??
  "http://localhost:3000";

export function TRPCReactProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 30, // 30 seconds
            retry: 2,
          },
        },
      }),
  );

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${API_URL}/api/trpc`,
          transformer: superjson,
          // Auth cookie sent automatically via fetch credentials
          fetch: (url, options) =>
            fetch(url, { ...options, credentials: "include" }),
        }),
      ],
    }),
  );

  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}

// Typed useTRPC hook for use outside React components
export function useTRPC() {
  return trpc;
}
```

---

## 4.3 — `apps/booth-app/stores/session.ts`

Zustand store persisted via AsyncStorage. Stores terminal selection and company context.

```typescript
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import AsyncStorage from "@react-native-async-storage/async-storage";

export interface SelectedTerminal {
  id: string;
  name: string;
  cityName: string | null;
  municipalityName: string | null;
}

export interface CompanyContext {
  id: string;
  name: string;
  slug: string;
  logoUrl: string | null;
}

export interface StaffContext {
  operatorId: string;
  role: string;
  fullName: string;
  email: string;
}

interface SessionState {
  // Terminal selected for this work session
  selectedTerminal: SelectedTerminal | null;

  // Company and staff context — loaded on login
  company: CompanyContext | null;
  staff: StaffContext | null;

  // Language preference
  locale: "fr" | "en";

  // Actions
  setTerminal: (terminal: SelectedTerminal) => void;
  clearTerminal: () => void;
  setCompany: (company: CompanyContext) => void;
  setStaff: (staff: StaffContext) => void;
  setLocale: (locale: "fr" | "en") => void;
  clearSession: () => void;
}

export const useSessionStore = create<SessionState>()(
  persist(
    (set) => ({
      selectedTerminal: null,
      company: null,
      staff: null,
      locale: "fr",

      setTerminal: (terminal) => set({ selectedTerminal: terminal }),
      clearTerminal: () => set({ selectedTerminal: null }),
      setCompany: (company) => set({ company }),
      setStaff: (staff) => set({ staff }),
      setLocale: (locale) => set({ locale }),

      clearSession: () =>
        set({
          selectedTerminal: null,
          company: null,
          staff: null,
        }),
    }),
    {
      name: "booth-session",
      storage: createJSONStorage(() => AsyncStorage),
      // Only persist terminal and locale across restarts.
      // Company/staff are re-fetched on each login.
      partialize: (state) => ({
        selectedTerminal: state.selectedTerminal,
        locale: state.locale,
      }),
    },
  ),
);
```

---

## 4.4 — `apps/booth-app/constants/theme.ts`

```typescript
// Re-exports @moja/theme tokens for use in NativeWind and StyleSheet
export { colors, spacing, typography } from "@moja/theme";

// Booth-specific color mappings
export const boothColors = {
  // Status colors for offline/online indicators
  offline: "#F59E0B",   // amber-500
  online: "#22C55E",    // green-500
  conflict: "#EF4444",  // red-500

  // Payment method indicators
  cash: "#16A34A",      // green-600
  paystack: "#2563EB",  // blue-600
} as const;
```

---

## 4.5 — `apps/booth-app/hooks/use-load-fonts.ts`

```typescript
import { useFonts } from "expo-font";
import * as SplashScreen from "expo-splash-screen";
import { useEffect } from "react";

export function useLoadFonts() {
  const [fontsLoaded, fontsError] = useFonts({
    // Outfit — same as web (body font)
    "Outfit-Regular": require("../assets/fonts/Outfit-Regular.ttf"),
    "Outfit-Medium": require("../assets/fonts/Outfit-Medium.ttf"),
    "Outfit-SemiBold": require("../assets/fonts/Outfit-SemiBold.ttf"),
    "Outfit-Bold": require("../assets/fonts/Outfit-Bold.ttf"),
    // Raleway — heading font
    "Raleway-Bold": require("../assets/fonts/Raleway-Bold.ttf"),
    "Raleway-SemiBold": require("../assets/fonts/Raleway-SemiBold.ttf"),
  });

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  return { fontsLoaded, fontsError };
}
```

> **Note**: Copy font files from `apps/driver-app/assets/fonts/` — same font set.

---

## 4.6 — `apps/booth-app/app/_layout.tsx`

Root layout: sets up providers, auth gate, Novu (notifications for conflict alerts), toast.

```typescript
import "@/global.css";
import "@/lib/i18n";

import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import Toast from "react-native-toast-message";
import { TRPCReactProvider } from "@/lib/trpc";
import { useLoadFonts } from "@/hooks/use-load-fonts";
import { colors } from "@/constants/theme";

SplashScreen.preventAutoHideAsync().catch(() => {});

export default function RootLayout() {
  const { fontsLoaded, fontsError } = useLoadFonts();

  if (!fontsLoaded && !fontsError) {
    return null; // Splash screen stays visible
  }

  return (
    <SafeAreaProvider>
      <TRPCReactProvider>
        <StatusBar style="light" />
        <Stack
          screenOptions={{
            headerShown: false,
            contentStyle: {
              flex: 1,
              backgroundColor: colors.neutral.background,
            },
            animation: "slide_from_right",
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(auth)/login" />
          <Stack.Screen name="(auth)/verify" />
          <Stack.Screen name="terminal-select" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen
            name="sell/[tripId]"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="sell/passenger"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="sell/payment"
            options={{ animation: "slide_from_right" }}
          />
          <Stack.Screen
            name="sell/confirmation"
            options={{ animation: "fade" }}
          />
          <Stack.Screen
            name="reconcile"
            options={{ presentation: "modal", animation: "slide_from_bottom" }}
          />
        </Stack>
        <Toast />
      </TRPCReactProvider>
    </SafeAreaProvider>
  );
}
```

---

## 4.7 — `apps/booth-app/app/index.tsx` — Boot Gate

5-step check that runs on every cold start.

```typescript
import { useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { authClient } from "@/lib/auth-client";
import { trpc } from "@/lib/trpc";
import { useSessionStore } from "@/stores/session";
import { colors } from "@/constants/theme";

const BOOTH_ELIGIBLE_ROLES = [
  "BOOTH", "DISPATCHER", "OPERATIONS", "MANAGER", "ADMIN", "OWNER",
];

export default function BootGate() {
  const { data: session, isPending: sessionLoading } = authClient.useSession();
  const { selectedTerminal, setCompany, setStaff } = useSessionStore();

  // Fetch profile only if authenticated
  const { data: profile, isPending: profileLoading } = trpc.booth.getMyProfile.useQuery(
    undefined,
    { enabled: !!session?.user, retry: false },
  );

  useEffect(() => {
    if (sessionLoading || (session?.user && profileLoading)) return;

    // Step 1 — Not authenticated
    if (!session?.user) {
      router.replace("/(auth)/login");
      return;
    }

    // Step 2 — No booth-eligible operator record (profile query would 403)
    if (!profile) {
      // If profileLoading is done and still no profile — access denied
      if (!profileLoading) {
        router.replace("/(auth)/login");
      }
      return;
    }

    // Step 3 — Save company + staff context
    setCompany({
      id: profile.companyId,
      name: profile.companyName,
      slug: profile.companySlug,
      logoUrl: profile.companyLogoUrl ?? null,
    });
    setStaff({
      operatorId: profile.operatorId,
      role: profile.role,
      fullName: profile.staffName ?? "",
      email: profile.staffEmail ?? "",
    });

    // Step 4 — Terminal not selected for this session
    if (!selectedTerminal) {
      router.replace("/terminal-select");
      return;
    }

    // Step 5 — All good, go to main tabs
    router.replace("/(tabs)");
  }, [session, sessionLoading, profile, profileLoading, selectedTerminal]);

  // Show loading spinner while checks run
  return (
    <View className="flex-1 items-center justify-center bg-background">
      <ActivityIndicator size="large" color={colors.primary} />
    </View>
  );
}
```

---

## 4.8 — `apps/booth-app/app/(auth)/login.tsx`

```typescript
import { useState } from "react";
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ScrollView,
} from "react-native";
import { router } from "expo-router";
import { authClient } from "@/lib/auth-client";
import { t } from "@/lib/i18n";
import Toast from "react-native-toast-message";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleLogin() {
    if (!email.trim() || !password.trim()) return;
    setLoading(true);
    try {
      const result = await authClient.signIn.email({
        email: email.trim().toLowerCase(),
        password,
      });

      if (result.error) {
        Toast.show({
          type: "error",
          text1: t("auth.login.errorInvalid"),
        });
        return;
      }

      // Auth succeeded — boot gate will handle role check + redirect
      router.replace("/");
    } catch {
      Toast.show({ type: "error", text1: t("errors.network") });
    } finally {
      setLoading(false);
    }
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <ScrollView
        contentContainerClassName="flex-1 justify-center px-6 py-12"
        keyboardShouldPersistTaps="handled"
      >
        {/* Logo / Title */}
        <View className="items-center mb-10">
          <Text className="font-heading text-3xl text-primary font-bold">
            Moja Ride
          </Text>
          <Text className="text-foreground/60 mt-1 text-base">
            {t("auth.login.subtitle")}
          </Text>
        </View>

        {/* Form */}
        <View className="gap-4">
          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">
              {t("auth.login.emailLabel")}
            </Text>
            <TextInput
              className="border border-input rounded-lg px-4 py-3 bg-card text-foreground"
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
              returnKeyType="next"
              editable={!loading}
            />
          </View>

          <View className="gap-1.5">
            <Text className="text-sm font-medium text-foreground">
              {t("auth.login.passwordLabel")}
            </Text>
            <TextInput
              className="border border-input rounded-lg px-4 py-3 bg-card text-foreground"
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              autoComplete="current-password"
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              editable={!loading}
            />
          </View>

          <TouchableOpacity
            className="bg-primary rounded-lg py-4 items-center mt-2 active:opacity-80"
            onPress={handleLogin}
            disabled={loading}
          >
            <Text className="text-white font-semibold text-base">
              {loading ? "..." : t("auth.login.submitButton")}
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
```

---

## 4.9 — `apps/booth-app/app/terminal-select.tsx`

```typescript
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator } from "react-native";
import { router } from "expo-router";
import { trpc } from "@/lib/trpc";
import { useSessionStore } from "@/stores/session";
import { useHoldPool } from "@/hooks/use-hold-pool";
import { t } from "@/lib/i18n";
import Toast from "react-native-toast-message";

interface Props {
  // isSwitch=true means we're switching mid-session (shows confirmation modal)
  isSwitching?: boolean;
}

export default function TerminalSelectScreen({ isSwitching = false }: Props) {
  const { data: terminals, isPending } = trpc.booth.getTerminals.useQuery();
  const { setTerminal, clearTerminal } = useSessionStore();
  const { releaseAllHolds } = useHoldPool();

  async function handleSelectTerminal(terminal: {
    id: string;
    name: string;
    cityRelation: { name: string } | null;
    municipality: { name: string } | null;
  }) {
    if (isSwitching) {
      // Release current hold pool before switching
      await releaseAllHolds();
    }

    setTerminal({
      id: terminal.id,
      name: terminal.name,
      cityName: terminal.cityRelation?.name ?? null,
      municipalityName: terminal.municipality?.name ?? null,
    });

    Toast.show({
      type: "success",
      text1: terminal.name,
      text2: terminal.cityRelation?.name ?? "",
    });

    router.replace("/(tabs)");
  }

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color="#ee237c" />
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-6">
        <Text className="font-heading text-2xl font-bold text-foreground">
          {isSwitching ? t("terminalSelect.switchTitle") : t("terminalSelect.title")}
        </Text>
        <Text className="text-foreground/60 mt-1">
          {t("terminalSelect.subtitle")}
        </Text>
      </View>

      <FlatList
        data={terminals}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-6 gap-3 pb-8"
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-card border border-border rounded-xl px-5 py-4 active:opacity-70"
            onPress={() => handleSelectTerminal(item)}
          >
            <Text className="font-semibold text-foreground text-base">{item.name}</Text>
            {item.cityRelation && (
              <Text className="text-foreground/60 text-sm mt-0.5">
                {item.municipality?.name ? `${item.municipality.name}, ` : ""}
                {item.cityRelation.name}
              </Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-foreground/50">{t("errors.generic")}</Text>
          </View>
        }
      />
    </View>
  );
}
```

---

## 4.10 — Verification Checklist

```bash
# App must boot without errors
pnpm --filter booth-app typecheck

# Test boot gate manually:
# 1. Not logged in → redirects to /auth/login ✓
# 2. Logged in as non-booth role → stays on login (403) ✓
# 3. Logged in, no terminal selected → redirects to /terminal-select ✓
# 4. Logged in, terminal selected → goes to /(tabs) ✓
```
