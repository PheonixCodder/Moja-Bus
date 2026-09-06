import React, { useCallback, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	RefreshControl,
	Text,
	View,
	Pressable,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	Notification01Icon,
	TickDouble02Icon,
	ArrowLeft01Icon,
} from "@hugeicons/core-free-icons";
import { useNovu, useNotifications } from "@novu/react-native";
import { useTranslation } from "react-i18next";
import { resolveNotificationRoute } from "@/lib/notification-routes";
import { colors } from "@/constants/theme";
import {
	NotificationRow,
	type NotificationItem,
} from "../components/notification-row";

export function NotificationsView() {
	const insets = useSafeAreaInsets();
	const router = useRouter();
	const { t } = useTranslation("notifications");
	const novu = useNovu();
	const [markingAll, setMarkingAll] = useState(false);

	const {
		notifications,
		isLoading,
		isFetching,
		refetch,
	} = useNotifications();

	const markOneRead = useCallback(
		async (item: NotificationItem) => {
			try {
				const notification = item as unknown as {
					id: string;
					read?: () => Promise<unknown>;
					markAsRead?: () => Promise<unknown>;
				};
				const maybeMethod = notification.read ?? notification.markAsRead;
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
					void markOneRead(item);
					const route = resolveNotificationRoute({
						identifier: item.workflow?.identifier,
						data: item.data,
						redirectUrl: item.redirect?.url,
					});
					if (route) router.push(route as any);
				}}
			/>
		),
		[markOneRead, router],
	);

	const renderEmpty = () => {
		if (isLoading) return null;
		return (
			<View className="flex-1 items-center justify-center px-8 pt-16 gap-3">
				<View className="w-16 h-16 rounded-2xl bg-card border border-border items-center justify-center">
					<HugeiconsIcon icon={Notification01Icon} size={28} color={colors.neutral.textMuted} />
				</View>
				<Text className="text-base font-bold text-foreground">{t("noNotifications")}</Text>
				<Text className="text-center text-xs text-muted-foreground leading-5 max-w-[280px]">{t("allCaughtUp")}</Text>
			</View>
		);
	};

	return (
		<View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
			{/* Header */}
			<View className="flex-row items-center justify-between border-b border-border px-4 pb-3 pt-2">
				<Pressable
					onPress={() => router.back()}
					className="w-10 h-10 rounded-2xl bg-card border border-border items-center justify-center"
				>
					<HugeiconsIcon icon={ArrowLeft01Icon} size={20} color={colors.neutral.textPrimary} />
				</Pressable>

				<View className="flex-1 items-center">
					<Text className="text-lg font-extrabold text-foreground">{t("title")}</Text>
					{unreadCount > 0 && (
						<Text className="text-xs text-primary font-bold">
							{unreadCount} {t("unread")}
						</Text>
					)}
				</View>

				{unreadCount > 0 ? (
					<Pressable
						onPress={markAllRead}
						disabled={markingAll}
						className="w-10 h-10 rounded-2xl bg-card border border-border items-center justify-center"
					>
						{markingAll ? (
							<ActivityIndicator size="small" color={colors.primary.rose} />
						) : (
							<HugeiconsIcon
								icon={TickDouble02Icon}
								size={18}
								color={colors.primary.rose}
							/>
						)}
					</Pressable>
				) : (
					<View className="w-10" />
				)}
			</View>

			{/* List */}
			{isLoading ? (
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color={colors.primary.rose} />
				</View>
			) : (
				<FlatList
					data={(notifications as NotificationItem[] | undefined) ?? []}
					keyExtractor={(item) => item.id}
					renderItem={renderItem}
					ListEmptyComponent={renderEmpty}
					contentContainerStyle={{
						paddingTop: 16,
						paddingBottom: Math.max(insets.bottom, 24) + 40,
					}}
					showsVerticalScrollIndicator={false}
					refreshControl={
						<RefreshControl
							refreshing={!!isFetching && !isLoading}
							onRefresh={() => refetch()}
							tintColor={colors.primary.rose}
						/>
					}
				/>
			)}
		</View>
	);
}
