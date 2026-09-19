import { useMutation } from "@tanstack/react-query";
import Constants from "expo-constants";
import * as Device from "expo-device";
import { useEffect, useRef } from "react";
import { Platform } from "react-native";
import { useTRPC } from "@/lib/trpc";

const isExpoGo = Constants.appOwnership === "expo";

async function getPushToken(): Promise<string | null> {
  if (isExpoGo || !Device.isDevice) {
    return null;
  }

  try {
    const Notifications = await import("expo-notifications");
    const { status: existingStatus } =
      await Notifications.getPermissionsAsync();
    let finalStatus = existingStatus;

    if (existingStatus !== "granted") {
      const { status } = await Notifications.requestPermissionsAsync();
      finalStatus = status;
    }

    if (finalStatus !== "granted") {
      return null;
    }

    const tokenData = await Notifications.getExpoPushTokenAsync();
    const token = tokenData.data;

    if (Platform.OS === "android") {
      await Notifications.setNotificationChannelAsync("default", {
        name: "default",
        importance: Notifications.AndroidImportance.MAX,
      });
    }

    return token;
  } catch (_error) {
    return null;
  }
}

export function usePushToken() {
  const trpc = useTRPC();
  const registerMutation = useMutation(
    trpc.public.registerPushToken.mutationOptions(),
  );
  const registeredRef = useRef(false);

  useEffect(() => {
    if (registeredRef.current) return;

    let mounted = true;
    void getPushToken().then((token) => {
      if (!mounted || !token) return;
      registeredRef.current = true;
      const platform = Platform.OS === "ios" ? "ios" : "android";
      registerMutation.mutate({ token, platform });
    });

    return () => {
      mounted = false;
    };
  }, [registerMutation]);
}
