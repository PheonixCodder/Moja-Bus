import { expoClient } from "@better-auth/expo/client";
import { emailOTPClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";

const baseURL =
  process.env["EXPO_PUBLIC_API_URL"] ?? "http://192.168.100.3:3000";

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    emailOTPClient(),
    expoClient({
      scheme: "travelerapp",
      storage: SecureStore,
    }) as any,
  ] as const,
}) as any;
