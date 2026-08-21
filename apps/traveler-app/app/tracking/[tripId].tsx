import { useState, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	ScrollView,
	ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	ArrowLeft,
	Radio,
	Bus,
	MapPin,
	Clock,
	Star,
	Phone,
	ShieldCheck,
	Navigation,
} from "lucide-react-native";

export default function LiveBusTrackingScreen() {
	const router = useRouter();
	const { tripId } = useLocalSearchParams<{ tripId: string }>();

	const [liveSpeed, setLiveSpeed] = useState(72);
	const [etaMinutes, setEtaMinutes] = useState(28);
	const [heading, setHeading] = useState(60);

	// Simulate real-time speed & heading updates from WebSocket
	useEffect(() => {
		const interval = setInterval(() => {
			setLiveSpeed((prev) => Math.min(100, Math.max(50, prev + (Math.random() * 4 - 2))));
		}, 3000);
		return () => clearInterval(interval);
	}, []);

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
					<View className="flex-row items-center gap-1.5">
						<View className="size-2.5 rounded-full bg-emerald-500 animate-ping" />
						<Text className="text-xs font-black text-white uppercase tracking-wider">
							Live Bus Telemetry
						</Text>
					</View>
					<Text className="text-[10px] text-zinc-400 font-mono">
						Trip Ref #{tripId?.slice(0, 8)}
					</Text>
				</View>

				<View className="size-10" />
			</View>

			<ScrollView className="flex-1 px-5 py-4 space-y-4">
				{/* Simulated Geo Tracking Canvas */}
				<View className="h-64 rounded-3xl bg-zinc-900 border border-zinc-800 relative overflow-hidden items-center justify-center shadow-2xl">
					<View className="absolute inset-0 bg-[radial-gradient(#27272a_1px,transparent_1px)] [background-size:20px_20px] opacity-40" />

					{/* Route Polyline (Simulated) */}
					<View className="w-48 h-1 bg-rose-500/30 rounded-full absolute rotate-[-25deg]" />

					{/* Live Bus Moving Marker */}
					<View className="items-center justify-center relative">
						<View className="size-20 rounded-full bg-rose-600/20 animate-ping absolute" />
						<View className="size-14 rounded-2xl bg-rose-600 border-2 border-white items-center justify-center shadow-2xl shadow-rose-600/50">
							<Bus size={24} color="#ffffff" />
						</View>
					</View>

					<View className="absolute bottom-4 left-4 right-4 bg-zinc-950/90 border border-zinc-800 backdrop-blur rounded-xl p-3 flex-row items-center justify-between">
						<View className="flex-row items-center gap-2">
							<Clock size={16} color="#e11d48" />
							<Text className="text-xs text-zinc-300">
								Estimated Arrival: <Text className="font-bold text-white">{etaMinutes} mins</Text>
							</Text>
						</View>
						<View className="flex-row items-center gap-1.5">
							<Text className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded">
								{Math.round(liveSpeed)} km/h
							</Text>
						</View>
					</View>
				</View>

				{/* Assigned Driver & Vehicle Card */}
				<View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-4">
					<Text className="text-xs font-bold text-zinc-400 uppercase">
						Assigned Driver & Vehicle
					</Text>

					<View className="flex-row items-center justify-between">
						<View className="flex-row items-center gap-3.5">
							<View className="size-12 rounded-2xl bg-rose-600/10 border border-rose-500/20 items-center justify-center">
								<Text className="text-base font-black text-rose-500">IT</Text>
							</View>
							<View>
								<Text className="text-base font-bold text-white">
									Ibrahim Touré
								</Text>
								<View className="flex-row items-center gap-1.5 mt-0.5">
									<Star size={13} color="#f59e0b" fill="#f59e0b" />
									<Text className="text-xs font-bold text-amber-400">4.92</Text>
									<Text className="text-xs text-zinc-500">• 380+ trips</Text>
								</View>
							</View>
						</View>

						<View className="bg-zinc-950 border border-zinc-800 px-3 py-1.5 rounded-xl text-right">
							<Text className="text-[10px] text-zinc-400">Bus Plate</Text>
							<Text className="text-xs font-mono font-bold text-white">
								9842-HJ-01
							</Text>
						</View>
					</View>

					<View className="p-3 bg-zinc-950 rounded-xl border border-zinc-800/60 flex-row items-center justify-between">
						<View className="flex-row items-center gap-2">
							<ShieldCheck size={16} color="#10b981" />
							<Text className="text-xs text-zinc-300">
								Moja Verified Commercial Carrier
							</Text>
						</View>
					</View>
				</View>
			</ScrollView>
		</SafeAreaView>
	);
}
