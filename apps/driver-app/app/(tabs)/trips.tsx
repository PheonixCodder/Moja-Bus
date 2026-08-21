import { useState } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	RefreshControl,
	ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import {
	Bus,
	MapPin,
	Calendar,
	Clock,
	Users,
	ChevronRight,
	Play,
	Radio,
} from "lucide-react-native";
import { DriverFeedback } from "@/lib/haptics";
import { startBackgroundLocationTracking } from "@/lib/telemetry";

export default function DriverTripsScreen() {
	const router = useRouter();
	const [activeTab, setActiveTab] = useState<"TODAY" | "UPCOMING" | "COMPLETED">("TODAY");
	const [serviceMode, setServiceMode] = useState<"INTERCITY" | "URBAN">("INTERCITY");
	const [isRefreshing, setIsRefreshing] = useState(false);

	// Mock driver trips state for demonstration / local run
	const trips = [
		{
			id: "trip_abidjan_yamoussoukro_01",
			serviceType: "INTERCITY",
			status: "SCHEDULED",
			origin: "Gare d'Adjamé, Abidjan",
			destination: "Gare Centrale, Yamoussoukro",
			departureTime: "08:30",
			departureDate: "Today",
			busPlate: "9842-HJ-01",
			bookedSeats: 48,
			totalSeats: 52,
		},
		{
			id: "trip_abidjan_bouake_02",
			serviceType: "INTERCITY",
			status: "SCHEDULED",
			origin: "Gare de Yopougon, Abidjan",
			destination: "Gare de Bouaké",
			departureTime: "14:00",
			departureDate: "Today",
			busPlate: "1104-AB-01",
			bookedSeats: 35,
			totalSeats: 52,
		},
	];

	const handleStartTrip = async (trip: (typeof trips)[0]) => {
		DriverFeedback.tap();
		try {
			await startBackgroundLocationTracking("drv_default_01", trip.id);
			router.push("/(tabs)/live");
		} catch (err: any) {
			console.warn("Location permission error:", err.message);
			router.push("/(tabs)/live");
		}
	};

	return (
		<SafeAreaView className="flex-1 bg-zinc-950">
			{/* Top Header & Dual Mode Switcher */}
			<View className="px-5 pt-3 pb-4 border-b border-zinc-800 bg-zinc-900/60">
				<View className="flex-row items-center justify-between">
					<View>
						<Text className="text-xl font-black text-white tracking-tight">
							Assigned Dispatches
						</Text>
						<Text className="text-xs text-zinc-400 mt-0.5">
							{serviceMode === "INTERCITY" ? "Intercity Passenger Runs" : "Urban High-Frequency Loops"}
						</Text>
					</View>

					{/* Dual-Mode Toggle */}
					<View className="flex-row bg-zinc-950 p-1 rounded-xl border border-zinc-800">
						<TouchableOpacity
							onPress={() => {
								DriverFeedback.tap();
								setServiceMode("INTERCITY");
							}}
							className={`px-3 py-1.5 rounded-lg ${serviceMode === "INTERCITY" ? "bg-rose-600" : ""}`}
						>
							<Text
								className={`text-[10px] font-bold ${serviceMode === "INTERCITY" ? "text-white" : "text-zinc-400"}`}
							>
								Intercity
							</Text>
						</TouchableOpacity>
						<TouchableOpacity
							onPress={() => {
								DriverFeedback.tap();
								setServiceMode("URBAN");
							}}
							className={`px-3 py-1.5 rounded-lg ${serviceMode === "URBAN" ? "bg-rose-600" : ""}`}
						>
							<Text
								className={`text-[10px] font-bold ${serviceMode === "URBAN" ? "text-white" : "text-zinc-400"}`}
							>
								Urban
							</Text>
						</TouchableOpacity>
					</View>
				</View>

				{/* Filter Tabs */}
				<View className="flex-row gap-2 mt-4">
					{(["TODAY", "UPCOMING", "COMPLETED"] as const).map((tab) => (
						<TouchableOpacity
							key={tab}
							onPress={() => {
								DriverFeedback.tap();
								setActiveTab(tab);
							}}
							className={`flex-1 py-2 rounded-lg items-center ${
								activeTab === tab
									? "bg-zinc-800 border border-zinc-700"
									: "bg-zinc-950/40"
							}`}
						>
							<Text
								className={`text-xs font-bold ${
									activeTab === tab ? "text-white" : "text-zinc-500"
								}`}
							>
								{tab === "TODAY" ? "Today" : tab === "UPCOMING" ? "Upcoming" : "Completed"}
							</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>

			{/* Trips List */}
			<ScrollView
				className="flex-1 px-4 py-4"
				refreshControl={
					<RefreshControl
						refreshing={isRefreshing}
						onRefresh={() => setIsRefreshing(false)}
						tintColor="#e11d48"
					/>
				}
			>
				{trips.map((trip) => (
					<View
						key={trip.id}
						className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 mb-4 shadow-sm"
					>
						{/* Top Run Tag & Bus Info */}
						<View className="flex-row items-center justify-between border-b border-zinc-800/80 pb-3 mb-3">
							<View className="flex-row items-center gap-2">
								<View className="p-1.5 rounded-lg bg-rose-600/10 border border-rose-500/20">
									<Bus size={16} color="#e11d48" />
								</View>
								<Text className="font-mono font-bold text-xs text-white">
									Bus {trip.busPlate}
								</Text>
							</View>
							<View className="flex-row items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
								<Radio size={12} color="#10b981" />
								<Text className="text-[10px] font-bold text-emerald-400">
									{trip.status}
								</Text>
							</View>
						</View>

						{/* Route Line */}
						<View className="space-y-2 mb-4">
							<View className="flex-row items-center gap-3">
								<View className="size-2 rounded-full bg-emerald-500" />
								<Text className="text-sm font-bold text-white flex-1" numberOfLines={1}>
									{trip.origin}
								</Text>
							</View>
							<View className="w-0.5 h-3 bg-zinc-800 ml-[3px]" />
							<View className="flex-row items-center gap-3">
								<View className="size-2 rounded-full bg-rose-500" />
								<Text className="text-sm font-bold text-white flex-1" numberOfLines={1}>
									{trip.destination}
								</Text>
							</View>
						</View>

						{/* Trip Metadata */}
						<View className="flex-row items-center justify-between bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/50 mb-4">
							<View className="flex-row items-center gap-1.5">
								<Clock size={14} color="#71717a" />
								<Text className="text-xs font-semibold text-zinc-300">
									{trip.departureTime}
								</Text>
							</View>
							<View className="flex-row items-center gap-1.5">
								<Users size={14} color="#71717a" />
								<Text className="text-xs font-semibold text-zinc-300">
									{trip.bookedSeats} / {trip.totalSeats} Boarded
								</Text>
							</View>
						</View>

						{/* Actions */}
						<View className="flex-row items-center gap-2">
							<TouchableOpacity
								onPress={() => router.push(`/trip/${trip.id}/manifest`)}
								className="flex-1 bg-zinc-800 active:bg-zinc-700 h-11 rounded-xl items-center justify-center border border-zinc-700"
							>
								<Text className="text-xs font-bold text-white">Manifest</Text>
							</TouchableOpacity>

							<TouchableOpacity
								onPress={() => handleStartTrip(trip)}
								className="flex-1 bg-rose-600 active:bg-rose-700 h-11 rounded-xl items-center justify-center flex-row gap-1.5 shadow-lg shadow-rose-600/20"
							>
								<Play size={14} color="#ffffff" fill="#ffffff" />
								<Text className="text-xs font-bold text-white">Start Run</Text>
							</TouchableOpacity>
						</View>
					</View>
				))}
			</ScrollView>
		</SafeAreaView>
	);
}
