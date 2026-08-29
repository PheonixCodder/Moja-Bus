import { HugeiconsIcon } from "@hugeicons/react-native";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { useCounts } from "@novu/react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { TouchableOpacity, Text, View } from "react-native";
import { useTRPC } from "@/lib/trpc";
import { authClient } from "@/lib/auth-client";
import { colors } from "@/constants/theme";

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
		<TouchableOpacity
			onPress={() => router.push("/notifications")}
			activeOpacity={0.7}
			className="size-10 rounded-2xl bg-[#18181b] border border-[#27272a] items-center justify-center relative"
		>
			<HugeiconsIcon icon={Notification01Icon} size={20} color="#a1a1aa" />
			{unread > 0 && (
				<View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-[#ee237c] items-center justify-center px-1 border-2 border-[#09090b]">
					<Text className="text-[10px] font-bold text-white">
						{unread > 99 ? "99+" : unread}
					</Text>
				</View>
			)}
		</TouchableOpacity>
	);
}
