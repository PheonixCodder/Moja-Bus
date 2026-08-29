import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Notification01Icon } from "@hugeicons/core-free-icons";
import { colors } from "@/constants/theme";
import type { NotificationRouteData } from "@/lib/notification-routes";

export type NotificationItem = {
	id: string;
	body?: string;
	subject?: string;
	createdAt: string | Date;
	read?: boolean;
	isRead?: boolean;
	avatar?: string;
	workflow?: { identifier?: string };
	data?: NotificationRouteData;
	redirect?: { url?: string };
};

function timeAgo(dateString: string | Date): string {
	const now = Date.now();
	const date = new Date(dateString).getTime();
	const diffMs = now - date;
	const diffSec = Math.floor(diffMs / 1000);

	if (diffSec < 60) return "À l'instant";
	const diffMin = Math.floor(diffSec / 60);
	if (diffMin < 60) return `${diffMin} min`;
	const diffHr = Math.floor(diffSec / 3600);
	if (diffHr < 24) return `${diffHr} h`;
	const diffDay = Math.floor(diffSec / 86400);
	if (diffDay < 7) return `${diffDay} j`;
	return new Date(dateString).toLocaleDateString();
}

interface NotificationRowProps {
	item: NotificationItem;
	onPress: () => void;
}

export function NotificationRow({ item, onPress }: NotificationRowProps) {
	const isRead =
		typeof item.isRead === "boolean"
			? item.isRead
			: typeof item.read === "boolean"
				? item.read
				: false;

	return (
		<TouchableOpacity
			onPress={onPress}
			activeOpacity={0.8}
			style={[
				styles.container,
				isRead ? styles.containerRead : styles.containerUnread,
			]}
		>
			<View style={styles.row}>
				<View
					style={[
						styles.iconBox,
						isRead ? styles.iconBoxRead : styles.iconBoxUnread,
					]}
				>
					<HugeiconsIcon
						icon={Notification01Icon}
						size={18}
						color={isRead ? "#71717a" : colors.primary.rose}
					/>
				</View>
				<View style={styles.contentWrap}>
					<View style={styles.titleRow}>
						<Text
							style={[
								styles.subjectText,
								isRead ? styles.subjectRead : styles.subjectUnread,
							]}
							numberOfLines={2}
						>
							{item.subject || "Notification"}
						</Text>
						{!isRead ? <View style={styles.unreadDot} /> : null}
					</View>
					{item.body ? (
						<Text style={styles.bodyText} numberOfLines={3}>
							{item.body}
						</Text>
					) : null}
					<Text style={styles.timeText}>{timeAgo(item.createdAt)}</Text>
				</View>
			</View>
		</TouchableOpacity>
	);
}

const styles = StyleSheet.create({
	container: {
		marginHorizontal: 16,
		marginBottom: 10,
		borderRadius: 16,
		borderWidth: 1,
		paddingHorizontal: 16,
		paddingVertical: 14,
	},
	containerRead: {
		borderColor: "#27272a",
		backgroundColor: "#18181b",
	},
	containerUnread: {
		borderColor: "rgba(238, 35, 124, 0.3)",
		backgroundColor: "rgba(238, 35, 124, 0.08)",
	},
	row: {
		flexDirection: "row",
		gap: 12,
	},
	iconBox: {
		marginTop: 2,
		width: 40,
		height: 40,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	iconBoxRead: {
		backgroundColor: "#09090b",
	},
	iconBoxUnread: {
		backgroundColor: "rgba(238, 35, 124, 0.15)",
	},
	contentWrap: {
		flex: 1,
		gap: 4,
	},
	titleRow: {
		flexDirection: "row",
		alignItems: "flex-start",
		justifyContent: "space-between",
		gap: 8,
	},
	subjectText: {
		flex: 1,
		fontSize: 14,
		color: "#fafafa",
	},
	subjectRead: {
		fontWeight: "600",
	},
	subjectUnread: {
		fontWeight: "800",
	},
	unreadDot: {
		marginTop: 4,
		width: 8,
		height: 8,
		borderRadius: 4,
		backgroundColor: "#ee237c",
	},
	bodyText: {
		fontSize: 12,
		lineHeight: 18,
		color: "#a1a1aa",
	},
	timeText: {
		fontSize: 10,
		fontWeight: "500",
		color: "#71717a",
	},
});
