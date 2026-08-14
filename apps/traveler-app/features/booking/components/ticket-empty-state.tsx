import { Ticket01Icon, Calendar01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

export function TicketEmptyState() {
	const { t } = useTranslation("booking");

	return (
		<View className="flex-1 items-center justify-center py-16 px-6">
			<View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center mb-4">
				<HugeiconsIcon icon={Ticket01Icon} size={32} color="#ee237c" />
			</View>
			<Text className="text-base font-bold text-foreground text-center mb-1">
				{t("noTickets")}
			</Text>
			<Text className="text-xs text-muted-foreground text-center max-w-[260px] leading-relaxed mb-6">
				{t("ticketEmptySubtitle")}
			</Text>
			<Pressable
				onPress={() => router.push("/(tabs)/bookings" as any)}
				className="bg-primary px-6 py-2.5 rounded-full flex-row items-center gap-2 shadow-sm"
				style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
			>
				<HugeiconsIcon icon={Calendar01Icon} size={16} color="#ffffff" />
				<Text className="text-xs font-bold text-white">{t("myBookings")}</Text>
			</Pressable>
		</View>
	);
}
