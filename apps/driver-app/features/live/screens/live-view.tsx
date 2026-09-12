import React, { useState, useEffect, useMemo, useRef } from "react";
import {
	View,
	Text,
	ScrollView,
	ActivityIndicator,
	Alert,
} from "react-native";
import { cn } from "@/lib/utils";
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
			<View className="flex-1 bg-background items-center justify-center gap-3">
				<ActivityIndicator size="large" color={colors.primary.rose} />
				<Text className="text-xs text-muted-foreground font-medium">{t("loading")}</Text>
			</View>
		);
	}

	if (!activeTrip) {
		return (
			<View className="flex-1 bg-background" style={{ paddingTop: insets.top + 20 }}>
				<View className="flex-1 items-center justify-center px-6">
					<Card className="p-8 items-center gap-3 w-full">
						<HugeiconsIcon icon={Bus01Icon} size={44} color={colors.neutral.textMuted} />
						<Text className="text-lg font-extrabold text-foreground text-center">{t("noActiveRunTitle")}</Text>
						<Text className="text-xs text-muted-foreground text-center leading-5 max-w-[280px]">
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
		<View className="flex-1 bg-background">
			{/* Top Live Bar */}
			<View
				className="px-5 pb-3 border-b border-border bg-background flex-row items-center justify-between"
				style={{ paddingTop: insets.top + 10 }}
			>
				<View className="flex-row items-center gap-2">
					<View className="size-2.5 rounded-full bg-success" />
					<Text className="text-xs font-extrabold text-foreground uppercase tracking-wider">{t("liveTelemetry")}</Text>
				</View>
				<Badge
					variant="default"
					label={activeTrip.bus?.registrationPlate ?? t("assignedBus")}
				/>
			</View>

			{/* Mapbox Live Vector Map Navigation Canvas */}
			<View className="h-[250px] border-b border-border relative">
				<DriverNavigationMap
					currentLocation={currentLocation ?? undefined}
					routeGeoJson={routeGeoJson}
					stops={stops}
					isNavigating={isTripActive}
				/>
			</View>

			<ScrollView
				className="flex-1"
				contentContainerClassName="px-4 pt-4 gap-4"
				contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 80 }}
				showsVerticalScrollIndicator={false}
			>
				{/* Emergency Breakdown Active Banner */}
				{isBreakdownReported && (
					<View className="flex-row items-center justify-between bg-destructive/10 border border-destructive/35 p-3.5 rounded-2xl gap-3">
						<View className="flex-row items-center gap-2.5 flex-1">
							<View className="p-2 rounded-xl bg-destructive/20">
								<HugeiconsIcon icon={Alert02Icon} size={22} color={colors.semantic.error} />
							</View>
							<View className="flex-1 gap-0.5">
								<Text className="text-[13px] font-extrabold text-destructive">{t("breakdownBannerTitle")}</Text>
								<Text className="text-xs text-foreground/80 leading-4">{t("breakdownBannerDesc")}</Text>
							</View>
						</View>
					</View>
				)}

				{/* Mandated Safety Rest Break Banner */}
				{isResting && (
					<View className="flex-row items-center justify-between bg-info/10 border border-info/30 p-3.5 rounded-2xl gap-3">
						<View className="flex-row items-center gap-2.5 flex-1">
							<View className="p-2 rounded-xl bg-info/15">
								<HugeiconsIcon icon={Time02Icon} size={22} color={colors.semantic.info} />
							</View>
							<View className="flex-1 gap-0.5">
								<Text className="text-[13px] font-bold text-foreground">{t("restBreakBannerTitle")}</Text>
								<Text className="text-xs font-semibold text-info">
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
							icon={<HugeiconsIcon icon={PlayIcon} size={16} color={colors.neutral.textPrimary} />}
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
					<View className="flex-row items-center justify-between">
						<View className="flex-row items-center gap-1.5">
							<HugeiconsIcon icon={Navigation01Icon} size={16} color={colors.primary.rose} />
							<Text className="text-[11px] font-bold text-foreground/80 uppercase tracking-wider">{t("stopProgress")}</Text>
						</View>
						{routeIsApproximate ? (
							<Text className="text-[11px] font-bold text-warning">{t("approximateRoute")}</Text>
						) : (
							<Text className="text-xs font-bold text-primary font-mono">
								{routeDurationSecs
									? t("etaLabel", { minutes: Math.max(1, Math.round(routeDurationSecs / 60)) })
									: t("etaNone")}
							</Text>
						)}
					</View>

					{/* Active Stop Action Card */}
					{currentWaypoint && (
						<View
							className={cn(
								"p-4 rounded-2xl border gap-2.5",
								isAtWaypoint
									? "bg-warning/10 border-warning/30"
									: isNearWaypoint
										? "bg-success/10 border-success/30"
										: "bg-card border-border",
							)}
						>
							<View className="flex-row items-center justify-between">
								<View className="flex-row items-center gap-2">
									<View
										className={cn(
											"size-2.5 rounded-full",
											isAtWaypoint ? "bg-warning" : isNearWaypoint ? "bg-success" : "bg-primary",
										)}
									/>
									<Text className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
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

							<Text className="text-base font-extrabold text-foreground">
								{currentWaypoint.terminal?.name ?? t("stopDefaultName", { index: currentWaypointIndex + 1 })}
							</Text>
							<Text className="text-xs text-muted-foreground leading-4">
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
									icon={<HugeiconsIcon icon={ArrowRight01Icon} size={16} color={colors.neutral.background} />}
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
									icon={<HugeiconsIcon icon={CheckmarkCircle02Icon} size={16} color={colors.neutral.textPrimary} />}
								/>
							) : null}
						</View>
					)}

					{/* Waypoints Sequence List */}
					<View className="gap-2 pt-2 border-t border-border">
						<Text className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider">{t("stopSheetTitle")}</Text>
						{tripStops.map((stop, idx) => {
							const isPassed = stop.actualDeparture != null;
							const isCurrent = stop.id === currentWaypoint?.id;
							const isArrived = stop.actualArrival != null;

							return (
								<View
									key={stop.id}
									className={cn(
										"flex-row items-center justify-between p-3 rounded-xl border",
										isCurrent ? "bg-card-elevated border-border-strong" : "bg-card border-border",
									)}
								>
									<View className="flex-row items-center gap-3 flex-1">
										<View
											className={cn(
												"size-6 rounded-full items-center justify-center",
												isPassed
													? "bg-success/20"
													: isCurrent && isArrived
														? "bg-warning/20"
														: "bg-secondary",
											)}
										>
											{isPassed ? (
												<HugeiconsIcon icon={CheckmarkCircle02Icon} size={14} color={colors.semantic.success} />
											) : (
												<Text className="text-[11px] font-extrabold text-muted-foreground">{idx + 1}</Text>
											)}
										</View>
										<View className="flex-1 gap-0.5">
											<Text
												className={cn(
													"text-[13px] font-bold",
													isPassed ? "text-muted-foreground line-through" : isCurrent ? "text-foreground" : "text-foreground/80",
												)}
											>
												{stop.terminal?.name ?? t("stopDefaultName", { index: idx + 1 })}
											</Text>
											<Text className="text-[11px] text-muted-foreground">
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
				<View className="flex-row gap-3 pb-6">
					{!isResting ? (
						<Button
							title={t("btnTakeBreak")}
							variant="secondary"
							size="md"
							loading={logRestBreakMutation.isPending}
							onPress={handleTakeBreak}
							icon={<HugeiconsIcon icon={Time02Icon} size={18} color={colors.semantic.info} />}
							className="flex-1"
						/>
					) : (
						<Button
							title={t("btnResumeDuty")}
							variant="primary"
							size="md"
							loading={resumeDutyMutation.isPending}
							onPress={handleResumeDuty}
							icon={<HugeiconsIcon icon={PlayIcon} size={18} color={colors.neutral.textPrimary} />}
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
						icon={<HugeiconsIcon icon={Alert02Icon} size={18} color={colors.semantic.warning} />}
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
						icon={<HugeiconsIcon icon={Alert02Icon} size={18} color={colors.neutral.textPrimary} />}
						className="flex-1"
					/>

					{reliefAssignments.length > 0 && (
						<Button
							title={t("btnHandover")}
							variant="outline"
							size="md"
							loading={handoverMutation.isPending}
							onPress={handleHandoverControl}
							icon={<HugeiconsIcon icon={Navigation01Icon} size={18} color={colors.semantic.info} />}
							className="flex-1"
						/>
					)}

					<Button
						title={t("btnEndTrip")}
						variant="destructive"
						size="md"
						loading={completeMutation.isPending}
						onPress={handleEndTrip}
						icon={<HugeiconsIcon icon={StopIcon} size={18} color={colors.neutral.textPrimary} />}
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
