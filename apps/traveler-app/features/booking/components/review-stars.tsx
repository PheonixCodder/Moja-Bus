import { Colors, Spacing } from "@moja/theme/tokens";
import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

type ReviewStarsProps = {
	rating: number;
	onRatingChange: (rating: number) => void;
};

export function ReviewStars({ rating, onRatingChange }: ReviewStarsProps) {
	return (
		<View
			style={{
				flexDirection: "row",
				gap: Spacing.two,
				alignItems: "center",
			}}
		>
			{[1, 2, 3, 4, 5].map((star) => (
				<Pressable
					key={star}
					onPress={() => onRatingChange(star)}
					style={({ pressed }) => ({
						opacity: pressed ? 0.7 : 1,
					})}
				>
					<Text
						style={{
							fontSize: 28,
							fontWeight: "800",
							color:
								star <= rating ? "#f59e0b" : Colors.light.backgroundSelected,
						}}
					>
						★
					</Text>
				</Pressable>
			))}
			<Text
				style={{
					fontSize: 14,
					fontWeight: "600",
					color: Colors.light.textSecondary,
					marginLeft: Spacing.two,
				}}
			>
				{rating}/5
			</Text>
		</View>
	);
}
