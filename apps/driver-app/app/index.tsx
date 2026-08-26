import { useEffect, useState } from "react";
import { View, ActivityIndicator } from "react-native";
import { useRouter } from "expo-router";
import { authClient } from "@/lib/auth-client";

// Minimal tRPC fetch to check if driver has set preferences yet.
// Raw fetch against the tRPC endpoint (not the hook stack) keeps this boot
// screen dependency-free.
//
// Outcome contract (Phase-1 audit fix, 2026-08-26):
//   true  → preference row exists OR the API is unreachable (fail-open)
//   false → definitive "no preference row" — show the marketplace gate
// The old code returned false on ANY network/HTTP error, which forced every
// offline cold boot into onboarding (and its skip button persists nothing, so
// the trap repeated). Now: one retry, then fail OPEN to tabs — an unconfigured
// driver simply gets captured by the gate on the next successful boot.
async function hasServicePreference(sessionToken: string): Promise<boolean> {
	let lastError: unknown = null;
	for (let attempt = 0; attempt < 2; attempt++) {
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
			if (!res.ok) throw new Error(`preference-check HTTP ${res.status}`);
			const json = await res.json();
			// Returns { result: { data: { preference: null | {...} } } }
			return json?.result?.data?.preference != null;
		} catch (err) {
			lastError = err;
			if (attempt === 0) await new Promise((r) => setTimeout(r, 400));
		}
	}
	console.warn("[Boot] preference check unavailable — failing open:", lastError);
	return true;
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
				// Definitive no-row → gate. Unreachable API (after 1 retry) → fail
				// open to tabs so offline boots never trap drivers in onboarding.
				const sessionToken =
					(session.data as any)?.session?.token ?? "";
				const hasPref = sessionToken
					? await hasServicePreference(sessionToken)
					: true; // no token to check with — skip gate

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

