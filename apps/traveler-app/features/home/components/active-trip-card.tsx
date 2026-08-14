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
				colors={["#0f172a", "#ee237c"]}
				start={{ x: 0, y: 0 }}
				end={{ x: 1, y: 1 }}
				className="rounded-2xl p-5"
			>
				<View className="flex-row items-center justify-between mb-3">
					<View className="flex-row items-center gap-1 bg-rose-500/20 border border-rose-400/30 px-2.5 py-1 rounded-full">
						<HugeiconsIcon icon={Clock01Icon} size={12} color="#f472b6" />
						<Text className="text-sm font-extrabold text-rose-300 uppercase tracking-wider">
							{t("activeTripTitle")}
						</Text>
					</View>
					<Text className="text-xs font-mono font-bold text-slate-300">
						{t("refLabel", { ns: "booking" })} {booking.referenceCode}
					</Text>
				</View>

				<View className="flex-row items-center justify-between my-2">
					<View className="gap-0.5">
						<Text className="text-lg font-black text-white">{booking.originName}</Text>
						<Text className="text-sm text-slate-300">
							{t("departure", { ns: "booking" })}: {departureTime}
						</Text>
					</View>
					<HugeiconsIcon icon={ArrowRight01Icon} size={20} color="#ffffff" />
					<View className="items-end gap-0.5">
						<Text className="text-lg font-black text-white">{booking.destName}</Text>
						<Text className="text-sm text-slate-300">
							{t("seatSingle", { ns: "booking", label: booking.seatLabel })}
						</Text>
					</View>
				</View>

				<View className="pt-3 mt-2 border-t border-white/10 flex-row items-center justify-between">
					<Text className="text-xs font-medium text-slate-200">
						{t("showQR", { ns: "booking", defaultValue: "Show QR at station gate" })}
					</Text>
					<View className="flex-row items-center gap-1.5 bg-white px-3 py-1.5 rounded-full shadow-sm">
						<HugeiconsIcon icon={Ticket01Icon} size={14} color="#0f172a" />
						<Text className="text-xs font-extrabold text-slate-900">
							{t("viewTicket", { ns: "booking" })}
						</Text>
					</View>
				</View>
			</LinearGradient>
		</Pressable>
	);
}
