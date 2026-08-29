import { useEffect, useState } from "react";
import { View, ActivityIndicator, Image, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { authClient } from "@/lib/auth-client";
import { colors } from "@/constants/theme";

type AuthState =
	| "loading"
	| "unauthenticated"
	| "needs-register"
	| "needs-status"
	| "needs-pref"
	| "authenticated";

async function fetchDriverStatus(sessionToken: string): Promise<{
	hasProfile: boolean;
	status: string | null;
	hasPref: boolean;
}> {
	let lastError: unknown = null;
	for (let attempt = 0; attempt < 2; attempt++) {
		try {
			const res = await fetch(
				`${process.env["EXPO_PUBLIC_API_URL"]}/api/trpc/drivers.getMyVerificationStatus,drivers.getMyServicePreference?batch=1`,
				{
					headers: {
						"Content-Type": "application/json",
						Cookie: `better-auth.session_token=${sessionToken}`,
					},
				}
			);
			if (!res.ok) throw new Error(`driver-status-check HTTP ${res.status}`);
			const json = await res.json();
			const statusRes = json?.[0]?.result?.data;
			const prefRes = json?.[1]?.result?.data;
			return {
				hasProfile: Boolean(statusRes?.driver),
				status: statusRes?.driver?.verificationStatus ?? null,
				hasPref: prefRes?.preference != null,
			};
		} catch (err) {
			lastError = err;
			if (attempt === 0) await new Promise((r) => setTimeout(r, 400));
		}
	}
	console.warn("[Boot] status check unavailable — failing open:", lastError);
	return { hasProfile: true, status: "VERIFIED", hasPref: true };
}

export default function IndexScreen() {
	const [authState, setAuthState] = useState<AuthState>("loading");

	useEffect(() => {
		let isMounted = true;
		async function checkAuth() {
			try {
				const session = await authClient.getSession();
				if (!isMounted) return;

				if (!session?.data?.user) {
					setAuthState("unauthenticated");
					return;
				}

				const sessionToken = (session.data as any)?.session?.token ?? "";
				if (!sessionToken) {
					setAuthState("unauthenticated");
					return;
				}

				const driverData = await fetchDriverStatus(sessionToken);
				if (!isMounted) return;

				if (!driverData.hasProfile) {
					setAuthState("needs-register");
				} else if (driverData.status !== "VERIFIED") {
					setAuthState("needs-status");
				} else if (!driverData.hasPref) {
					setAuthState("needs-pref");
				} else {
					setAuthState("authenticated");
				}
			} catch {
				if (isMounted) setAuthState("unauthenticated");
			}
		}

		const timer = setTimeout(() => {
			checkAuth();
		}, 100);

		return () => {
			isMounted = false;
			clearTimeout(timer);
		};
	}, []);

	if (authState === "unauthenticated") {
		return <Redirect href="/(auth)/login" />;
	}

	if (authState === "needs-register") {
		return <Redirect href="/(auth)/register" />;
	}

	if (authState === "needs-status") {
		return <Redirect href="/(auth)/register/status" />;
	}

	if (authState === "needs-pref") {
		return <Redirect href="/(auth)/preferences" />;
	}

	if (authState === "authenticated") {
		return <Redirect href="/(tabs)/trips" />;
	}

	return (
		<SafeAreaView
			style={{ flex: 1, backgroundColor: "#09090b" }}
			className="flex-1 bg-[#09090b]"
		>
			<View
				style={{ flex: 1, alignItems: "center", justifyContent: "center" }}
				className="px-6 gap-4"
			>
				<Image
					source={require("../assets/images/icon.png")}
					style={{ width: 88, height: 88, borderRadius: 22 }}
					resizeMode="contain"
				/>
				<View className="items-center">
					<Text className="text-2xl font-bold text-[#fafafa] tracking-tight">
						Moja Driver
					</Text>
					<Text className="text-xs text-[#a1a1aa] mt-1">
						Portail Chauffeur Professionnel
					</Text>
				</View>
				<ActivityIndicator
					size="small"
					color={colors.primary.rose}
					style={{ marginTop: 24 }}
				/>
			</View>
		</SafeAreaView>
	);
}
