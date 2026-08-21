import { useState, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Modal,
	TextInput,
	ScrollView,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import {
	Radio,
	Gauge,
	MapPin,
	Clock,
	AlertTriangle,
	Users,
	StopCircle,
	CheckCircle,
} from "lucide-react-native";
import { DriverFeedback } from "@/lib/haptics";
import { stopBackgroundLocationTracking } from "@/lib/telemetry";

export default function DriverLiveTripScreen() {
	const [speedKmh, setSpeedKmh] = useState(68);
	const [heading, setHeading] = useState(45);
	const [delayModalOpen, setDelayModalOpen] = useState(false);
	const [delayMinutes, setDelayMinutes] = useState("15");
	const [delayReason, setDelayReason] = useState("");
	const [isTripActive, setIsTripActive] = useState(true);

	// Simulate fluctuating speedometer in driving simulator
	useEffect(() => {
		if (!isTripActive) return;
		const interval = setInterval(() => {
			setSpeedKmh((prev) => Math.min(105, Math.max(55, prev + (Math.random() * 6 - 3))));
		}, 2000);
		return () => clearInterval(interval);
	}, [isTripActive]);

	const handleEndTrip = async () => {
		DriverFeedback.warning();
		await stopBackgroundLocationTracking();
		setIsTripActive(false);
	};

	const handleReportDelay = () => {
		DriverFeedback.tap();
		setDelayModalOpen(false);
		setDelayReason("");
	};

	return (
		<SafeAreaView className="flex-1 bg-zinc-950">
			{/* Top Live Bar */}
			<View className="px-5 py-3 border-b border-zinc-800 bg-zinc-900/80 flex-row items-center justify-between">
				<View className="flex-row items-center gap-2">
					<View className="size-3 rounded-full bg-emerald-500 animate-ping" />
					<Text className="text-xs font-bold text-white uppercase tracking-wider">
						Live Telemetry Active
					</Text>
				</View>
				<View className="bg-zinc-950 px-2.5 py-1 rounded-md border border-zinc-800">
					<Text className="font-mono font-bold text-xs text-zinc-300">
						Bus 9842-HJ-01
					</Text>
				</View>
			</View>

			<ScrollView className="flex-1 px-5 py-4 space-y-4">
				{/* Speedometer Instrument HUD */}
				<View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 items-center justify-center relative overflow-hidden shadow-2xl">
					<View className="absolute inset-0 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

					<Text className="text-xs uppercase font-extrabold text-zinc-500 tracking-widest mb-1">
						Vehicle Speed
					</Text>
					<View className="flex-row items-baseline">
						<Text className="text-6xl font-black text-white font-mono tracking-tighter">
							{Math.round(speedKmh)}
						</Text>
						<Text className="text-sm font-bold text-rose-500 ml-2">km/h</Text>
					</View>

					<View className="flex-row items-center gap-6 mt-4 pt-4 border-t border-zinc-800/80 w-full justify-around">
						<View className="items-center">
							<Text className="text-[10px] uppercase text-zinc-500 font-bold">
								Heading
							</Text>
							<Text className="text-sm font-bold text-cyan-400 font-mono">
								{heading}° NE
							</Text>
						</View>
						<View className="w-[1px] h-6 bg-zinc-800" />
						<View className="items-center">
							<Text className="text-[10px] uppercase text-zinc-500 font-bold">
								GPS Signal
							</Text>
							<Text className="text-sm font-bold text-emerald-400 font-mono">
								High (4m)
							</Text>
						</View>
					</View>
				</View>

				{/* Next Terminal Progress Card */}
				<View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-5 space-y-3">
					<View className="flex-row items-center justify-between">
						<Text className="text-xs font-bold text-zinc-400 uppercase">
							Next Intermediate Terminal
						</Text>
						<Text className="text-xs font-bold text-rose-400 font-mono">
							ETA: 24 mins
						</Text>
					</View>

					<View className="flex-row items-center gap-3">
						<View className="p-2 rounded-xl bg-primary/10 border border-primary/20">
							<MapPin size={20} color="#e11d48" />
						</View>
						<View className="flex-1">
							<Text className="text-base font-bold text-white">
								Gare de Toumodi
							</Text>
							<Text className="text-xs text-zinc-400">
								18 passengers alighting • 6 boarding
							</Text>
						</View>
					</View>
				</View>

				{/* In-Trip Emergency / Delay Actions */}
				<View className="flex-row gap-3">
					<TouchableOpacity
						onPress={() => {
							DriverFeedback.tap();
							setDelayModalOpen(true);
						}}
						className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 items-center gap-1.5"
					>
						<AlertTriangle size={20} color="#f59e0b" />
						<Text className="text-xs font-bold text-amber-400">
							Report Traffic Delay
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						onPress={handleEndTrip}
						className="flex-1 bg-rose-600/10 border border-rose-500/20 rounded-xl p-4 items-center gap-1.5"
					>
						<StopCircle size={20} color="#e11d48" />
						<Text className="text-xs font-bold text-rose-400">
							Complete Run
						</Text>
					</TouchableOpacity>
				</View>
			</ScrollView>

			{/* Delay Reporting Modal */}
			<Modal
				visible={delayModalOpen}
				transparent
				animationType="slide"
				onRequestClose={() => setDelayModalOpen(false)}
			>
				<View className="flex-1 bg-black/80 justify-end">
					<View className="bg-zinc-900 border-t border-zinc-800 rounded-t-3xl p-6 space-y-4">
						<Text className="text-lg font-bold text-white">
							Report Route Delay
						</Text>
						<Text className="text-xs text-zinc-400">
							Notify awaiting passengers across all terminals with updated real-time ETA.
						</Text>

						<View className="space-y-1.5">
							<Text className="text-xs font-semibold text-zinc-300">
								Estimated Delay (Minutes)
							</Text>
							<TextInput
								className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 h-12 text-white font-bold"
								keyboardType="number-pad"
								value={delayMinutes}
								onChangeText={setDelayMinutes}
							/>
						</View>

						<View className="space-y-1.5">
							<Text className="text-xs font-semibold text-zinc-300">
								Reason (Traffic, Heavy Rain, Road Maintenance)
							</Text>
							<TextInput
								className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 h-12 text-white"
								placeholder="e.g. Highway congestion near Toumodi"
								placeholderTextColor="#52525b"
								value={delayReason}
								onChangeText={setDelayReason}
							/>
						</View>

						<View className="flex-row gap-3 pt-2">
							<TouchableOpacity
								onPress={() => setDelayModalOpen(false)}
								className="flex-1 bg-zinc-800 h-12 rounded-xl items-center justify-center"
							>
								<Text className="text-sm font-bold text-white">Cancel</Text>
							</TouchableOpacity>
							<TouchableOpacity
								onPress={handleReportDelay}
								className="flex-1 bg-amber-500 h-12 rounded-xl items-center justify-center"
							>
								<Text className="text-sm font-bold text-black">
									Broadcast Delay
								</Text>
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}
