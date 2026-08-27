import { useState, useRef, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	Modal,
	StyleSheet,
	ActivityIndicator,
	Alert,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useMutation } from "@tanstack/react-query";
import {
	QrCode,
	CheckCircle,
	AlertTriangle,
	XCircle,
	User,
	Ticket,
	Armchair,
	Flashlight,
	RotateCw,
	CloudOff,
	RefreshCw,
} from "lucide-react-native";
import { useTRPC } from "@/lib/trpc";
import { DriverFeedback } from "@/lib/haptics";
import { useTranslation } from "react-i18next";
import { ACTIVE_TRIP_ID_KEY } from "@/lib/telemetry";
import AsyncStorage from "@react-native-async-storage/async-storage";


const OFFLINE_SCANS_KEY = "driver_offline_scans_queue";

interface OfflineScanItem {
	ticketToken: string;
	tripId?: string;
	scannedAt: string;
}

interface ScanValidationState {
	status: "SUCCESS" | "ALREADY_BOARDED" | "QUEUED_OFFLINE" | "ERROR";
	passengerName?: string;
	seatNumber?: string;
	bookingReference?: string;
	ticketToken: string;
	boardedAt?: string | Date | null;
	errorMessage?: string;
}

export default function DriverScannerScreen() {
	const { t } = useTranslation("scanner");
	const trpc = useTRPC();
	const [permission, requestPermission] = useCameraPermissions();
	const [torch, setTorch] = useState(false);
	const [validationResult, setValidationResult] = useState<ScanValidationState | null>(null);
	const [offlineQueue, setOfflineQueue] = useState<OfflineScanItem[]>([]);
	const [isSyncing, setIsSyncing] = useState(false);
	const isScanningRef = useRef(false);
	const [activeTripId, setActiveTripId] = useState<string | null>(null);

	// Load stored trip ID & offline queue on mount
	useEffect(() => {
		AsyncStorage.getItem(ACTIVE_TRIP_ID_KEY)
			.then((v) => {
				if (v) setActiveTripId(v);
			})
			.catch(() => {});

		loadOfflineQueue();
	}, []);

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

	// Real tRPC checkInPassenger mutation
	const checkInMutation = useMutation(
		trpc.drivers.checkInPassenger.mutationOptions()
	);

	// Batch sync mutation for offline queue
	const batchSyncMutation = useMutation(
		trpc.drivers.batchSyncCheckIns.mutationOptions()
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
				"Sync Complete",
				`Successfully processed ${offlineQueue.length} offline scans:\n• ${syncedCount} cleared for boarding\n• ${alreadyBoardedCount} previously boarded\n• ${rejectedCount} rejected`,
			);
		} catch (err: any) {
			DriverFeedback.invalidScan();
			Alert.alert("Sync Failed", err?.message ?? "Unable to sync offline scans. Will retry later.");
		} finally {
			setIsSyncing(false);
		}
	};

	if (!permission) {
		return <View className="flex-1 bg-zinc-950" />;
	}

	if (!permission.granted) {
		return (
			<SafeAreaView className="flex-1 bg-zinc-950 items-center justify-center p-6 text-center">
				<QrCode size={52} color="#e11d48" />
				<Text className="text-xl font-black text-white mt-4 text-center">
					Camera Access Required
				</Text>
				<Text className="text-xs text-zinc-400 mt-2 text-center max-w-xs leading-relaxed">
					Moja Driver uses the camera to scan and authenticate passenger QR ticket codes at terminal gates.
				</Text>
				<TouchableOpacity
					onPress={requestPermission}
					className="bg-rose-600 px-6 py-3.5 rounded-2xl mt-6 active:bg-rose-700 shadow-lg shadow-rose-600/30"
				>
					<Text className="text-white font-bold text-sm">Grant Camera Permission</Text>
				</TouchableOpacity>
			</SafeAreaView>
		);
	}

	const handleBarcodeScanned = async ({ data }: { data: string }) => {
		if (isScanningRef.current || validationResult) return;
		isScanningRef.current = true;

		try {
			// Raw camera output goes straight to the server — parseTicketToken in
			// the shared schema normalizes URLs, JSON payloads and pt. tokens.
			const res = await checkInMutation.mutateAsync({
				ticketToken: data,
				tripId: activeTripId ?? undefined,
			});

			if (res.alreadyBoarded) {
				DriverFeedback.warning();
				setValidationResult({
					status: "ALREADY_BOARDED",
					passengerName: res.passengerName,
					seatNumber: res.seatNumber,
					bookingReference: res.bookingReference,
					ticketToken: data,
					boardedAt: res.boardedAt,
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
					boardedAt: res.boardedAt,
				});
			}
		} catch (err: any) {
			const isNetworkErr =
				err?.message?.includes("Network") ||
				err?.message?.includes("fetch") ||
				err?.message?.includes("timeout") ||
				err?.message?.includes("Failed to fetch");

			if (isNetworkErr) {
				// Phase 7 (Gap #10b) — Save to offline queue for later reconciliation
				const newItem: OfflineScanItem = {
					ticketToken: data,
					tripId: activeTripId ?? undefined,
					scannedAt: new Date().toISOString(),
				};
				const updatedQueue = [...offlineQueue, newItem];
				void saveOfflineQueue(updatedQueue);

				DriverFeedback.successScan();
				setValidationResult({
					status: "QUEUED_OFFLINE",
					passengerName: "Queued for Sync",
					ticketToken: data,
					errorMessage: "Device is offline. Scan recorded locally and will sync when network is restored.",
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

	return (
		<SafeAreaView className="flex-1 bg-black">
			{/* Scanner Header */}
			<View className="px-5 py-3.5 flex-row items-center justify-between bg-zinc-950 border-b border-zinc-800/80">
				<View>
					<Text className="text-base font-black text-white">
						{t("scanTitle")}
					</Text>
					<Text className="text-[10px] text-zinc-400">
						{t("scanSubtitle")}
					</Text>
				</View>
				<TouchableOpacity
					onPress={() => setTorch(!torch)}
					className={`p-2.5 rounded-xl border ${
						torch ? "bg-amber-500 border-amber-400" : "bg-zinc-900 border-zinc-800"
					}`}
				>
					<Flashlight size={18} color={torch ? "#000000" : "#fafafa"} />
				</TouchableOpacity>
			</View>

			{/* Phase 7 (Gap #10b) — Offline Scans Queue Banner */}
			{offlineQueue.length > 0 && (
				<View className="bg-amber-500/15 border-b border-amber-500/30 px-5 py-2.5 flex-row items-center justify-between">
					<View className="flex-row items-center gap-2">
						<CloudOff size={16} color="#f59e0b" />
						<Text className="text-xs font-bold text-amber-400">
							{offlineQueue.length} {offlineQueue.length === 1 ? "scan" : "scans"} queued offline
						</Text>
					</View>
					<TouchableOpacity
						onPress={handleSyncOfflineQueue}
						disabled={isSyncing}
						className="bg-amber-500 active:bg-amber-600 px-3 py-1.5 rounded-lg flex-row items-center gap-1.5 shadow-md shadow-amber-500/20"
					>
						{isSyncing ? (
							<ActivityIndicator size="small" color="#000000" />
						) : (
							<RefreshCw size={12} color="#000000" />
						)}
						<Text className="text-xs font-black text-black uppercase tracking-wider">
							{isSyncing ? "Syncing…" : "Sync Now"}
						</Text>
					</TouchableOpacity>
				</View>
			)}

			{/* Camera Feed with Viewfinder Frame */}
			<View className="flex-1 relative items-center justify-center">
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
				<View className="size-64 border-2 border-rose-500 rounded-3xl relative items-center justify-center bg-black/10 shadow-2xl">
					<View className="w-48 h-0.5 bg-rose-500 shadow-lg shadow-rose-500" />
					<View className="absolute top-2 left-2 size-4 border-t-2 border-l-2 border-white" />
					<View className="absolute top-2 right-2 size-4 border-t-2 border-r-2 border-white" />
					<View className="absolute bottom-2 left-2 size-4 border-b-2 border-l-2 border-white" />
					<View className="absolute bottom-2 right-2 size-4 border-b-2 border-r-2 border-white" />
				</View>
				<Text className="text-xs font-semibold text-white/90 mt-5 bg-black/70 px-4 py-2 rounded-full border border-white/10 backdrop-blur">
					{t("scanHint")}
				</Text>
			</View>

			{/* Validation Result Modal Sheet */}
			<Modal
				visible={!!validationResult}
				transparent
				animationType="slide"
				onRequestClose={handleDismissSheet}
			>
				<View className="flex-1 bg-black/80 justify-end p-4">
					<View className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-2xl">
						{/* Status Header */}
						{validationResult?.status === "SUCCESS" && (
							<View className="flex-row items-center gap-3">
								<View className="size-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center">
									<CheckCircle size={28} color="#10b981" />
								</View>
								<View>
									<Text className="text-lg font-black text-white">
										{t("cleared")}
									</Text>
									<Text className="text-xs text-emerald-400 font-semibold">
										{t("clearedMsg")}
									</Text>
								</View>
							</View>
						)}

						{validationResult?.status === "QUEUED_OFFLINE" && (
							<View className="flex-row items-center gap-3">
								<View className="size-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 items-center justify-center">
									<CloudOff size={28} color="#06b6d4" />
								</View>
								<View>
									<Text className="text-lg font-black text-white">
										Recorded Offline
									</Text>
									<Text className="text-xs text-cyan-400 font-semibold">
										Saved locally • Passenger cleared to board
									</Text>
								</View>
							</View>
						)}

						{validationResult?.status === "ALREADY_BOARDED" && (
							<View className="flex-row items-center gap-3">
								<View className="size-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 items-center justify-center">
									<AlertTriangle size={28} color="#f59e0b" />
								</View>
								<View>
									<Text className="text-lg font-black text-white">
										{t("doubleBoardingAlert")}
									</Text>
									<Text className="text-xs text-amber-400 font-semibold">
										{t("doubleBoardingMsg")}
									</Text>
								</View>
							</View>
						)}

						{validationResult?.status === "ERROR" && (
							<View className="flex-row items-center gap-3">
								<View className="size-12 rounded-2xl bg-rose-500/10 border border-rose-500/20 items-center justify-center">
									<XCircle size={28} color="#f43f5e" />
								</View>
								<View>
									<Text className="text-lg font-black text-white">
										{t("invalidTicket")}
									</Text>
									<Text className="text-xs text-rose-400 font-semibold">
										{t("invalidTicketMsg")}
									</Text>
								</View>
							</View>
						)}

						{/* Detail Card */}
						<View className="bg-zinc-950 p-4 rounded-2xl border border-zinc-800 space-y-2.5">
							{validationResult?.passengerName && (
								<View className="flex-row items-center justify-between">
									<View className="flex-row items-center gap-2">
										<User size={15} color="#71717a" />
										<Text className="text-xs text-zinc-400">{t("labelPassenger")}</Text>
									</View>
									<Text className="text-sm font-bold text-white">
										{validationResult.passengerName}
									</Text>
								</View>
							)}

							{validationResult?.seatNumber && (
								<View className="flex-row items-center justify-between">
									<View className="flex-row items-center gap-2">
										<Armchair size={15} color="#71717a" />
										<Text className="text-xs text-zinc-400">{t("labelSeat")}</Text>
									</View>
									<View className="bg-rose-600/15 px-3 py-1 rounded-lg border border-rose-500/30">
										<Text className="text-base font-black text-rose-400 font-mono">
											{validationResult.seatNumber}
										</Text>
									</View>
								</View>
							)}

							{validationResult?.bookingReference && (
								<View className="flex-row items-center justify-between">
									<View className="flex-row items-center gap-2">
										<Ticket size={15} color="#71717a" />
										<Text className="text-xs text-zinc-400">{t("labelBookingRef")}</Text>
									</View>
									<Text className="text-xs font-mono font-bold text-zinc-300">
										{validationResult.bookingReference}
									</Text>
								</View>
							)}

							{validationResult?.errorMessage && (
								<Text className="text-xs text-zinc-400 pt-1 leading-relaxed">
									{validationResult.errorMessage}
								</Text>
							)}
						</View>

						{/* Action Button */}
						<TouchableOpacity
							onPress={handleDismissSheet}
							className={`h-12 rounded-xl items-center justify-center ${
								validationResult?.status === "SUCCESS"
									? "bg-emerald-600 active:bg-emerald-700"
									: validationResult?.status === "ALREADY_BOARDED"
										? "bg-amber-500 active:bg-amber-600"
										: "bg-rose-600 active:bg-rose-700"
							}`}
						>
							<Text
								className={`text-sm font-black ${
									validationResult?.status === "ALREADY_BOARDED"
										? "text-black"
										: "text-white"
								}`}
							>
							{validationResult?.status === "SUCCESS"
								? t("confirmNext")
								: t("dismissReturn")}
							</Text>
						</TouchableOpacity>
					</View>
				</View>
			</Modal>
		</SafeAreaView>
	);
}
