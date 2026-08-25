import { useCallback, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	Pressable,
	RefreshControl,
	Text,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { Bell, CheckCheck, ChevronLeft } from "lucide-react-native";
import { useNovu, useNotifications } from "@novu/react-native";
import { useTranslation } from "react-i18next";
import {
	type NotificationRouteData,
	resolveNotificationRoute,
} from "@/lib/notification-routes";

type NotificationItem = {
	id: string;
	body?: string;
	subject?: string;
	createdAt: string | Date;
	read?: boolean;
	isRead?: boolean;
	avatar?: string;
	// Phase 34 (F-NF-15) — tap routing reads the workflow identifier, trigger
	// payload and stored redirect off the Novu message.
	workflow?: { identifier?: string };
	data?: NotificationRouteData;
	redirect?: { url?: string };
};

function timeAgo(dateString: string | Date): string {
	const now = Date.now();
	const date = new Date(dateString).getTime();
	const diffMs = now - date;
	const diffSec = Math.floor(diffMs / 1000);

	if (diffSec < 60) return "à l'instant";
	const diffMin = Math.floor(diffSec / 60);
	if (diffMin < 60) return `${diffMin} min`;
	const diffHr = Math.floor(diffSec / 3600);
	if (diffHr < 24) return `${diffHr} h`;
	const diffDay = Math.floor(diffSec / 86400);
	if (diffDay < 7) return `${diffDay} j`;
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
					? "border-[#27272a] bg-[#18181b]"
					: "border-[#e11d48]/30 bg-[#1f1216]"
			}`}
		>
			<View className="flex-row gap-3">
				<View
					className={`mt-0.5 h-10 w-10 items-center justify-center rounded-full ${
						isRead ? "bg-[#27272a]" : "bg-[#e11d48]/15"
					}`}
				>
					<Bell size={18} color={isRead ? "#71717a" : "#fb7185"} />
				</View>
				<View className="min-w-0 flex-1 gap-1">
					<View className="flex-row items-start justify-between gap-2">
						<Text
							className={`flex-1 text-[15px] text-zinc-50 ${
								isRead ? "font-semibold" : "font-bold"
							}`}
							numberOfLines={2}
						>
							{item.subject || "Notification"}
						</Text>
						{!isRead ? (
							<View className="mt-1.5 h-2 w-2 rounded-full bg-[#e11d48]" />
						) : null}
					</View>
					{item.body ? (
						<Text className="text-sm leading-5 text-zinc-400" numberOfLines={3}>
							{item.body}
						</Text>
					) : null}
					<Text className="text-xs font-medium text-zinc-500">
						{timeAgo(item.createdAt)}
					</Text>
				</View>
			</View>
		</Pressable>
	);
}

export default function NotificationsScreen() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	// Phase 34 ride-along — this screen previously pulled its strings from the
	// "offers" namespace; notifications now own their namespace (en↔fr parity).
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
			<NotificationRow
				item={item}
				onPress={() => {
					// Phase 34 (F-NF-15) — tap navigates (map → redirect fallback)
					// and marks read; read-marking stays best-effort and never
					// blocks navigation.
					void markOneRead(item);
					const route = resolveNotificationRoute({
						identifier: item.workflow?.identifier,
						data: item.data,
						redirectUrl: item.redirect?.url,
					});
					if (route) router.push(route);
				}}
			/>
		),
		[markOneRead, router],
	);

	const renderEmpty = () => {
		if (isLoading) return null;
		return (
			<View className="flex-1 items-center justify-center px-8 pt-16">
				<View className="mb-4 h-16 w-16 items-center justify-center rounded-full bg-[#27272a]">
					<Bell size={28} color="#71717a" />
				</View>
				<Text className="mb-1 text-base font-bold text-zinc-100">
					{t("noNotifications")}
				</Text>
				<Text className="text-center text-sm leading-5 text-zinc-500">
					{t("allCaughtUp")}
				</Text>
			</View>
		);
	};

	return (
		<View
			className="flex-1 bg-[#09090b]"
			style={{ paddingTop: insets.top }}
		>
			{/* Header */}
			<View className="flex-row items-center justify-between border-b border-[#27272a] px-4 pb-3 pt-2">
				<Pressable
					onPress={() => router.back()}
					style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
				>
					<ChevronLeft size={26} color="#a1a1aa" />
				</Pressable>
				<Text className="text-lg font-bold text-zinc-50">
					{t("title")}
				</Text>
				<View style={{ width: 26 }} />
			</View>

			{unreadCount > 0 ? (
				<View className="mb-2 flex-row items-center justify-between px-4 pt-2">
					<Text className="text-xs font-semibold uppercase tracking-wide text-zinc-500">
						{t("unreadCount", { count: unreadCount })}
					</Text>
					<Pressable
						onPress={markAllRead}
						disabled={markingAll}
						className="flex-row items-center gap-1.5 rounded-full border border-[#27272a] bg-[#18181b] px-3 py-1.5 active:opacity-80"
					>
						{markingAll ? (
							<ActivityIndicator size="small" color="#e11d48" />
						) : (
							<CheckCheck size={14} color="#fb7185" />
						)}
						<Text className="text-xs font-bold text-[#fb7185]">
							{t("markAllRead")}
						</Text>
					</Pressable>
				</View>
			) : null}

			{isLoading && !notifications?.length ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#e11d48" />
				</View>
			) : (
				<FlatList
					data={notifications as unknown as NotificationItem[]}
					renderItem={renderItem}
					keyExtractor={(item) => item.id}
					contentContainerStyle={{ flexGrow: 1, paddingTop: 8, paddingBottom: insets.bottom + 24 }}
					onEndReached={() => {
						if (hasMore && !isFetching) fetchMore();
					}}
					onEndReachedThreshold={0.5}
					ListEmptyComponent={renderEmpty}
					refreshControl={
						<RefreshControl
							refreshing={!!isFetching && !isLoading}
							onRefresh={refetch}
							tintColor="#e11d48"
						/>
					}
				/>
			)}
		</View>
	);
}
