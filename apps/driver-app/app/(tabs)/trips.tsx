import { useState } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	RefreshControl,
	ActivityIndicator,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Bus,
	MapPin,
	Calendar,
	Clock,
	Users,
	ChevronRight,
	Play,
	Radio,
	AlertCircle,
	ArrowRight,
} from "lucide-react-native";
import { useTRPC } from "@/lib/trpc";
import { DriverFeedback } from "@/lib/haptics";
import {
	setTelemetryAuthToken,
	setTelemetryReauthHandler,
	startBackgroundLocationTracking,
} from "@/lib/telemetry";

export default function DriverTripsScreen() {
	const router = useRouter();
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const [activeTab, setActiveTab] = useState<"TODAY" | "UPCOMING" | "COMPLETED">("TODAY");
	// P3-13 — ALL by default so no assignment is ever hidden behind the toggle.
	const [serviceMode, setServiceMode] = useState<"ALL" | "INTERCITY" | "URBAN">("ALL");

	// Real tRPC query for driver trips
	const {
		data: tripsData,
		isLoading,
		isRefetching,
		refetch,
		error,
	} = useQuery({
		...trpc.drivers.getMyTrips.queryOptions({
			filter: activeTab,
			...(serviceMode !== "ALL" ? { serviceType: serviceMode } : {}),
			page: 1,
			limit: 20,
		}),
		// Phase 12 — new dispatch assignments surface without pull-to-refresh
		refetchInterval: 30_000,
	});

	// Real tRPC mutation to start a trip
	const startTripMutation = useMutation(
		trpc.drivers.startTrip.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries();
			},
		})
	);

	const handleStartTrip = async (tripId: string) => {
		DriverFeedback.tap();
		try {
			// P0-1 — the mutation response is the single source of telemetry identity.
			const res = await startTripMutation.mutateAsync({ tripId });
			setTelemetryAuthToken(res.telemetryToken);
			// Phase 10 (F-TM-06) — self-heal an expired dispatch token mid-run:
			// the lib calls back into this assignment-checked re-mint instead of
			// silently degrading after 24 h.
			setTelemetryReauthHandler(async () => {
				try {
					const minted = await queryClient.fetchQuery(
						trpc.drivers.getTelemetryToken.queryOptions({ tripId }),
					);
					setTelemetryAuthToken(minted.telemetryToken);
					return minted.telemetryToken;
				} catch {
					return null;
				}
			});
			await startBackgroundLocationTracking(res.driverProfileId, tripId);
			router.push("/(tabs)/live");
		} catch (err: any) {
			console.warn("[StartTrip] Error starting run:", err.message);
			Alert.alert("Unable to Start Run", err?.message ?? "Please try again.");
		}
	};

	const trips = tripsData?.items ?? [];

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
							{serviceMode === "ALL"
								? "All Modes"
								: serviceMode === "INTERCITY"
									? "Intercity Passenger Runs"
									: "Urban High-Frequency Loops"}
						</Text>
					</View>

					{/* Dual-Mode Toggle */}
					<View className="flex-row bg-zinc-950 p-1 rounded-xl border border-zinc-800">
						{(["ALL", "INTERCITY", "URBAN"] as const).map((mode) => (
							<TouchableOpacity
								key={mode}
								onPress={() => {
									DriverFeedback.tap();
									setServiceMode(mode);
								}}
								className={`px-3 py-1.5 rounded-lg ${serviceMode === mode ? "bg-rose-600" : ""}`}
							>
								<Text
									className={`text-[10px] font-bold ${serviceMode === mode ? "text-white" : "text-zinc-400"}`}
								>
									{mode === "ALL" ? "All" : mode === "INTERCITY" ? "Intercity" : "Urban"}
								</Text>
							</TouchableOpacity>
						))}
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

			{/* Content Feed */}
			<ScrollView
				className="flex-1 px-4 py-4"
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={() => refetch()}
						tintColor="#e11d48"
					/>
				}
			>
				{isLoading ? (
					<View className="py-20 items-center justify-center space-y-3">
						<ActivityIndicator size="large" color="#e11d48" />
						<Text className="text-xs text-zinc-400 font-medium">
							Loading scheduled dispatches...
						</Text>
					</View>
				) : error ? (
					<View className="py-16 items-center justify-center px-6 text-center space-y-3 bg-zinc-900/40 rounded-3xl border border-zinc-800/80 my-4">
						<AlertCircle size={40} color="#f43f5e" />
						<Text className="text-base font-bold text-white text-center">
							Unable to Load Trips
						</Text>
						<Text className="text-xs text-zinc-400 text-center leading-relaxed">
							{error.message || "Please verify you have an active driver profile linked to your account."}
						</Text>
						<TouchableOpacity
							onPress={() => refetch()}
							className="bg-zinc-800 px-5 py-2.5 rounded-xl border border-zinc-700 mt-2"
						>
							<Text className="text-xs font-bold text-white">Retry</Text>
						</TouchableOpacity>
					</View>
				) : trips.length === 0 ? (
					<View className="py-20 items-center justify-center px-6 text-center space-y-3 bg-zinc-900/30 rounded-3xl border border-zinc-800/60 my-4">
						<Bus size={44} color="#71717a" />
						<Text className="text-base font-bold text-white text-center">
							No Dispatches Found
						</Text>
						<Text className="text-xs text-zinc-400 text-center leading-relaxed max-w-xs">
							{activeTab === "TODAY"
								? "You have no assigned runs scheduled for today. Check upcoming or contact your carrier dispatcher."
								: `No ${activeTab.toLowerCase()} trips found on your schedule.`}
						</Text>
					</View>
				) : (
					trips.map(({ assignmentId, trip, passengerCount, role }) => {
						const stops = trip.tripStops ?? [];
						const originStop = stops[0]?.terminal?.name ?? "Origin Terminal";
						const destStop = stops[stops.length - 1]?.terminal?.name ?? "Destination Terminal";
						const depTime = new Date(trip.departureDate).toLocaleTimeString([], {
							hour: "2-digit",
							minute: "2-digit",
							hour12: false,
						});

						return (
							<View
								key={assignmentId}
								className="bg-zinc-900 border border-zinc-800 rounded-3xl p-5 mb-4 shadow-xl"
							>
								{/* Top Bus & Status Header */}
								<View className="flex-row items-center justify-between border-b border-zinc-800/80 pb-3.5 mb-3.5">
									<View className="flex-row items-center gap-2.5">
										<View className="p-2 rounded-xl bg-rose-600/10 border border-rose-500/20">
											<Bus size={18} color="#e11d48" />
										</View>
										<View>
											<Text className="font-mono font-black text-sm text-white">
												{trip.bus?.registrationPlate ?? "Bus Assigned"}
											</Text>
											<Text className="text-[10px] text-zinc-400">
												{trip.company?.name ?? "Commercial Carrier"} • Role: {role}
											</Text>
										</View>
									</View>
									<View className="flex-row items-center gap-1.5 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
										<Radio size={12} color="#10b981" />
										<Text className="text-[10px] font-bold text-emerald-400">
											{trip.status}
										</Text>
									</View>
								</View>

								{/* Route Timeline */}
								<View className="space-y-2 mb-4 bg-zinc-950/60 p-3.5 rounded-2xl border border-zinc-800/60">
									<View className="flex-row items-center gap-3">
										<View className="size-2.5 rounded-full bg-emerald-500" />
										<Text className="text-sm font-bold text-white flex-1" numberOfLines={1}>
											{originStop}
										</Text>
									</View>
									<View className="w-0.5 h-3 bg-zinc-800 ml-[4px]" />
									<View className="flex-row items-center gap-3">
										<View className="size-2.5 rounded-full bg-rose-500" />
										<Text className="text-sm font-bold text-white flex-1" numberOfLines={1}>
											{destStop}
										</Text>
									</View>
								</View>

								{/* Metadata Card: Departure Time & Passenger Capacity Progress */}
								<View className="flex-row items-center justify-between bg-zinc-950/40 p-3 rounded-xl border border-zinc-800/40 mb-4">
									<View className="flex-row items-center gap-1.5">
										<Clock size={14} color="#71717a" />
										<Text className="text-xs font-semibold text-zinc-300">
											Departs {depTime}
										</Text>
									</View>
									<View className="flex-row items-center gap-1.5">
										<Users size={14} color="#71717a" />
										<Text className="text-xs font-semibold text-zinc-300">
											{passengerCount} / {trip.totalSeats} Booked
										</Text>
									</View>
								</View>

								{/* Actions */}
								<View className="flex-row items-center gap-2.5">
									<TouchableOpacity
										onPress={() => router.push(`/trip/${trip.id}/manifest`)}
										className="flex-1 bg-zinc-800 active:bg-zinc-700 h-11 rounded-xl items-center justify-center border border-zinc-700"
									>
										<Text className="text-xs font-bold text-white">Passenger Manifest</Text>
									</TouchableOpacity>

									{trip.status !== "ARRIVED" && (
										<TouchableOpacity
											onPress={() => handleStartTrip(trip.id)}
											disabled={startTripMutation.isPending}
											className="flex-1 bg-rose-600 active:bg-rose-700 h-11 rounded-xl items-center justify-center flex-row gap-1.5 shadow-lg shadow-rose-600/25"
										>
											{startTripMutation.isPending ? (
												<ActivityIndicator size="small" color="#ffffff" />
											) : (
												<>
													<Play size={14} color="#ffffff" fill="#ffffff" />
													<Text className="text-xs font-bold text-white">
														{trip.status === "DEPARTED" ? "Resume Run" : "Start Run"}
													</Text>
												</>
											)}
										</TouchableOpacity>
									)}
								</View>
							</View>
						);
					})
				)}
			</ScrollView>
		</SafeAreaView>
	);
}
