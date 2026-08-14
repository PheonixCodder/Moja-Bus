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
					? "bg-red-50/80 border-red-200/60"
					: "bg-amber-50/80 border-amber-200/60"
			}`}
		>
			<View
				className={`w-2 h-2 rounded-full ${isExpired ? "bg-red-500" : "bg-amber-500"}`}
			/>
			<Text
				className={`text-xs font-semibold ${isExpired ? "text-red-500" : "text-amber-500"}`}
			>
				{isExpired ? "Hold expired" : `Pay within ${remaining}`}
			</Text>
		</View>
	);
}
