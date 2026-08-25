import React, { useState, useEffect } from "react";
import {
	View,
	Text,
	Modal,
	TouchableOpacity,
	StyleSheet,
	ActivityIndicator,
} from "react-native";
import {
	AlertTriangle,
	Bus,
	Clock,
	MapPin,
	Users,
	CheckCircle,
	XCircle,
} from "lucide-react-native";
import { DriverFeedback } from "@/lib/haptics";
import { useTranslation } from "react-i18next";

/**
 * Phase 31 (F-DV-14) — locale-aware departure formatting. Falls back to the
 * raw ISO string only if the timestamp is unparseable (never shows a fake
 * date).
 */
function formatDeparture(iso: string): string {
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return iso;
	return date.toLocaleString(undefined, {
		dateStyle: "short",
		timeStyle: "short",
	});
}

export interface UrgentDispatchPayload {
	tripId: string;
	carrierName: string;
	busPlate: string;
	originName: string;
	destinationName: string;
	/**
	 * Phase 31 (F-DV-14) — ISO timestamp from the server. The device locale
	 * formats it; the old pre-formatted fr-FR string could not be localized
	 * or used for countdowns.
	 */
	departureTimeIso: string;
	bookedPassengers: number;
	totalSeats: number;
}

interface UrgentDispatchModalProps {
	visible: boolean;
	dispatch: UrgentDispatchPayload | null;
	onAccept: (tripId: string) => void;
	onDecline: (tripId: string) => void;
}

export function UrgentDispatchModal({
	visible,
	dispatch,
	onAccept,
	onDecline,
}: UrgentDispatchModalProps) {
	const { t } = useTranslation("dispatch");
	const [timeLeft, setTimeLeft] = useState(30);

	useEffect(() => {
		if (!visible || !dispatch) {
			setTimeLeft(30);
			return;
		}

		DriverFeedback.warning();

		const interval = setInterval(() => {
			setTimeLeft((prev) => {
				if (prev <= 1) {
					clearInterval(interval);
					onDecline(dispatch.tripId);
					return 0;
				}
				return prev - 1;
			});
		}, 1000);

		return () => clearInterval(interval);
	}, [visible, dispatch]);

	if (!visible || !dispatch) return null;

	const handleAccept = () => {
		DriverFeedback.successScan();
		onAccept(dispatch.tripId);
	};

	const handleDecline = () => {
		DriverFeedback.tap();
		onDecline(dispatch.tripId);
	};

	return (
		<Modal visible={visible} transparent animationType="fade">
			<View style={styles.backdrop}>
				<View style={styles.modalCard}>
					{/* Header with Urgent Badge & 30s Countdown */}
					<View style={styles.header}>
						<View style={styles.alertBadge}>
							<AlertTriangle size={16} color="#f59e0b" />
                        <Text style={styles.alertText}>{t("urgentDispatch")}</Text>
						</View>
						<View style={styles.countdownContainer}>
							<Text style={styles.countdownText}>{timeLeft}s</Text>
						</View>
					</View>

					{/* Route Details Card */}
					<View style={styles.routeCard}>
						<View style={styles.carrierRow}>
							<View style={styles.busIconContainer}>
								<Bus size={18} color="#e11d48" />
							</View>
							<View>
								<Text style={styles.carrierTitle}>{dispatch.carrierName}</Text>
								<Text style={styles.busPlateText}>{t("busPlate", { plate: dispatch.busPlate })}</Text>
							</View>
						</View>

						{/* Route Sequence */}
						<View style={styles.stopTimeline}>
							<View style={styles.stopRow}>
								<View style={styles.originDot} />
								<Text style={styles.stopName} numberOfLines={1}>
									{dispatch.originName}
								</Text>
							</View>
							<View style={styles.timelineTrack} />
							<View style={styles.stopRow}>
								<View style={styles.destDot} />
								<Text style={styles.stopName} numberOfLines={1}>
									{dispatch.destinationName}
								</Text>
							</View>
						</View>

						{/* Metadata */}
						<View style={styles.metaRow}>
							<View style={styles.metaItem}>
								<Clock size={13} color="#71717a" />
								<Text style={styles.metaText}>
									{t("departs", { time: formatDeparture(dispatch.departureTimeIso) })}
								</Text>
							</View>
							<View style={styles.metaItem}>
								<Users size={13} color="#71717a" />
								<Text style={styles.metaText}>
									{t("passengersCount", {
										booked: dispatch.bookedPassengers,
										total: dispatch.totalSeats,
									})}
								</Text>
							</View>
						</View>
					</View>

					{/* Action Buttons */}
					<View style={styles.buttonRow}>
						<TouchableOpacity
							onPress={handleDecline}
							style={styles.declineButton}
							activeOpacity={0.8}
						>
							<Text style={styles.declineText}>{t("decline")}</Text>
						</TouchableOpacity>

						<TouchableOpacity
							onPress={handleAccept}
							style={styles.acceptButton}
							activeOpacity={0.8}
						>
							<Text style={styles.acceptText}>{t("accept")}</Text>
						</TouchableOpacity>
					</View>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.85)",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  modalCard: {
    width: "100%",
    backgroundColor: "#18181b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 24,
    padding: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 16,
  },
  alertBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: "rgba(245, 158, 11, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(245, 158, 11, 0.3)",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  alertText: {
    fontSize: 11,
    fontWeight: "800",
    color: "#f59e0b",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  countdownContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "#e11d48",
    alignItems: "center",
    justifyContent: "center",
  },
  countdownText: {
    fontSize: 12,
    fontWeight: "900",
    color: "#ffffff",
    fontFamily: "monospace",
  },
  routeCard: {
    backgroundColor: "#09090b",
    borderWidth: 1,
    borderColor: "#27272a",
    borderRadius: 16,
    padding: 14,
    marginBottom: 16,
  },
  carrierRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: "rgba(39, 39, 42, 0.6)",
    paddingBottom: 10,
    marginBottom: 10,
  },
  busIconContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: "rgba(225, 29, 72, 0.1)",
    borderWidth: 1,
    borderColor: "rgba(225, 29, 72, 0.2)",
    alignItems: "center",
    justifyContent: "center",
  },
  carrierTitle: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
  },
  busPlateText: {
    fontSize: 11,
    color: "#a1a1aa",
    fontFamily: "monospace",
  },
  stopTimeline: {
    paddingVertical: 4,
  },
  stopRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  originDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#10b981",
  },
  destDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e11d48",
  },
  timelineTrack: {
    width: 2,
    height: 10,
    backgroundColor: "#27272a",
    marginLeft: 3,
    marginVertical: 2,
  },
  stopName: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
    flex: 1,
  },
  metaRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 1,
    borderTopColor: "rgba(39, 39, 42, 0.6)",
    paddingTop: 10,
    marginTop: 10,
  },
  metaItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  metaText: {
    fontSize: 11,
    color: "#a1a1aa",
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
  },
  declineButton: {
    flex: 1,
    height: 48,
    backgroundColor: "#27272a",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
  },
  declineText: {
    fontSize: 13,
    fontWeight: "700",
    color: "#a1a1aa",
  },
  acceptButton: {
    flex: 2,
    height: 48,
    backgroundColor: "#e11d48",
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#e11d48",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  acceptText: {
    fontSize: 13,
    fontWeight: "800",
    color: "#ffffff",
  },
});
