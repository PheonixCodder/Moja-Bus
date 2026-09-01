import React, { useState } from "react";
import {
	View,
	Text,
	ScrollView,
	TouchableOpacity,
	RefreshControl,
	ActivityIndicator,
	Alert,
	StyleSheet,
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
			const res = await startTripMutation.mutateAsync({ tripId });
			setTelemetryAuthToken(res.telemetryToken);
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
			console.warn("[StartTrip] Error starting run:", err?.message);
			Alert.alert(t("errorStartTripTitle"), err?.message ?? t("errorStartTripMsg"));
		}
	};

	const handleTakeOverTrip = (tripId: string) => {
		DriverFeedback.tap();
		Alert.alert(
			t("takeoverConfirmTitle"),
			t("takeoverConfirmMsg"),
			[
				{ text: t("cancel", { ns: "live" }) || "Annuler", style: "cancel" },
				{
					text: t("btnTakeOver"),
					style: "default",
					onPress: async () => {
						try {
							const res = await takeOverTripMutation.mutateAsync({ tripId });
							if (res.telemetryToken) {
								setTelemetryAuthToken(res.telemetryToken);
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
								await startBackgroundLocationTracking(res.activeDriverProfileId, tripId);
							}
							router.push("/(tabs)/live");
						} catch (err: any) {
							console.warn("[TakeOverTrip] Error taking over run:", err?.message);
							Alert.alert(t("errorStartTripTitle"), err?.message ?? t("errorStartTripMsg"));
						}
					},
				},
			]
		);
	};

	const trips = tripsData?.items ?? [];

	return (
		<View style={styles.root}>
			{/* Top Header & Dual Mode Switcher */}
			<View style={[styles.headerContainer, { paddingTop: insets.top + 12 }]}>
				<View style={styles.headerRow}>
					<View style={styles.headerTitleWrap}>
						<Text style={styles.headerTitle}>{t("title")}</Text>
						<Text style={styles.headerSubtitle}>
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
				<View style={styles.tabsRow}>
					{(["TODAY", "UPCOMING", "COMPLETED"] as const).map((tab) => (
						<TouchableOpacity
							key={tab}
							onPress={() => {
								DriverFeedback.tap();
								setActiveTab(tab);
							}}
							activeOpacity={0.8}
							style={[
								styles.tabButton,
								activeTab === tab && styles.tabButtonActive,
							]}
						>
							<Text
								style={[
									styles.tabButtonText,
									activeTab === tab && styles.tabButtonTextActive,
								]}
							>
								{tab === "TODAY" ? t("tabToday") : tab === "UPCOMING" ? t("tabUpcoming") : t("tabCompleted")}
							</Text>
						</TouchableOpacity>
					))}
				</View>
			</View>

			{/* Content Feed */}
			<ScrollView
				style={styles.scroll}
				contentContainerStyle={[
					styles.scrollContent,
					{ paddingBottom: Math.max(insets.bottom, 24) + 80 },
				]}
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
					<View style={styles.loadingBox}>
						<ActivityIndicator size="large" color={colors.primary.rose} />
						<Text style={styles.loadingText}>
							{t("loadingDispatches")}
						</Text>
					</View>
				) : error ? (
					<Card className="py-16 items-center justify-center px-6 text-center gap-3 my-4">
						<HugeiconsIcon icon={Alert02Icon} size={40} color="#ef4444" />
						<Text className="text-base font-bold text-[#fafafa] text-center">
							{t("errorLoadingTitle")}
						</Text>
						<Text className="text-xs text-[#a1a1aa] text-center leading-relaxed">
							{error.message || t("errorLoadingMsg")}
						</Text>
						<Button
							title={t("btnRetry")}
							variant="secondary"
							size="sm"
							onPress={() => refetch()}
							icon={<HugeiconsIcon icon={RefreshIcon} size={16} color="#fafafa" />}
						/>
					</Card>
				) : trips.length === 0 ? (
					<Card className="py-20 items-center justify-center px-6 text-center gap-3 my-4">
						<HugeiconsIcon icon={Bus01Icon} size={44} color="#71717a" />
						<Text className="text-base font-bold text-[#fafafa] text-center">
							{t("emptyTitle")}
						</Text>
						<Text className="text-xs text-[#a1a1aa] text-center leading-relaxed max-w-xs">
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

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: "#09090b",
	},
	headerContainer: {
		paddingHorizontal: 20,
		paddingBottom: 14,
		borderBottomWidth: 1,
		borderBottomColor: "#27272a",
		backgroundColor: "#09090b",
		gap: 14,
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	headerTitleWrap: {
		gap: 2,
		flex: 1,
	},
	headerTitle: {
		fontSize: 22,
		fontWeight: "800",
		color: "#fafafa",
		letterSpacing: -0.4,
	},
	headerSubtitle: {
		fontSize: 11,
		color: "#a1a1aa",
	},
	tabsRow: {
		flexDirection: "row",
		gap: 8,
	},
	tabButton: {
		flex: 1,
		paddingVertical: 10,
		borderRadius: 12,
		alignItems: "center",
		borderWidth: 1,
		borderColor: "transparent",
	},
	tabButtonActive: {
		backgroundColor: "#18181b",
		borderColor: "#3f3f46",
	},
	tabButtonText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#71717a",
	},
	tabButtonTextActive: {
		color: "#fafafa",
	},
	scroll: {
		flex: 1,
	},
	scrollContent: {
		paddingHorizontal: 16,
		paddingTop: 16,
		gap: 16,
	},
	loadingBox: {
		alignItems: "center",
		justifyContent: "center",
		paddingVertical: 80,
		gap: 12,
	},
	loadingText: {
		fontSize: 12,
		color: "#a1a1aa",
		fontWeight: "500",
	},
});
