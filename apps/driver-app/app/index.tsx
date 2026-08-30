import { useEffect, useState } from "react";
import { View, ActivityIndicator, Image, Text } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Redirect } from "expo-router";
import { authClient, ensureAuthCookiesFresh } from "@/lib/auth-client";
import { getTrpcClient } from "@/lib/trpc";
import { useDriverRegistrationStore } from "@/stores/driver-registration";
import { colors } from "@/constants/theme";

type AuthState =
	| "loading"
	| "unauthenticated"
	| "needs-register"
	| "needs-status"
	| "needs-pref"
	| "authenticated";

async function fetchDriverStatus(): Promise<{
	hasProfile: boolean;
	status: string | null;
	hasPref: boolean;
}> {
	try {
		// Flush auth cookies into memory before making tRPC calls.
		// On cold boot, SecureStore hasn't been read yet so getCookie()
		// returns empty, causing a 401 which misidentifies the user as
		// having no driver profile.
		await ensureAuthCookiesFresh();
		const trpc = getTrpcClient();
		const [statusRes, prefRes] = await Promise.all([
			trpc.drivers.getMyVerificationStatus.query().catch(() => null),
			trpc.drivers.getMyServicePreference.query().catch(() => null),
		]);
		return {
			hasProfile: Boolean(statusRes?.driver),
			status: statusRes?.driver?.verificationStatus ?? null,
			hasPref: prefRes?.preference != null,
		};
	} catch (err) {
		console.warn("[Boot] status check unavailable:", err);
		return { hasProfile: false, status: null, hasPref: false };
	}
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

				const driverData = await fetchDriverStatus();
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
		const { currentStep, verifiedAt } = useDriverRegistrationStore.getState();
		const stepRoutes = [
			"/(auth)/register",
			"/(auth)/register/license",
			"/(auth)/register/documents",
			"/(auth)/register/carrier",
		] as const;
		const targetRoute =
			verifiedAt && currentStep > 1
				? stepRoutes[Math.min(currentStep - 1, stepRoutes.length - 1)]
				: "/(auth)/register";
		return <Redirect href={targetRoute as any} />;
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
