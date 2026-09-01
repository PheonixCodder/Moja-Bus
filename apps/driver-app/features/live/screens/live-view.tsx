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
	Time02Icon,
	PlayIcon,
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
import { fetchRouteDirections, getCachedRouteDirections } from "@/lib/mapbox";
import { useTRPC } from "@/lib/trpc";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { colors } from "@/constants/theme";
import { SpeedometerGauge } from "../components/speedometer-gauge";
import { DelayModal } from "../components/delay-modal";
import { BreakdownModal } from "../components/breakdown-modal";
import type { DriverBreakdownType } from "@moja/schemas";

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
				t("tripCompleted"),
				t("tripCompletedMsg"),
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
					t("arrivalConfirmed"),
					t("arrivalConfirmedMsg", { terminal: res.terminalName }),
				);
			},
			onError: (err: any) => {
				DriverFeedback.invalidScan();
				Alert.alert(t("confirmError"), err?.message ?? t("confirmErrorMsg"));
			},
		})
	);

	const recordDepartureMutation = useMutation(
		trpc.drivers.recordStopDeparture.mutationOptions({
			onSuccess: (res) => {
				DriverFeedback.successScan();
				queryClient.invalidateQueries(trpc.drivers.getMyProfile.queryFilter());
				Alert.alert(
					t("departureConfirmed"),
					t("departureConfirmedMsg", { terminal: res.terminalName }),
				);
			},
			onError: (err: any) => {
				DriverFeedback.invalidScan();
				Alert.alert(t("confirmError"), err?.message ?? t("confirmErrorMsg"));
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
					t("delayReported"),
					t("delayReportedMsg"),
				);
			},
			onError: (err: any) => {
				DriverFeedback.invalidScan();
				Alert.alert(t("delayError"), err?.message ?? t("delayErrorMsg"));
			},
		})
	);

	const reliefAssignments = useMemo<
		Array<{
			role: string;
			driverProfileId: string;
			driverProfile: {
				id: string;
				user?: { fullName?: string | null };
				fullName?: string;
			};
		}>
	>(() => {
		const assignments =
			(activeTrip as any)?.driverAssignments ??
			(activeTrip as any)?.tripDriverAssignments ??
			[];
		return assignments.filter(
			(a: any) =>
				a.role === "RELIEF" &&
				a.driverProfileId !== profile?.id &&
				a.driverProfile
		);
	}, [activeTrip, profile?.id]);

	const handoverMutation = useMutation(
		trpc.drivers.handoverTripControl.mutationOptions({
			onSuccess: async () => {
				DriverFeedback.successScan();
				await stopBackgroundLocationTracking();
				setTelemetryAuthToken(null);
				queryClient.invalidateQueries();
				Alert.alert(t("handoverTitle"), t("handoverSuccess"));
				router.replace("/(tabs)/trips");
			},
			onError: (err: any) => {
				DriverFeedback.invalidScan();
				Alert.alert(t("confirmError"), err?.message ?? t("confirmErrorMsg"));
			},
		})
	);

	const handleHandoverControl = () => {
		DriverFeedback.tap();
		if (!activeTrip) return;
		if (reliefAssignments.length === 0) {
			Alert.alert(t("handoverTitle"), t("noReliefAssigned"));
			return;
		}

		if (reliefAssignments.length === 1) {
			const reliefDriver = reliefAssignments[0]?.driverProfile;
			if (!reliefDriver) return;
			const driverName =
				reliefDriver.user?.fullName ??
				reliefDriver.fullName ??
				"Conducteur Relais";
			Alert.alert(
				t("handoverTitle"),
				t("handoverConfirmMsg", { name: driverName }),
				[
					{ text: t("cancel") || "Annuler", style: "cancel" },
					{
						text: t("btnHandover"),
						style: "destructive",
						onPress: () => {
							handoverMutation.mutate({
								tripId: activeTrip.id,
								targetDriverProfileId: reliefDriver.id,
							});
						},
					},
				]
			);
		} else {
			const buttons = reliefAssignments.map((a) => {
				const name =
					a.driverProfile.user?.fullName ??
					a.driverProfile.fullName ??
					"Conducteur Relais";
				return {
					text: name,
					onPress: () => {
						handoverMutation.mutate({
							tripId: activeTrip.id,
							targetDriverProfileId: a.driverProfile.id,
						});
					},
				};
			});
			Alert.alert(
				t("handoverTitle"),
				t("handoverSubtitle"),
				[...buttons, { text: t("cancel") || "Annuler", style: "cancel" }]
			);
		}
	};

	const [restTargetResumeAt, setRestTargetResumeAt] = useState<Date | null>(null);
	const [restMinutesRemaining, setRestMinutesRemaining] = useState<number>(30);

	const isResting = profile?.status === "RESTING";

	const logRestBreakMutation = useMutation(
		trpc.drivers.logRestBreak.mutationOptions({
			onSuccess: (res) => {
				DriverFeedback.successScan();
				const resumeTime = new Date(res.targetResumeAt);
				setRestTargetResumeAt(resumeTime);
				queryClient.invalidateQueries(trpc.drivers.getMyProfile.queryFilter());
				Alert.alert(t("restBreakTitle"), t("restBreakSubtitle"));
			},
			onError: (err: any) => {
				DriverFeedback.invalidScan();
				Alert.alert(t("confirmError"), err?.message ?? t("confirmErrorMsg"));
			},
		})
	);

	const resumeDutyMutation = useMutation(
		trpc.drivers.resumeDuty.mutationOptions({
			onSuccess: () => {
				DriverFeedback.successScan();
				setRestTargetResumeAt(null);
				queryClient.invalidateQueries(trpc.drivers.getMyProfile.queryFilter());
				Alert.alert(t("btnResumeDuty"), t("dutyResumed"));
			},
			onError: (err: any) => {
				DriverFeedback.invalidScan();
				Alert.alert(t("confirmError"), err?.message ?? t("confirmErrorMsg"));
			},
		})
	);

	useEffect(() => {
		if (!isResting) {
			setRestTargetResumeAt(null);
			return;
		}
		if (!restTargetResumeAt) {
			setRestTargetResumeAt(new Date(Date.now() + 30 * 60_000));
		}
		const interval = setInterval(() => {
			if (restTargetResumeAt) {
				const diffMs = restTargetResumeAt.getTime() - Date.now();
				const mins = Math.max(0, Math.ceil(diffMs / 60_000));
				setRestMinutesRemaining(mins);
			}
		}, 1000);
		return () => clearInterval(interval);
	}, [isResting, restTargetResumeAt]);

	const handleTakeBreak = () => {
		DriverFeedback.tap();
		Alert.alert(
			t("breakConfirmTitle"),
			t("breakConfirmMsg"),
			[
				{ text: t("cancel") || "Annuler", style: "cancel" },
				{
					text: t("btnTakeBreak"),
					style: "default",
					onPress: () => {
						logRestBreakMutation.mutate({ durationMinutes: 30 });
					},
				},
			]
		);
	};

	const handleResumeDuty = () => {
		DriverFeedback.tap();
		resumeDutyMutation.mutate({});
	};

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

	const [breakdownModalOpen, setBreakdownModalOpen] = useState(false);
	const [breakdownType, setBreakdownType] = useState<DriverBreakdownType>("ENGINE");
	const [breakdownDesc, setBreakdownDesc] = useState("");
	const [breakdownDelayMinutes, setBreakdownDelayMinutes] = useState("60");
	const [isBreakdownReported, setIsBreakdownReported] = useState(false);

	const reportBreakdownMutation = useMutation(
		trpc.drivers.reportVehicleBreakdown.mutationOptions({
			onSuccess: () => {
				DriverFeedback.successScan();
				setIsBreakdownReported(true);
				setBreakdownModalOpen(false);
				queryClient.invalidateQueries(trpc.drivers.getMyProfile.queryFilter());
				Alert.alert(t("breakdownSuccessTitle"), t("breakdownSuccessMsg"));
			},
			onError: (err: any) => {
				DriverFeedback.invalidScan();
				Alert.alert(t("confirmError"), err?.message ?? t("confirmErrorMsg"));
			},
		})
	);

	const handleReportBreakdown = () => {
		DriverFeedback.tap();
		if (!activeTrip || !currentLocation) {
			Alert.alert(t("confirmError"), t("breakdownGpsWaiting"));
			return;
		}
		const mins = Number.parseInt(breakdownDelayMinutes, 10) || 60;
		reportBreakdownMutation.mutate({
			tripId: activeTrip.id,
			breakdownType,
			description: breakdownDesc.trim() || "Panne mécanique signalée par le conducteur",
			latitude: currentLocation.latitude,
			longitude: currentLocation.longitude,
			accuracyMeters: currentLocation.accuracy,
			delayMinutes: mins,
		});
	};

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
		const cacheKey = `trip_${activeTrip.id}`;

		// Phase 3C (DRV-P2-11) — Mount immediately with cached road geometry
		// so there is zero initial blank screen or delay in dead-zones.
		void getCachedRouteDirections(cacheKey, true).then((cached) => {
			if (!cancelled && cached) {
				setRouteGeoJson(cached.geoJson);
				setRouteIsApproximate(cached.isApproximate);
				setRouteDurationSecs(
					cached.isApproximate ? null : cached.durationSeconds,
				);
			}
		});

		fetchRouteDirections(stops, cacheKey).then((res) => {
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
			t("endTripTitle"),
			t("endTripMsg"),
			[
				{ text: t("endTripContinue"), style: "cancel" },
				{
					text: t("endTripConfirm"),
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
									t("endTripError"),
									err?.message ?? t("endTripErrorMsg"),
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
			Alert.alert(t("invalidDelay"), t("invalidDelayMsg"));
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
				<Text style={styles.loadingText}>{t("loading")}</Text>
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
					<Text style={styles.liveTitle}>{t("liveTelemetry")}</Text>
				</View>
				<Badge
					variant="default"
					label={activeTrip.bus?.registrationPlate ?? t("assignedBus")}
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
				{/* Emergency Breakdown Active Banner */}
				{isBreakdownReported && (
					<View style={styles.breakdownBanner}>
						<View style={styles.breakdownBannerLeft}>
							<View style={styles.breakdownIconWrap}>
								<HugeiconsIcon icon={Alert02Icon} size={22} color="#ef4444" />
							</View>
							<View style={styles.breakdownTextWrap}>
								<Text style={styles.breakdownBannerTitle}>{t("breakdownBannerTitle")}</Text>
								<Text style={styles.breakdownBannerDesc}>{t("breakdownBannerDesc")}</Text>
							</View>
						</View>
					</View>
				)}

				{/* Mandated Safety Rest Break Banner */}
				{isResting && (
					<View style={styles.restBanner}>
						<View style={styles.restBannerLeft}>
							<View style={styles.restIconWrap}>
								<HugeiconsIcon icon={Time02Icon} size={22} color="#38bdf8" />
							</View>
							<View style={styles.restBannerTextWrap}>
								<Text style={styles.restBannerTitle}>{t("restBreakBannerTitle")}</Text>
								<Text style={styles.restBannerCountdown}>
									{restMinutesRemaining > 0
										? t("restBreakRemaining", { minutes: restMinutesRemaining })
										: t("restBreakOver")}
								</Text>
							</View>
						</View>
						<Button
							title={t("btnResumeDuty")}
							variant="primary"
							size="sm"
							loading={resumeDutyMutation.isPending}
							onPress={handleResumeDuty}
							icon={<HugeiconsIcon icon={PlayIcon} size={16} color="#ffffff" />}
						/>
					</View>
				)}

				{/* Speedometer Instrument HUD */}
				<SpeedometerGauge
					currentLocation={currentLocation as any}
					isOverspeed={!isResting && isOverspeed}
					isActiveDriving={!isResting && isTripActive}
				/>

				{/* Waypoint Progression & Stop Checklist */}
				<Card className="p-4 gap-4">
					<View style={styles.stopsHeader}>
						<View style={styles.stopsTitleRow}>
							<HugeiconsIcon icon={Navigation01Icon} size={16} color={colors.primary.rose} />
							<Text style={styles.stopsTitle}>{t("stopProgress")}</Text>
						</View>
						{routeIsApproximate ? (
							<Text style={styles.approxBadge}>{t("approximateRoute")}</Text>
						) : (
							<Text style={styles.etaText}>
								{routeDurationSecs
									? t("etaLabel", { minutes: Math.max(1, Math.round(routeDurationSecs / 60)) })
									: t("etaNone")}
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
											? t("atTerminal")
											: t("stopLabel", { current: currentWaypointIndex + 1, total: tripStops.length })}
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
								{currentWaypoint.terminal?.name ?? t("stopDefaultName", { index: currentWaypointIndex + 1 })}
							</Text>
							<Text style={styles.waypointHint}>
								{isAtWaypoint
									? t("boardingHint")
									: t("nextStopHint")}
							</Text>

							{/* Action Button */}
							{isAtWaypoint ? (
								<Button
									title={t("confirmDeparture", { name: currentWaypoint.terminal?.name ?? t("stopDefaultName", { index: currentWaypointIndex + 1 }) })}
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
									title={t("reportArrival", { name: currentWaypoint.terminal?.name ?? t("stopDefaultName", { index: currentWaypointIndex + 1 }) })}
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
						<Text style={styles.stopsListTitle}>{t("stopSheetTitle")}</Text>
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
												{stop.terminal?.name ?? t("stopDefaultName", { index: idx + 1 })}
											</Text>
											<Text style={styles.stopTime}>
												{stop.actualDeparture
													? t("stopTimeDeparted", { time: new Date(stop.actualDeparture).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })
													: stop.actualArrival
														? t("stopTimeArrived", { time: new Date(stop.actualArrival).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })
														: stop.scheduledArrival
															? t("stopTimeScheduled", { time: new Date(stop.scheduledArrival).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }) })
															: t("stopTimePending")}
											</Text>
										</View>
									</View>

									<Badge
										variant={isPassed ? "success" : isCurrent && isArrived ? "warning" : isCurrent ? "brand" : "default"}
										label={isPassed ? t("stopStatusPassed") : isCurrent && isArrived ? t("stopStatusAtTerminal") : isCurrent ? t("stopStatusCurrent") : t("stopStatusUpcoming")}
										size="sm"
									/>
								</View>
							);
						})}
					</View>
				</Card>

				{/* In-Trip Operations / Handover / Break / Delay Actions */}
				<View style={styles.actionButtonsRow}>
					{!isResting ? (
						<Button
							title={t("btnTakeBreak")}
							variant="secondary"
							size="md"
							loading={logRestBreakMutation.isPending}
							onPress={handleTakeBreak}
							icon={<HugeiconsIcon icon={Time02Icon} size={18} color="#38bdf8" />}
							className="flex-1"
						/>
					) : (
						<Button
							title={t("btnResumeDuty")}
							variant="primary"
							size="md"
							loading={resumeDutyMutation.isPending}
							onPress={handleResumeDuty}
							icon={<HugeiconsIcon icon={PlayIcon} size={18} color="#ffffff" />}
							className="flex-1"
						/>
					)}

					<Button
						title={t("btnReportDelay")}
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
						title={t("btnReportBreakdown")}
						variant="destructive"
						size="md"
						onPress={() => {
							DriverFeedback.tap();
							setBreakdownModalOpen(true);
						}}
						icon={<HugeiconsIcon icon={Alert02Icon} size={18} color="#ffffff" />}
						className="flex-1"
					/>

					{reliefAssignments.length > 0 && (
						<Button
							title={t("btnHandover")}
							variant="outline"
							size="md"
							loading={handoverMutation.isPending}
							onPress={handleHandoverControl}
							icon={<HugeiconsIcon icon={Navigation01Icon} size={18} color="#38bdf8" />}
							className="flex-1"
						/>
					)}

					<Button
						title={t("btnEndTrip")}
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

			<BreakdownModal
				open={breakdownModalOpen}
				onClose={() => setBreakdownModalOpen(false)}
				breakdownType={breakdownType}
				onBreakdownTypeChange={setBreakdownType}
				description={breakdownDesc}
				onDescriptionChange={setBreakdownDesc}
				delayMinutes={breakdownDelayMinutes}
				onDelayMinutesChange={setBreakdownDelayMinutes}
				currentLocation={currentLocation}
				onSubmit={handleReportBreakdown}
				submitting={reportBreakdownMutation.isPending}
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
	restBanner: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: "rgba(56, 189, 248, 0.12)",
		borderWidth: 1,
		borderColor: "rgba(56, 189, 248, 0.3)",
		padding: 14,
		borderRadius: 16,
		gap: 12,
	},
	restBannerLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		flex: 1,
	},
	restIconWrap: {
		padding: 8,
		borderRadius: 12,
		backgroundColor: "rgba(56, 189, 248, 0.15)",
	},
	restBannerTextWrap: {
		flex: 1,
		gap: 2,
	},
	restBannerTitle: {
		fontSize: 13,
		fontWeight: "700",
		color: "#fafafa",
	},
	restBannerCountdown: {
		fontSize: 12,
		fontWeight: "600",
		color: "#38bdf8",
	},
	breakdownBanner: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		backgroundColor: "rgba(239, 68, 68, 0.12)",
		borderWidth: 1,
		borderColor: "rgba(239, 68, 68, 0.35)",
		padding: 14,
		borderRadius: 16,
		gap: 12,
	},
	breakdownBannerLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		flex: 1,
	},
	breakdownIconWrap: {
		padding: 8,
		borderRadius: 12,
		backgroundColor: "rgba(239, 68, 68, 0.2)",
	},
	breakdownTextWrap: {
		flex: 1,
		gap: 2,
	},
	breakdownBannerTitle: {
		fontSize: 13,
		fontWeight: "800",
		color: "#ef4444",
	},
	breakdownBannerDesc: {
		fontSize: 12,
		color: "#d4d4d8",
		lineHeight: 16,
	},
});
