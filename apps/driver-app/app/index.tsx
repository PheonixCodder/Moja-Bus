import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { authClient } from "@/lib/auth-client";

// Minimal tRPC fetch to check if driver has set preferences yet
// We use a raw fetch against the tRPC endpoint rather than importing the full
// hook stack to keep this boot screen dependency-free.
async function hasServicePreference(sessionToken: string): Promise<boolean> {
	try {
		const res = await fetch(
			`${process.env['EXPO_PUBLIC_API_URL']}/api/trpc/drivers.getMyServicePreference`,
			{
				headers: {
					"Content-Type": "application/json",
					Cookie: `better-auth.session_token=${sessionToken}`,
				},
			}
		);
		if (!res.ok) return false;
		const json = await res.json();
		// Returns { result: { data: { preference: null | {...} } } }
		return json?.result?.data?.preference != null;
	} catch {
		return false;
	}
}

export default function IndexScreen() {
	const router = useRouter();
	const [isChecking, setIsChecking] = useState(true);

	useEffect(() => {
		async function checkAuth() {
			try {
				const session = await authClient.getSession();
				if (!session?.data?.user) {
					router.replace("/(auth)/login");
					return;
				}

				// User is authenticated — check if they've set preferences
				// We check this to show the one-time post-verification preference gate.
				// We do a lightweight check; on error we skip the gate (fail-open).
				const sessionToken =
					(session.data as any)?.session?.token ?? "";
				const hasPref = sessionToken
					? await hasServicePreference(sessionToken)
					: true; // skip gate if we can't determine

				if (!hasPref) {
					// First boot post-verification — show marketplace preference screen
					router.replace("/(auth)/preferences");
				} else {
					router.replace("/(tabs)/trips");
				}
			} catch {
				router.replace("/(auth)/login");
			} finally {
				setIsChecking(false);
			}
		}
		checkAuth();
	}, [router]);

	return (
		<View className="flex-1 items-center justify-center bg-zinc-950">
			<ActivityIndicator size="large" color="#e11d48" />
		</View>
	);
}

