import { Notification03Icon, CheckmarkCircle01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useNovu, useNotifications } from "@novu/react-native";
import { useCallback, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	RefreshControl,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { SubpageHeader } from "@/components/subpage-header";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";

type NotificationItem = {
	id: string;
	body?: string;
	subject?: string;
	createdAt: string | Date;
	read?: boolean;
	isRead?: boolean;
	avatar?: string;
};

function timeAgo(dateString: string | Date): string {
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
}: {
	item: NotificationItem;
	onPress: () => void;
}) {
	const isRead =
		typeof item.isRead === "boolean"
			? item.isRead
			: typeof item.read === "boolean"
				? item.read
				: false;

	return (
		<Pressable
			onPress={onPress}
			className={`mx-4 mb-2.5 rounded-2xl border px-4 py-3.5 active:opacity-80 ${
				isRead
					? "border-slate-100 bg-white"
					: "border-pink-100 bg-pink-50/70"
			}`}
		>
			<View className="flex-row gap-3">
				<View
					className={`mt-0.5 h-10 w-10 items-center justify-center rounded-full ${
						isRead ? "bg-slate-100" : "bg-pink-100"
					}`}
				>
					<HugeiconsIcon
						icon={Notification03Icon}
						size={18}
						color={isRead ? "#94a3b8" : "#ee237c"}
					/>
				</View>
				<View className="min-w-0 flex-1 gap-1">
					<View className="flex-row items-start justify-between gap-2">
						<Text
							className={`flex-1 text-[15px] text-slate-900 ${
								isRead ? "font-semibold" : "font-bold"
							}`}
							numberOfLines={2}
						>
							{item.subject || "Notification"}
						</Text>
						{!isRead ? (
							<View className="mt-1.5 h-2 w-2 rounded-full bg-pink-600" />
						) : null}
					</View>
					{item.body ? (
						<Text className="text-sm leading-5 text-slate-500" numberOfLines={3}>
							{item.body}
						</Text>
					) : null}
					<Text className="text-xs font-medium text-slate-400">
						{timeAgo(item.createdAt)}
					</Text>
				</View>
			</View>
		</Pressable>
	);
}

export function NotificationsView() {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation("notifications");
	const novu = useNovu();
	const [markingAll, setMarkingAll] = useState(false);

	const {
		notifications,
		isLoading,
		fetchMore,
		hasMore,
		refetch,
		isFetching,
	} = useNotifications();

	const markOneRead = useCallback(
		async (notification: NotificationItem) => {
			const alreadyRead =
				typeof notification.isRead === "boolean"
					? notification.isRead
					: typeof notification.read === "boolean"
						? notification.read
						: false;
			if (alreadyRead) return;

			try {
				const maybeMethod = (notification as { read?: unknown }).read;
				if (typeof maybeMethod === "function") {
					await (maybeMethod as () => Promise<unknown>).call(notification);
				} else {
					const client = (novu as any)?.notifications
						? novu
						: (novu as any)?.novu;
					if (client?.notifications?.read) {
						await client.notifications.read(notification.id);
					}
				}
				await refetch();
			} catch {
				// best-effort
			}
		},
		[novu, refetch],
	);

	const markAllRead = useCallback(async () => {
		setMarkingAll(true);
		try {
			const client = (novu as any)?.notifications ? novu : (novu as any)?.novu;
			if (client?.notifications?.readAll) {
				await client.notifications.readAll();
			}
			await refetch();
		} catch {
			// best-effort
		} finally {
			setMarkingAll(false);
		}
	}, [novu, refetch]);

	const unreadCount =
		(notifications as NotificationItem[] | undefined)?.filter((n) => {
			const isRead =
				typeof n.isRead === "boolean"
					? n.isRead
					: typeof n.read === "boolean"
						? n.read
						: false;
			return !isRead;
		}).length ?? 0;

	const renderItem = useCallback(
		({ item }: { item: NotificationItem }) => (
			<NotificationRow item={item} onPress={() => markOneRead(item)} />
		),
		[markOneRead],
	);

	const renderFooter = () => {
		if (!hasMore)
			return <View style={{ height: BottomTabInset + insets.bottom + 24 }} />;
		return (
			<View className="items-center py-3">
				<ActivityIndicator size="small" color="#ee237c" />
			</View>
		);
	};

	const renderEmpty = () => {
		if (isLoading) return null;
		return (
			<View className="flex-1 items-center justify-center px-8 pt-16">
				<View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-pink-50">
					<HugeiconsIcon icon={Notification03Icon} size={28} color="#ee237c" />
				</View>
				<Text className="mb-1 text-base font-bold text-slate-900">
					{t("noNotifications")}
				</Text>
				<Text className="text-center text-sm leading-5 text-slate-500">
					{t("allCaughtUp")}
				</Text>
			</View>
		);
	};

	return (
		<View className="flex-1 bg-slate-50">
			<SubpageHeader title={t("notifications")} />

			{unreadCount > 0 ? (
				<View className="mb-2 flex-row items-center justify-between px-4 pt-1">
					<Text className="text-xs font-semibold uppercase tracking-wide text-slate-400">
						{t("unreadCount", {
							count: unreadCount,
							defaultValue: `${unreadCount} unread`,
						})}
					</Text>
					<Pressable
						onPress={markAllRead}
						disabled={markingAll}
						className="flex-row items-center gap-1.5 rounded-full bg-white border border-slate-200 px-3 py-1.5 active:opacity-80"
					>
						{markingAll ? (
							<ActivityIndicator size="small" color="#ee237c" />
						) : (
							<HugeiconsIcon icon={CheckmarkCircle01Icon} size={14} color="#ee237c" />
						)}
						<Text className="text-xs font-bold text-pink-600">
							{t("markAllRead", { defaultValue: "Mark all read" })}
						</Text>
					</Pressable>
				</View>
			) : null}

			{isLoading && !notifications?.length ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#ee237c" />
				</View>
			) : (
				<FlatList
					data={notifications as unknown as NotificationItem[]}
					renderItem={renderItem}
					keyExtractor={(item) => item.id}
					contentContainerStyle={{ flexGrow: 1, paddingTop: 8 }}
					onEndReached={() => {
						if (hasMore && !isFetching) fetchMore();
					}}
					onEndReachedThreshold={0.5}
					ListFooterComponent={renderFooter}
					ListEmptyComponent={renderEmpty}
					refreshControl={
						<RefreshControl
							refreshing={!!isFetching && !isLoading}
							onRefresh={refetch}
							tintColor="#ee237c"
						/>
					}
				/>
			)}
		</View>
	);
}
