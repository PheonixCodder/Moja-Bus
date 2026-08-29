import React, { useState } from "react";
import {
	View,
	Text,
	TextInput,
	Modal,
	Pressable,
	StyleSheet,
} from "react-native";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";

interface CounterSheetProps {
	open: boolean;
	onClose: () => void;
	onSubmit: (input: {
		counterSalaryCFA: number;
		counterStartDate?: string;
		note?: string;
	}) => void;
	submitting: boolean;
}

export function CounterSheet({
	open,
	onClose,
	onSubmit,
	submitting,
}: CounterSheetProps) {
	const { t } = useTranslation("offers");
	const [salary, setSalary] = useState("");
	const [startDate, setStartDate] = useState("");
	const [note, setNote] = useState("");

	const salaryNum = Number(salary.replace(/[^\d]/g, ""));
	const valid = Number.isFinite(salaryNum) && salaryNum >= 1000;

	const reset = () => {
		setSalary("");
		setStartDate("");
		setNote("");
	};

	return (
		<Modal
			visible={open}
			transparent
			animationType="slide"
			onRequestClose={() => {
				reset();
				onClose();
			}}
		>
			<Pressable
				style={styles.backdrop}
				onPress={() => {
					reset();
					onClose();
				}}
			/>
			<View style={styles.sheetContainer}>
				<View style={styles.dragHandle} />
				<Text style={styles.sheetTitle}>
					{t("counter.title")}
				</Text>
				<Text style={styles.sheetSubtitle}>
					{t("counter.subtitle")}
				</Text>

				<View style={styles.fieldGroup}>
					<Text style={styles.fieldLabel}>
						{t("counter.salaryLabel")}
					</Text>
					<TextInput
						style={styles.textInput}
						placeholderTextColor="#71717a"
						keyboardType="number-pad"
						placeholder={t("counter.salaryPlaceholder")}
						value={salary}
						onChangeText={setSalary}
					/>
				</View>

				<View style={styles.fieldGroup}>
					<Text style={styles.fieldLabel}>
						{t("counter.startDateLabel")}
					</Text>
					<TextInput
						style={styles.textInput}
						placeholderTextColor="#71717a"
						placeholder={t("counter.startDatePlaceholder")}
						value={startDate}
						onChangeText={setStartDate}
					/>
				</View>

				<View style={styles.fieldGroup}>
					<Text style={styles.fieldLabel}>
						{t("counter.noteLabel")}
					</Text>
					<TextInput
						style={[styles.textInput, styles.textArea]}
						placeholderTextColor="#71717a"
						multiline
						numberOfLines={3}
						maxLength={2000}
						placeholder={t("counter.notePlaceholder")}
						value={note}
						onChangeText={setNote}
					/>
				</View>

				<View style={styles.buttonRow}>
					<Button
						title={t("counter.cancel")}
						variant="outline"
						size="md"
						onPress={() => {
							reset();
							onClose();
						}}
						className="flex-1"
					/>
					<Button
						title={t("counter.submit")}
						variant="primary"
						size="md"
						disabled={!valid || submitting}
						loading={submitting}
						onPress={() => {
							if (!valid) return;
							onSubmit({
								counterSalaryCFA: salaryNum,
								counterStartDate: startDate || undefined,
								note: note.trim() || undefined,
							});
							reset();
						}}
						className="flex-1"
					/>
				</View>
			</View>
		</Modal>
	);
}

const styles = StyleSheet.create({
	backdrop: {
		flex: 1,
		backgroundColor: "rgba(0,0,0,0.6)",
	},
	sheetContainer: {
		backgroundColor: "#18181b",
		borderTopLeftRadius: 28,
		borderTopRightRadius: 28,
		borderWidth: 1,
		borderColor: "#27272a",
		paddingHorizontal: 20,
		paddingTop: 12,
		paddingBottom: 36,
		gap: 14,
	},
	dragHandle: {
		alignSelf: "center",
		height: 4,
		width: 44,
		borderRadius: 999,
		backgroundColor: "#3f3f46",
		marginBottom: 4,
	},
	sheetTitle: {
		fontSize: 18,
		fontWeight: "800",
		color: "#fafafa",
		letterSpacing: -0.3,
	},
	sheetSubtitle: {
		fontSize: 12,
		color: "#a1a1aa",
		lineHeight: 16,
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
		borderRadius: 14,
		borderWidth: 1,
		borderColor: "#27272a",
		backgroundColor: "#09090b",
		paddingHorizontal: 14,
		paddingVertical: 12,
		color: "#fafafa",
		fontSize: 14,
	},
	textArea: {
		minHeight: 76,
		textAlignVertical: "top",
	},
	buttonRow: {
		flexDirection: "row",
		gap: 12,
		paddingTop: 6,
	},
});
