import { View, Text, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import { ArrowLeft, Satellite, Clock } from "lucide-react-native";

/**
 * Phase 18 (P1-5 / P2-13) — v1 ships HTTP-only telemetry with no live
 * consumer, so this surface is deliberately NOT a simulation. Entry is
 * flag-gated (EXPO_PUBLIC_LIVE_TRACKING_ENABLED); stale deep links land on
 * an honest status screen until the real consumer client ships.
 */
export default function LiveBusTrackingScreen() {
	const { t } = useTranslation("booking");
	const router = useRouter();
	const { tripId } = useLocalSearchParams<{ tripId: string }>();

	return (
		<SafeAreaView className="flex-1 bg-zinc-950">
			{/* Header */}
			<View className="px-5 py-3 border-b border-zinc-800 bg-zinc-900/80 flex-row items-center justify-between">
				<TouchableOpacity
					onPress={() => router.back()}
					className="size-10 rounded-full bg-zinc-800 items-center justify-center"
				>
					<ArrowLeft size={20} color="#fafafa" />
				</TouchableOpacity>

				<View className="items-center">
					<Text className="text-xs font-black text-white uppercase tracking-wider">
						{t("trackingTitle")}
					</Text>
				</View>

				<View className="size-10" />
			</View>

			<View className="flex-1 items-center justify-center px-6">
				<View className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-8 items-center gap-3 w-full">
					<View className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
						<Satellite size={40} color="#e11d48" />
					</View>
					<Text className="text-lg font-bold text-white text-center">
						{t("trackingComingSoon")}
					</Text>
					<Text className="text-xs text-zinc-400 text-center leading-relaxed">
						{t("trackingBody")}
					</Text>

					{tripId ? (
						<View className="flex-row items-center gap-1.5 bg-zinc-950 px-2.5 py-1 rounded-full border border-zinc-800 mt-1">
							<Clock size={12} color="#71717a" />
							<Text className="text-[10px] font-bold text-zinc-500">
								{t("refLabel", { tripId })}
							</Text>
						</View>
					) : null}
				</View>
			</View>
		</SafeAreaView>
	);
}
