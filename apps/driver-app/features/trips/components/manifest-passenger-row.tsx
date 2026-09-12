import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
	CheckmarkCircle02Icon,
	Call02Icon,
	CircleIcon,
} from "@hugeicons/core-free-icons";
import { Card } from "@/components/ui/Card";
import { colors } from "@/constants/theme";
import { cn } from "@/lib/utils";

export interface ManifestPassenger {
	bookingId: string;
	passengerName: string;
	passengerPhone?: string | null;
	seatNumber: string | number;
	bookingReference: string;
	originTerminal?: string | null;
	boardedAt?: string | Date | null;
}

interface ManifestPassengerRowProps {
	passenger: ManifestPassenger;
	onToggleBoarding: (bookingId: string, isBoarded: boolean) => void;
	onCallPassenger: (phone?: string | null) => void;
	isUpdating?: boolean;
}

export function ManifestPassengerRow({
	passenger,
	onToggleBoarding,
	onCallPassenger,
	isUpdating,
}: ManifestPassengerRowProps) {
	const isBoarded = !!passenger.boardedAt;

	return (
		<Card className="p-3.5 flex-row items-center justify-between">
			{/* Left: Seat Number Badge & Passenger Details */}
			<View className="flex-row items-center gap-3 flex-1 mr-2">
				<View className="size-11 rounded-2xl bg-background border border-border items-center justify-center">
					<Text className="text-[13px] font-mono font-extrabold text-primary">{passenger.seatNumber}</Text>
				</View>

				<View className="flex-1 gap-0.5">
					<Text className="text-sm font-bold text-foreground" numberOfLines={1}>
						{passenger.passengerName}
					</Text>
					<View className="flex-row items-center gap-1.5">
						<Text className="text-[11px] text-muted-foreground font-mono">{passenger.bookingReference}</Text>
						{passenger.originTerminal && (
							<Text className="text-[11px] text-muted-foreground" numberOfLines={1}>
								• {passenger.originTerminal}
							</Text>
						)}
					</View>
				</View>
			</View>

			{/* Right Actions: Phone Call & Boarding Checkbox */}
			<View className="flex-row items-center gap-2">
				{passenger.passengerPhone && (
					<TouchableOpacity
						onPress={() => onCallPassenger(passenger.passengerPhone)}
						activeOpacity={0.8}
						accessibilityRole="button"
						accessibilityLabel={`Call passenger ${passenger.passengerName}`}
						className="size-10 rounded-xl bg-card items-center justify-center border border-border active:bg-secondary"
					>
						<HugeiconsIcon icon={Call02Icon} size={16} color={colors.semantic.info} />
					</TouchableOpacity>
				)}

				<TouchableOpacity
					onPress={() => onToggleBoarding(passenger.bookingId, isBoarded)}
					disabled={isUpdating || isBoarded}
					activeOpacity={0.8}
					accessibilityRole="checkbox"
					accessibilityState={{ checked: isBoarded, disabled: isUpdating || isBoarded }}
					accessibilityLabel={isBoarded ? "Passenger boarded" : "Mark passenger as boarded"}
					className={cn(
						"size-10 rounded-xl items-center justify-center border",
						isBoarded ? "bg-success/15 border-success/30" : "bg-background border-border",
					)}
				>
					{isBoarded ? (
						<HugeiconsIcon icon={CheckmarkCircle02Icon} size={20} color={colors.semantic.success} />
					) : (
						<HugeiconsIcon icon={CircleIcon} size={20} color={colors.neutral.textMuted} />
					)}
				</TouchableOpacity>
			</View>
		</Card>
	);
}
