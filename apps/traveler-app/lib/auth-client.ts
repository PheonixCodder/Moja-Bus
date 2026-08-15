import { emailOTPClient, phoneNumberClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import Constants from "expo-constants";
import * as Linking from "expo-linking";
import * as SecureStore from "expo-secure-store";
import {
	expoClient,
	getSetCookie,
	hasBetterAuthCookies,
} from "@better-auth/expo/client";

const AUTH_STORAGE_PREFIX = "traveler-app";
const AUTH_COOKIE_STORAGE_KEY = `${AUTH_STORAGE_PREFIX}_cookie`;

const baseURL =
	process.env["EXPO_PUBLIC_API_URL"] ?? "http://192.168.100.3:3000";

export const authClient = createAuthClient({
	baseURL,
	plugins: [
		emailOTPClient(),
		phoneNumberClient(),
		expoClient({
			scheme: "traveler-app",
			storage: SecureStore,
			storagePrefix: AUTH_STORAGE_PREFIX,
		}) as unknown as { id: "expo"; $Infer: {} },
	],
});

export function getAuthCookieHeader(): string {
	// expoClient stores cookies in SecureStore; read synchronously via cache if present.
	// Prefer plugin helper when typed; fall back to empty (fetch will refresh session).
	const client = authClient as typeof authClient & {
		getCookie?: () => string;
	};
	return client.getCookie?.() ?? "";
}

export function getExpoOriginHeader(): string {
	const rawScheme =
		Constants.expoConfig?.scheme ?? Constants.platform?.scheme ?? "traveler-app";
	const scheme = Array.isArray(rawScheme) ? rawScheme[0] : rawScheme;
	return Linking.createURL("", { scheme });
}

/** Merge Set-Cookie from non-auth responses (e.g. tRPC) into SecureStore. */
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

/** Hit Better Auth get-session so the expo plugin refreshes stored cookies. */
export async function ensureAuthCookiesFresh(): Promise<void> {
	await authClient.getSession();
}


export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;

export const { useSession, signUp, signOut } = authClient;

export async function refreshSession() {
	const sessionAtom = authClient.$store?.atoms?.["session"];
	const refetch = sessionAtom?.get()?.refetch;
	if (refetch) {
		await refetch();
	}
}
