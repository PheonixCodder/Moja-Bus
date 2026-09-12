import React from "react";
import {
	View,
	Text,
	TextInput,
	Modal,
	Pressable,
} from "react-native";
import { DriverFeedback } from "@/lib/haptics";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";

export const DELAY_REASONS = [
	{ value: "TRAFFIC", labelKey: "delay.reasons.TRAFFIC" },
	{ value: "MECHANICAL_ISSUE", labelKey: "delay.reasons.MECHANICAL_ISSUE" },
	{ value: "POLICE_CHECKPOINT", labelKey: "delay.reasons.POLICE_CHECKPOINT" },
	{ value: "WEATHER", labelKey: "delay.reasons.WEATHER" },
	{ value: "PASSENGER_DELAY", labelKey: "delay.reasons.PASSENGER_DELAY" },
	{ value: "OTHER", labelKey: "delay.reasons.OTHER" },
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
	const { t } = useTranslation("live");
	return (
		<Modal
			visible={open}
			transparent
			animationType="slide"
			onRequestClose={onClose}
		>
			<View className="flex-1 bg-black/80 justify-end">
				<View className="bg-card border-t border-border rounded-t-3xl p-6 gap-4">
					<View>
						<Text className="text-xl font-extrabold text-foreground tracking-tight">{t("delay.title")}</Text>
						<Text className="text-xs text-muted-foreground mt-0.5">
							{t("delay.subtitle")}
						</Text>
					</View>

					<View className="gap-1.5">
						<Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("delay.minutesLabel")}</Text>
						<TextInput
							className="bg-background border border-border rounded-2xl px-4 h-12 text-foreground text-sm font-semibold"
							keyboardType="number-pad"
							value={delayMinutes}
							onChangeText={onDelayMinutesChange}
						/>
					</View>

					<View className="gap-1.5">
						<Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("delay.reasonLabel")}</Text>
						<View className="flex-row flex-wrap gap-2">
							{DELAY_REASONS.map((option) => {
								const isSelected = delayReason === option.value;
								return (
									<Pressable
										key={option.value}
										onPress={() => {
											DriverFeedback.tap();
											onDelayReasonChange(option.value);
										}}
										className={`px-3 py-2 rounded-xl border ${
											isSelected
												? "bg-primary/15 border-primary"
												: "border-border bg-background"
										}`}
									>
										<Text
											className={`text-xs font-bold ${
												isSelected ? "text-primary" : "text-muted-foreground"
											}`}
										>
											{t(option.labelKey)}
										</Text>
									</Pressable>
								);
							})}
						</View>
					</View>

					<View className="gap-1.5">
						<Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{t("delay.noteLabel")}</Text>
						<TextInput
							className="bg-background border border-border rounded-2xl px-4 h-12 text-foreground text-sm font-semibold"
							placeholder={t("delay.notePlaceholder")}
							placeholderTextColor={colors.neutral.textMuted}
							value={delayNote}
							onChangeText={onDelayNoteChange}
						/>
					</View>

					<View className="flex-row gap-3 pt-2">
						<Button
							title={t("delay.cancel")}
							variant="outline"
							size="md"
							onPress={onClose}
							className="flex-1"
						/>
						<Button
							title={t("delay.submit")}
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
