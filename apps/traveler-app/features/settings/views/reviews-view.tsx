import {
	ActivityIndicator,
	ScrollView,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { SubpageHeader } from "@/components/subpage-header";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { authClient } from "@/lib/auth-client";
import { useUserReviews } from "@/hooks/use-reviews";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { StarIcon, Comment01Icon } from "@hugeicons/core-free-icons";

function StarRatingDisplay({ rating }: { rating: number }) {
	return (
		<View className="flex-row items-center gap-1">
			{[1, 2, 3, 4, 5].map((star) => (
				<HugeiconsIcon
					key={star}
					icon={StarIcon}
					size={16}
					color={star <= rating ? "#F59E0B" : "#e2e8f0"}
				/>
			))}
		</View>
	);
}

export function ReviewsView() {
	const insets = useSafeAreaInsets();
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const isAuth = !!session?.user;

	const { data: reviews, isLoading } = useUserReviews(isAuth);

	if (sessionPending || isLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-white">
				<ActivityIndicator size="large" color="#ee237c" />
			</View>
		);
	}

	if (!isAuth) {
		return (
			<View className="flex-1 items-center justify-center bg-white">
				<Text className="text-[15px] text-slate-500">Sign in to view your trip reviews.</Text>
			</View>
		);
	}

	const reviewList = reviews ?? [];

	return (
		<View className="flex-1 bg-white">
			<SubpageHeader title="My Trip Reviews" />

			{reviewList.length === 0 ? (
				<View className="flex-1 items-center justify-center px-4 gap-3">
					<View className="w-16 h-16 rounded-full bg-pink-50 items-center justify-center">
						<HugeiconsIcon icon={Comment01Icon} size={28} color="#ee237c" />
					</View>
					<Text className="text-base font-bold text-slate-900">No Trip Reviews Yet</Text>
					<Text className="text-sm text-slate-500 text-center max-w-[280px]">
						After completing a travel booking, you can rate your trip experience and share feedback for transport operators.
					</Text>
				</View>
			) : (
				<ScrollView
					style={{ flex: 1 }}
					contentContainerStyle={{
						paddingHorizontal: 16,
						paddingTop: 8,
						paddingBottom: BottomTabInset + insets.bottom + 24,
						gap: 12,
					}}
				>
					{reviewList.map((review, idx) => (
						<View
							key={review.bookingId || idx}
							className="bg-white rounded-[18px] border border-slate-100 p-4 gap-2 shadow-sm shadow-black/5"
						>
							<View className="flex-row items-center justify-between">
								<StarRatingDisplay rating={review.rating} />
								<Text className="text-xs font-semibold text-slate-400">
									Booking #{review.bookingId.slice(-6).toUpperCase()}
								</Text>
							</View>

							{review.content ? (
								<Text className="text-sm text-slate-800 leading-5">"{review.content}"</Text>
							) : (
								<Text className="text-sm text-slate-400 italic">Rated {review.rating} of 5 stars</Text>
							)}
						</View>
					))}
				</ScrollView>
			)}
		</View>
	);
}
