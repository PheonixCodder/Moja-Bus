import { useQuery } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { IconColors } from "@/constants/ui-colors";
import { useSession } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc";
import { useSessionStore } from "@/stores/session";

export default function BootGate() {
  const { data: session, isPending: sessionLoading } = useSession();
  const trpc = useTRPC();
  const {
    terminal,
    setTerminal,
    setProfile,
    setProfileLoaded,
    profile,
    profileLoaded,
  } = useSessionStore();

  const {
    data: profileData,
    isPending: profileLoading,
    isError: profileError,
  } = useQuery(
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

      // Terminal Scoping (Phase 02): If the agent has an assigned terminal,
      // lock the session to that terminal automatically — skip terminal-select screen.
      if (profileData.assignedTerminal) {
        setTerminal({
          id: profileData.assignedTerminal.id,
          name: profileData.assignedTerminal.name,
        });
      }
    } else if (profileError) {
      // FAIL-OPEN OFFLINE MANDATE:
      // If we previously had a cached profile in persistent Zustand store,
      // preserve it so offline booth operations can proceed during outages.
      if (profile) {
        setProfileLoaded(true);
      } else {
        setProfile(null);
        setProfileLoaded(true);
      }
    } else if (!profileLoading && !profileData) {
      setProfile(null);
      setProfileLoaded(true);
    }
  }, [
    session,
    profileLoading,
    profileData,
    profileError,
    profile,
    setProfile,
    setProfileLoaded,
  ]);

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
