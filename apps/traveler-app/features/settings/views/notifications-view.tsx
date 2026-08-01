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
import { Colors, Spacing } from "@moja/theme/tokens";

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
			style={({ pressed }) => ({
				flexDirection: "row",
				paddingVertical: Spacing.three,
				paddingHorizontal: Spacing.four,
				opacity: pressed ? 0.7 : 1,
				backgroundColor: isRead ? "transparent" : "rgba(0, 129, 241, 0.04)",
			})}
		>
			<View
				style={{
					width: 8,
					height: 8,
					borderRadius: 4,
					backgroundColor: isRead ? "transparent" : Colors.light.primary,
					marginTop: 6,
					marginRight: Spacing.two,
				}}
			/>
			<View style={{ flex: 1 }}>
				{item.subject ? (
					<Text
						style={{
							fontSize: 14,
							fontWeight: isRead ? "500" : "700",
							color: Colors.light.text,
							marginBottom: 2,
						}}
					>
						{item.subject}
					</Text>
				) : null}
				<Text
					style={{
						fontSize: 13,
						fontWeight: "400",
						color: Colors.light.textSecondary,
						lineHeight: 18,
					}}
					numberOfLines={2}
				>
					{item.body}
				</Text>
				<Text
					style={{
						fontSize: 11,
						fontWeight: "400",
						color: Colors.light.textSecondary,
						marginTop: 4,
					}}
				>
					{timeAgo(item.createdAt)}
				</Text>
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
			return (
				<View style={{ height: BottomTabInset + insets.bottom + 24 }} />
			);
		return (
			<View style={{ paddingVertical: Spacing.three, alignItems: "center" }}>
				<ActivityIndicator size="small" color={Colors.light.primary} />
			</View>
		);
	};

	const renderEmpty = () => {
		if (isLoading) return null;
			return (
			<View
				style={{
					flex: 1,
					alignItems: "center",
					justifyContent: "center",
					paddingTop: 80,
					paddingHorizontal: Spacing.four,
				}}
			>
				<Text
					style={{
						fontSize: 16,
						fontWeight: "600",
						color: Colors.light.text,
						marginBottom: 4,
					}}
				>
					{t("noNotifications")}
				</Text>
				<Text
					style={{
						fontSize: 14,
						fontWeight: "400",
						color: Colors.light.textSecondary,
						textAlign: "center",
					}}
				>
					{t("allCaughtUp")}
				</Text>
			</View>
		);
	};

	return (
		<View style={{ flex: 1, backgroundColor: Colors.light.background }}>
			<SubpageHeader title={t("notifications")} />

			{isLoading && !notifications?.length ? (
				<View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
					<ActivityIndicator size="large" color={Colors.light.primary} />
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
							tintColor={Colors.light.primary}
						/>
					}
					ItemSeparatorComponent={() => (
						<View
							style={{
								height: 0.5,
								backgroundColor: Colors.light.backgroundSelected,
								marginHorizontal: Spacing.four,
							}}
						/>
					)}
				/>
			)}
		</View>
	);
}