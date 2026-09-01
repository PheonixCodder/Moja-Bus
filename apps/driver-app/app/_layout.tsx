import "@/global.css";
import "@/lib/i18n";

import { useEffect } from "react";
import { Stack, router, ThemeProvider } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import * as SplashScreen from "expo-splash-screen";
import Toast from "react-native-toast-message";
import { NovuProvider } from "@novu/react-native";
import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import { TRPCReactProvider, useTRPC } from "@/lib/trpc";
import { useLoadFonts } from "@/hooks/use-load-fonts";
import { authClient } from "@/lib/auth-client";
import { usePushToken } from "@/hooks/use-push-token";
import { UrgentDispatchGate } from "@/components/urgent-dispatch-gate";
import { NAV_THEME } from "@/lib/theme";

const isExpoGo = Constants.appOwnership === "expo";

// Prevent splash auto-hide until the boot gate (index.tsx) finishes its
// async auth/registration checks. The splash is hidden there once the
// redirect target is known.
SplashScreen.preventAutoHideAsync().catch(() => {});

interface NotificationTokenResponse {
	subscriberId: string;
	subscriberHash: string;
	appId: string;
}

interface TrpcQuery<TInput, TOutput> {
	queryOptions: (
		input: TInput,
		opts?: { staleTime?: number; enabled?: boolean },
	) => {
		queryKey: unknown[];
		queryFn: () => Promise<TOutput>;
	};
}

interface PublicRouter {
	getNotificationToken: TrpcQuery<undefined, NotificationTokenResponse>;
}

interface TypedTRPC {
	public: PublicRouter;
}

function AuthenticatedNovuProvider({ children }: { children: React.ReactNode }) {
	const { data: session, isPending } = authClient.useSession();
	const trpc = useTRPC() as unknown as TypedTRPC;
	const { data: token } = useQuery({
		...trpc.public.getNotificationToken.queryOptions(undefined, {
			staleTime: Infinity,
		}),
		enabled: !!session?.user,
	});

	if (isPending) {
		return <>{children}</>;
	}

	const isAuthed = !!session?.user && !!token?.subscriberId && !!token?.appId;

	if (!isAuthed) {
		return <>{children}</>;
	}

	return (
		<NovuProvider
			subscriberId={token.subscriberId}
			subscriberHash={token.subscriberHash}
			applicationIdentifier={token.appId}
		>
			<PushTokenRegistrar />
			<NotificationHandler />
			<UrgentDispatchGate />
			{children}
		</NovuProvider>
	);
}

function PushTokenRegistrar() {
	usePushToken();
	return null;
}

function NotificationHandler() {
	useEffect(() => {
		if (isExpoGo) return;

		let cancelled = false;
		let cleanup: (() => void) | undefined;

		async function setup() {
			const Notifications = await import("expo-notifications");
			if (cancelled) return;

			Notifications.setNotificationHandler({
				handleNotification: async () => ({
					shouldShowAlert: true,
					shouldPlaySound: true,
					shouldSetBadge: true,
					shouldShowBanner: true,
					shouldShowList: true,
				}),
			});

			const notificationListener =
				Notifications.addNotificationReceivedListener(() => {
					// Novu cache sync handled by provider
				});

			const responseListener =
				Notifications.addNotificationResponseReceivedListener((response) => {
					const data = response.notification.request.content.data as
						| Record<string, unknown>
						| undefined;
					if (!data || typeof data !== "object") return;
					const type = data["type"] as string | undefined;
					if (
						type === "driver-offer-received" ||
						type === "offer-counter" ||
						type === "offer-expiring" ||
						type === "offer-expired"
					) {
						router.push("/(tabs)/offers");
					} else if (
						type === "trip-assigned" ||
						type === "trip-unassigned" ||
						type === "dispatch-urgent"
					) {
						router.push("/(tabs)/trips");
					}
				});

			cleanup = () => {
				notificationListener.remove();
				responseListener.remove();
			};
		}

		setup();

		return () => {
			cancelled = true;
			cleanup?.();
		};
	}, []);

	return null;
}

export default function RootLayout() {
	const { fontsLoaded, fontsError } = useLoadFonts();

	if (!fontsLoaded && !fontsError) {
		return null;
	}

	return (
		<SafeAreaProvider>
			<TRPCReactProvider>
				<AuthenticatedNovuProvider>
					<ThemeProvider value={NAV_THEME}>
						<StatusBar style="light" />
						<Stack
							screenOptions={{
								headerShown: false,
								contentStyle: { flex: 1, backgroundColor: "#09090b" },
								animation: "slide_from_right",
							}}
						>
							<Stack.Screen name="index" />
							<Stack.Screen name="(auth)/login" />
							<Stack.Screen name="(auth)/preferences" />
							<Stack.Screen name="(auth)/register" />
							<Stack.Screen name="(tabs)" />
							<Stack.Screen name="notifications" />
							<Stack.Screen
								name="trip/[id]/manifest"
								options={{
									presentation: "modal",
									animation: "slide_from_bottom",
								}}
							/>
						</Stack>
						<Toast />
					</ThemeProvider>
				</AuthenticatedNovuProvider>
			</TRPCReactProvider>
		</SafeAreaProvider>
	);
}
