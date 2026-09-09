import { useQuery } from "@tanstack/react-query";
import { Redirect } from "expo-router";
import { useEffect } from "react";
import { ActivityIndicator, View } from "react-native";
import { useSession } from "@/lib/auth-client";
import { useTRPC } from "@/lib/trpc";
import { useSessionStore } from "@/stores/session";
import { IconColors } from "@/constants/ui-colors";

export default function BootGate() {
  const { data: session, isPending: sessionLoading } = useSession();
  const trpc = useTRPC();
  const { terminal, setProfile, setProfileLoaded, profile, profileLoaded } =
    useSessionStore();

  const { data: profileData, isPending: profileLoading } = useQuery(
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
    } else {
      setProfile(null);
      setProfileLoaded(true);
    }
  }, [session, profileLoading, profileData, setProfile, setProfileLoaded]);

  if (sessionLoading || profileLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={IconColors.brand} />
      </View>
    );
  }

  if (!session?.user || !profileLoaded || !profile) {
    return <Redirect href="/(auth)/login" />;
  }

  if (!terminal) {
    return <Redirect href="/terminal-select" />;
  }

  return <Redirect href="/(tabs)" />;
}
