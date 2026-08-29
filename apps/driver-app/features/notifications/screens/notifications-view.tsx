import React, { useCallback, useState } from "react";
import {
	ActivityIndicator,
	FlatList,
	RefreshControl,
	Text,
	View,
	TouchableOpacity,
	StyleSheet,
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
			<View style={styles.emptyBox}>
				<View style={styles.emptyIconWrap}>
					<HugeiconsIcon icon={Notification01Icon} size={28} color="#71717a" />
				</View>
				<Text style={styles.emptyTitle}>{t("noNotifications")}</Text>
				<Text style={styles.emptySubtitle}>{t("allCaughtUp")}</Text>
			</View>
		);
	};

	return (
		<View style={[styles.root, { paddingTop: insets.top }]}>
			{/* Header */}
			<View style={styles.headerBar}>
				<TouchableOpacity
					onPress={() => router.back()}
					activeOpacity={0.8}
					style={styles.backBtn}
				>
					<HugeiconsIcon icon={ArrowLeft01Icon} size={20} color="#fafafa" />
				</TouchableOpacity>

				<View style={styles.headerTitleWrap}>
					<Text style={styles.headerTitle}>{t("title")}</Text>
					{unreadCount > 0 && (
						<Text style={styles.unreadBadgeText}>
							{unreadCount} {t("unread")}
						</Text>
					)}
				</View>

				{unreadCount > 0 ? (
					<TouchableOpacity
						onPress={markAllRead}
						disabled={markingAll}
						activeOpacity={0.8}
						style={styles.markAllBtn}
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
					</TouchableOpacity>
				) : (
					<View style={styles.placeholder} />
				)}
			</View>

			{/* List */}
			{isLoading ? (
				<View style={styles.loadingBox}>
					<ActivityIndicator size="large" color={colors.primary.rose} />
				</View>
			) : (
				<FlatList
					data={(notifications as NotificationItem[] | undefined) ?? []}
					keyExtractor={(item) => item.id}
					renderItem={renderItem}
					ListEmptyComponent={renderEmpty}
					contentContainerStyle={[
						styles.listContent,
						{ paddingBottom: Math.max(insets.bottom, 24) + 40 },
					]}
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

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: "#09090b",
	},
	headerBar: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		borderBottomWidth: 1,
		borderBottomColor: "#27272a",
		paddingHorizontal: 16,
		paddingBottom: 12,
		paddingTop: 8,
	},
	backBtn: {
		width: 40,
		height: 40,
		borderRadius: 14,
		backgroundColor: "#18181b",
		borderWidth: 1,
		borderColor: "#27272a",
		alignItems: "center",
		justifyContent: "center",
	},
	headerTitleWrap: {
		flex: 1,
		alignItems: "center",
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#fafafa",
	},
	unreadBadgeText: {
		fontSize: 11,
		color: "#ee237c",
		fontWeight: "700",
	},
	markAllBtn: {
		width: 40,
		height: 40,
		borderRadius: 14,
		backgroundColor: "#18181b",
		borderWidth: 1,
		borderColor: "#27272a",
		alignItems: "center",
		justifyContent: "center",
	},
	placeholder: {
		width: 40,
	},
	loadingBox: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	emptyBox: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 32,
		paddingTop: 64,
		gap: 12,
	},
	emptyIconWrap: {
		width: 64,
		height: 64,
		borderRadius: 20,
		backgroundColor: "#18181b",
		borderWidth: 1,
		borderColor: "#27272a",
		alignItems: "center",
		justifyContent: "center",
	},
	emptyTitle: {
		fontSize: 16,
		fontWeight: "700",
		color: "#fafafa",
	},
	emptySubtitle: {
		textAlign: "center",
		fontSize: 12,
		color: "#a1a1aa",
		lineHeight: 18,
		maxWidth: 280,
	},
	listContent: {
		paddingTop: 16,
	},
});
