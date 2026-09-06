import { useState, useEffect } from "react";
import {
	View,
	Text,
	Modal,
} from "react-native";
import {
	AlertTriangle,
	Bus,
	Clock,
	Users,
} from "lucide-react-native";
import { DriverFeedback } from "@/lib/haptics";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/Button";
import { colors } from "@/constants/theme";

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
	clockSkewMs?: number;
	onAccept: (tripId: string) => void;
	onDecline: (tripId: string) => void;
}

export function UrgentDispatchModal({
	visible,
	dispatch,
	clockSkewMs = 0,
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

	// Skew-corrected departure proximity calculation
	const trueNowMs = Date.now() + clockSkewMs;
	const departureDateMs = new Date(dispatch.departureTimeIso).getTime();
	const minutesToDeparture = Math.round((departureDateMs - trueNowMs) / 60000);
	const isImminent = minutesToDeparture <= 15;

	return (
		<Modal visible={visible} transparent animationType="fade">
			<View className="flex-1 bg-black/85 items-center justify-center p-5">
				<View className="w-full bg-card border border-border rounded-3xl p-5 shadow-2xl">
					{/* Header with Urgent Badge & 30s Countdown */}
					<View className="flex-row items-center justify-between mb-4">
						<View className="flex-row items-center gap-1.5 bg-warning/10 border border-warning/30 px-2.5 py-1.5 rounded-full">
							<AlertTriangle size={16} color={colors.semantic.warning} />
							<Text className="text-[11px] font-extrabold text-warning uppercase tracking-wider">{t("urgentDispatch")}</Text>
						</View>
						<View className="w-8 h-8 rounded-full bg-primary items-center justify-center">
							<Text className="text-xs font-black text-primary-foreground font-mono">{timeLeft}s</Text>
						</View>
					</View>

					{/* Route Details Card */}
					<View className="bg-background border border-border rounded-2xl p-3.5 mb-4">
						<View className="flex-row items-center gap-2.5 border-b border-border/60 pb-2.5 mb-2.5">
							<View className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center">
								<Bus size={18} color={colors.primary.rose} />
							</View>
							<View className="flex-1">
								<Text className="text-sm font-extrabold text-foreground">{dispatch.carrierName}</Text>
								<Text className="text-xs text-muted-foreground font-mono">{t("busPlate", { plate: dispatch.busPlate })}</Text>
							</View>
							{/* Departure Proximity Pill */}
							<View
								className={`flex-row items-center gap-1 px-2 py-1 rounded-lg border ${
									isImminent ? "bg-destructive/15 border-destructive/40" : "bg-warning/10 border-warning/30"
								}`}
							>
								<Clock size={11} color={isImminent ? colors.semantic.error : colors.semantic.warning} />
								<Text
									className={`text-[11px] font-bold ${
										isImminent ? "text-destructive" : "text-warning"
									}`}
								>
									{minutesToDeparture <= 0
										? t("departingNow")
										: t("departsIn", { minutes: minutesToDeparture })}
								</Text>
							</View>
						</View>

						{/* Route Sequence */}
						<View className="py-1">
							<View className="flex-row items-center gap-2">
								<View className="w-2 h-2 rounded-full bg-success" />
								<Text className="text-xs font-bold text-foreground flex-1" numberOfLines={1}>
									{dispatch.originName}
								</Text>
							</View>
							<View className="w-0.5 h-2.5 bg-border ml-[3px] my-0.5" />
							<View className="flex-row items-center gap-2">
								<View className="w-2 h-2 rounded-full bg-primary" />
								<Text className="text-xs font-bold text-foreground flex-1" numberOfLines={1}>
									{dispatch.destinationName}
								</Text>
							</View>
						</View>

						{/* Metadata */}
						<View className="flex-row items-center justify-between border-t border-border/60 pt-2.5 mt-2.5">
							<View className="flex-row items-center gap-1">
								<Clock size={13} color={colors.neutral.textMuted} />
								<Text className="text-xs font-semibold text-muted-foreground">
									{t("departs", { time: formatDeparture(dispatch.departureTimeIso) })}
								</Text>
							</View>
							<View className="flex-row items-center gap-1">
								<Users size={13} color={colors.neutral.textMuted} />
								<Text className="text-xs font-semibold text-muted-foreground">
									{t("passengersCount", {
										booked: dispatch.bookedPassengers,
										total: dispatch.totalSeats,
									})}
								</Text>
							</View>
						</View>
					</View>

					{/* Action Buttons */}
					<View className="flex-row gap-2.5">
						<Button
							title={t("decline")}
							variant="secondary"
							size="lg"
							onPress={handleDecline}
							className="flex-1"
						/>

						<Button
							title={t("accept")}
							variant="primary"
							size="lg"
							onPress={handleAccept}
							className="flex-[2]"
						/>
					</View>
				</View>
			</View>
		</Modal>
	);
}
