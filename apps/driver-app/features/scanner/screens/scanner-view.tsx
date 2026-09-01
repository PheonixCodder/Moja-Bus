import React, { useState, useRef, useEffect, useMemo } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Alert,
	Modal,
	ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useLocalSearchParams, useRouter } from "expo-router";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	QrCode01Icon,
	FlashlightIcon,
	CloudSavingDone01Icon,
	Bus01Icon,
	Time02Icon,
	ArrowRight01Icon,
	Cancel01Icon,
	CheckmarkCircle02Icon,
	DocumentAttachmentIcon,
} from "@hugeicons/core-free-icons";
import { useTRPC } from "@/lib/trpc";
import { DriverFeedback } from "@/lib/haptics";
import { useTranslation } from "react-i18next";
import { ACTIVE_TRIP_ID_KEY } from "@/lib/telemetry";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button } from "@/components/ui/Button";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { colors } from "@/constants/theme";
import {
	TicketResultModal,
	type TicketValidationResult,
} from "../components/ticket-result-modal";

const OFFLINE_SCANS_KEY = "driver_offline_scans_queue";

interface OfflineScanItem {
	ticketToken: string;
	tripId?: string;
	scannedAt: string;
}

export function ScannerView() {
	const { t } = useTranslation("scanner");
	const params = useLocalSearchParams<{ tripId?: string }>();
	const router = useRouter();
	const trpc = useTRPC();
	const queryClient = useQueryClient();
	const insets = useSafeAreaInsets();

	const [permission, requestPermission] = useCameraPermissions();
	const [torch, setTorch] = useState(false);
	const [validationResult, setValidationResult] = useState<TicketValidationResult | null>(null);
	const [offlineQueue, setOfflineQueue] = useState<OfflineScanItem[]>([]);
	const [isSyncing, setIsSyncing] = useState(false);
	const isScanningRef = useRef(false);

	const [selectedTripId, setSelectedTripId] = useState<string | null>(params.tripId ?? null);
	const [isTripSelectorOpen, setIsTripSelectorOpen] = useState(false);

	// Fetch today's assigned departures to populate context banner & switchers
	const { data: todayTripsData } = useQuery(
		trpc.drivers.getMyTrips.queryOptions({
			filter: "TODAY",
			limit: 20,
		})
	);

	const todayAssignments = useMemo(() => todayTripsData?.items ?? [], [todayTripsData]);

	// Auto-select trip if none explicitly chosen via route param
	useEffect(() => {
		if (params.tripId) {
			setSelectedTripId(params.tripId);
			return;
		}

		AsyncStorage.getItem(ACTIVE_TRIP_ID_KEY)
			.then((storedId) => {
				if (storedId) {
					setSelectedTripId(storedId);
				} else if (todayAssignments.length > 0) {
					// Find first active or scheduled trip
					const activeOrBoardable = todayAssignments.find(
						(a) =>
							a.trip.status === "DEPARTED" ||
							a.trip.status === "BOARDING" ||
							a.trip.status === "SCHEDULED" ||
							a.trip.status === "DELAYED"
					);
					if (activeOrBoardable) {
						setSelectedTripId(activeOrBoardable.trip.id);
					}
				}
			})
			.catch(() => {});

		loadOfflineQueue();
	}, [params.tripId, todayAssignments]);

	const selectedAssignment = useMemo(() => {
		if (!selectedTripId) return null;
		return todayAssignments.find((a) => a.trip.id === selectedTripId) ?? null;
	}, [selectedTripId, todayAssignments]);

	const selectedTrip = selectedAssignment?.trip ?? null;

	const loadOfflineQueue = async () => {
		try {
			const raw = await AsyncStorage.getItem(OFFLINE_SCANS_KEY);
			if (raw) {
				const parsed = JSON.parse(raw);
				if (Array.isArray(parsed)) setOfflineQueue(parsed);
			}
		} catch {}
	};

	const saveOfflineQueue = async (queue: OfflineScanItem[]) => {
		setOfflineQueue(queue);
		await AsyncStorage.setItem(OFFLINE_SCANS_KEY, JSON.stringify(queue));
	};

	const checkInMutation = useMutation(
		trpc.drivers.checkInPassenger.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.drivers.getMyTripManifest.queryFilter());
				queryClient.invalidateQueries(trpc.drivers.getMyTrips.queryFilter());
			},
		})
	);

	const batchSyncMutation = useMutation(
		trpc.drivers.batchSyncCheckIns.mutationOptions({
			onSuccess: () => {
				queryClient.invalidateQueries(trpc.drivers.getMyTripManifest.queryFilter());
				queryClient.invalidateQueries(trpc.drivers.getMyTrips.queryFilter());
			},
		})
	);

	const handleSyncOfflineQueue = async () => {
		if (offlineQueue.length === 0 || isSyncing) return;
		setIsSyncing(true);
		DriverFeedback.tap();

		try {
			const res = await batchSyncMutation.mutateAsync({
				checkIns: offlineQueue,
			});

			const syncedCount = res.syncedCount ?? 0;
			const rejectedCount = res.results.filter((r: any) => r.outcome === "REJECTED").length;
			const alreadyBoardedCount = res.results.filter((r: any) => r.outcome === "ALREADY_BOARDED").length;

			await saveOfflineQueue([]);
			DriverFeedback.successScan();

			Alert.alert(
				t("syncComplete"),
				t("syncCompleteMsg", {
					count: offlineQueue.length,
					synced: syncedCount,
					alreadyBoarded: alreadyBoardedCount,
					rejected: rejectedCount,
				})
			);
		} catch (err: any) {
			DriverFeedback.invalidScan();
			Alert.alert(t("syncFailed"), err?.message ?? t("syncFailedMsg"));
		} finally {
			setIsSyncing(false);
		}
	};

	if (!permission) {
		return <View style={styles.permissionLoading} />;
	}

	if (!permission.granted) {
		return (
			<View style={[styles.permissionContainer, { paddingTop: insets.top + 40 }]}>
				<HugeiconsIcon icon={QrCode01Icon} size={52} color={colors.primary.rose} />
				<Text style={styles.permissionTitle}>{t("permissionTitle")}</Text>
				<Text style={styles.permissionSubtitle}>
					{t("permissionSubtitle")}
				</Text>
				<Button
					title={t("permissionAllow")}
					variant="primary"
					size="lg"
					onPress={requestPermission}
					className="mt-6"
				/>
			</View>
		);
	}

	const handleBarcodeScanned = async ({ data }: { data: string }) => {
		if (isScanningRef.current || validationResult) return;
		isScanningRef.current = true;

		try {
			const res = await checkInMutation.mutateAsync({
				ticketToken: data,
				tripId: selectedTripId ?? undefined,
			});

			if (res.alreadyBoarded) {
				DriverFeedback.warning();
				setValidationResult({
					status: "ALREADY_BOARDED",
					passengerName: res.passengerName,
					seatNumber: res.seatNumber,
					bookingReference: res.bookingReference,
					ticketToken: data,
					boardedAt: res.boardedAt ? String(res.boardedAt) : undefined,
					errorMessage: res.message,
				});
			} else {
				DriverFeedback.successScan();
				setValidationResult({
					status: "SUCCESS",
					passengerName: res.passengerName,
					seatNumber: res.seatNumber,
					bookingReference: res.bookingReference,
					ticketToken: data,
					boardedAt: res.boardedAt ? String(res.boardedAt) : undefined,
				});
			}
		} catch (err: any) {
			const isNetworkErr =
				err?.message?.includes("Network") ||
				err?.message?.includes("fetch") ||
				err?.message?.includes("timeout") ||
				err?.message?.includes("Failed to fetch");

			if (isNetworkErr) {
				const newItem: OfflineScanItem = {
					ticketToken: data,
					tripId: selectedTripId ?? undefined,
					scannedAt: new Date().toISOString(),
				};
				const updatedQueue = [...offlineQueue, newItem];
				void saveOfflineQueue(updatedQueue);

				DriverFeedback.successScan();
				setValidationResult({
					status: "QUEUED_OFFLINE",
					passengerName: t("offlinePassengerName"),
					ticketToken: data,
					errorMessage: t("offlineErrorMessage"),
				});
			} else {
				DriverFeedback.invalidScan();
				setValidationResult({
					status: "ERROR",
					ticketToken: data,
					errorMessage: err.message || t("fallbackError"),
				});
			}
		} finally {
			isScanningRef.current = false;
		}
	};

	const handleDismissSheet = () => {
		DriverFeedback.tap();
		setValidationResult(null);
	};

	const stops = selectedTrip?.tripStops ?? [];
	const originTerminal = stops[0]?.terminal?.name ?? "Départ";
	const destTerminal = stops[stops.length - 1]?.terminal?.name ?? "Arrivée";
	const depTime = selectedTrip?.departureDate
		? new Date(selectedTrip.departureDate).toLocaleTimeString([], {
				hour: "2-digit",
				minute: "2-digit",
				hour12: false,
			})
		: "";

	return (
		<View style={styles.root}>
			{/* Scanner Header */}
			<View style={[styles.headerBar, { paddingTop: insets.top + 10 }]}>
				<View style={styles.headerTitleWrap}>
					<Text style={styles.headerTitle}>{t("scanTitle")}</Text>
					<Text style={styles.headerSubtitle}>{t("scanSubtitle")}</Text>
				</View>
				<TouchableOpacity
					onPress={() => setTorch(!torch)}
					activeOpacity={0.8}
					style={[
						styles.torchButton,
						torch ? styles.torchOn : styles.torchOff,
					]}
				>
					<HugeiconsIcon
						icon={FlashlightIcon}
						size={20}
						color={torch ? "#000000" : "#fafafa"}
					/>
				</TouchableOpacity>
			</View>

			{/* Target Departure Context Banner */}
			{selectedTrip ? (
				<View style={styles.departureBanner}>
					<View style={styles.departureLeft}>
						<View style={styles.busBadge}>
							<HugeiconsIcon icon={Bus01Icon} size={16} color={colors.primary.rose} />
						</View>
						<View style={styles.departureDetails}>
							<View style={styles.routeRow}>
								<Text style={styles.routeText} numberOfLines={1}>
									{originTerminal} → {destTerminal}
								</Text>
								<Badge
									variant={selectedTrip.status === "DEPARTED" ? "brand" : "default"}
									label={selectedTrip.status}
								/>
							</View>
							<Text style={styles.departureSub}>
								{selectedTrip.bus?.registrationPlate ?? "Bus N/A"} • {depTime ? `Départ ${depTime}` : ""}
							</Text>
						</View>
					</View>

					<View style={styles.bannerActions}>
						<TouchableOpacity
							style={styles.manifestIconBtn}
							onPress={() => router.push(`/trip/${selectedTrip.id}/manifest`)}
							activeOpacity={0.8}
						>
							<HugeiconsIcon icon={DocumentAttachmentIcon} size={18} color="#fafafa" />
						</TouchableOpacity>

						{todayAssignments.length > 1 && (
							<TouchableOpacity
								style={styles.switchTripBtn}
								onPress={() => setIsTripSelectorOpen(true)}
								activeOpacity={0.8}
							>
								<Text style={styles.switchTripText}>{t("switchTrip")}</Text>
								<HugeiconsIcon icon={ArrowRight01Icon} size={14} color={colors.primary.rose} />
							</TouchableOpacity>
						)}
					</View>
				</View>
			) : (
				<View style={styles.noTripBanner}>
					<HugeiconsIcon icon={Bus01Icon} size={16} color="#71717a" />
					<Text style={styles.noTripText}>{t("noActiveOrUpcomingTrip")}</Text>
					{todayAssignments.length > 0 && (
						<TouchableOpacity
							style={styles.switchTripBtn}
							onPress={() => setIsTripSelectorOpen(true)}
						>
							<Text style={styles.switchTripText}>{t("switchTrip")}</Text>
						</TouchableOpacity>
					)}
				</View>
			)}

			{/* Offline Scans Queue Banner */}
			{offlineQueue.length > 0 && (
				<View style={styles.offlineBanner}>
					<View style={styles.offlineLeft}>
						<HugeiconsIcon icon={CloudSavingDone01Icon} size={18} color="#f59e0b" />
						<Text style={styles.offlineText}>
							{t("offlineCount", { count: offlineQueue.length })}
						</Text>
					</View>
					<Button
						title={isSyncing ? t("offlineSyncing") : t("offlineSync")}
						variant="warning"
						size="sm"
						loading={isSyncing}
						onPress={handleSyncOfflineQueue}
					/>
				</View>
			)}

			{/* Camera Feed with Viewfinder Frame */}
			<View style={styles.cameraContainer}>
				<CameraView
					style={StyleSheet.absoluteFill}
					facing="back"
					enableTorch={torch}
					barcodeScannerSettings={{
						barcodeTypes: ["qr"],
					}}
					onBarcodeScanned={validationResult ? undefined : handleBarcodeScanned}
				/>

				{/* High-Contrast Target Viewfinder */}
				<View style={styles.viewfinderBox}>
					<View style={styles.viewfinderCenterLine} />
					<View style={[styles.corner, styles.cornerTL]} />
					<View style={[styles.corner, styles.cornerTR]} />
					<View style={[styles.corner, styles.cornerBL]} />
					<View style={[styles.corner, styles.cornerBR]} />
				</View>

				<Text style={styles.scanHint}>{t("scanHint")}</Text>
			</View>

			{/* Validation Result Modal Sheet */}
			<TicketResultModal
				result={validationResult}
				onDismiss={handleDismissSheet}
			/>

			{/* Departure Switcher Modal */}
			<Modal
				visible={isTripSelectorOpen}
				transparent
				animationType="slide"
				onRequestClose={() => setIsTripSelectorOpen(false)}
			>
				<View style={styles.modalBackdrop}>
					<View style={[styles.modalSheet, { paddingBottom: Math.max(insets.bottom, 20) + 10 }]}>
						<View style={styles.modalHeader}>
							<Text style={styles.modalTitle}>{t("allTripsAssigned")}</Text>
							<TouchableOpacity
								onPress={() => setIsTripSelectorOpen(false)}
								style={styles.modalCloseBtn}
							>
								<HugeiconsIcon icon={Cancel01Icon} size={20} color="#a1a1aa" />
							</TouchableOpacity>
						</View>

						<ScrollView style={styles.modalScroll} showsVerticalScrollIndicator={false}>
							{todayAssignments.map((a) => {
								const aStops = a.trip.tripStops ?? [];
								const aOrig = aStops[0]?.terminal?.name ?? "Départ";
								const aDest = aStops[aStops.length - 1]?.terminal?.name ?? "Arrivée";
								const aTime = new Date(a.trip.departureDate).toLocaleTimeString([], {
									hour: "2-digit",
									minute: "2-digit",
									hour12: false,
								});
								const isSelected = a.trip.id === selectedTripId;

								return (
									<TouchableOpacity
										key={a.assignmentId}
										style={[
											styles.tripOptionCard,
											isSelected && styles.tripOptionCardSelected,
										]}
										onPress={() => {
											DriverFeedback.tap();
											setSelectedTripId(a.trip.id);
											setIsTripSelectorOpen(false);
										}}
										activeOpacity={0.8}
									>
										<View style={styles.tripOptionLeft}>
											<View style={styles.tripOptionRouteRow}>
												<Text style={styles.tripOptionRoute}>
													{aOrig} → {aDest}
												</Text>
												<Badge
													variant={a.trip.status === "DEPARTED" ? "brand" : "default"}
													label={a.trip.status}
												/>
											</View>
											<Text style={styles.tripOptionMeta}>
												{a.trip.bus?.registrationPlate ?? "Bus N/A"} • Départ {aTime} • {a.role}
											</Text>
										</View>

										{isSelected && (
											<HugeiconsIcon
												icon={CheckmarkCircle02Icon}
												size={22}
												color={colors.primary.rose}
											/>
										)}
									</TouchableOpacity>
								);
							})}
						</ScrollView>
					</View>
				</View>
			</Modal>
		</View>
	);
}

