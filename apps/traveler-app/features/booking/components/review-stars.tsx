import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

type ReviewStarsProps = {
	rating: number;
	onRatingChange: (rating: number) => void;
	size?: number;
};

export function ReviewStars({ rating, onRatingChange, size = 28 }: ReviewStarsProps) {
	return (
		<View className="flex-row gap-2 items-center">
			{[1, 2, 3, 4, 5].map((star) => (
				<Pressable
					key={star}
					onPress={() => onRatingChange(star)}
					style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
				>
					<Text
						style={{ fontSize: size }}
						className={`font-extrabold ${
							star <= rating ? "text-amber-400" : "text-slate-200"
						}`}
					>
						★
					</Text>
				</Pressable>
			))}
			<Text className="text-xs font-semibold text-slate-400 ml-1">
				{rating}/5
			</Text>
		</View>
	);
}
