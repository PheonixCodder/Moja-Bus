import { Notification03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useCounts } from "@novu/react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, View } from "react-native";
import { useTRPC } from "@/lib/trpc";
import { authClient } from "@/lib/auth-client";
import { Text } from "./ui/text";

interface TrpcQuery<TInput, TOutput> {
	queryOptions: (
		input: TInput,
		opts?: { staleTime?: number; enabled?: boolean },
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

export function NotificationBell() {
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const trpc = useTRPC() as unknown as TypedTRPC;
	const { data: token, isPending: tokenPending } = useQuery({
		...trpc.public.getNotificationToken.queryOptions(undefined, {
			staleTime: Infinity,
		}),
		enabled: !!session?.user,
	});

	const isReady = !!session?.user && !!token?.subscriberId && !!token?.appId;

	if (sessionPending || !session?.user || tokenPending || !isReady) return null;

	return <BellWithCount />;
}

function BellWithCount() {
	const { counts } = useCounts({ filters: [{ read: false }] });
	const unread = counts?.[0]?.count ?? 0;

	return (
		<Pressable
			onPress={() => router.push("/notifications")}
			style={({ pressed }) => ({
				opacity: pressed ? 0.7 : 1,
				marginTop: 4,
			})}
		>
			<View>
				<HugeiconsIcon icon={Notification03Icon} size={24} color="#a3a3a3" />
				{unread > 0 && (
					<View
						style={{
							position: "absolute",
							top: -4,
							right: -6,
							minWidth: 18,
							height: 18,
							borderRadius: 9,
							backgroundColor: "#ef4444",
							alignItems: "center",
							justifyContent: "center",
							paddingHorizontal: 4,
						}}
					>
						<Text
							style={{
								fontSize: 10,
								fontWeight: "700",
								color: "#ffffff",
							}}
						>
							{unread > 99 ? "99+" : unread}
						</Text>
					</View>
				)}
			</View>
		</Pressable>
	);
}
