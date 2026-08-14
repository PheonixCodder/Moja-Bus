import { Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

type ReviewStarsProps = {
	rating: number;
	onRatingChange: (rating: number) => void;
};

export function ReviewStars({ rating, onRatingChange }: ReviewStarsProps) {
	return (
		<View className="flex-row gap-2 items-center">
			{[1, 2, 3, 4, 5].map((star) => (
				<Pressable
					key={star}
					onPress={() => onRatingChange(star)}
					style={({ pressed }) => ({ opacity: pressed ? 0.7 : 1 })}
				>
					<Text
						className={`text-[28px] font-extrabold ${
							star <= rating ? "text-amber-400" : "text-slate-200"
						}`}
					>
						★
					</Text>
				</Pressable>
			))}
			<Text className="text-sm font-semibold text-slate-400 ml-2">
				{rating}/5
			</Text>
		</View>
	);
}
