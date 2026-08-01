import { useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import { Platform } from "react-native";
import { useTRPC } from "@/lib/trpc";

interface TrpcMutation<TInput, TOutput> {
	mutationOptions: () => {
		mutationFn: (input: TInput) => Promise<TOutput>;
	};
}

interface PublicRouter {
	registerPushToken: TrpcMutation<{ token: string; platform: string }, { success: boolean }>;
}

interface TypedTRPC {
	public: PublicRouter;
}

async function getPushToken(): Promise<string | null> {
	if (!Device.isDevice) {
		return null;
	}

	const { status: existingStatus } = await Notifications.getPermissionsAsync();
	let finalStatus = existingStatus;

	if (existingStatus !== "granted") {
		const { status } = await Notifications.requestPermissionsAsync();
		finalStatus = status;
	}

	if (finalStatus !== "granted") {
		return null;
	}

	const tokenData = await Notifications.getExpoPushTokenAsync();
	const token = tokenData.data;

	if (Platform.OS === "android") {
		await Notifications.setNotificationChannelAsync("default", {
			name: "default",
			importance: Notifications.AndroidImportance.MAX,
		});
	}

	return token;
}

export function usePushToken() {
	const trpc = useTRPC() as unknown as TypedTRPC;
	const mutation = useMutation(
		trpc.public.registerPushToken.mutationOptions(),
	);
	const hasRegistered = useRef(false);

	useEffect(() => {
		if (hasRegistered.current) return;

		async function register() {
			const token = await getPushToken();
			if (!token) return;
			hasRegistered.current = true;
			mutation.mutate({ token, platform: Platform.OS });
		}

		register();
	}, [mutation]);

	return mutation;
}