import React from "react";
import {
	View,
	Text,
	TextInput,
	Modal,
	TouchableOpacity,
	StyleSheet,
	ScrollView,
} from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Alert02Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { DriverFeedback } from "@/lib/haptics";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import type { DriverBreakdownType } from "@moja/schemas";

export const BREAKDOWN_TYPES: Array<{
	value: DriverBreakdownType;
	labelKey: string;
}> = [
	{ value: "ENGINE", labelKey: "breakdownTypeEngine" },
	{ value: "TIRE", labelKey: "breakdownTypeTire" },
	{ value: "TRANSMISSION", labelKey: "breakdownTypeTransmission" },
	{ value: "ELECTRICAL", labelKey: "breakdownTypeElectrical" },
	{ value: "BRAKE", labelKey: "breakdownTypeBrake" },
	{ value: "ACCIDENT", labelKey: "breakdownTypeAccident" },
	{ value: "OTHER", labelKey: "breakdownTypeOther" },
];

interface BreakdownModalProps {
	open: boolean;
	onClose: () => void;
	breakdownType: DriverBreakdownType;
	onBreakdownTypeChange: (val: DriverBreakdownType) => void;
	description: string;
	onDescriptionChange: (val: string) => void;
	delayMinutes: string;
	onDelayMinutesChange: (val: string) => void;
	currentLocation: {
		latitude: number;
		longitude: number;
		accuracy?: number;
	} | null;
	onSubmit: () => void;
	submitting?: boolean;
}

