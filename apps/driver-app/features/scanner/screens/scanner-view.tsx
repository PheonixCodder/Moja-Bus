import React, { useState, useRef, useEffect } from "react";
import {
	View,
	Text,
	TouchableOpacity,
	StyleSheet,
	Alert,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { CameraView, useCameraPermissions } from "expo-camera";
import { useMutation } from "@tanstack/react-query";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	QrCode01Icon,
	FlashlightIcon,
	CloudSavingDone01Icon,
} from "@hugeicons/core-free-icons";
import { useTRPC } from "@/lib/trpc";
import { DriverFeedback } from "@/lib/haptics";
import { useTranslation } from "react-i18next";
import { ACTIVE_TRIP_ID_KEY } from "@/lib/telemetry";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Button } from "@/components/ui/Button";
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
	const trpc = useTRPC();
	const insets = useSafeAreaInsets();

	const [permission, requestPermission] = useCameraPermissions();
	const [torch, setTorch] = useState(false);
	const [validationResult, setValidationResult] = useState<TicketValidationResult | null>(null);
	const [offlineQueue, setOfflineQueue] = useState<OfflineScanItem[]>([]);
	const [isSyncing, setIsSyncing] = useState(false);
	const isScanningRef = useRef(false);
	const [activeTripId, setActiveTripId] = useState<string | null>(null);

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

	const checkInMutation = useMutation(
		trpc.drivers.checkInPassenger.mutationOptions()
	);

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
				"Synchronisation Terminée",
				`${offlineQueue.length} scans hors-ligne traités :\n• ${syncedCount} validés pour embarquement\n• ${alreadyBoardedCount} déjà enregistrés\n• ${rejectedCount} rejetés`,
			);
		} catch (err: any) {
			DriverFeedback.invalidScan();
			Alert.alert("Échec de synchronisation", err?.message ?? "Impossible de synchroniser. Réessai ultérieur.");
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
				<Text style={styles.permissionTitle}>Accès Caméra Requis</Text>
				<Text style={styles.permissionSubtitle}>
					Moja Driver utilise la caméra pour scanner et valider les billets QR passagers aux portes d'embarquement.
				</Text>
				<Button
					title="Autoriser la caméra"
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
					tripId: activeTripId ?? undefined,
					scannedAt: new Date().toISOString(),
				};
				const updatedQueue = [...offlineQueue, newItem];
				void saveOfflineQueue(updatedQueue);

				DriverFeedback.successScan();
				setValidationResult({
					status: "QUEUED_OFFLINE",
					passengerName: "Mis en attente de synchronisation",
					ticketToken: data,
					errorMessage: "Appareil hors ligne. Scan enregistré localement, synchronisation dès le retour du réseau.",
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
		<View style={styles.root}>
			{/* Scanner Header */}
			<View style={[styles.headerBar, { paddingTop: insets.top + 10 }]}>
				<View>
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

			{/* Offline Scans Queue Banner */}
			{offlineQueue.length > 0 && (
				<View style={styles.offlineBanner}>
					<View style={styles.offlineLeft}>
						<HugeiconsIcon icon={CloudSavingDone01Icon} size={18} color="#f59e0b" />
						<Text style={styles.offlineText}>
							{offlineQueue.length} {offlineQueue.length === 1 ? "scan" : "scans"} en attente
						</Text>
					</View>
					<Button
						title={isSyncing ? "En cours…" : "Synchroniser"}
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
	headerTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#fafafa",
	},
	headerSubtitle: {
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