const styles = StyleSheet.create({
	root: {
		flex: 1,
		backgroundColor: "#000000",
	},
	permissionLoading: {
		flex: 1,
		backgroundColor: "#09090b",
	},
	permissionContainer: {
		flex: 1,
		backgroundColor: "#09090b",
		alignItems: "center",
		justifyContent: "center",
		padding: 24,
	},
	permissionTitle: {
		fontSize: 20,
		fontWeight: "800",
		color: "#fafafa",
		marginTop: 16,
		textAlign: "center",
	},
	permissionSubtitle: {
		fontSize: 12,
		color: "#a1a1aa",
		marginTop: 8,
		textAlign: "center",
		maxWidth: 280,
		lineHeight: 18,
	},
	headerBar: {
		paddingHorizontal: 20,
		paddingBottom: 14,
		backgroundColor: "#09090b",
		borderBottomWidth: 1,
		borderBottomColor: "#27272a",
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	headerTitleWrap: {
		flex: 1,
		gap: 2,
	},
	headerTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#fafafa",
	},
	headerSubtitle: {
		fontSize: 11,
		color: "#a1a1aa",
	},
	departureBanner: {
		backgroundColor: "#18181b",
		borderBottomWidth: 1,
		borderBottomColor: "#27272a",
		paddingHorizontal: 16,
		paddingVertical: 12,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 12,
	},
	departureLeft: {
		flex: 1,
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
	},
	busBadge: {
		width: 32,
		height: 32,
		borderRadius: 10,
		backgroundColor: "rgba(238, 35, 124, 0.1)",
		borderWidth: 1,
		borderColor: "rgba(238, 35, 124, 0.2)",
		alignItems: "center",
		justifyContent: "center",
	},
	departureDetails: {
		flex: 1,
		gap: 3,
	},
	routeRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	routeText: {
		fontSize: 13,
		fontWeight: "700",
		color: "#fafafa",
		flexShrink: 1,
	},
	departureSub: {
		fontSize: 11,
		color: "#a1a1aa",
	},
	bannerActions: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	manifestIconBtn: {
		width: 36,
		height: 36,
		borderRadius: 10,
		backgroundColor: "#27272a",
		alignItems: "center",
		justifyContent: "center",
	},
	switchTripBtn: {
		flexDirection: "row",
		alignItems: "center",
		gap: 4,
		backgroundColor: "rgba(238, 35, 124, 0.1)",
		borderWidth: 1,
		borderColor: "rgba(238, 35, 124, 0.3)",
		paddingHorizontal: 10,
		paddingVertical: 6,
		borderRadius: 10,
	},
	switchTripText: {
		fontSize: 11,
		fontWeight: "700",
		color: colors.primary.rose,
	},
	noTripBanner: {
		backgroundColor: "#18181b",
		borderBottomWidth: 1,
		borderBottomColor: "#27272a",
		paddingHorizontal: 16,
		paddingVertical: 10,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		gap: 10,
	},
	noTripText: {
		fontSize: 12,
		color: "#a1a1aa",
		flex: 1,
	},
	modalBackdrop: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.8)",
		justifyContent: "flex-end",
	},
	modalSheet: {
		backgroundColor: "#18181b",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		borderTopWidth: 1,
		borderTopColor: "#27272a",
		paddingHorizontal: 20,
		paddingTop: 20,
		maxHeight: "75%",
		gap: 16,
	},
	modalHeader: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	modalTitle: {
		fontSize: 16,
		fontWeight: "800",
		color: "#fafafa",
	},
	modalCloseBtn: {
		padding: 6,
		borderRadius: 10,
		backgroundColor: "#27272a",
	},
	modalScroll: {
		gap: 10,
	},
	tripOptionCard: {
		backgroundColor: "#09090b",
		borderWidth: 1,
		borderColor: "#27272a",
		borderRadius: 14,
		padding: 14,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
		marginBottom: 10,
	},
	tripOptionCardSelected: {
		borderColor: colors.primary.rose,
		backgroundColor: "rgba(238, 35, 124, 0.05)",
	},
	tripOptionLeft: {
		flex: 1,
		gap: 4,
	},
	tripOptionRouteRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	tripOptionRoute: {
		fontSize: 14,
		fontWeight: "700",
		color: "#fafafa",
		flexShrink: 1,
	},
	tripOptionMeta: {
		fontSize: 11,
		color: "#a1a1aa",
	},
	torchButton: {
		width: 44,
		height: 44,
		borderRadius: 14,
		borderWidth: 1,
		alignItems: "center",
		justifyContent: "center",
	},
	torchOn: {
		backgroundColor: "#f59e0b",
		borderColor: "#fbbf24",
	},
	torchOff: {
		backgroundColor: "#18181b",
		borderColor: "#27272a",
	},
	offlineBanner: {
		backgroundColor: "rgba(245, 158, 11, 0.15)",
		borderBottomWidth: 1,
		borderBottomColor: "rgba(245, 158, 11, 0.3)",
		paddingHorizontal: 20,
		paddingVertical: 10,
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	offlineLeft: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	offlineText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#fbbf24",
	},
	cameraContainer: {
		flex: 1,
		position: "relative",
		alignItems: "center",
		justifyContent: "center",
	},
	viewfinderBox: {
		width: 256,
		height: 256,
		borderWidth: 2,
		borderColor: "#ee237c",
		borderRadius: 24,
		position: "relative",
		alignItems: "center",
		justifyContent: "center",
		backgroundColor: "rgba(0, 0, 0, 0.1)",
	},
	viewfinderCenterLine: {
		width: 192,
		height: 2,
		backgroundColor: "#ee237c",
	},
	corner: {
		position: "absolute",
		width: 16,
		height: 16,
		borderColor: "#ffffff",
	},
	cornerTL: {
		top: 8,
		left: 8,
		borderTopWidth: 2,
		borderLeftWidth: 2,
	},
	cornerTR: {
		top: 8,
		right: 8,
		borderTopWidth: 2,
		borderRightWidth: 2,
	},
	cornerBL: {
		bottom: 8,
		left: 8,
		borderBottomWidth: 2,
		borderLeftWidth: 2,
	},
	cornerBR: {
		bottom: 8,
		right: 8,
		borderBottomWidth: 2,
		borderRightWidth: 2,
	},
	scanHint: {
		fontSize: 12,
		fontWeight: "600",
		color: "rgba(255, 255, 255, 0.9)",
		marginTop: 24,
		backgroundColor: "rgba(0, 0, 0, 0.75)",
		paddingHorizontal: 16,
		paddingVertical: 8,
		borderRadius: 999,
		borderWidth: 1,
		borderColor: "rgba(255, 255, 255, 0.1)",
	},
});
