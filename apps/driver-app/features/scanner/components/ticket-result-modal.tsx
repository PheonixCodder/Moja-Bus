import React from "react";
import { View, Text, Modal } from "react-native";
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
import { colors } from "@/constants/theme";

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
			<View className="flex-1 bg-black/80 justify-end p-4">
				<View className="bg-card border border-border rounded-3xl p-6 gap-4">
					{/* Status Header */}
					{result.status === "SUCCESS" && (
						<View className="flex-row items-center gap-3.5">
							<View className="w-12 h-12 rounded-2xl items-center justify-center border bg-success/15 border-success/30">
								<HugeiconsIcon icon={CheckmarkCircle02Icon} size={28} color={colors.semantic.success} />
							</View>
							<View className="gap-0.5 flex-1">
								<Text className="text-lg font-extrabold text-foreground tracking-tight">{t("cleared")}</Text>
								<Text className="text-xs font-semibold text-emerald-400">{t("clearedMsg")}</Text>
							</View>
						</View>
					)}

					{result.status === "QUEUED_OFFLINE" && (
						<View className="flex-row items-center gap-3.5">
							<View className="w-12 h-12 rounded-2xl items-center justify-center border bg-info/15 border-info/30">
								<HugeiconsIcon icon={CloudSavingDone01Icon} size={28} color={colors.semantic.info} />
							</View>
							<View className="gap-0.5 flex-1">
								<Text className="text-lg font-extrabold text-foreground tracking-tight">{t("offlineTitle")}</Text>
								<Text className="text-xs font-semibold text-info">{t("offlineMsg")}</Text>
							</View>
						</View>
					)}

					{result.status === "ALREADY_BOARDED" && (
						<View className="flex-row items-center gap-3.5">
							<View className="w-12 h-12 rounded-2xl items-center justify-center border bg-warning/15 border-warning/30">
								<HugeiconsIcon icon={Alert02Icon} size={28} color={colors.semantic.warning} />
							</View>
							<View className="gap-0.5 flex-1">
								<Text className="text-lg font-extrabold text-foreground tracking-tight">{t("doubleBoardingAlert")}</Text>
								<Text className="text-xs font-semibold text-warning">{t("doubleBoardingMsg")}</Text>
							</View>
						</View>
					)}

					{result.status === "ERROR" && (
						<View className="flex-row items-center gap-3.5">
							<View className="w-12 h-12 rounded-2xl items-center justify-center border bg-destructive/15 border-destructive/30">
								<HugeiconsIcon icon={CancelCircleIcon} size={28} color={colors.semantic.error} />
							</View>
							<View className="gap-0.5 flex-1">
								<Text className="text-lg font-extrabold text-foreground tracking-tight">{t("invalidTicket")}</Text>
								<Text className="text-xs font-semibold text-destructive">{t("invalidTicketMsg")}</Text>
							</View>
						</View>
					)}

					{/* Detail Card */}
					<Card className="bg-background p-4 gap-2.5">
						{result.passengerName && (
							<View className="flex-row items-center justify-between">
								<View className="flex-row items-center gap-2">
									<HugeiconsIcon icon={User02Icon} size={15} color={colors.neutral.textMuted} />
									<Text className="text-xs text-muted-foreground">{t("labelPassenger")}</Text>
								</View>
								<Text className="text-sm font-bold text-foreground">{result.passengerName}</Text>
							</View>
						)}

						{result.seatNumber && (
							<View className="flex-row items-center justify-between">
								<View className="flex-row items-center gap-2">
									<HugeiconsIcon icon={ArmchairIcon} size={15} color={colors.neutral.textMuted} />
									<Text className="text-xs text-muted-foreground">{t("labelSeat")}</Text>
								</View>
								<Badge variant="brand" label={`${t("seatPrefix")} ${result.seatNumber}`} />
							</View>
						)}

						{result.bookingReference && (
							<View className="flex-row items-center justify-between">
								<View className="flex-row items-center gap-2">
									<HugeiconsIcon icon={Ticket01Icon} size={15} color={colors.neutral.textMuted} />
									<Text className="text-xs text-muted-foreground">{t("labelBookingRef")}</Text>
								</View>
								<Text className="text-xs font-mono font-bold text-foreground">{result.bookingReference}</Text>
							</View>
						)}

						{result.errorMessage && (
							<Text className="text-xs text-muted-foreground pt-1 leading-5">{result.errorMessage}</Text>
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
