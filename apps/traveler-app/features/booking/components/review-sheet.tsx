import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Alert,
	Modal,
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
	companyId: string;
};

export function ReviewSheet({
	visible,
	onClose,
	bookingId,
	companyId,
}: ReviewSheetProps) {
	const { t } = useTranslation("booking");
	const [rating, setRating] = useState(0);
	const [comment, setComment] = useState("");
	const submitReview = useSubmitReview();

	const handleSubmit = () => {
		if (rating === 0 || !bookingId || !companyId) return;
		submitReview.mutate(
			{
				companyId,
				bookingId,
				rating,
				content: comment.trim() || null,
			},
			{
				onSuccess: () => {
					setRating(0);
					setComment("");
					onClose();
				},
				onError: (err: Error) => {
					Alert.alert(t("error"), err.message || t("error"));
				},
			},
		);
	};

	return (
		<Modal
			visible={visible}
			transparent
			animationType="slide"
			onRequestClose={onClose}
		>
			<Pressable className="flex-1 bg-black/40" onPress={onClose} />
			<View className="bg-white rounded-t-3xl px-4 py-5 gap-4 shadow-xl">
				<View className="flex-row items-center justify-between">
					<Text className="text-lg font-extrabold text-foreground">
						{t("reviewTrip")}
					</Text>
					<Pressable onPress={onClose} hitSlop={12}>
						<Text className="text-lg text-muted-foreground">✕</Text>
					</Pressable>
				</View>

				<ReviewStars rating={rating} onRatingChange={setRating} />

				<TextInput
					value={comment}
					onChangeText={setComment}
					placeholder={t("writeReview")}
					placeholderTextColor="#94a3b8"
					multiline
					numberOfLines={4}
					className="bg-slate-100 rounded-xl border border-slate-200 p-4 text-sm font-medium text-foreground min-h-[80px]"
					style={{ textAlignVertical: "top" }}
				/>

				<Pressable
					onPress={handleSubmit}
					disabled={submitReview.isPending || rating === 0}
					className="py-4 rounded-xl bg-primary items-center"
					style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
				>
					{submitReview.isPending ? (
						<ActivityIndicator size="small" color="#ffffff" />
					) : (
						<Text className="text-base font-bold text-white">
							{t("submitReview")}
						</Text>
					)}
				</Pressable>
			</View>
		</Modal>
	);
}
