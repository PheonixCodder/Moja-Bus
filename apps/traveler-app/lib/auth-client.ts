import { emailOTPClient, phoneNumberClient } from "better-auth/client/plugins";
import { createAuthClient } from "better-auth/react";
import * as SecureStore from "expo-secure-store";
import { createExpoPlugin } from "./expo-client-plugin";

const baseURL =
	process.env["EXPO_PUBLIC_API_URL"] ?? "http://192.168.100.3:3000";

export const authClient = createAuthClient({
	baseURL,
	plugins: [
		emailOTPClient(),
		phoneNumberClient(),
		createExpoPlugin({
			scheme: "travelerapp",
			storage: SecureStore,
		}),
	],
});

export type Session = typeof authClient.$Infer.Session;
export type User = typeof authClient.$Infer.Session.user;

export const { useSession, signUp, signOut } = authClient;
