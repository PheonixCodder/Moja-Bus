import { useQuery } from "@tanstack/react-query";
import { useLocalSearchParams, useRouter } from "expo-router";
import {
	ArrowLeft,
	Clock,
	MapPin,
	Navigation,
	Satellite,
	Signal,
	SignalLow,
} from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	AppState,
	Text,
	TouchableOpacity,
	View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { TravelerTrackingMap } from "@/features/tracking/components/traveler-tracking-map";
import { useTRPC } from "@/lib/trpc";

const POLL_INTERVAL_MS = 10_000;

/**
 * Phase 5 — Passenger live tracking v1.
 *
 * Polls `passenger.getTripTracking` at 10 s intervals. Shows a live Mapbox
 * map when position data is available (fresh or stale). Falls back to a
 * status-only screen when the driver position is dead or the trip has not
 * departed yet.
 */
export default function LiveBusTrackingScreen() {
	const { t } = useTranslation("booking");
	const router = useRouter();
	const { tripId } = useLocalSearchParams<{ tripId: string }>();
	const trpc = useTRPC();

	// ── Pause polling when app is backgrounded ──────────────────────────
	const appState = useRef(AppState.currentState);
	const [isActive, setIsActive] = useState(true);

	useEffect(() => {
		const sub = AppState.addEventListener("change", (next) => {
			setIsActive(appState.current === "active" && next === "active");
			appState.current = next;
		});
		return () => sub.remove();
	}, []);

	// ── Fetch tracking data ─────────────────────────────────────────────
	const { data, isLoading, error } = useQuery({
		...trpc.passenger.getTripTracking.queryOptions(
			{ tripId: tripId ?? "" },
			{ enabled: !!tripId },
		),
		refetchInterval: isActive ? POLL_INTERVAL_MS : false,
	});

	// ── Header ──────────────────────────────────────────────────────────
	const header = (
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
	);

	// ── Loading state ───────────────────────────────────────────────────
	if (isLoading) {
		return (
			<SafeAreaView className="flex-1 bg-zinc-950">
				{header}
				<View className="flex-1 items-center justify-center">
					<ActivityIndicator size="large" color="#e11d48" />
					<Text className="text-sm text-zinc-400 mt-3">
						{t("trackingLoading")}
					</Text>
				</View>
			</SafeAreaView>
		);
	}

	// ── Error / not found ───────────────────────────────────────────────
	if (error || !data) {
		return (
			<SafeAreaView className="flex-1 bg-zinc-950">
				{header}
				<View className="flex-1 items-center justify-center px-6">
					<View className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-8 items-center gap-3 w-full">
						<View className="p-3 rounded-2xl bg-destructive/10 border border-destructive/20">
							<Satellite size={40} color="#ef4444" />
						</View>
						<Text className="text-lg font-bold text-white text-center">
							{t("trackingUnavailable")}
						</Text>
						<Text className="text-xs text-zinc-400 text-center leading-relaxed">
							{t("trackingUnavailableBody")}
						</Text>
					</View>
				</View>
			</SafeAreaView>
		);
	}

	// ── Pre-departure: trip hasn't left yet ──────────────────────────────
	if (data.status === "SCHEDULED" || data.status === "BOARDING") {
		return (
			<SafeAreaView className="flex-1 bg-zinc-950">
				{header}
				<View className="flex-1 items-center justify-center px-6">
					<View className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-8 items-center gap-3 w-full">
						<View className="p-3 rounded-2xl bg-primary/10 border border-primary/20">
							<Clock size={40} color="#e11d48" />
						</View>
						<Text className="text-lg font-bold text-white text-center">
							{t("trackingNotDeparted")}
						</Text>
						<Text className="text-xs text-zinc-400 text-center leading-relaxed">
							{t("trackingNotDepartedBody")}
						</Text>

						{/* Route preview — show stops even before departure */}
						{data.stops.length > 0 && (
							<View className="w-full mt-2 gap-1.5">
								{data.stops.map((stop) => (
									<View
										key={stop.stopOrder}
										className="flex-row items-center gap-2 px-3 py-1.5 rounded-lg bg-zinc-950 border border-zinc-800"
									>
										<View
											className={`size-2 rounded-full ${
												stop.stopOrder === data.boardingStopOrder
													? "bg-emerald-500"
													: stop.stopOrder === data.dropoffStopOrder
														? "bg-primary"
														: "bg-zinc-600"
											}`}
										/>
										<Text className="text-[11px] text-zinc-300 flex-1">
											{stop.terminalName}
											{stop.city ? ` · ${stop.city}` : ""}
										</Text>
										{stop.stopOrder === data.boardingStopOrder && (
											<Text className="text-[9px] font-bold text-emerald-400 uppercase">
												Board
											</Text>
										)}
										{stop.stopOrder === data.dropoffStopOrder && (
											<Text className="text-[9px] font-bold text-primary uppercase">
												Drop
											</Text>
										)}
									</View>
								))}
							</View>
						)}
					</View>
				</View>
			</SafeAreaView>
		);
	}

	// ── Trip ended ──────────────────────────────────────────────────────
	if (data.status === "ARRIVED" || data.status === "CANCELLED") {
		return (
			<SafeAreaView className="flex-1 bg-zinc-950">
				{header}
				<View className="flex-1 items-center justify-center px-6">
					<View className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-8 items-center gap-3 w-full">
						<View className="p-3 rounded-2xl bg-zinc-800 border border-zinc-700">
							<Navigation size={40} color="#71717a" />
						</View>
						<Text className="text-lg font-bold text-white text-center">
							{data.status === "ARRIVED"
								? t("trackingArrived")
								: t("trackingCancelled")}
						</Text>
						<Text className="text-xs text-zinc-400 text-center leading-relaxed">
							{data.status === "ARRIVED"
								? t("trackingArrivedBody")
								: t("trackingCancelledBody")}
						</Text>
					</View>
				</View>
			</SafeAreaView>
		);
	}

	// ── Dead position: no fresh GPS but trip is in progress ──────────────
	if (data.freshness === "dead") {
		return (
			<SafeAreaView className="flex-1 bg-zinc-950">
				{header}
				<View className="flex-1 items-center justify-center px-6">
					<View className="bg-zinc-900/40 border border-zinc-800/60 rounded-3xl p-8 items-center gap-3 w-full">
						<View className="p-3 rounded-2xl bg-amber-500/10 border border-amber-500/20">
							<SignalLow size={40} color="#f59e0b" />
						</View>
						<Text className="text-lg font-bold text-white text-center">
							{t("trackingSignalLost")}
						</Text>
						<Text className="text-xs text-zinc-400 text-center leading-relaxed">
							{t("trackingSignalLostBody")}
						</Text>
					</View>
				</View>
			</SafeAreaView>
		);
	}

	// ── Live map ────────────────────────────────────────────────────────
	const busLocation = {
		latitude: data.lastLatitude ?? 0,
		longitude: data.lastLongitude ?? 0,
		heading: data.lastHeading ?? undefined,
		speedKmh: data.lastSpeedKmh ?? undefined,
	};

	const originStop = data.stops[0];
	const destStop = data.stops[data.stops.length - 1];

	return (
		<SafeAreaView className="flex-1 bg-zinc-950" edges={["top"]}>
			{header}

			{/* Map */}
			<View className="flex-1">
				<TravelerTrackingMap
					busLocation={busLocation}
					originTerminal={
						originStop?.latitude != null && originStop?.longitude != null
							? {
									id: String(originStop.stopOrder),
									name: originStop.terminalName,
									latitude: originStop.latitude,
									longitude: originStop.longitude,
								}
							: undefined
					}
					destinationTerminal={
						destStop?.latitude != null && destStop?.longitude != null
							? {
									id: String(destStop.stopOrder),
									name: destStop.terminalName,
									latitude: destStop.latitude,
									longitude: destStop.longitude,
									isDestination: true,
								}
							: undefined
					}
				/>
			</View>

			{/* Stale overlay */}
			{data.freshness === "stale" && (
				<View className="absolute top-16 left-4 right-4 bg-amber-500/90 rounded-xl px-4 py-2.5 flex-row items-center gap-2">
					<SignalLow size={14} color="#000" />
					<Text className="text-xs font-bold text-black flex-1">
						{t("trackingStale")}
					</Text>
				</View>
			)}

			{/* Bottom info bar */}
			<View className="bg-zinc-900 border-t border-zinc-800 px-5 py-3 flex-row items-center justify-between">
				<View className="flex-row items-center gap-2">
					<Signal
						size={12}
						color={
							data.freshness === "fresh"
								? "#22c55e"
								: data.freshness === "stale"
									? "#f59e0b"
									: "#ef4444"
						}
					/>
					<Text className="text-[10px] text-zinc-400">
						{data.lastPingAt
							? new Date(data.lastPingAt).toLocaleTimeString()
							: "—"}
					</Text>
				</View>

				{data.lastSpeedKmh != null && (
					<Text className="text-[10px] text-zinc-400">
						{Math.round(data.lastSpeedKmh)} km/h
					</Text>
				)}

				{data.distanceToDropoffKm != null && (
					<View className="flex-row items-center gap-1">
						<MapPin size={10} color="#a1a1aa" />
						<Text className="text-[10px] text-zinc-400">
							{data.distanceToDropoffKm} km
							<Text className="text-[8px] text-zinc-600"> approx</Text>
						</Text>
					</View>
				)}
			</View>
		</SafeAreaView>
	);
}
