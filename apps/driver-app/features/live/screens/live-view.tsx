import React, { useState, useEffect, useMemo, useRef } from "react";
import {
	View,
	Text,
	ScrollView,
	ActivityIndicator,
	Alert,
	StyleSheet,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	Navigation01Icon,
	Alert02Icon,
	StopIcon,
	Bus01Icon,
	CheckmarkCircle02Icon,
	ArrowRight01Icon,
} from "@hugeicons/core-free-icons";
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
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { colors } from "@/constants/theme";
import { SpeedometerGauge } from "../components/speedometer-gauge";
import { DelayModal } from "../components/delay-modal";

export function LiveView() {
	const { t } = useTranslation("live");
	const router = useRouter();
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const insets = useSafeAreaInsets();

	const {
		data: profile,
		isLoading: isProfileLoading,
	} = useQuery(trpc.drivers.getMyProfile.queryOptions(undefined));
	const activeTrip = profile?.currentTrip ?? null;

	const prevTripIdRef = useRef<string | null>(null);
	const completingRunRef = useRef(false);

	useEffect(() => {
		const prevId = prevTripIdRef.current;
		prevTripIdRef.current = activeTrip?.id ?? null;
		if (prevId && !activeTrip && !completingRunRef.current) {
			void stopBackgroundLocationTracking().catch(() => {});
			setTelemetryAuthToken(null);
			Alert.alert(
				"Course Terminée",
				"Le dispatch a clôturé cette course. Le suivi en direct a été arrêté.",
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

	const recordArrivalMutation = useMutation(
		trpc.drivers.recordStopArrival.mutationOptions({
			onSuccess: (res) => {
				DriverFeedback.successScan();
				queryClient.invalidateQueries(trpc.drivers.getMyProfile.queryFilter());
				Alert.alert(
					"Arrivée confirmée",
					`Arrivée confirmée à ${res.terminalName}. Suivi et heures estimées mis à jour.`,
				);
			},
			onError: (err: any) => {
				DriverFeedback.invalidScan();
				Alert.alert("Échec de confirmation", err?.message ?? "Veuillez réessayer.");
			},
		})
	);

	const recordDepartureMutation = useMutation(
		trpc.drivers.recordStopDeparture.mutationOptions({
			onSuccess: (res) => {
				DriverFeedback.successScan();
				queryClient.invalidateQueries(trpc.drivers.getMyProfile.queryFilter());
				Alert.alert(
					"Départ confirmé",
					`Départ confirmé de ${res.terminalName}. En route vers la prochaine étape.`,
				);
			},
			onError: (err: any) => {
				DriverFeedback.invalidScan();
				Alert.alert("Échec de confirmation", err?.message ?? "Veuillez réessayer.");
			},
		})
	);

	const reportDelayMutation = useMutation(
		trpc.drivers.reportTripDelay.mutationOptions({
			onSuccess: () => {
				DriverFeedback.successScan();
				setDelayModalOpen(false);
				setDelayNote("");
				Alert.alert(
					"Retard Signalé",
					"Les passagers de cette ligne ont été notifiés de l'estimation actualisée.",
				);
			},
			onError: (err: any) => {
				DriverFeedback.invalidScan();
				Alert.alert("Échec du signalement", err?.message ?? "Veuillez réessayer.");
			},
		})
	);

	const [currentLocation, setCurrentLocation] = useState<{
		latitude: number;
		longitude: number;
		heading: number;
		speedKmh: number;
		accuracy?: number;
		altitudeMeters?: number;
	} | null>(null);
	const [routeGeoJson, setRouteGeoJson] = useState<GeoJSON.FeatureCollection<GeoJSON.LineString> | null>(null);
	const [routeDurationSecs, setRouteDurationSecs] = useState<number | null>(null);
	const [routeIsApproximate, setRouteIsApproximate] = useState(false);
	const [delayModalOpen, setDelayModalOpen] = useState(false);
	const [delayMinutes, setDelayMinutes] = useState("15");
	const [delayReason, setDelayReason] = useState<string>("TRAFFIC");
	const [delayNote, setDelayNote] = useState("");

	const isTripActive = activeTrip?.status === "DEPARTED";

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
					accuracy: loc.coords.accuracy ?? undefined,
					altitudeMeters: loc.coords.altitude ?? undefined,
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
					name: tripStop.terminal?.name ?? `Arrêt ${index + 1}`,
					latitude,
					longitude,
					order: tripStop.stopOrder ?? index + 1,
					isTerminal: tripStop.terminal?.isTerminal ?? true,
				},
			];
		});
	}, [activeTrip]);

	const tripStops = useMemo(() => {
		return (activeTrip?.tripStops ?? [])
			.slice()
			.sort((a, b) => (a.stopOrder ?? 0) - (b.stopOrder ?? 0));
	}, [activeTrip]);

	const currentWaypointIndex = useMemo(() => {
		const idx = tripStops.findIndex((s) => !s.actualDeparture);
		return idx !== -1 ? idx : Math.max(0, tripStops.length - 1);
	}, [tripStops]);

	const currentWaypoint = tripStops[currentWaypointIndex] ?? null;
	const isAtWaypoint =
		currentWaypoint?.actualArrival != null &&
		currentWaypoint?.actualDeparture == null;

	const distanceToWaypointKm = useMemo(() => {
		if (!currentLocation || !currentWaypoint?.terminal) return null;
		const lat1 = currentLocation.latitude;
		const lon1 = currentLocation.longitude;
		const lat2 = currentWaypoint.terminal.latitude;
		const lon2 = currentWaypoint.terminal.longitude;
		if (typeof lat2 !== "number" || typeof lon2 !== "number") return null;

		const R = 6371;
		const dLat = ((lat2 - lat1) * Math.PI) / 180;
		const dLon = ((lon2 - lon1) * Math.PI) / 180;
		const a =
			Math.sin(dLat / 2) ** 2 +
			Math.cos((lat1 * Math.PI) / 180) *
				Math.cos((lat2 * Math.PI) / 180) *
				Math.sin(dLon / 2) ** 2;
		const d = R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
		return Math.round(d * 10) / 10;
	}, [currentLocation, currentWaypoint]);

	const isNearWaypoint =
		distanceToWaypointKm != null && distanceToWaypointKm <= 0.5;

	useEffect(() => {
		if (!activeTrip || stops.length < 2) return;
		let cancelled = false;
		fetchRouteDirections(stops, `trip_${activeTrip.id}`).then((res) => {
			if (!cancelled && res) {
				setRouteGeoJson(res.geoJson);
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

	const handleEndTrip = () => {
		DriverFeedback.warning();
		if (!activeTrip) return;
		Alert.alert(
			"Clôturer la Course",
			"Ceci termine définitivement la course : le trajet passe à ARRIVÉ pour tous les passagers. Continuer ?",
			[
				{ text: "Poursuivre la conduite", style: "cancel" },
				{
					text: "Terminer la Course",
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
									"Échec de la clôture",
									err?.message ?? "Vérifiez votre connexion. Le suivi reste actif.",
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
			Alert.alert("Retard Invalide", "Saisissez un retard compris entre 1 et 600 minutes.");
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
			<View style={styles.loadingContainer}>
				<ActivityIndicator size="large" color={colors.primary.rose} />
				<Text style={styles.loadingText}>Connexion au dispatch en direct...</Text>
			</View>
		);
	}

	if (!activeTrip) {
		return (
			<View style={[styles.root, { paddingTop: insets.top + 20 }]}>
				<View style={styles.emptyContainer}>
					<Card className="p-8 items-center gap-3 w-full">
						<HugeiconsIcon icon={Bus01Icon} size={44} color="#71717a" />
						<Text style={styles.emptyTitle}>{t("noActiveRunTitle")}</Text>
						<Text style={styles.emptySubtitle}>
							{t("noActiveRunDesc")}
						</Text>
						<Button
							title={t("btnGoToTrips")}
							variant="primary"
							size="md"
							onPress={() => router.replace("/(tabs)/trips")}
							className="mt-2"
						/>
					</Card>
				</View>
			</View>
		);
	}

	return (
		<View style={styles.root}>
			{/* Top Live Bar */}
			<View style={[styles.topLiveBar, { paddingTop: insets.top + 10 }]}>
				<View style={styles.liveIndicator}>
					<View style={styles.liveDot} />
					<Text style={styles.liveTitle}>Télémétrie GPS Active</Text>
				</View>
				<Badge
					variant="default"
					label={activeTrip.bus?.registrationPlate ?? "Bus Assigné"}
				/>
			</View>

			{/* Mapbox Live Vector Map Navigation Canvas */}
			<View style={styles.mapCanvas}>
				<DriverNavigationMap
					currentLocation={currentLocation ?? undefined}
					routeGeoJson={routeGeoJson}
					stops={stops}
					isNavigating={isTripActive}
				/>
			</View>

			<ScrollView
				style={styles.scroll}
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingBottom: Math.max(insets.bottom, 24) + 80 },
				]}
				showsVerticalScrollIndicator={false}
			>
				{/* Speedometer Instrument HUD */}
				<SpeedometerGauge
					currentLocation={currentLocation as any}
					isOverspeed={isOverspeed}
				/>

				{/* Waypoint Progression & Stop Checklist */}
				<Card className="p-4 gap-4">
					<View style={styles.stopsHeader}>
						<View style={styles.stopsTitleRow}>
							<HugeiconsIcon icon={Navigation01Icon} size={16} color={colors.primary.rose} />
							<Text style={styles.stopsTitle}>Progression des Arrêts</Text>
						</View>
						{routeIsApproximate ? (
							<Text style={styles.approxBadge}>{t("approximateRoute")}</Text>
						) : (
							<Text style={styles.etaText}>
								{routeDurationSecs
									? `ETA: ${Math.max(1, Math.round(routeDurationSecs / 60))} min`
									: "ETA: —"}
							</Text>
						)}
					</View>

					{/* Active Stop Action Card */}
					{currentWaypoint && (
						<View
							style={[
								styles.waypointBox,
								isAtWaypoint
									? styles.waypointAt
									: isNearWaypoint
										? styles.waypointNear
										: styles.waypointDefault,
							]}
						>
							<View style={styles.waypointHeader}>
								<View style={styles.waypointStatusRow}>
									<View
										style={[
											styles.waypointDot,
											{
												backgroundColor: isAtWaypoint
													? "#fbbf24"
													: isNearWaypoint
														? "#34d399"
														: "#ee237c",
											},
										]}
									/>
									<Text style={styles.waypointLabel}>
										{isAtWaypoint
											? "En Gare / Embarquement"
											: `Arrêt ${currentWaypointIndex + 1} sur ${tripStops.length}`}
									</Text>
								</View>
								{distanceToWaypointKm != null && !isAtWaypoint && (
									<Badge
										variant="outline"
										label={
											distanceToWaypointKm < 1
												? `${Math.round(distanceToWaypointKm * 1000)} m`
												: `${distanceToWaypointKm} km`
										}
									/>
								)}
							</View>

							<Text style={styles.waypointTerminalName}>
								{currentWaypoint.terminal?.name ?? `Arrêt #${currentWaypointIndex + 1}`}
							</Text>
							<Text style={styles.waypointHint}>
								{isAtWaypoint
									? "Embarquement passagers en cours. Appuyez sur départ lorsque vous quittez la gare."
									: "Prochain point de passage sur l'itinéraire."}
							</Text>

							{/* Action Button */}
							{isAtWaypoint ? (
								<Button
									title={`Confirmer le départ de ${currentWaypoint.terminal?.name ?? "l'arrêt"}`}
									variant="warning"
									size="md"
									loading={recordDepartureMutation.isPending}
									onPress={() => {
										DriverFeedback.tap();
										recordDepartureMutation.mutate({
											tripId: activeTrip.id,
											tripStopId: currentWaypoint.id,
										});
									}}
									icon={<HugeiconsIcon icon={ArrowRight01Icon} size={16} color="#000000" />}
									textClassName="text-black"
								/>
							) : !currentWaypoint.actualArrival ? (
								<Button
									title={`Signaler arrivée à ${currentWaypoint.terminal?.name ?? "l'arrêt"}`}
									variant={isNearWaypoint ? "success" : "primary"}
									size="md"
									loading={recordArrivalMutation.isPending}
									onPress={() => {
										DriverFeedback.tap();
										recordArrivalMutation.mutate({
											tripId: activeTrip.id,
											tripStopId: currentWaypoint.id,
										});
									}}
									icon={<HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color="#ffffff" />}
								/>
							) : null}
						</View>
					)}

					{/* Waypoints Sequence List */}
					<View style={styles.stopsList}>
						<Text style={styles.stopsListTitle}>Feuille de Route des Arrêts</Text>
						{tripStops.map((stop, idx) => {
							const isPassed = stop.actualDeparture != null;
							const isCurrent = stop.id === currentWaypoint?.id;
							const isArrived = stop.actualArrival != null;

							return (
								<View
									key={stop.id}
									style={[
										styles.stopRow,
										isCurrent ? styles.stopRowCurrent : styles.stopRowDefault,
									]}
								>
									<View style={styles.stopInfo}>
										<View
											style={[
												styles.stopBadge,
												isPassed
													? styles.stopBadgePassed
													: isCurrent && isArrived
														? styles.stopBadgeArrived
														: styles.stopBadgePending,
											]}
										>
											{isPassed ? (
												<HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} color="#10b981" />
											) : (
												<Text style={styles.stopBadgeText}>{idx + 1}</Text>
											)}
										</View>
										<View style={styles.stopTextWrap}>
											<Text
												style={[
													styles.stopName,
													isPassed ? styles.stopNamePassed : isCurrent ? styles.stopNameCurrent : styles.stopNameDefault,
												]}
											>
												{stop.terminal?.name ?? `Arrêt ${idx + 1}`}
											</Text>
											<Text style={styles.stopTime}>
												{stop.actualDeparture
													? `Parti à ${new Date(stop.actualDeparture).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
													: stop.actualArrival
														? `Arrivé à ${new Date(stop.actualArrival).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
														: stop.scheduledArrival
															? `Prévu : ${new Date(stop.scheduledArrival).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
															: "En attente"}
											</Text>
										</View>
									</View>

									<Badge
										variant={isPassed ? "success" : isCurrent && isArrived ? "warning" : isCurrent ? "brand" : "default"}
										label={isPassed ? "Passé" : isCurrent && isArrived ? "En Gare" : isCurrent ? "Actuel" : "À venir"}
										size="sm"
									/>
								</View>
							);
						})}
					</View>
				</Card>

				{/* In-Trip Emergency / Delay Actions */}
				<View style={styles.actionButtonsRow}>
					<Button
						title="Signaler un retard"
						variant="secondary"
						size="md"
						onPress={() => {
							DriverFeedback.tap();
							setDelayModalOpen(true);
						}}
						icon={<HugeiconsIcon icon={Alert02Icon} size={18} color="#f59e0b" />}
						className="flex-1"
					/>

					<Button
						title="Clôturer la Course"
						variant="destructive"
						size="md"
						loading={completeMutation.isPending}
						onPress={handleEndTrip}
						icon={<HugeiconsIcon icon={StopIcon} size={18} color="#ffffff" />}
						className="flex-1"
					/>
				</View>
			</ScrollView>

			<DelayModal
				open={delayModalOpen}
				onClose={() => setDelayModalOpen(false)}
				delayMinutes={delayMinutes}
				onDelayMinutesChange={setDelayMinutes}
				delayReason={delayReason}
				onDelayReasonChange={setDelayReason}
				delayNote={delayNote}
				onDelayNoteChange={setDelayNote}
				onSubmit={handleReportDelay}
				submitting={reportDelayMutation.isPending}
			/>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: "#09090b",
	},
	loadingContainer: {
		flex: 1,
		backgroundColor: "#09090b",
		alignItems: "center",
		justifyContent: "center",
		gap: 12,
	},
	loadingText: {
		fontSize: 12,
		color: "#a1a1aa",
		fontWeight: "500",
	},
	emptyContainer: {
		flex: 1,
		alignItems: "center",
		justifyContent: "center",
		paddingHorizontal: 24,
	},
	emptyTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#fafafa",
		textAlign: "center",
	},
	emptySubtitle: {
		fontSize: 12,
		color: "#a1a1aa",
		textAlign: "center",
		lineHeight: 18,
		maxWidth: 280,
	},
	topLiveBar: {
		paddingHorizontal: 20,
		paddingBottom: 12,
		borderBottomWidth: 1,
		borderBottomColor: "#27272a",
		backgroundColor: "#09090b",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	liveIndicator: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	liveDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
		backgroundColor: "#10b981",
	},
	liveTitle: {
		fontSize: 12,
		fontWeight: "800",
		color: "#fafafa",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	mapCanvas: {
		height: 250,
		borderBottomWidth: 1,
		borderBottomColor: "#27272a",
		position: "relative",
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 16,
		paddingTop: 16,
		gap: 16,
	},
	stopsHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	stopsTitleRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 6,
	},
	stopsTitle: {
		fontSize: 11,
		fontWeight: "700",
		color: "#d4d4d8",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	approxBadge: {
		fontSize: 10,
		fontWeight: "700",
		color: "#fbbf24",
	},
	etaText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#ee237c",
		fontFamily: "monospace",
	},
	waypointBox: {
		padding: 16,
		borderRadius: 16,
		borderWidth: 1,
		gap: 10,
	},
	waypointAt: {
		backgroundColor: "rgba(245, 158, 11, 0.08)",
		borderColor: "rgba(245, 158, 11, 0.3)",
	},
	waypointNear: {
		backgroundColor: "rgba(16, 185, 129, 0.08)",
		borderColor: "rgba(16, 185, 129, 0.3)",
	},
	waypointDefault: {
		backgroundColor: "#09090b",
		borderColor: "#27272a",
	},
	waypointHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	waypointStatusRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	waypointDot: {
		width: 10,
		height: 10,
		borderRadius: 5,
	},
	waypointLabel: {
		fontSize: 10,
		fontWeight: "700",
		textTransform: "uppercase",
		letterSpacing: 0.5,
		color: "#a1a1aa",
	},
	waypointTerminalName: {
		fontSize: 16,
		fontWeight: "800",
		color: "#fafafa",
	},
	waypointHint: {
		fontSize: 12,
		color: "#a1a1aa",
		lineHeight: 16,
	},
	stopsList: {
		gap: 8,
		paddingTop: 8,
		borderTopWidth: 1,
		borderTopColor: "#27272a",
	},
	stopsListTitle: {
		fontSize: 10,
		fontWeight: "700",
		color: "#71717a",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	stopRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		padding: 12,
		borderRadius: 12,
		borderWidth: 1,
	},
	stopRowCurrent: {
		backgroundColor: "#18181b",
		borderColor: "#3f3f46",
	},
	stopRowDefault: {
		backgroundColor: "#09090b",
		borderColor: "#27272a",
	},
	stopInfo: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
		flex: 1,
	},
	stopBadge: {
		width: 24,
		height: 24,
		borderRadius: 12,
		alignItems: "center",
		justifyContent: "center",
	},
	stopBadgePassed: {
		backgroundColor: "rgba(16, 185, 129, 0.2)",
	},
	stopBadgeArrived: {
		backgroundColor: "rgba(245, 158, 11, 0.2)",
	},
	stopBadgePending: {
		backgroundColor: "#27272a",
	},
	stopBadgeText: {
		fontSize: 10,
		fontWeight: "800",
		color: "#a1a1aa",
	},
	stopTextWrap: {
		flex: 1,
		gap: 2,
	},
	stopName: {
		fontSize: 13,
		fontWeight: "700",
	},
	stopNamePassed: {
		color: "#71717a",
		textDecorationLine: "line-through",
	},
	stopNameCurrent: {
		color: "#ffffff",
	},
	stopNameDefault: {
		color: "#d4d4d8",
	},
	stopTime: {
		fontSize: 10,
		color: "#71717a",
	},
	actionButtonsRow: {
		flexDirection: "row",
		gap: 12,
		paddingBottom: 24,
	},
});
