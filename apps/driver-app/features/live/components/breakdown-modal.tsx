import React from "react";
import {
	View,
	Text,
	TextInput,
	Modal,
	Pressable,
	ScrollView,
} from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Alert02Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { DriverFeedback } from "@/lib/haptics";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";
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
			<View className="flex-1 bg-black/80 justify-end">
				<View className="bg-card rounded-t-3xl p-5 border-t border-destructive/30 max-h-[85%]">
					<ScrollView
						showsVerticalScrollIndicator={false}
						contentContainerStyle={{ gap: 18, paddingBottom: 16 }}
					>
						{/* Header */}
						<View className="flex-row items-center gap-3">
							<View className="p-2.5 rounded-2xl bg-destructive/15">
								<HugeiconsIcon icon={Alert02Icon} size={22} color={colors.semantic.error} />
							</View>
							<View className="flex-1 gap-0.5">
								<Text className="text-lg font-extrabold text-foreground">{t("breakdownTitle")}</Text>
								<Text className="text-xs text-muted-foreground leading-4">{t("breakdownSubtitle")}</Text>
							</View>
						</View>

						{/* GPS Position Fix Preview */}
						<View className="flex-row items-center gap-2.5 p-3 rounded-xl bg-info/10 border border-info/20">
							<HugeiconsIcon icon={Location01Icon} size={16} color={colors.semantic.info} />
							<View className="flex-1">
								<Text className="text-xs font-bold text-info">{t("breakdownGpsFix")}</Text>
								<Text className="text-xs text-foreground font-semibold">
									{currentLocation
										? `${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)} (±${Math.round(currentLocation.accuracy ?? 10)}m)`
										: t("breakdownGpsWaiting")}
								</Text>
							</View>
						</View>

						{/* Failure Category */}
						<View className="gap-2">
							<Text className="text-xs font-semibold text-muted-foreground">{t("breakdownTypeLabel")}</Text>
							<View className="flex-row flex-wrap gap-2">
								{BREAKDOWN_TYPES.map((option) => {
									const isSelected = breakdownType === option.value;
									return (
										<Pressable
											key={option.value}
											onPress={() => {
												DriverFeedback.tap();
												onBreakdownTypeChange(option.value);
											}}
											className={`px-3 py-2 rounded-xl border ${
												isSelected
													? "bg-destructive/20 border-destructive"
													: "bg-background border-border"
											}`}
										>
											<Text
												className={`text-xs font-semibold ${
													isSelected ? "text-destructive font-bold" : "text-muted-foreground"
												}`}
											>
												{t(option.labelKey)}
											</Text>
										</Pressable>
									);
								})}
							</View>
						</View>

						{/* Delay Minutes Estimate */}
						<View className="gap-2">
							<Text className="text-xs font-semibold text-muted-foreground">{t("breakdownDelayLabel")}</Text>
							<TextInput
								className="bg-background rounded-xl border border-border px-3.5 py-2.5 text-foreground text-sm font-semibold"
								keyboardType="number-pad"
								value={delayMinutes}
								onChangeText={onDelayMinutesChange}
							/>
						</View>

						{/* Incident Notes / Description */}
						<View className="gap-2">
							<Text className="text-xs font-semibold text-muted-foreground">{t("breakdownDescLabel")}</Text>
							<TextInput
								className="bg-background rounded-xl border border-border px-3.5 py-2.5 text-foreground text-sm min-h-[70px] text-top"
								multiline
								numberOfLines={3}
								placeholder={t("breakdownDescPlaceholder")}
								placeholderTextColor={colors.neutral.textMuted}
								value={description}
								onChangeText={onDescriptionChange}
							/>
						</View>

						{/* Action Buttons */}
						<View className="flex-row gap-3 mt-2">
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
								icon={<HugeiconsIcon icon={Alert02Icon} size={16} color={colors.neutral.textPrimary} />}
								className="flex-1"
							/>
						</View>
					</ScrollView>
				</View>
			</View>
		</Modal>
	);
}
