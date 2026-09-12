import "@/global.css";
import "@/lib/i18n";

import { PortalHost } from "@rn-primitives/portal";
import { useMutation } from "@tanstack/react-query";
import { Stack, ThemeProvider } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { StatusBar } from "expo-status-bar";
import { useEffect, useRef } from "react";
import { View } from "react-native";
import { SafeAreaProvider } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { NAV_THEME } from "@/lib/theme";
import { useLoadFonts } from "@/hooks/use-load-fonts";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { flushOfflineQueue } from "@/lib/offline-sync";
import { TRPCReactProvider, useTRPC } from "@/lib/trpc";
import { useOfflineQueue } from "@/stores/offline-queue";
import { colors } from "@/constants/theme";

// Prevent splash auto-hide until the boot gate (index.tsx) finishes its
// async auth/profile/terminal checks. The splash is hidden there once the
// redirect target is known.
SplashScreen.preventAutoHideAsync().catch(() => {});

function ReconnectHandler() {
  const { isOnline } = useNetworkStatus();
  const { queue } = useOfflineQueue();
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

    if (isOnline && wasOffline && queue.length > 0) {
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
    queue.length,
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

  return (
    <SafeAreaProvider>
      <TRPCReactProvider>
        <StatusBar style="dark" />
        <ReconnectHandler />
        {/*
          className="light" forces NativeWind to always resolve :root (light)
          CSS variables regardless of device system dark mode preference.
          This is the single switch that keeps the booth in light mode.
        */}
        <ThemeProvider value={NAV_THEME}>
          <View
            className="flex-1 light"
            style={{ backgroundColor: colors.neutral.background }}
          >
            <Stack
              screenOptions={{
                headerShown: false,
                contentStyle: { flex: 1, backgroundColor: colors.neutral.background },
                animation: "slide_from_right",
              }}
            >
              <Stack.Screen name="index" />
              <Stack.Screen name="terminal-select" />
              <Stack.Screen name="reconcile" />
              <Stack.Screen name="(auth)" />
              <Stack.Screen name="(tabs)" />
              <Stack.Screen name="sell" />
            </Stack>
            <Toast />
            <PortalHost />
          </View>
        </ThemeProvider>
      </TRPCReactProvider>
    </SafeAreaProvider>
  );
}
