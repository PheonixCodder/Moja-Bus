import { useState } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	TextInput,
	ActivityIndicator,
	Linking,
	Alert,
} from "react-native";
import { useLocalSearchParams } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Search,
	CheckCircle,
	Circle,
	Armchair,
	Phone,
	User,
	Ticket,
	AlertCircle,
	RotateCw,
} from "lucide-react-native";
import { useTRPC } from "@/lib/trpc";
import { DriverFeedback } from "@/lib/haptics";

export default function PassengerManifestScreen() {
	const { id } = useLocalSearchParams<{ id: string }>();
	const trpc = useTRPC();
	const queryClient = useQueryClient();

	const [search, setSearch] = useState("");

	// Real tRPC query for trip manifest
	const {
		data: manifestData,
		isLoading,
		isRefetching,
		refetch,
		error,
	} = useQuery(
		trpc.drivers.getMyTripManifest.queryOptions({
			tripId: id ?? "",
			search: search || undefined,
		})
	);

	// Real tRPC mutation for manual boarding check-in
	const manualCheckInMutation = useMutation(
		trpc.drivers.manualCheckInPassenger.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries();
			},
		})
	);

	const handleToggleManualBoarding = async (bookingId: string, currentBoarded: boolean) => {
		if (currentBoarded) {
			Alert.alert("Already Boarded", "This passenger has already been scanned and boarded.");
			return;
		}

		DriverFeedback.tap();
		try {
			await manualCheckInMutation.mutateAsync({
				tripId: id ?? "",
				bookingId,
			});
			DriverFeedback.successScan();
		} catch (err: any) {
			DriverFeedback.invalidScan();
			Alert.alert("Boarding Error", err.message || "Failed to mark passenger as boarded.");
		}
	};

	const handleCallPassenger = (phone?: string | null) => {
		if (!phone) return;
		DriverFeedback.tap();
		Linking.openURL(`tel:${phone}`).catch(() => {
			Alert.alert("Error", "Unable to open phone dialer.");
		});
	};

	const manifest = manifestData?.manifest ?? [];
	const totalBooked = manifestData?.totalBooked ?? 0;
	const boardedCount = manifestData?.boardedCount ?? 0;
	const percentBoarded = totalBooked > 0 ? Math.round((boardedCount / totalBooked) * 100) : 0;

	return (
		<View className="flex-1 bg-zinc-950">
			{/* Manifest Progress & Search Bar */}
			<View className="p-4 bg-zinc-900 border-b border-zinc-800 space-y-3.5 shadow-md">
				{/* Progress Counter & Bar */}
				<View className="space-y-1.5">
					<View className="flex-row items-center justify-between">
						<Text className="text-xs font-bold text-zinc-400">
							Boarding Progress
						</Text>
						<Text className="text-xs font-black text-rose-500 font-mono">
							{boardedCount} / {totalBooked} Boarded ({percentBoarded}%)
						</Text>
					</View>

					<View className="h-2 bg-zinc-950 rounded-full overflow-hidden border border-zinc-800">
						<View
							className="h-full bg-rose-600 rounded-full"
							style={{ width: `${percentBoarded}%` }}
						/>
					</View>
				</View>

				{/* Search Field */}
				<View className="flex-row items-center bg-zinc-950 border border-zinc-800 rounded-xl px-3.5 h-11">
					<Search size={16} color="#71717a" />
					<TextInput
						className="flex-1 ml-2.5 text-white text-xs"
						placeholder="Search by name, seat label, or booking ref..."
						placeholderTextColor="#52525b"
						value={search}
						onChangeText={setSearch}
					/>
					{isRefetching && <ActivityIndicator size="small" color="#e11d48" />}
				</View>
			</View>

			{/* Passenger List */}
			<ScrollView className="flex-1 p-4">
				{isLoading ? (
					<View className="py-20 items-center justify-center space-y-3">
						<ActivityIndicator size="large" color="#e11d48" />
						<Text className="text-xs text-zinc-400">Loading passenger manifest...</Text>
					</View>
				) : error ? (
					<View className="py-16 items-center justify-center px-6 text-center space-y-3 bg-zinc-900/40 rounded-3xl border border-zinc-800/80 my-4">
						<AlertCircle size={40} color="#f43f5e" />
						<Text className="text-base font-bold text-white text-center">
							Unable to Load Manifest
						</Text>
						<Text className="text-xs text-zinc-400 text-center leading-relaxed">
							{error.message || "Failed to retrieve passengers for this trip."}
						</Text>
						<TouchableOpacity
							onPress={() => refetch()}
							className="bg-zinc-800 px-5 py-2.5 rounded-xl border border-zinc-700 mt-2"
						>
							<Text className="text-xs font-bold text-white">Retry</Text>
						</TouchableOpacity>
					</View>
				) : manifest.length === 0 ? (
					<View className="py-20 items-center justify-center px-6 text-center space-y-3">
						<User size={44} color="#52525b" />
						<Text className="text-base font-bold text-white">No Passengers Found</Text>
						<Text className="text-xs text-zinc-400 max-w-xs">
							{search
								? "No passenger matches your search query."
								: "No bookings have been confirmed for this trip yet."}
						</Text>
					</View>
				) : (
					manifest.map((p) => {
						const isBoarded = !!p.boardedAt;

						return (
							<View
								key={p.bookingId}
								className="bg-zinc-900/70 border border-zinc-800/80 rounded-2xl p-3.5 mb-3 flex-row items-center justify-between"
							>
								{/* Left: Seat Number Badge & Passenger Details */}
								<View className="flex-row items-center gap-3.5 flex-1 mr-2">
									<View className="size-11 rounded-xl bg-zinc-950 border border-zinc-800 items-center justify-center">
										<Text className="text-xs font-mono font-black text-rose-500">
											{p.seatNumber}
										</Text>
									</View>

									<View className="flex-1">
										<Text className="text-sm font-bold text-white" numberOfLines={1}>
											{p.passengerName}
										</Text>
										<View className="flex-row items-center gap-2 mt-0.5">
											<Text className="text-[11px] text-zinc-400 font-mono">
												{p.bookingReference}
											</Text>
											{p.originTerminal && (
												<Text className="text-[10px] text-zinc-500 truncate" numberOfLines={1}>
													• {p.originTerminal}
												</Text>
											)}
										</View>
									</View>
								</View>

								{/* Right Actions: Phone Call & Boarding Checkbox */}
								<View className="flex-row items-center gap-2">
									{p.passengerPhone && (
										<TouchableOpacity
											onPress={() => handleCallPassenger(p.passengerPhone)}
											className="size-9 rounded-xl bg-zinc-800 items-center justify-center border border-zinc-700"
										>
											<Phone size={15} color="#38bdf8" />
										</TouchableOpacity>
									)}

									<TouchableOpacity
										onPress={() => handleToggleManualBoarding(p.bookingId, isBoarded)}
										disabled={manualCheckInMutation.isPending || isBoarded}
										className={`size-9 rounded-xl items-center justify-center border ${
											isBoarded
												? "bg-emerald-500/10 border-emerald-500/20"
												: "bg-zinc-950 border-zinc-800"
										}`}
									>
										{isBoarded ? (
											<CheckCircle size={20} color="#10b981" />
										) : (
											<Circle size={20} color="#71717a" />
										)}
									</TouchableOpacity>
								</View>
							</View>
						);
					})
				)}
			</ScrollView>
		</View>
	);
}
