import { Bus, Clock, User } from "lucide-react-native";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
	ActivityIndicator,
	Alert,
	Modal,
	Pressable,
	ScrollView,
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
	const [overallRating, setOverallRating] = useState(0);
	// Phase 19 (F-PS-08) — sub-ratings are EXPLICIT-ONLY (Phase 13 semantics):
	// unset stays null and the key is OMITTED from the payload, never sent as
	// an implicit 5. Overall starts at 0 so submit stays disabled until chosen.
	const [driverRating, setDriverRating] = useState<number | null>(null);
	const [busRating, setBusRating] = useState<number | null>(null);
	const [punctualityRating, setPunctualityRating] = useState<number | null>(
		null,
	);
	const [comment, setComment] = useState("");
	const submitReview = useSubmitReview();

	const handleSubmit = () => {
		if (overallRating === 0 || !bookingId || !companyId) return;
		submitReview.mutate(
			{
				companyId,
				bookingId,
				rating: overallRating,
				...(driverRating != null ? { driverRating } : {}),
				...(busRating != null ? { busRating } : {}),
				...(punctualityRating != null ? { punctualityRating } : {}),
				content: comment.trim() || null,
			},
			{
				onSuccess: () => {
					setOverallRating(0);
					setDriverRating(null);
					setBusRating(null);
					setPunctualityRating(null);
					setComment("");
					onClose();
				},
				onError: (err: Error) => {
					Alert.alert(t("reviewErrorTitle"), err.message || t("reviewFailed"));
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
			<Pressable className="flex-1 bg-black/50" onPress={onClose} />
			<View className="bg-white dark:bg-zinc-900 rounded-t-3xl px-5 py-6 gap-4 shadow-2xl max-h-[85%]">
				<View className="flex-row items-center justify-between">
					<View>
						<Text className="text-xl font-extrabold text-foreground">
							{t("reviewSheetTitle")}
						</Text>
						<Text className="text-xs text-muted-foreground mt-0.5">
							{t("reviewSheetSubtitle")}
						</Text>
					</View>
					<Pressable onPress={onClose} hitSlop={12}>
						<Text className="text-lg text-muted-foreground">✕</Text>
					</Pressable>
				</View>

				<ScrollView className="space-y-4" showsVerticalScrollIndicator={false}>
					{/* Overall Rating */}
					<View className="bg-muted/40 p-3.5 rounded-2xl border border-border items-center">
						<Text className="text-xs font-bold text-foreground mb-1.5">
							{t("overallExperience")}
						</Text>
						<ReviewStars
							rating={overallRating}
							onRatingChange={setOverallRating}
						/>
					</View>

					{/* 3-Way Criteria */}
					<View className="space-y-3">
						{/* Driver Rating */}
						<View className="flex-row items-center justify-between p-3 rounded-xl bg-card border border-border">
							<View className="flex-row items-center gap-2">
								<User size={16} color="#e11d48" />
								<Text className="text-xs font-bold text-foreground">
									{t("driverCriteria")}
								</Text>
							</View>
							<ReviewStars
								rating={driverRating ?? 0}
								onRatingChange={setDriverRating}
								size={18}
							/>
						</View>

						{/* Bus Cleanliness Rating */}
						<View className="flex-row items-center justify-between p-3 rounded-xl bg-card border border-border">
							<View className="flex-row items-center gap-2">
								<Bus size={16} color="#38bdf8" />
								<Text className="text-xs font-bold text-foreground">
									{t("busCriteria")}
								</Text>
							</View>
							<ReviewStars
								rating={busRating ?? 0}
								onRatingChange={setBusRating}
								size={18}
							/>
						</View>

						{/* Punctuality Rating */}
						<View className="flex-row items-center justify-between p-3 rounded-xl bg-card border border-border">
							<View className="flex-row items-center gap-2">
								<Clock size={16} color="#10b981" />
								<Text className="text-xs font-bold text-foreground">
									{t("punctualityCriteria")}
								</Text>
							</View>
							<ReviewStars
								rating={punctualityRating ?? 0}
								onRatingChange={setPunctualityRating}
								size={18}
							/>
						</View>
					</View>

					<TextInput
						value={comment}
						onChangeText={setComment}
						placeholder={t("reviewNotePlaceholder")}
						placeholderTextColor="#94a3b8"
						multiline
						numberOfLines={3}
						className="bg-muted/40 rounded-xl border border-border p-3.5 text-xs font-medium text-foreground min-h-[70px]"
						style={{ textAlignVertical: "top" }}
					/>

					<Pressable
						onPress={handleSubmit}
						disabled={submitReview.isPending || overallRating === 0}
						className="py-3.5 rounded-xl bg-primary items-center mt-2 shadow-lg"
						style={({ pressed }) => ({ opacity: pressed ? 0.85 : 1 })}
					>
						{submitReview.isPending ? (
							<ActivityIndicator size="small" color="#ffffff" />
						) : (
							<Text className="text-sm font-bold text-white">
								{t("submit3WayReview")}
							</Text>
						)}
					</Pressable>
				</ScrollView>
			</View>
		</Modal>
	);
}
