import { Colors, Spacing } from "@moja/theme/tokens";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Pressable,
	Text,
	TextInput,
	View,
} from "react-native";
import { ReviewStars } from "@/features/booking/components/review-stars";
import { useSubmitReview } from "@/features/booking/hooks/use-reviews";

type ReviewSheetProps = {
	visible: boolean;
	onClose: () => void;
	bookingId: string;
};

export function ReviewSheet({ visible, onClose, bookingId }: ReviewSheetProps) {
	const { t } = useTranslation("booking");
	const [rating, setRating] = useState(0);
	const [comment, setComment] = useState("");
	const submitReview = useSubmitReview();

	if (!visible) return null;

	const handleSubmit = () => {
		if (rating === 0) return;
		submitReview.mutate(
			{ bookingId, rating, content: comment || undefined },
			{
				onSuccess: () => {
					setRating(0);
					setComment("");
					onClose();
				},
				onError: () => {},
			},
		);
	};

	return (
		<View
			style={{
				position: "absolute",
				bottom: 0,
				left: 0,
				right: 0,
				backgroundColor: Colors.light.background,
				borderTopLeftRadius: 24,
				borderTopRightRadius: 24,
				paddingHorizontal: Spacing.four,
				paddingTop: Spacing.five,
				paddingBottom: Spacing.five,
				gap: Spacing.four,
				shadowColor: "#000",
				shadowOffset: { width: 0, height: -4 },
				shadowOpacity: 0.1,
				shadowRadius: 20,
				elevation: 20,
			}}
		>
			<View
				style={{
					flexDirection: "row",
					alignItems: "center",
					justifyContent: "space-between",
				}}
			>
				<Text
					style={{
						fontSize: 18,
						fontWeight: "800",
						color: Colors.light.text,
					}}
				>
					{t("reviewTrip")}
				</Text>
				<Pressable onPress={onClose}>
					<Text style={{ fontSize: 18, color: Colors.light.textSecondary }}>
						✕
					</Text>
				</Pressable>
			</View>

			<ReviewStars rating={rating} onRatingChange={setRating} />

			<TextInput
				value={comment}
				onChangeText={setComment}
				placeholder={t("writeReview")}
				placeholderTextColor={Colors.light.textSecondary}
				multiline
				numberOfLines={4}
				style={{
					backgroundColor: Colors.light.backgroundElement,
					borderRadius: 12,
					borderWidth: 1,
					borderColor: Colors.light.backgroundSelected,
					padding: Spacing.four,
					fontSize: 14,
					fontWeight: "500",
					color: Colors.light.text,
					textAlignVertical: "top",
					minHeight: 80,
				}}
			/>

			<Pressable
				onPress={handleSubmit}
				disabled={submitReview.isPending || rating === 0}
				style={({ pressed }) => ({
					paddingVertical: Spacing.four,
					borderRadius: 14,
					backgroundColor: Colors.light.primary,
					alignItems: "center",
					opacity: pressed ? 0.85 : 1,
				})}
			>
				{submitReview.isPending ? (
					<ActivityIndicator
						size="small"
						color={Colors.light.primaryForeground}
					/>
				) : (
					<Text
						style={{
							fontSize: 15,
							fontWeight: "700",
							color: Colors.light.primaryForeground,
						}}
					>
						{t("submitReview")}
					</Text>
				)}
			</Pressable>
		</View>
	);
}
