import "@/global.css";
import "@/lib/i18n";
import Toast from "react-native-toast-message";

import { NovuProvider } from "@novu/react-native";
import { PortalHost } from "@rn-primitives/portal";
import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import { DefaultTheme, router, Stack, ThemeProvider } from "expo-router";
import * as Linking from "expo-linking";
import { StatusBar } from "expo-status-bar";
import { PostHogProvider as PHProvider } from "posthog-react-native";
import { useEffect } from "react";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useLoadFonts } from "@/hooks/use-load-fonts";
import { usePushToken } from "@/hooks/use-push-token";
import { authClient } from "@/lib/auth-client";
import { posthog } from "@/lib/posthog";
import { TRPCReactProvider, useTRPC } from "@/lib/trpc";
import { usePendingReferralApplier } from "@/hooks/use-pending-referral-applier";
import { storePendingReferralCode } from "@/lib/pending-referral";

const isExpoGo = Constants.appOwnership === "expo";

const LightTheme = {
	...DefaultTheme,
	colors: {
		...DefaultTheme.colors,
		background: "#ffffff",
	},
};

interface TrpcQuery<TInput, TOutput> {
	queryOptions: (
		input: TInput,
		opts?: { staleTime?: number },
	) => {
		queryKey: unknown[];
		queryFn: () => Promise<TOutput>;
	};
}

interface NotificationTokenResponse {
	subscriberId: string;
	subscriberHash: string;
	appId: string;
}

interface PublicRouter {
	getNotificationToken: TrpcQuery<undefined, NotificationTokenResponse>;
}

interface TypedTRPC {
	public: PublicRouter;
}

function AuthenticatedNovuProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const { data: session, isPending } = authClient.useSession();
	const trpc = useTRPC() as unknown as TypedTRPC;
	const { data: token } = useQuery({
		...trpc.public.getNotificationToken.queryOptions(undefined, {
			staleTime: Infinity,
		}),
		enabled: !!session?.user,
	});

	// Never block the tree while session is loading — that leaves screens empty.
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
			<PendingReferralApplier />
			{children}
		</NovuProvider>
	);
}

function PushTokenRegistrar() {
	usePushToken();
	return null;
}

function PendingReferralApplier() {
	usePendingReferralApplier();
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
				Notifications.addNotificationReceivedListener((notification) => {
					// Update the Novu notification cache so in-app indicators stay in sync
				});

			const responseListener =
				Notifications.addNotificationResponseReceivedListener((response) => {
					const notification = response.notification;
					const data = notification.request.content.data as
						| Record<string, unknown>
						| undefined;
					if (data && typeof data === "object") {
						const type = (data as Record<string, unknown>)["type"] as
							| string
							| undefined;
						const ref = (data as Record<string, unknown>)["bookingReference"] as
							| string
							| undefined;
						if (
							type === "booking-confirmed" ||
							type === "booking-refunded" ||
							type === "hold-created" ||
							type === "review-request" ||
							type === "review-submitted" ||
							type === "trip-boarding"
						) {
							if (ref) {
								router.push(`/bookings/${ref}` as any);
							} else {
								router.push("/bookings");
							}
						} else if (type === "trip-cancelled") {
							router.push("/bookings");
						} else if (type === "trip-delayed") {
							router.push("/tickets");
						} else if (type === "trip-gate-updated") {
							router.push("/tickets");
						} else if (
							type === "wallet-low-balance" ||
							type === "wallet-topup"
						) {
							router.push("/wallet");
						}
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

	useEffect(() => {
		void (async () => {
			const url = await Linking.getInitialURL();
			if (!url) return;
			const parsed = Linking.parse(url);
			const parts = parsed.path?.split("/").filter(Boolean) ?? [];
			if (parts[0] === "r" && parts[1]) {
				await storePendingReferralCode(parts[1]);
			}
		})();
	}, []);

	if (!fontsLoaded && !fontsError) {
		return null;
	}

	const content = (
		<TRPCReactProvider>
			<AuthenticatedNovuProvider>
				<ThemeProvider value={LightTheme}>
					<StatusBar style="dark" />
					<Stack
						screenOptions={{
							headerShown: false,
							animation: "slide_from_right",
							contentStyle: { flex: 1, backgroundColor: "#ffffff" },
						}}
					>
						<Stack.Screen name="(tabs)" />
						<Stack.Screen
							name="article/[slug]"
							options={{
								presentation: "modal",
								animation: "slide_from_bottom",
							}}
						/>
					</Stack>
					<Toast />
					<PortalHost />
				</ThemeProvider>
			</AuthenticatedNovuProvider>
		</TRPCReactProvider>
	);

	return (
		<SafeAreaProvider>
			{posthog ? <PHProvider client={posthog}>{content}</PHProvider> : content}
		</SafeAreaProvider>
	);
}
