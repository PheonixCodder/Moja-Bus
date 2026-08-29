import React from "react";
import {
	View,
	Text,
	TextInput,
	Modal,
	TouchableOpacity,
	StyleSheet,
} from "react-native";
import { DriverFeedback } from "@/lib/haptics";
import { Button } from "@/components/ui/Button";

export const DELAY_REASONS = [
	{ value: "TRAFFIC", label: "Embouteillage / Circulation" },
	{ value: "MECHANICAL_ISSUE", label: "Incident Mécanique" },
	{ value: "POLICE_CHECKPOINT", label: "Contrôle Routier / Barrage" },
	{ value: "WEATHER", label: "Météo / Intempéries" },
	{ value: "PASSENGER_DELAY", label: "Attente Passager / Bagages" },
	{ value: "OTHER", label: "Autre Raison" },
];

interface DelayModalProps {
	open: boolean;
	onClose: () => void;
	delayMinutes: string;
	onDelayMinutesChange: (val: string) => void;
	delayReason: string;
	onDelayReasonChange: (val: string) => void;
	delayNote: string;
	onDelayNoteChange: (val: string) => void;
	onSubmit: () => void;
	submitting?: boolean;
}

export function DelayModal({
	open,
	onClose,
	delayMinutes,
	onDelayMinutesChange,
	delayReason,
	onDelayReasonChange,
	delayNote,
	onDelayNoteChange,
	onSubmit,
	submitting,
}: DelayModalProps) {
	return (
		<Modal
			visible={open}
			transparent
			animationType="slide"
			onRequestClose={onClose}
		>
			<View style={styles.backdrop}>
				<View style={styles.modalSheet}>
					<View>
						<Text style={styles.modalTitle}>Signaler un Retard sur la Ligne</Text>
						<Text style={styles.modalSubtitle}>
							Notifie les passagers en attente avec une estimation actualisée en temps réel.
						</Text>
					</View>

					<View style={styles.fieldGroup}>
						<Text style={styles.fieldLabel}>Retard Estimé (Minutes)</Text>
						<TextInput
							style={styles.textInput}
							keyboardType="number-pad"
							value={delayMinutes}
							onChangeText={onDelayMinutesChange}
						/>
					</View>

					<View style={styles.fieldGroup}>
						<Text style={styles.fieldLabel}>Motif du Retard</Text>
						<View style={styles.reasonsGrid}>
							{DELAY_REASONS.map((option) => {
								const isSelected = delayReason === option.value;
								return (
									<TouchableOpacity
										key={option.value}
										onPress={() => {
											DriverFeedback.tap();
											onDelayReasonChange(option.value);
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
											{option.label}
										</Text>
									</TouchableOpacity>
								);
							})}
						</View>
					</View>

					<View style={styles.fieldGroup}>
						<Text style={styles.fieldLabel}>Précisions complémentaires (optionnel)</Text>
						<TextInput
							style={styles.textInput}
							placeholder="ex: Embouteillage dense vers Toumodi"
							placeholderTextColor="#71717a"
							value={delayNote}
							onChangeText={onDelayNoteChange}
						/>
					</View>

					<View style={styles.buttonRow}>
						<Button
							title="Annuler"
							variant="outline"
							size="md"
							onPress={onClose}
							className="flex-1"
						/>
						<Button
							title="Envoyer le signalement"
							variant="primary"
							size="md"
							loading={submitting}
							onPress={onSubmit}
							className="flex-1"
						/>
					</View>
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
	},
	modalSheet: {
		backgroundColor: "#18181b",
		borderTopWidth: 1,
		borderTopColor: "#27272a",
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		padding: 24,
		gap: 16,
	},
	modalTitle: {
		fontSize: 20,
		fontWeight: "800",
		color: "#fafafa",
		letterSpacing: -0.3,
	},
	modalSubtitle: {
		fontSize: 12,
		color: "#a1a1aa",
		marginTop: 2,
	},
	fieldGroup: {
		gap: 6,
	},
	fieldLabel: {
		fontSize: 11,
		fontWeight: "700",
		color: "#d4d4d8",
		textTransform: "uppercase",
		letterSpacing: 0.5,
	},
	textInput: {
		backgroundColor: "#09090b",
		borderWidth: 1,
		borderColor: "#27272a",
		borderRadius: 14,
		paddingHorizontal: 16,
		height: 50,
		color: "#fafafa",
		fontSize: 14,
		fontWeight: "600",
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
		borderWidth: 1,
		borderColor: "#27272a",
		backgroundColor: "#09090b",
	},
	reasonChipSelected: {
		backgroundColor: "rgba(238, 35, 124, 0.15)",
		borderColor: "#ee237c",
	},
	reasonText: {
		fontSize: 12,
		fontWeight: "700",
		color: "#a1a1aa",
	},
	reasonTextSelected: {
		color: "#ee237c",
	},
	buttonRow: {
		flexDirection: "row",
		gap: 12,
		paddingTop: 8,
	},
});
