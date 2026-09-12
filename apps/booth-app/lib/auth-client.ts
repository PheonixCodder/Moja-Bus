import {
  emailOTPClient,
  phoneNumberClient,
} from "better-auth/client/plugins";
import {
  expoClient,
  getSetCookie,
  hasBetterAuthCookies,
} from "@better-auth/expo/client";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";

const AUTH_STORAGE_PREFIX = "booth-app";
const AUTH_COOKIE_STORAGE_KEY = `${AUTH_STORAGE_PREFIX}_cookie`;

export function getBaseUrl(): string {
  // biome-ignore lint/complexity/useLiteralKeys: process.env index signature requires bracket notation
  const envUrl = process.env["EXPO_PUBLIC_API_URL"];
  if (envUrl) return envUrl;
  // Production fallback — update once the web app has a stable domain
  return "https://moja-bus-web.vercel.app";
}

const baseURL = getBaseUrl();

export const authClient = createAuthClient({
  baseURL,
  plugins: [
    emailOTPClient(),
    phoneNumberClient(),
    expoClient({
      scheme: "mojabooth",
      storage: SecureStore,
      storagePrefix: AUTH_STORAGE_PREFIX,
    }) as unknown as { id: "expo"; $Infer: object },
  ],
}) as ReturnType<typeof createAuthClient> & {
  phoneNumber: {
    sendOtp: (opts: { phoneNumber: string }) => Promise<{ data?: any; error?: any }>;
    verify: (opts: { phoneNumber: string; code: string }) => Promise<{ data?: any; error?: any }>;
  };
  emailOtp: {
    sendVerificationOtp: (opts: { email: string; type: "sign-in" | "email-verification" }) => Promise<{ data?: any; error?: any }>;
    verifyEmail: (opts: { email: string; otp: string }) => Promise<{ data?: any; error?: any }>;
  };
  signIn: ReturnType<typeof createAuthClient>["signIn"] & {
    emailOtp: (opts: { email: string; otp: string }) => Promise<{ data?: any; error?: any }>;
  };
};

export function getAuthCookieHeader(): string {
  const client = authClient as typeof authClient & {
    getCookie?: () => string;
  };
  return client.getCookie?.() ?? "";
}

export function getExpoOriginHeader(): string {
  const rawScheme =
    Constants.expoConfig?.scheme ?? Constants.platform?.scheme ?? "mojabooth";
  const scheme = Array.isArray(rawScheme) ? rawScheme[0] : rawScheme;
  return Linking.createURL("", { scheme });
}

export async function syncAuthCookiesFromResponse(
  response: Response,
): Promise<void> {
  const setCookie = response.headers.get("set-cookie");
  if (!setCookie || !hasBetterAuthCookies(setCookie, "better-auth")) {
    return;
  }

  const prev =
    (await SecureStore.getItemAsync(AUTH_COOKIE_STORAGE_KEY)) ?? "{}";
  const next = getSetCookie(setCookie, prev);
  await SecureStore.setItemAsync(AUTH_COOKIE_STORAGE_KEY, next);
}

export async function ensureAuthCookiesFresh(): Promise<void> {
  try {
    await authClient.getSession();
  } catch {
    // Session check is best-effort
  }
}

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;

export const { useSession, signOut } = authClient;

export async function refreshSession() {
  const sessionAtom = authClient.$store?.atoms?.["session"];
  const refetch = sessionAtom?.get()?.refetch;
  if (refetch) {
    await refetch();
  }
}
