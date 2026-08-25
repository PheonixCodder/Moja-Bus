import { Bell } from "lucide-react-native";
import { useCounts } from "@novu/react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { useTRPC } from "@/lib/trpc";
import { authClient } from "@/lib/auth-client";

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
			className="mt-1"
			style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
		>
			<View>
				<Bell size={24} color="#a1a1aa" />
				{unread > 0 && (
					<View className="absolute -top-1 -right-1.5 min-w-[18px] h-[18px] rounded-full bg-[#e11d48] items-center justify-center px-1">
						<Text className="text-xs font-bold text-white">
							{unread > 99 ? "99+" : unread}
						</Text>
					</View>
				)}
			</View>
		</Pressable>
	);
}
