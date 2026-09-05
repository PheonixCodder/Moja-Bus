import {
	ActivityIndicator,
	ScrollView,
	View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { SubpageHeader } from "@/components/subpage-header";
import { Text } from "@/components/ui/text";
import { BottomTabInset, Palette } from "@/constants/theme";
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
					size={14}
					color={star <= rating ? Palette.amber[500] : Palette.zinc[200]}
				/>
			))}
		</View>
	);
}

function formatReviewDate(value: Date | string) {
	const d = typeof value === "string" ? new Date(value) : value;
	if (Number.isNaN(d.getTime())) return "";
	return d.toLocaleDateString(undefined, {
		day: "numeric",
		month: "short",
		year: "numeric",
	});
}

export function ReviewsView() {
	const insets = useSafeAreaInsets();
	const { t } = useTranslation("settings");
	const { data: session, isPending: sessionPending } = authClient.useSession();
	const isAuth = !!session?.user;

	const { data: reviews, isLoading } = useUserReviews(isAuth);

	if (sessionPending || isLoading) {
		return (
			<View className="flex-1 items-center justify-center bg-background">
				<ActivityIndicator size="large" color={Palette.rose[500]} />
			</View>
		);
	}

	if (!isAuth) {
		return (
			<View className="flex-1 items-center justify-center bg-background px-6">
				<Text className="text-base text-muted-foreground text-center">
					{t("signInToManage")}
				</Text>
			</View>
		);
	}

	const reviewList = reviews ?? [];

	return (
		<View className="flex-1 bg-background">
			<SubpageHeader title={t("myReviews", { defaultValue: "My Trip Reviews" })} />

			{reviewList.length === 0 ? (
				<View className="flex-1 items-center justify-center px-4 gap-3">
					<View className="w-16 h-16 rounded-full bg-primary/10 items-center justify-center">
						<HugeiconsIcon icon={Comment01Icon} size={28} color={Palette.rose[500]} />
					</View>
					<Text className="text-base font-bold text-foreground">
						{t("noReviewsYet", { defaultValue: "No Trip Reviews Yet" })}
					</Text>
					<Text className="text-sm text-muted-foreground text-center max-w-[280px]">
						{t("noReviewsHint", {
							defaultValue:
								"After completing a trip, you can rate your experience and share feedback for operators.",
						})}
					</Text>
				</View>
			) : (
				<ScrollView
					style={{ flex: 1 }}
					contentContainerStyle={{
						paddingHorizontal: 16,
						paddingTop: 12,
						paddingBottom: BottomTabInset + insets.bottom + 24,
						gap: 12,
					}}
				>
					{reviewList.map((review) => (
						<View
							key={review.id}
							className="bg-card rounded-2xl border border-border p-4 gap-3 shadow-sm shadow-black/5"
						>
							<View className="flex-row items-start justify-between gap-3">
								<View className="flex-1 gap-1">
									<Text className="text-sm font-bold text-foreground" numberOfLines={1}>
										{review.company.name}
									</Text>
									<Text className="text-xs text-muted-foreground">
										{formatReviewDate(review.createdAt)}
									</Text>
								</View>
								<StarRatingDisplay rating={review.rating} />
							</View>

							{review.content ? (
								<Text className="text-sm text-foreground leading-5">
									{review.content}
								</Text>
							) : (
								<Text className="text-sm text-muted-foreground italic">
									Rated {review.rating} of 5 stars
								</Text>
							)}

							{review.response ? (
								<View className="rounded-xl bg-muted/40 border border-border p-3 gap-1">
									<Text className="text-xs font-bold uppercase tracking-wide text-muted-foreground">
										Operator response
									</Text>
									<Text className="text-sm text-foreground leading-5">
										{review.response}
									</Text>
								</View>
							) : null}
						</View>
					))}
				</ScrollView>
			)}
		</View>
	);
}
