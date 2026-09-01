import { type Href, Redirect } from "expo-router";
import * as SplashScreen from "expo-splash-screen";
import { useEffect, useState } from "react";

import { authClient, ensureAuthCookiesFresh } from "@/lib/auth-client";
import { getTrpcClient } from "@/lib/trpc";
import { useDriverRegistrationStore } from "@/stores/driver-registration";

type AuthState =
	| "loading"
	| "unauthenticated"
	| "needs-register"
	| "needs-status"
	| "needs-pref"
	| "authenticated";

const REDIRECT_ROUTES: Record<
	Exclude<AuthState, "loading" | "needs-register">,
	Href
> = {
	unauthenticated: "/(auth)/login",
	"needs-status": "/(auth)/register/status",
	"needs-pref": "/(auth)/preferences",
	authenticated: "/(tabs)/trips",
};

/** Registration step routes, indexed by `currentStep - 1`. */
const REGISTRATION_STEP_ROUTES = [
	"/(auth)/register",
	"/(auth)/register/license",
	"/(auth)/register/documents",
	"/(auth)/register/carrier",
] as const;

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

		// Small delay lets Better Auth's SecureStore-backed session
		// initialise on cold boot before the first getSession() call.
		const timer = setTimeout(() => {
			checkAuth();
		}, 100);

		return () => {
			isMounted = false;
			clearTimeout(timer);
		};
	}, []);

	// Once the auth state is resolved, hide the native splash screen.
	useEffect(() => {
		if (authState !== "loading") {
			SplashScreen.hideAsync().catch(() => {});
		}
	}, [authState]);

	// While auth state is being determined the native splash screen
	// (kept visible by preventAutoHideAsync in _layout.tsx) covers the
	// viewport — return null to avoid a flash.
	if (authState === "loading") {
		return null;
	}

	// Resolve the registration step route (resumes at the correct step).
	if (authState === "needs-register") {
		const { currentStep, verifiedAt } = useDriverRegistrationStore.getState();
		const targetRoute =
			verifiedAt && currentStep > 1
				? REGISTRATION_STEP_ROUTES[
						Math.min(currentStep - 1, REGISTRATION_STEP_ROUTES.length - 1)
					]
				: "/(auth)/register";
		return <Redirect href={targetRoute as Href} />;
	}

	return <Redirect href={REDIRECT_ROUTES[authState]} />;
}
