import { useState, useEffect, useMemo, useRef } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Modal,
	TextInput,
	ScrollView,
	ActivityIndicator,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
	Radio,
	MapPin,
	AlertTriangle,
	StopCircle,
	ShieldAlert,
	Bus,
} from "lucide-react-native";
import { DriverFeedback } from "@/lib/haptics";
import { useTranslation } from "react-i18next";
import {
	setTelemetryAuthToken,
	stopBackgroundLocationTracking,
	HIGHWAY_SPEED_LIMIT_KMH,
} from "@/lib/telemetry";
import { DriverNavigationMap } from "@/features/map/components/driver-navigation-map";
import type { NavigationStop } from "@/features/map/components/driver-navigation-map";
import { fetchRouteDirections } from "@/lib/mapbox";
import { useTRPC } from "@/lib/trpc";

export default function DriverLiveTripScreen() {
	const { t } = useTranslation("live");
	const trpc = useTRPC();
	const router = useRouter();
	const queryClient = useQueryClient();

	// P0-2 — server truth for the active run (getMyProfile.currentTrip
	// survives app restarts, unlike any local hand-off).
	const {
		data: profile,
		isLoading: isProfileLoading,
	} = useQuery(trpc.drivers.getMyProfile.queryOptions(undefined));
	const activeTrip = profile?.currentTrip ?? null;

	// Phase 06 (F-DV-04) — if dispatch closes or cancels the run server-side
	// (operator ARRIVED, trip cancellation, suspension), the background GPS
	// task would otherwise keep streaming pings against a dead trip until app
	// restart. Watch for the run vanishing and stop tracking immediately.
	const prevTripIdRef = useRef<string | null>(null);
	const completingRunRef = useRef(false);

	useEffect(() => {
		const prevId = prevTripIdRef.current;
		prevTripIdRef.current = activeTrip?.id ?? null;
		if (prevId && !activeTrip && !completingRunRef.current) {
			void stopBackgroundLocationTracking().catch(() => {});
			setTelemetryAuthToken(null);
			Alert.alert(
				"Run Closed",
				"Dispatch ended this run. Live tracking has been stopped.",
			);
		}
	}, [activeTrip]);

	const completeMutation = useMutation(
		trpc.drivers.completeTrip.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries();
			},
		})
	);

	// P3-12 — the delay report actually reaches the backend now.
	const reportDelayMutation = useMutation(
		trpc.drivers.reportTripDelay.mutationOptions({
			onSuccess: () => {
				DriverFeedback.successScan();
				setDelayModalOpen(false);
				setDelayNote("");
				Alert.alert(
					"Delay Broadcast",
					"Passengers on this run have been notified of the reported delay.",
				);
			},
			onError: (err: any) => {
				DriverFeedback.invalidScan();
				Alert.alert("Could Not Report Delay", err?.message ?? "Try again.");
			},
		})
	);

	const [currentLocation, setCurrentLocation] = useState<{
		latitude: number;
		longitude: number;
		heading: number;
		speedKmh: number;
	} | null>(null);
	const [routeGeoJson, setRouteGeoJson] = useState<GeoJSON.FeatureCollection<GeoJSON.LineString> | null>(null);
	// Phase 12 — real whole-route ETA from the Directions response we already
	// fetch; never fabricated, shown as "—" until it exists.
	const [routeDurationSecs, setRouteDurationSecs] = useState<number | null>(null);
	// Phase 30 (F-TM-17) — true when the polyline is a straight-line fallback.
	const [routeIsApproximate, setRouteIsApproximate] = useState(false);
	const [delayModalOpen, setDelayModalOpen] = useState(false);
	const [delayMinutes, setDelayMinutes] = useState("15");
	const [delayReason, setDelayReason] = useState<string>("TRAFFIC");
	const [delayNote, setDelayNote] = useState("");

	// P3-12 — reasons mirror driverReportDelaySchema on the server.
	const DELAY_REASONS: Array<{ value: string; label: string }> = [
		{ value: "TRAFFIC", label: "Traffic" },
		{ value: "BREAKDOWN", label: "Breakdown" },
		{ value: "WEATHER", label: "Weather" },
		{ value: "POLICE_CHECKPOINT", label: "Checkpoint" },
		{ value: "ACCIDENT", label: "Accident" },
		{ value: "OTHER", label: "Other" },
	];

	const isTripActive = activeTrip?.status === "DEPARTED";

	// Phase 12 (F-TM-11) — the HUD shows what the sensors say. Foreground
	// watcher feeds the same state the old random-walk simulator drove; the
	// background task keeps streaming independently.
	useEffect(() => {
		if (!isTripActive) return;
		let cancelled = false;
		let subscription: Location.LocationSubscription | null = null;
		Location.watchPositionAsync(
			{ accuracy: Location.Accuracy.High, timeInterval: 5000, distanceInterval: 10 },
			(loc) => {
				if (cancelled) return;
				setCurrentLocation({
					latitude: loc.coords.latitude,
					longitude: loc.coords.longitude,
					heading: loc.coords.heading ?? 0,
					speedKmh: Math.max(0, (loc.coords.speed || 0) * 3.6),
				});
			},
		)
			.then((sub) => {
				if (cancelled) sub.remove();
				else subscription = sub;
			})
			.catch((err: any) =>
				console.warn("[LiveHUD] watchPositionAsync failed:", err?.message),
			);
		return () => {
			cancelled = true;
			subscription?.remove();
		};
	}, [isTripActive]);

	// Real stop corridor from the assigned trip.
	const stops: NavigationStop[] = useMemo(() => {
		return (activeTrip?.tripStops ?? []).flatMap((tripStop, index) => {
			const latitude = tripStop.terminal?.latitude;
			const longitude = tripStop.terminal?.longitude;
			if (typeof latitude !== "number" || typeof longitude !== "number") {
				return [];
			}
			return [
				{
					id: tripStop.id,
					name: tripStop.terminal?.name ?? `Stop ${index + 1}`,
					latitude,
					longitude,
					order: tripStop.stopOrder ?? index + 1,
					isTerminal: tripStop.terminal?.isTerminal ?? true,
				},
			];
		});
	}, [activeTrip]);

	useEffect(() => {
		if (!activeTrip || stops.length < 2) return;
		let cancelled = false;
		fetchRouteDirections(stops, `trip_${activeTrip.id}`).then((res) => {
			if (!cancelled && res) {
				setRouteGeoJson(res.geoJson);
				// Phase 30 (F-TM-17) — approximate corridor = no honest ETA.
				setRouteIsApproximate(res.isApproximate);
				setRouteDurationSecs(
					res.isApproximate ? null : res.durationSeconds,
				);
			}
		});
		return () => {
			cancelled = true;
		};
	}, [activeTrip, stops]);

	// P0-2 — Complete Run hits drivers.completeTrip; tracking stops only after
	// backend success so a failed completion never orphans an active run.
	const handleEndTrip = () => {
		DriverFeedback.warning();
		if (!activeTrip) return;
		Alert.alert(
			"Complete Run",
			"This ends the run permanently: the trip is marked ARRIVED for all passengers and review requests go out. Continue?",
			[
				{ text: "Keep Driving", style: "cancel" },
				{
					text: "Complete Run",
					style: "destructive",
					onPress: () => {
						completingRunRef.current = true;
						completeMutation
							.mutateAsync({ tripId: activeTrip.id })
							.then(async () => {
								await stopBackgroundLocationTracking();
								setTelemetryAuthToken(null);
								router.replace("/(tabs)/trips");
							})
							.catch((err: any) => {
								console.warn("[EndTrip] Complete failed:", err.message);
								Alert.alert(
									"Could Not Complete Run",
									err?.message ??
										"Check your connection and try again. Tracking is still active.",
								);
							});
					},
				},
			],
		);
	};

	const handleReportDelay = () => {
		DriverFeedback.tap();
		if (!activeTrip) return;
		const minutes = Number.parseInt(delayMinutes, 10);
		if (!Number.isFinite(minutes) || minutes < 1 || minutes > 600) {
			Alert.alert("Invalid Delay", "Enter a delay between 1 and 600 minutes.");
			return;
		}
		reportDelayMutation.mutate({
			tripId: activeTrip.id,
			reason: delayReason as any,
			delayMinutes: minutes,
			...(delayNote.trim() ? { note: delayNote.trim() } : {}),
		});
	};

	const isOverspeed = (currentLocation?.speedKmh ?? 0) > HIGHWAY_SPEED_LIMIT_KMH;

	if (isProfileLoading) {
		return (
			<SafeAreaView className="flex-1 bg-zinc-950 items-center justify-center">
				<ActivityIndicator size="large" color="#e11d48" />
				<Text className="text-xs text-zinc-400 font-medium mt-3">
					Connecting to active dispatch...
				</Text>
			</SafeAreaView>
		);
	}

	if (!activeTrip) {
		return (
			<SafeAreaView className="flex-1 bg-zinc-950">
				<View className="flex-1 items-center justify-center px-6">
					<View className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-8 items-center gap-3 w-full">
						<Bus size={44} color="#71717a" />
						<Text className="text-base font-bold text-white text-center">
							No Active Run
						</Text>
						<Text className="text-xs text-zinc-400 text-center leading-relaxed">
							Start a dispatch from your trips list to open the live navigation HUD.
						</Text>
						<TouchableOpacity
							onPress={() => router.replace("/(tabs)/trips")}
							className="bg-rose-600 px-6 py-3 rounded-xl mt-2"
						>
							<Text className="text-xs font-bold text-white">Back to Dispatches</Text>
						</TouchableOpacity>
					</View>
				</View>
			</SafeAreaView>
		);
	}

	const nextStop =
		stops.find((stop, index) => index > 0 && !stop.isTerminal) ??
		stops[stops.length - 1] ??
		null;

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
						{activeTrip.bus?.registrationPlate ?? "Bus Unassigned"}
					</Text>
				</View>
			</View>

			{/* Mapbox Live Vector Map Navigation Canvas */}
			<View className="h-64 border-b border-zinc-800 relative">
				<DriverNavigationMap
					currentLocation={currentLocation ?? undefined}
					routeGeoJson={routeGeoJson}
					stops={stops}
					isNavigating={isTripActive}
				/>
			</View>

			<ScrollView className="flex-1 px-5 py-4 space-y-4">
				{/* Speedometer Instrument HUD */}
				<View
					className={`bg-zinc-900 border rounded-3xl p-5 items-center justify-center relative overflow-hidden shadow-2xl ${
						isOverspeed ? "border-rose-500/80" : "border-zinc-800"
					}`}
				>
					<View className="absolute inset-0 bg-[radial-gradient(#e11d48_1px,transparent_1px)] [background-size:16px_16px] opacity-10" />

					<View className="flex-row items-center justify-between w-full mb-1 px-2">
						<Text className="text-[10px] uppercase font-extrabold text-zinc-500 tracking-widest">
							Vehicle Speed
						</Text>
						{isOverspeed && (
							<View className="flex-row items-center gap-1 bg-rose-500/15 px-2 py-0.5 rounded-md border border-rose-500/30">
								<ShieldAlert size={12} color="#f43f5e" />
								<Text className="text-[10px] font-bold text-rose-400">
									Limit 110 km/h
								</Text>
							</View>
						)}
					</View>

					<View className="flex-row items-baseline">
						<Text
							className={`text-5xl font-black font-mono tracking-tighter ${
								isOverspeed ? "text-rose-500" : "text-white"
							}`}
						>
							{currentLocation ? Math.round(currentLocation.speedKmh) : "—"}
						</Text>
						<Text className="text-xs font-bold text-rose-500 ml-2">km/h</Text>
					</View>

					<View className="flex-row items-center gap-6 mt-3 pt-3 border-t border-zinc-800/80 w-full justify-around">
						<View className="items-center">
							<Text className="text-[10px] uppercase text-zinc-500 font-bold">
								Heading
							</Text>
							<Text className="text-xs font-bold text-cyan-400 font-mono">
								{currentLocation
									? `${Math.round(currentLocation.heading)}°`
									: "—"}
							</Text>
						</View>
						<View className="w-[1px] h-5 bg-zinc-800" />
						<View className="items-center">
							<Text className="text-[10px] uppercase text-zinc-500 font-bold">
								Update Rate
							</Text>
							<Text className="text-xs font-bold text-emerald-400 font-mono">
								Fixed 5 s
							</Text>
						</View>
					</View>
				</View>

				{/* Route Progress Card — Phase 12: honest whole-route ETA */}
				<View className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-3">
					<View className="flex-row items-center justify-between">
						<Text className="text-xs font-bold text-zinc-400 uppercase">
							Route Progress
						</Text>
						{routeIsApproximate ? (
							// Phase 30 (F-TM-17) — the corridor is terminal-to-terminal
							// straight line, not a road path; say so instead of an ETA.
							<Text className="text-[10px] font-bold text-amber-400">
								{t("approximateRoute")}
							</Text>
						) : (
							<Text className="text-xs font-bold text-rose-400 font-mono">
								{routeDurationSecs
									? `Trip ETA: ${Math.max(1, Math.round(routeDurationSecs / 60))} mins`
									: "Trip ETA: —"}
							</Text>
						)}
					</View>

					<View className="flex-row items-center gap-3">
						<View className="p-2 rounded-xl bg-primary/10 border border-primary/20">
							<MapPin size={18} color="#e11d48" />
						</View>
						<View className="flex-1">
							<Text className="text-sm font-bold text-white">
								{nextStop?.name ?? "En route"}
							</Text>
							<Text className="text-xs text-zinc-400">
								Passenger exchange at next scheduled stop
							</Text>
						</View>
					</View>
				</View>

				{/* In-Trip Emergency / Delay Actions */}
				<View className="flex-row gap-3 pb-6">
					<TouchableOpacity
						onPress={() => {
							DriverFeedback.tap();
							setDelayModalOpen(true);
						}}
						className="flex-1 bg-amber-500/10 border border-amber-500/20 rounded-xl p-3.5 items-center gap-1"
					>
						<AlertTriangle size={18} color="#f59e0b" />
						<Text className="text-xs font-bold text-amber-400">
							Report Traffic Delay
						</Text>
					</TouchableOpacity>

					<TouchableOpacity
						onPress={handleEndTrip}
						disabled={completeMutation.isPending}
						className="flex-1 bg-rose-600/10 border border-rose-500/20 rounded-xl p-3.5 items-center gap-1"
					>
						{completeMutation.isPending ? (
							<ActivityIndicator size="small" color="#e11d48" />
						) : (
							<StopCircle size={18} color="#e11d48" />
						)}
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
								Reason
							</Text>
							<View className="flex-row flex-wrap gap-2">
								{DELAY_REASONS.map((option) => (
									<TouchableOpacity
										key={option.value}
										onPress={() => {
											DriverFeedback.tap();
											setDelayReason(option.value);
										}}
										className={`px-3 py-2 rounded-xl border ${
											delayReason === option.value
												? "bg-amber-500/20 border-amber-500/60"
												: "bg-zinc-950 border-zinc-800"
										}`}
									>
										<Text
											className={`text-[11px] font-bold ${
												delayReason === option.value ? "text-amber-300" : "text-zinc-400"
											}`}
										>
											{option.label}
										</Text>
									</TouchableOpacity>
								))}
							</View>
						</View>

						<View className="space-y-1.5">
							<Text className="text-xs font-semibold text-zinc-300">
								Details for dispatch (optional)
							</Text>
							<TextInput
								className="bg-zinc-950 border border-zinc-800 rounded-xl px-4 h-12 text-white"
								placeholder="e.g. Highway congestion near Toumodi"
								placeholderTextColor="#52525b"
								value={delayNote}
								onChangeText={setDelayNote}
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
								disabled={reportDelayMutation.isPending}
								className="flex-1 bg-amber-500 h-12 rounded-xl items-center justify-center"
							>
								{reportDelayMutation.isPending ? (
									<ActivityIndicator size="small" color="#000000" />
								) : (
									<Text className="text-sm font-bold text-black">
										Broadcast Delay
									</Text>
								)}
							</TouchableOpacity>
						</View>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}
