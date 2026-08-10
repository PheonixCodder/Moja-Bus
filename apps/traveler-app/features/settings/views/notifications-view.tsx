import { useNotifications } from "@novu/react-native";
import { useCallback } from "react";
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	RefreshControl,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { useTRPC } from "@/lib/trpc";
import { useMutation } from "@tanstack/react-query";
import { SubpageHeader } from "@/components/subpage-header";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";

interface TrpcQuery<TInput, TOutput> {
	queryOptions: (
		input: TInput,
		opts?: { staleTime?: number },
	) => {
		queryKey: unknown[];
		queryFn: () => Promise<TOutput>;
	};
}

interface TrpcMutation<TInput, TOutput> {
	mutationOptions: () => {
		mutationFn: (input: TInput) => Promise<TOutput>;
	};
}

interface NotificationsTokenResponse {
	subscriberId: string;
	subscriberHash: string;
	appId: string;
}

interface PublicRouter {
	getNotificationToken: TrpcQuery<undefined, NotificationsTokenResponse>;
	markNotificationAsRead: TrpcMutation<{ notificationId: string }, { success: boolean }>;
}

interface TypedTRPC {
	public: PublicRouter;
}

type NotificationItem = {
	id: string;
	body: string;
	subject?: string;
	createdAt: string;
	read: boolean;
	isRead: boolean;
	avatar?: string;
};

function timeAgo(dateString: string): string {
	const now = Date.now();
	const date = new Date(dateString).getTime();
	const diffMs = now - date;
	const diffSec = Math.floor(diffMs / 1000);

	if (diffSec < 60) return "just now";
	const diffMin = Math.floor(diffSec / 60);
	if (diffMin < 60) return `${diffMin}m ago`;
	const diffHr = Math.floor(diffMin / 60);
	if (diffHr < 24) return `${diffHr}h ago`;
	const diffDay = Math.floor(diffHr / 24);
	if (diffDay < 7) return `${diffDay}d ago`;
	return new Date(dateString).toLocaleDateString();
}

function NotificationRow({
	item,
	onPress,
}: { item: NotificationItem; onPress: () => void }) {
	const isRead = item.read ?? item.isRead;

	return (
		<Pressable
			onPress={onPress}
			className={`flex-row py-3 px-4 active:opacity-70 ${isRead ? "" : "bg-blue-500/[0.04]"}`}
		>
			<View
				className={`w-2 h-2 rounded-full mt-1.5 mr-2 ${isRead ? "bg-transparent" : "bg-pink-600"}`}
			/>
			<View className="flex-1">
				{item.subject ? (
					<Text className={`text-sm mb-0.5 text-slate-900 ${isRead ? "font-medium" : "font-bold"}`}>
						{item.subject}
					</Text>
				) : null}
				<Text className="text-sm text-slate-500 leading-[18px]" numberOfLines={2}>
					{item.body}
				</Text>
				<Text className="text-[11px] text-slate-400 mt-1">{timeAgo(item.createdAt)}</Text>
			</View>
		</Pressable>
	);
}

export function NotificationsView() {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation("notifications");
	const trpc = useTRPC() as unknown as TypedTRPC;

	const {
		notifications,
		isLoading,
		fetchMore,
		hasMore,
		refetch,
		isFetching,
	} = useNotifications();

	const markAsReadMutation = useMutation(
		trpc.public.markNotificationAsRead.mutationOptions(),
	);

	const handleNotificationPress = useCallback(
		(notification: NotificationItem) => {
			const alreadyRead = notification.read || notification.isRead;
			if (alreadyRead) return;

			markAsReadMutation.mutate(
				{ notificationId: notification.id },
				{
					onSuccess: () => {
						refetch();
					},
					onError: () => {
						// Silently fail — mark-as-read is best-effort
					},
				},
			);
		},
		[markAsReadMutation, refetch],
	);

	const renderItem = useCallback(
		({ item }: { item: NotificationItem }) => (
			<NotificationRow
				item={item}
				onPress={() => handleNotificationPress(item)}
			/>
		),
		[handleNotificationPress],
	);

	const renderFooter = () => {
		if (!hasMore)
			return <View style={{ height: BottomTabInset + insets.bottom + 24 }} />;
		return (
			<View className="py-3 items-center">
				<ActivityIndicator size="small" color="#ee237c" />
			</View>
		);
	};

	const renderEmpty = () => {
		if (isLoading) return null;
		return (
			<View className="flex-1 items-center justify-center pt-20 px-4">
				<Text className="text-base font-semibold text-slate-900 mb-1">{t("noNotifications")}</Text>
				<Text className="text-sm text-slate-500 text-center">{t("allCaughtUp")}</Text>
			</View>
		);
	};

	return (
		<View className="flex-1 bg-white">
			<SubpageHeader title={t("notifications")} />

			{isLoading && !notifications?.length ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#ee237c" />
				</View>
			) : (
				<FlatList
					data={notifications as unknown as NotificationItem[]}
					renderItem={renderItem}
					keyExtractor={(item) => item.id}
					contentContainerStyle={{ flexGrow: 1 }}
					onEndReached={() => {
						if (hasMore && !isFetching) fetchMore();
					}}
					onEndReachedThreshold={0.5}
					ListFooterComponent={renderFooter}
					ListEmptyComponent={renderEmpty}
					refreshControl={
						<RefreshControl
							refreshing={isFetching}
							onRefresh={refetch}
							tintColor="#ee237c"
						/>
					}
					ItemSeparatorComponent={() => (
						<View className="h-[0.5px] bg-slate-100 mx-4" />
					)}
				/>
			)}
		</View>
	);
}