import { emailOTPClient, phoneNumberClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { expoClient } from "@better-auth/expo/client";

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
			storagePrefix: "traveler-app",
		}) as unknown as { id: "expo"; $Infer: {} },
	],
});


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
