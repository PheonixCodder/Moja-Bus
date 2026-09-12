import { Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { IconColors } from "@/constants/ui-colors";
import { authClient, ensureAuthCookiesFresh } from "@/lib/auth-client";
import { getTrpcClient } from "@/lib/trpc";
import { useSessionStore } from "@/stores/session";

type AuthState =
  | "loading"
  | "unauthenticated"
  | "needs-terminal"
  | "authenticated";

export default function BootGate() {
  const [authState, setAuthState] = useState<AuthState>("loading");
  const setProfile = useSessionStore((s) => s.setProfile);
  const setProfileLoaded = useSessionStore((s) => s.setProfileLoaded);
  const setTerminal = useSessionStore((s) => s.setTerminal);

  useEffect(() => {
    let isMounted = true;

    async function checkAuth() {
      try {
        await ensureAuthCookiesFresh();
        const session = await authClient.getSession();
        if (!isMounted) return;

        const user = session?.data?.user;
        if (!user) {
          setAuthState("unauthenticated");
          return;
        }

        // Fetch operator profile & assigned terminal
        try {
          const trpc = getTrpcClient();
          const profileData = await trpc.booth.getMyProfile.query();
          if (!isMounted) return;

          if (profileData) {
            setProfile(profileData);
            setProfileLoaded(true);

            // Terminal Scoping: If the agent has an assigned terminal,
            // lock the session to that terminal automatically.
            if (profileData.assignedTerminal) {
              setTerminal({
                id: profileData.assignedTerminal.id,
                name: profileData.assignedTerminal.name,
              });
              setAuthState("authenticated");
              return;
            }
          }
        } catch {
          // FAIL-OPEN OFFLINE MANDATE:
          // If we previously had a cached profile in persistent Zustand store,
          // preserve it so offline booth operations can proceed during outages.
          const cachedProfile = useSessionStore.getState().profile;
          if (cachedProfile) {
            setProfileLoaded(true);
          } else {
            setProfile(null);
            setProfileLoaded(true);
          }
        }

        if (!isMounted) return;

        const currentTerminal = useSessionStore.getState().terminal;
        if (!currentTerminal) {
          setAuthState("needs-terminal");
        } else {
          setAuthState("authenticated");
        }
      } catch {
        if (isMounted) setAuthState("unauthenticated");
      }
    }

    const timer = setTimeout(() => {
      checkAuth();
    }, 50);

    return () => {
      isMounted = false;
      clearTimeout(timer);
    };
  }, [setProfile, setProfileLoaded, setTerminal]);

  useEffect(() => {
    if (authState !== "loading") {
      SplashScreen.hideAsync().catch(() => {});
    }
  }, [authState]);

  if (authState === "loading") {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={IconColors.brand} />
      </View>
    );
  }

  if (authState === "unauthenticated") {
    return <Redirect href="/(auth)/login" />;
  }

  if (authState === "needs-terminal") {
    return <Redirect href="/terminal-select" />;
  }

  return <Redirect href="/(tabs)" />;
}
