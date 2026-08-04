import { Colors, Spacing } from "@moja/theme/tokens";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { useHoldCountdown } from "@/features/booking/hooks/use-hold-countdown";

type HoldCountdownProps = {
	holdExpiresAt: string;
};

export function HoldCountdown({ holdExpiresAt }: HoldCountdownProps) {
	const remaining = useHoldCountdown(holdExpiresAt);
	const isExpired = remaining === "Expired";

	return (
		<View
			style={{
				flexDirection: "row",
				alignItems: "center",
				gap: Spacing.two,
				paddingHorizontal: Spacing.four,
				paddingVertical: Spacing.two,
				backgroundColor: isExpired
					? "rgba(239, 68, 68, 0.08)"
					: "rgba(245, 158, 11, 0.08)",
				borderRadius: 12,
				borderWidth: 1,
				borderColor: isExpired
					? "rgba(239, 68, 68, 0.2)"
					: "rgba(245, 158, 11, 0.2)",
			}}
		>
			<View
				style={{
					width: 8,
					height: 8,
					borderRadius: 4,
					backgroundColor: isExpired ? "#ef4444" : "#f59e0b",
				}}
			/>
			<Text
				style={{
					fontSize: 12,
					fontWeight: "600",
					color: isExpired ? "#ef4444" : "#f59e0b",
				}}
			>
				{isExpired ? "Hold expired" : `Pay within ${remaining}`}
			</Text>
		</View>
	);
}
