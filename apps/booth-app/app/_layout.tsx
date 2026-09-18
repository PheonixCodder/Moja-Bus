import "@/global.css";
import "@/lib/i18n";

import { NovuProvider } from "@novu/react-native";
import { PortalHost } from "@rn-primitives/portal";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import type React from "react";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { colors } from "@/constants/theme";
import { useLoadFonts } from "@/hooks/use-load-fonts";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { usePushToken } from "@/hooks/use-push-token";
import { authClient } from "@/lib/auth-client";
import { flushOfflineQueue } from "@/lib/offline-sync";
import { NAV_THEME } from "@/lib/theme";
import { TRPCReactProvider, useTRPC } from "@/lib/trpc";
import { useOfflineQueue } from "@/stores/offline-queue";
import { PostHogProvider as PHProvider } from "posthog-react-native";
import { posthog } from "@/lib/posthog";
import { PostHogNavigationTracker } from "@/components/posthog-tracker";

// Prevent splash auto-hide until the boot gate (index.tsx) finishes its
// async auth/profile/terminal checks.
SplashScreen.preventAutoHideAsync().catch(() => {});

function PushTokenRegistrar() {
  usePushToken();
  return null;
}

function AuthenticatedNovuProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, isPending } = authClient.useSession();
  const trpc = useTRPC();
  const { data: token } = useQuery({
    ...trpc.notifications.getNotificationToken.queryOptions(undefined, {
      staleTime: Infinity,
    }),
    enabled: !!session?.user,
  });

  // Never block the tree while session is loading — that leaves screens empty.
  if (isPending) {
    return <>{children}</>;
  }

  const isAuthed = !!session?.user && !!token?.subscriberId && !!token?.appId;

  if (!isAuthed) {
    return <>{children}</>;
  }

  return (
    <NovuProvider
      subscriberId={token.subscriberId}
      subscriberHash={token.subscriberHash}
      applicationIdentifier={token.appId}
    >
      <PushTokenRegistrar />
      {children}
    </NovuProvider>
  );
}

function ReconnectHandler() {
  const { isOnline } = useNetworkStatus();
  const queueLength = useOfflineQueue((s) => s.queue.length);
  const trpc = useTRPC();
  const createCashSale = useMutation(
    trpc.booth.createCashSale.mutationOptions(),
  );
  const reportUrbanConflict = useMutation(
    trpc.booth.reportUrbanConflict.mutationOptions(),
  );
  const prevOnlineRef = useRef(true);

  useEffect(() => {
    const wasOffline = !prevOnlineRef.current;
    prevOnlineRef.current = isOnline;

    if (isOnline && wasOffline && queueLength > 0) {
      void flushOfflineQueue(
        createCashSale.mutateAsync,
        reportUrbanConflict.mutateAsync,
      ).then(({ flushed, failed }) => {
        if (flushed > 0) {
          Toast.show({
            type: "success",
            text1: `${flushed} vente(s) synchronisée(s)`,
          });
        }
        if (failed > 0) {
          Toast.show({
            type: "error",
            text1: `${failed} vente(s) non synchronisée(s)`,
            text2: "Vérifiez votre connexion et réessayez",
          });
        }
      });
    }
  }, [
    isOnline,
    queueLength,
    createCashSale.mutateAsync,
    reportUrbanConflict.mutateAsync,
  ]);

  return null;
}

export default function RootLayout() {
  const { fontsLoaded, fontsError } = useLoadFonts();

  useEffect(() => {
    if (fontsLoaded || fontsError) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontsError]);

  if (!fontsLoaded && !fontsError) {
    return null;
  }

  const content = (
    <TRPCReactProvider>
      <AuthenticatedNovuProvider>
        <StatusBar style="dark" />
        <ReconnectHandler />
        <ThemeProvider value={NAV_THEME}>
          <View
            className="flex-1 light"
            style={{ backgroundColor: colors.neutral.background }}
          >
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
              <Stack.Screen name="terminal-select" />
              <Stack.Screen name="reconcile" />
              <Stack.Screen name="notifications" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="sell" />
            </Stack>
            <Toast />
            <PortalHost />
          </View>
        </ThemeProvider>
      </AuthenticatedNovuProvider>
    </TRPCReactProvider>
  );

  return (
    <SafeAreaProvider>
      {posthog ? (
        <PHProvider client={posthog}>
          <PostHogNavigationTracker />
          {content}
        </PHProvider>
      ) : (
        content
      )}
    </SafeAreaProvider>
  );
}
