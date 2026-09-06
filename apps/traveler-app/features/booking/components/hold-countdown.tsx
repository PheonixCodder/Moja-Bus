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
			className={`flex-row items-center gap-2 px-4 py-2 rounded-xl border ${
				isExpired
					? "bg-destructive/10 border-destructive/20"
					: "bg-warning/10 border-warning/20"
			}`}
		>
			<View
				className={`w-2 h-2 rounded-full ${isExpired ? "bg-destructive" : "bg-warning"}`}
			/>
			<Text
				className={`text-xs font-semibold ${isExpired ? "text-destructive" : "text-warning"}`}
			>
				{isExpired ? "Hold expired" : `Pay within ${remaining}`}
			</Text>
		</View>
	);
}
