import React, { useState } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	RefreshControl,
	ActivityIndicator,
	Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	Bus01Icon,
	Alert02Icon,
	RefreshIcon,
} from "@hugeicons/core-free-icons";
import { useTRPC } from "@/lib/trpc";
import { DriverFeedback } from "@/lib/haptics";
import {
	setTelemetryAuthToken,
	setTelemetryReauthHandler,
	startBackgroundLocationTracking,
} from "@/lib/telemetry";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";
import { prefetchTripRouteDirections } from "@/lib/mapbox";
import { cn } from "@/lib/utils";
import { ModeSwitcher, type ServiceMode } from "../components/mode-switcher";
import { TripCard } from "../components/trip-card";

type TabFilter = "TODAY" | "UPCOMING" | "COMPLETED";

export function TripsView() {
	const { t } = useTranslation("trips");
	const router = useRouter();
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const insets = useSafeAreaInsets();

	const [activeTab, setActiveTab] = useState<TabFilter>("TODAY");
	const [serviceMode, setServiceMode] = useState<ServiceMode>("ALL");

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
		refetchInterval: 30_000,
	});

	// Phase 3C (DRV-P2-11) — Pre-cache route geometries in AsyncStorage
	// for assigned upcoming trips so live navigation opens with zero lag
	// and never drops to straight lines in terminal dead-zones.
	React.useEffect(() => {
		if (!tripsData?.items || tripsData.items.length === 0) return;
		for (const item of tripsData.items) {
			const trip = item.trip;
			if (trip?.tripStops && trip.tripStops.length >= 2) {
				void prefetchTripRouteDirections(trip.id, trip.tripStops).catch(
					(err) => {
						console.warn(
							`[RoutePreCache] Background prefetch failed for trip ${trip.id}:`,
							err?.message,
						);
					},
				);
			}
		}
	}, [tripsData?.items]);

	const startTripMutation = useMutation(
		trpc.drivers.startTrip.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries();
			},
		})
	);

	const takeOverTripMutation = useMutation(
		trpc.drivers.handoverTripControl.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries();
			},
		})
	);

	const handleStartTrip = async (tripId: string) => {
		DriverFeedback.tap();
		try {
			const result = await startTripMutation.mutateAsync({ tripId });
			if (result.telemetryToken) {
				setTelemetryAuthToken(result.telemetryToken);
				setTelemetryReauthHandler(async () => {
					try {
						const minted = await queryClient.fetchQuery(
							trpc.drivers.getTelemetryToken.queryOptions({ tripId }),
						);
						setTelemetryAuthToken(minted.telemetryToken);
						return minted.telemetryToken;
					} catch (e) {
						console.warn("[Telemetry] Background token refresh failed:", e);
						return null;
					}
				});
				await startBackgroundLocationTracking(result.driverProfileId, tripId);
			}
			DriverFeedback.successScan();
			router.push("/(tabs)/live");
		} catch (err: any) {
			DriverFeedback.invalidScan();
			Alert.alert(t("errorStartingTrip"), err.message || t("errorStartingTripMsg"));
		}
	};

	const handleTakeOverTrip = async (tripId: string) => {
		DriverFeedback.tap();
		Alert.alert(
			t("takeOverTripTitle"),
			t("takeOverTripMsg"),
			[
				{ text: t("cancel"), style: "cancel" },
				{
					text: t("btnTakeOver"),
					style: "destructive",
					onPress: async () => {
						try {
							const result = await takeOverTripMutation.mutateAsync({
								tripId,
							});
							if (result.telemetryToken) {
								setTelemetryAuthToken(result.telemetryToken);
								setTelemetryReauthHandler(async () => {
									try {
										const minted = await queryClient.fetchQuery(
											trpc.drivers.getTelemetryToken.queryOptions({ tripId }),
										);
										setTelemetryAuthToken(minted.telemetryToken);
										return minted.telemetryToken;
									} catch (e) {
										console.warn(
											"[Telemetry] Handover token refresh failed:",
											e,
										);
										return null;
									}
								});
								await startBackgroundLocationTracking(result.activeDriverProfileId, tripId);
							}
							DriverFeedback.successScan();
							router.push("/(tabs)/live");
						} catch (err: any) {
							DriverFeedback.invalidScan();
							Alert.alert(
								t("errorHandover"),
								err.message || t("errorHandoverMsg"),
							);
						}
					},
				},
			],
		);
	};

	const trips = tripsData?.items ?? [];

	return (
		<View className="flex-1 bg-background">
			{/* Top Header & Dual Mode Switcher */}
			<View
				className="px-5 pb-3.5 border-b border-border bg-background gap-3.5"
				style={{ paddingTop: insets.top + 12 }}
			>
				<View className="flex-row items-center justify-between">
					<View className="gap-0.5 flex-1">
						<Text className="text-2xl font-extrabold text-foreground tracking-tight">{t("title")}</Text>
						<Text className="text-xs text-muted-foreground">
							{serviceMode === "ALL"
								? t("subtitleAll")
								: serviceMode === "INTERCITY"
									? t("subtitleIntercity")
									: t("subtitleUrban")}
						</Text>
					</View>

					<ModeSwitcher mode={serviceMode} onModeChange={setServiceMode} />
				</View>

				{/* Filter Tabs */}
				<View className="flex-row gap-2">
					{(["TODAY", "UPCOMING", "COMPLETED"] as const).map((tab) => (
						<TouchableOpacity
							key={tab}
							onPress={() => {
								DriverFeedback.tap();
								setActiveTab(tab);
							}}
							activeOpacity={0.8}
							accessibilityRole="button"
							accessibilityLabel={tab === "TODAY" ? t("tabToday") : tab === "UPCOMING" ? t("tabUpcoming") : t("tabCompleted")}
							className={cn(
								"flex-1 py-2.5 rounded-xl items-center border",
								activeTab === tab ? "bg-card-elevated border-border" : "border-transparent",
							)}
						>
							<Text
								className={cn(
									"text-xs font-bold",
									activeTab === tab ? "text-foreground" : "text-muted-foreground",
								)}
							>
								{tab === "TODAY" ? t("tabToday") : tab === "UPCOMING" ? t("tabUpcoming") : t("tabCompleted")}
							</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>

			{/* Content Feed */}
			<ScrollView
				className="flex-1"
				contentContainerClassName="px-4 pt-4 gap-4"
				contentContainerStyle={{ paddingBottom: Math.max(insets.bottom, 24) + 80 }}
				showsVerticalScrollIndicator={false}
				refreshControl={
					<RefreshControl
						refreshing={isRefetching}
						onRefresh={() => refetch()}
						tintColor={colors.primary.rose}
					/>
				}
			>
				{isLoading ? (
					<View className="items-center justify-center py-20 gap-3">
						<ActivityIndicator size="large" color={colors.primary.rose} />
						<Text className="text-xs text-muted-foreground font-medium">
							{t("loadingDispatches")}
						</Text>
					</View>
				) : error ? (
					<Card className="py-16 items-center justify-center px-6 text-center gap-3 my-4">
						<HugeiconsIcon icon={Alert02Icon} size={40} color={colors.semantic.error} />
						<Text className="text-base font-bold text-foreground text-center">
							{t("errorLoadingTitle")}
						</Text>
						<Text className="text-xs text-muted-foreground text-center leading-relaxed">
							{error.message || t("errorLoadingMsg")}
						</Text>
						<Button
							title={t("btnRetry")}
							variant="secondary"
							size="sm"
							onPress={() => refetch()}
							icon={<HugeiconsIcon icon={RefreshIcon} size={16} color={colors.neutral.textPrimary} />}
						/>
					</Card>
				) : trips.length === 0 ? (
					<Card className="py-20 items-center justify-center px-6 text-center gap-3 my-4">
						<HugeiconsIcon icon={Bus01Icon} size={44} color={colors.neutral.textMuted} />
						<Text className="text-base font-bold text-foreground text-center">
							{t("emptyTitle")}
						</Text>
						<Text className="text-xs text-muted-foreground text-center leading-relaxed max-w-xs">
							{activeTab === "TODAY"
								? t("emptyToday")
								: t("emptyTabMsg", { tab: activeTab.toLowerCase() })}
						</Text>
					</Card>
				) : (
					trips.map(({ assignmentId, trip, passengerCount, role }) => (
						<TripCard
							key={assignmentId}
							assignmentId={assignmentId}
							trip={trip}
							passengerCount={passengerCount}
							role={role}
							onStartTrip={handleStartTrip}
							isStarting={startTripMutation.isPending}
							onTakeOverTrip={handleTakeOverTrip}
							isTakingOver={takeOverTripMutation.isPending}
						/>
					))
				)}
			</ScrollView>
		</View>
	);
}