export function BreakdownModal({
	open,
	onClose,
	breakdownType,
	onBreakdownTypeChange,
	description,
	onDescriptionChange,
	delayMinutes,
	onDelayMinutesChange,
	currentLocation,
	onSubmit,
	submitting,
}: BreakdownModalProps) {
	const { t } = useTranslation("live");

	return (
		<Modal
			visible={open}
			transparent
			animationType="slide"
			onRequestClose={onClose}
		>
			<View style={styles.backdrop}>
				<View style={styles.modalSheet}>
					<ScrollView
						showsVerticalScrollIndicator={false}
						contentContainerStyle={styles.scrollContent}
					>
						{/* Header */}
						<View style={styles.headerRow}>
							<View style={styles.iconWrap}>
								<HugeiconsIcon icon={Alert02Icon} size={22} color="#ef4444" />
							</View>
							<View style={{ flex: 1, gap: 2 }}>
								<Text style={styles.modalTitle}>{t("breakdownTitle")}</Text>
								<Text style={styles.modalSubtitle}>{t("breakdownSubtitle")}</Text>
							</View>
						</View>

						{/* GPS Position Fix Preview */}
						<View style={styles.gpsCard}>
							<HugeiconsIcon icon={Location01Icon} size={16} color="#38bdf8" />
							<View style={{ flex: 1 }}>
								<Text style={styles.gpsTitle}>{t("breakdownGpsFix")}</Text>
								<Text style={styles.gpsCoords}>
									{currentLocation
										? `${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)} (±${Math.round(currentLocation.accuracy ?? 10)}m)`
										: t("breakdownGpsWaiting")}
								</Text>
							</View>
						</View>

						{/* Failure Category */}
						<View style={styles.fieldGroup}>
							<Text style={styles.fieldLabel}>{t("breakdownTypeLabel")}</Text>
							<View style={styles.reasonsGrid}>
								{BREAKDOWN_TYPES.map((option) => {
									const isSelected = breakdownType === option.value;
									return (
										<TouchableOpacity
											key={option.value}
											onPress={() => {
												DriverFeedback.tap();
												onBreakdownTypeChange(option.value);
											}}
											activeOpacity={0.8}
											style={[
												styles.reasonChip,
												isSelected && styles.reasonChipSelected,
											]}
										>
											<Text
												style={[
													styles.reasonText,
													isSelected && styles.reasonTextSelected,
												]}
											>
												{t(option.labelKey)}
											</Text>
										</TouchableOpacity>
									);
								})}
							</View>
						</View>

						{/* Delay Minutes Estimate */}
						<View style={styles.fieldGroup}>
							<Text style={styles.fieldLabel}>{t("breakdownDelayLabel")}</Text>
							<TextInput
								style={styles.textInput}
								keyboardType="number-pad"
								value={delayMinutes}
								onChangeText={onDelayMinutesChange}
							/>
						</View>

						{/* Incident Notes / Description */}
						<View style={styles.fieldGroup}>
							<Text style={styles.fieldLabel}>{t("breakdownDescLabel")}</Text>
							<TextInput
								style={[styles.textInput, styles.textArea]}
								multiline
								numberOfLines={3}
								placeholder={t("breakdownDescPlaceholder")}
								placeholderTextColor="#71717a"
								value={description}
								onChangeText={onDescriptionChange}
							/>
						</View>

						{/* Action Buttons */}
						<View style={styles.buttonRow}>
							<Button
								title={t("cancel") || "Annuler"}
								variant="outline"
								size="md"
								onPress={onClose}
								className="flex-1"
							/>
							<Button
								title={t("breakdownSubmit")}
								variant="destructive"
								size="md"
								loading={submitting}
								onPress={onSubmit}
								icon={<HugeiconsIcon icon={Alert02Icon} size={16} color="#ffffff" />}
								className="flex-1"
							/>
						</View>
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: "rgba(0, 0, 0, 0.8)",
		justifyContent: "flex-end",
	},
	modalSheet: {
		backgroundColor: "#18181b",
		borderTopLeftRadius: 24,
		borderTopRightRadius: 24,
		padding: 20,
		borderTopWidth: 1,
		borderColor: "rgba(239, 68, 68, 0.3)",
		maxHeight: "85%",
	},
	scrollContent: {
		gap: 18,
		paddingBottom: 16,
	},
	headerRow: {
		flexDirection: "row",
		alignItems: "center",
		gap: 12,
	},
	iconWrap: {
		padding: 10,
		borderRadius: 14,
		backgroundColor: "rgba(239, 68, 68, 0.15)",
	},
	modalTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#fafafa",
	},
	modalSubtitle: {
		fontSize: 12,
		color: "#a1a1aa",
		lineHeight: 16,
	},
	gpsCard: {
		flexDirection: "row",
		alignItems: "center",
		gap: 10,
		padding: 12,
		borderRadius: 12,
		backgroundColor: "rgba(56, 189, 248, 0.08)",
		borderWidth: 1,
		borderColor: "rgba(56, 189, 248, 0.2)",
	},
	gpsTitle: {
		fontSize: 11,
		fontWeight: "700",
		color: "#38bdf8",
	},
	gpsCoords: {
		fontSize: 12,
		color: "#fafafa",
		fontWeight: "600",
	},
	fieldGroup: {
		gap: 8,
	},
	fieldLabel: {
		fontSize: 13,
		fontWeight: "600",
		color: "#e4e4e7",
	},
	textInput: {
		backgroundColor: "#27272a",
		borderRadius: 12,
		borderWidth: 1,
		borderColor: "#3f3f46",
		paddingHorizontal: 14,
		paddingVertical: 10,
		color: "#fafafa",
		fontSize: 14,
	},
	textArea: {
		minHeight: 70,
		textAlignVertical: "top",
	},
	reasonsGrid: {
		flexDirection: "row",
		flexWrap: "wrap",
		gap: 8,
	},
	reasonChip: {
		paddingHorizontal: 12,
		paddingVertical: 8,
		borderRadius: 10,
		backgroundColor: "#27272a",
		borderWidth: 1,
		borderColor: "#3f3f46",
	},
	reasonChipSelected: {
		backgroundColor: "rgba(239, 68, 68, 0.2)",
		borderColor: "#ef4444",
	},
	reasonText: {
		fontSize: 12,
		color: "#a1a1aa",
		fontWeight: "600",
	},
	reasonTextSelected: {
		color: "#ef4444",
		fontWeight: "700",
	},
	buttonRow: {
		flexDirection: "row",
		gap: 12,
		marginTop: 8,
	},
});
