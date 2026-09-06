import React, { useState, useRef, useEffect, useMemo } from "react";
import {
	View,
	Text,
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
		return <View className="flex-1 bg-background" />;
	}

	if (!permission.granted) {
		return (
			<View
				className="flex-1 bg-background items-center justify-center p-6"
				style={{ paddingTop: insets.top + 40 }}
			>
				<HugeiconsIcon icon={QrCode01Icon} size={52} color={colors.primary.rose} />
				<Text className="text-xl font-extrabold text-foreground mt-4 text-center">
					{t("permissionTitle")}
				</Text>
				<Text className="text-xs text-muted-foreground mt-2 text-center max-w-xs leading-5">
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
		<View className="flex-1 bg-black">
			{/* Scanner Header */}
			<View
				className="px-5 pb-3.5 bg-background border-b border-border flex-row items-center justify-between"
				style={{ paddingTop: insets.top + 10 }}
			>
				<View className="flex-1 gap-0.5">
					<Text className="text-lg font-extrabold text-foreground">{t("scanTitle")}</Text>
					<Text className="text-xs text-muted-foreground">{t("scanSubtitle")}</Text>
				</View>
				<Button
					variant={torch ? "warning" : "outline"}
					size="sm"
					onPress={() => setTorch(!torch)}
					className="w-11 h-11 min-h-11 p-0 rounded-2xl"
				>
					<HugeiconsIcon
						icon={FlashlightIcon}
						size={20}
						color={torch ? colors.neutral.background : colors.neutral.textPrimary}
					/>
				</Button>
			</View>

			{/* Target Departure Context Banner */}
			{selectedTrip ? (
				<View className="bg-card border-b border-border px-4 py-3 flex-row items-center justify-between gap-3">
					<View className="flex-1 flex-row items-center gap-2.5">
						<View className="w-8 h-8 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center">
							<HugeiconsIcon icon={Bus01Icon} size={16} color={colors.primary.rose} />
						</View>
						<View className="flex-1 gap-1">
							<View className="flex-row items-center gap-2">
								<Text className="text-sm font-bold text-foreground shrink" numberOfLines={1}>
									{originTerminal} → {destTerminal}
								</Text>
								<Badge
									variant={selectedTrip.status === "DEPARTED" ? "brand" : "default"}
									label={selectedTrip.status}
								/>
							</View>
							<Text className="text-xs text-muted-foreground">
								{selectedTrip.bus?.registrationPlate ?? "Bus N/A"} • {depTime ? `Départ ${depTime}` : ""}
							</Text>
						</View>
					</View>

					<View className="flex-row items-center gap-2">
						<Button
							variant="outline"
							size="sm"
							className="w-9 h-9 min-h-9 p-0 rounded-xl bg-border border-border"
							onPress={() => router.push(`/trip/${selectedTrip.id}/manifest`)}
						>
							<HugeiconsIcon icon={DocumentAttachmentIcon} size={18} color={colors.neutral.textPrimary} />
						</Button>

						{todayAssignments.length > 1 && (
							<Button
								variant="outline"
								size="sm"
								className="flex-row items-center gap-1 bg-primary/10 border-primary/30 px-2.5 py-1.5 h-auto min-h-8 rounded-xl"
								onPress={() => setIsTripSelectorOpen(true)}
							>
								<Text className="text-xs font-bold text-primary">{t("switchTrip")}</Text>
								<HugeiconsIcon icon={ArrowRight01Icon} size={14} color={colors.primary.rose} />
							</Button>
						)}
					</View>
				</View>
			) : (
				<View className="bg-card border-b border-border px-4 py-2.5 flex-row items-center justify-between gap-2.5">
					<HugeiconsIcon icon={Bus01Icon} size={16} color={colors.neutral.textMuted} />
					<Text className="text-xs text-muted-foreground flex-1">{t("noActiveOrUpcomingTrip")}</Text>
					{todayAssignments.length > 0 && (
						<Button
							variant="outline"
							size="sm"
							className="flex-row items-center gap-1 bg-primary/10 border-primary/30 px-2.5 py-1.5 h-auto min-h-8 rounded-xl"
							onPress={() => setIsTripSelectorOpen(true)}
						>
							<Text className="text-xs font-bold text-primary">{t("switchTrip")}</Text>
						</Button>
					)}
				</View>
			)}

			{/* Offline Scans Queue Banner */}
			{offlineQueue.length > 0 && (
				<View className="bg-warning/15 border-b border-warning/30 px-5 py-2.5 flex-row items-center justify-between">
					<View className="flex-row items-center gap-2">
						<HugeiconsIcon icon={CloudSavingDone01Icon} size={18} color={colors.semantic.warning} />
						<Text className="text-xs font-bold text-warning">
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
			<View className="flex-1 relative items-center justify-center">
				<CameraView
					className="absolute inset-0 size-full"
					facing="back"
					enableTorch={torch}
					barcodeScannerSettings={{
						barcodeTypes: ["qr"],
					}}
					onBarcodeScanned={validationResult ? undefined : handleBarcodeScanned}
				/>

				{/* High-Contrast Target Viewfinder */}
				<View className="w-64 h-64 border-2 border-primary rounded-3xl relative items-center justify-center bg-black/10">
					<View className="w-48 h-0.5 bg-primary" />
					<View className="absolute w-4 h-4 border-white top-2 left-2 border-t-2 border-l-2" />
					<View className="absolute w-4 h-4 border-white top-2 right-2 border-t-2 border-r-2" />
					<View className="absolute w-4 h-4 border-white bottom-2 left-2 border-b-2 border-l-2" />
					<View className="absolute w-4 h-4 border-white bottom-2 right-2 border-b-2 border-r-2" />
				</View>

				<Text className="text-xs font-semibold text-white/90 mt-6 bg-black/75 px-4 py-2 rounded-full border border-white/10">
					{t("scanHint")}
				</Text>
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
				<View className="flex-1 bg-black/80 justify-end">
					<View
						className="bg-card rounded-t-3xl border-t border-border px-5 pt-5 max-h-[75%] gap-4"
						style={{ paddingBottom: Math.max(insets.bottom, 20) + 10 }}
					>
						<View className="flex-row items-center justify-between">
							<Text className="text-base font-extrabold text-foreground">{t("allTripsAssigned")}</Text>
							<Button
								variant="outline"
								size="sm"
								onPress={() => setIsTripSelectorOpen(false)}
								className="p-1.5 w-8 h-8 min-h-8 rounded-xl bg-border border-border"
							>
								<HugeiconsIcon icon={Cancel01Icon} size={20} color={colors.neutral.textSecondary} />
							</Button>
						</View>

						<ScrollView className="gap-2.5" showsVerticalScrollIndicator={false}>
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
									<Button
										key={a.assignmentId}
										variant="outline"
										className={`border rounded-2xl p-3.5 flex-row items-center justify-between mb-2.5 h-auto min-h-[64px] ${
											isSelected ? "border-primary bg-primary/5" : "border-border bg-background"
										}`}
										onPress={() => {
											DriverFeedback.tap();
											setSelectedTripId(a.trip.id);
											setIsTripSelectorOpen(false);
										}}
									>
										<View className="flex-1 gap-1">
											<View className="flex-row items-center gap-2">
												<Text className="text-sm font-bold text-foreground shrink">
													{aOrig} → {aDest}
												</Text>
												<Badge
													variant={a.trip.status === "DEPARTED" ? "brand" : "default"}
													label={a.trip.status}
												/>
											</View>
											<Text className="text-xs text-muted-foreground">
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
									</Button>
								);
							})}
						</ScrollView>
					</View>
				</View>
			</Modal>
		</View>
	);
}
