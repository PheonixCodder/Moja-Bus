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

const AUTH_STORAGE_PREFIX = "driver-app";
const AUTH_COOKIE_STORAGE_KEY = `${AUTH_STORAGE_PREFIX}_cookie`;

const baseURL =
	process.env["EXPO_PUBLIC_API_URL"] ?? "http://localhost:3000";

export const authClient = createAuthClient({
	baseURL,
	plugins: [
		emailOTPClient(),
		phoneNumberClient(),
		expoClient({
			scheme: "driver-app",
			storage: SecureStore,
			storagePrefix: AUTH_STORAGE_PREFIX,
		}) as unknown as { id: "expo"; $Infer: {} },
	],
});

export function getAuthCookieHeader(): string {
	const client = authClient as typeof authClient & {
		getCookie?: () => string;
	};
	return client.getCookie?.() ?? "";
}

export function getExpoOriginHeader(): string {
	const rawScheme =
		Constants.expoConfig?.scheme ?? Constants.platform?.scheme ?? "driver-app";
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
		// Ignore errors during cookie refresh
	}
}
