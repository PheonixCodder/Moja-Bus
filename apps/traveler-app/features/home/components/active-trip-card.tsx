import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	Ticket01Icon,
	ArrowRight01Icon,
	Clock01Icon,
} from "@hugeicons/core-free-icons";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import { Colors, Palette } from "@/constants/theme";
import type { ActiveTripCardData } from "../lib/map-active-trip";

interface ActiveTripCardProps {
	booking: ActiveTripCardData;
	onPressIn?: () => void;
}

export function ActiveTripCard({ booking, onPressIn }: ActiveTripCardProps) {
	const { t } = useTranslation(["home", "booking"]);

	const departureTime = booking.departureTime.toLocaleTimeString("fr-FR", {
		hour: "2-digit",
		minute: "2-digit",
	});

	return (
		<Pressable
			onPressIn={onPressIn}
			onPress={() => router.push("/(tabs)/tickets")}
		>
			<LinearGradient
				colors={[Palette.zinc[900], Palette.rose[500]]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				className="rounded-2xl p-5"
			>
				<View className="flex-row items-center justify-between mb-3">
					<View className="flex-row items-center gap-1 bg-white/20 border border-white/30 px-2.5 py-1 rounded-full">
						<HugeiconsIcon icon={Clock01Icon} size={12} color={Colors.light.primaryForeground} />
						<Text className="text-sm font-extrabold text-white uppercase tracking-wider">
							{t("activeTripTitle")}
						</Text>
					</View>
					<Text className="text-xs font-mono font-bold text-white/80">
						{t("refLabel", { ns: "booking" })} {booking.referenceCode}
					</Text>
				</View>

				<View className="flex-row items-center justify-between my-2">
					<View className="gap-0.5">
						<Text className="text-lg font-black text-white">{booking.originName}</Text>
						<Text className="text-sm text-white/80">
							{t("departure", { ns: "booking" })}: {departureTime}
						</Text>
					</View>
					<HugeiconsIcon icon={ArrowRight01Icon} size={20} color={Colors.light.primaryForeground} />
					<View className="items-end gap-0.5">
						<Text className="text-lg font-black text-white">{booking.destName}</Text>
						<Text className="text-sm text-white/80">
							{t("seatSingle", { ns: "booking", label: booking.seatLabel })}
						</Text>
					</View>
				</View>

				<View className="pt-3 mt-2 border-t border-white/10 flex-row items-center justify-between">
					<Text className="text-xs font-medium text-white/80">
						{t("showQR", { ns: "booking", defaultValue: "Show QR at station gate" })}
					</Text>
					<View className="flex-row items-center gap-1.5 bg-card px-3 py-1.5 rounded-full shadow-sm">
						<HugeiconsIcon icon={Ticket01Icon} size={14} color={Colors.light.textPrimary} />
						<Text className="text-xs font-extrabold text-foreground">
							{t("viewTicket", { ns: "booking" })}
						</Text>
					</View>
				</View>
			</LinearGradient>
		</Pressable>
	);
}
