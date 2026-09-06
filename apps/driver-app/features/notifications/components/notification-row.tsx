import React from "react";
import { View, Text, Pressable } from "react-native";
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
		<Pressable
			onPress={onPress}
			className={`mx-4 mb-2.5 rounded-2xl border px-4 py-3.5 ${
				isRead ? "border-border bg-card" : "border-primary/30 bg-primary/10"
			}`}
		>
			<View className="flex-row gap-3">
				<View
					className={`mt-0.5 w-10 h-10 rounded-xl items-center justify-center ${
						isRead ? "bg-background" : "bg-primary/15"
					}`}
				>
					<HugeiconsIcon
						icon={Notification01Icon}
						size={18}
						color={isRead ? colors.neutral.textMuted : colors.primary.rose}
					/>
				</View>
				<View className="flex-1 gap-1">
					<View className="flex-row items-start justify-between gap-2">
						<Text
							className={`flex-1 text-sm text-foreground ${
								isRead ? "font-semibold" : "font-extrabold"
							}`}
							numberOfLines={2}
						>
							{item.subject || "Notification"}
						</Text>
						{!isRead ? <View className="mt-1 w-2 h-2 rounded-full bg-primary" /> : null}
					</View>
					{item.body ? (
						<Text className="text-xs leading-5 text-muted-foreground" numberOfLines={3}>
							{item.body}
						</Text>
					) : null}
					<Text className="text-[10px] font-medium text-muted-foreground">{timeAgo(item.createdAt)}</Text>
				</View>
			</View>
		</Pressable>
	);
}
