import React from "react";
import { View, Text, Modal, StyleSheet } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	CheckmarkCircle02Icon,
	CancelCircleIcon,
	Alert02Icon,
	CloudSavingDone01Icon,
	User02Icon,
	ArmchairIcon,
	Ticket01Icon,
} from "@hugeicons/core-free-icons";
import { useTranslation } from "react-i18next";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

export type ValidationStatus = "SUCCESS" | "QUEUED_OFFLINE" | "ALREADY_BOARDED" | "ERROR";

export interface TicketValidationResult {
	status: ValidationStatus;
	passengerName?: string;
	seatNumber?: string | number;
	bookingReference?: string;
	ticketToken: string;
	boardedAt?: string;
	errorMessage?: string;
}

interface TicketResultModalProps {
	result: TicketValidationResult | null;
	onDismiss: () => void;
}

export function TicketResultModal({
	result,
	onDismiss,
}: TicketResultModalProps) {
	const { t } = useTranslation("scanner");

	if (!result) return null;

	return (
		<Modal
			visible={!!result}
			transparent
			animationType="slide"
			onRequestClose={onDismiss}
		>
			<View style={styles.backdrop}>
				<View style={styles.sheetBox}>
					{/* Status Header */}
					{result.status === "SUCCESS" && (
						<View style={styles.headerRow}>
							<View style={[styles.iconWrap, styles.iconSuccess]}>
								<HugeiconsIcon icon={CheckmarkCircle02Icon} size={28} color="#10b981" />
							</View>
							<View style={styles.headerTexts}>
								<Text style={styles.titleText}>{t("cleared")}</Text>
								<Text style={styles.subSuccess}>{t("clearedMsg")}</Text>
							</View>
						</View>
					)}

					{result.status === "QUEUED_OFFLINE" && (
						<View style={styles.headerRow}>
							<View style={[styles.iconWrap, styles.iconQueued]}>
								<HugeiconsIcon icon={CloudSavingDone01Icon} size={28} color="#06b6d4" />
							</View>
							<View style={styles.headerTexts}>
							<Text style={styles.titleText}>{t("offlineTitle")}</Text>
							<Text style={styles.subQueued}>{t("offlineMsg")}</Text>
							</View>
						</View>
					)}

					{result.status === "ALREADY_BOARDED" && (
						<View style={styles.headerRow}>
							<View style={[styles.iconWrap, styles.iconWarning]}>
								<HugeiconsIcon icon={Alert02Icon} size={28} color="#f59e0b" />
							</View>
							<View style={styles.headerTexts}>
								<Text style={styles.titleText}>{t("doubleBoardingAlert")}</Text>
								<Text style={styles.subWarning}>{t("doubleBoardingMsg")}</Text>
							</View>
						</View>
					)}

					{result.status === "ERROR" && (
						<View style={styles.headerRow}>
							<View style={[styles.iconWrap, styles.iconError]}>
								<HugeiconsIcon icon={CancelCircleIcon} size={28} color="#ef4444" />
							</View>
							<View style={styles.headerTexts}>
								<Text style={styles.titleText}>{t("invalidTicket")}</Text>
								<Text style={styles.subError}>{t("invalidTicketMsg")}</Text>
							</View>
						</View>
					)}

					{/* Detail Card */}
					<Card className="bg-[#09090b] p-4 gap-2.5">
						{result.passengerName && (
							<View style={styles.detailRow}>
								<View style={styles.labelRow}>
									<HugeiconsIcon icon={User02Icon} size={15} color="#71717a" />
									<Text style={styles.labelText}>{t("labelPassenger")}</Text>
								</View>
								<Text style={styles.valueText}>{result.passengerName}</Text>
							</View>
						)}

						{result.seatNumber && (
							<View style={styles.detailRow}>
								<View style={styles.labelRow}>
									<HugeiconsIcon icon={ArmchairIcon} size={15} color="#71717a" />
									<Text style={styles.labelText}>{t("labelSeat")}</Text>
								</View>
								<Badge variant="brand" label={`${t("seatPrefix")} ${result.seatNumber}`} />
							</View>
						)}

						{result.bookingReference && (
							<View style={styles.detailRow}>
								<View style={styles.labelRow}>
									<HugeiconsIcon icon={Ticket01Icon} size={15} color="#71717a" />
									<Text style={styles.labelText}>{t("labelBookingRef")}</Text>
								</View>
								<Text style={styles.monoValue}>{result.bookingReference}</Text>
							</View>
						)}

						{result.errorMessage && (
							<Text style={styles.errorDesc}>{result.errorMessage}</Text>
						)}
					</Card>

					{/* Action Button */}
					<Button
						title={result.status === "SUCCESS" ? t("confirmNext") : t("dismissReturn")}
						variant={
							result.status === "SUCCESS"
								? "success"
								: result.status === "ALREADY_BOARDED"
									? "warning"
									: "primary"
						}
						size="lg"
						onPress={onDismiss}
						textClassName={result.status === "ALREADY_BOARDED" ? "text-black" : undefined}
					/>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.8)",
		justifyContent: "flex-end",
		padding: 16,
	},
	sheetBox: {
		backgroundColor: "#18181b",
		borderWidth: 1,
		borderColor: "#27272a",
		borderRadius: 28,
		padding: 24,
		gap: 16,
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 14,
	},
	iconWrap: {
		width: 48,
		height: 48,
		borderRadius: 16,
		alignItems: "center",
		justifyContent: "center",
		borderWidth: 1,
	},
	iconSuccess: {
		backgroundColor: "rgba(16, 185, 129, 0.15)",
		borderColor: "rgba(16, 185, 129, 0.3)",
	},
	iconQueued: {
		backgroundColor: "rgba(6, 182, 212, 0.15)",
		borderColor: "rgba(6, 182, 212, 0.3)",
	},
	iconWarning: {
		backgroundColor: "rgba(245, 158, 11, 0.15)",
		borderColor: "rgba(245, 158, 11, 0.3)",
	},
	iconError: {
		backgroundColor: "rgba(239, 68, 68, 0.15)",
		borderColor: "rgba(239, 68, 68, 0.3)",
	},
	headerTexts: {
		gap: 2,
		flex: 1,
	},
	titleText: {
		fontSize: 18,
		fontWeight: "800",
		color: "#fafafa",
		letterSpacing: -0.3,
	},
	subSuccess: {
		fontSize: 12,
		fontWeight: "600",
		color: "#34d399",
	},
	subQueued: {
		fontSize: 12,
		fontWeight: "600",
		color: "#22d3ee",
	},
	subWarning: {
		fontSize: 12,
		fontWeight: "600",
		color: "#fbbf24",
	},
	subError: {
		fontSize: 12,
		fontWeight: "600",
		color: "#f87171",
	},
	detailRow: {
		flexDirection: "row",
		alignItems: "center",
		justifyContent: "space-between",
	},
	labelRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 8,
	},
	labelText: {
		fontSize: 12,
		color: "#a1a1aa",
	},
	valueText: {
		fontSize: 14,
		fontWeight: "700",
		color: "#fafafa",
	},
	monoValue: {
		fontSize: 12,
		fontFamily: "monospace",
		fontWeight: "700",
		color: "#d4d4d8",
	},
	errorDesc: {
		fontSize: 12,
		color: "#a1a1aa",
		paddingTop: 4,
		lineHeight: 18,
	},
});
