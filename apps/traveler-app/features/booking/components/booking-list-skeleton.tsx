import { View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

function SkeletonCard() {
	const opacity = useSharedValue(0.4);

	useEffect(() => {
		opacity.value = withRepeat(
			withSequence(
				withTiming(0.8, { duration: 600 }),
				withTiming(0.4, { duration: 600 }),
			),
			-1,
			true,
		);
	}, []);

	const animatedStyle = useAnimatedStyle(() => ({
		opacity: opacity.value,
	}));

	return (
		<Animated.View
			style={animatedStyle}
			className="bg-card rounded-2xl p-4 border border-border mb-3"
		>
			<View className="flex-row items-center justify-between mb-3.5">
				<View className="flex-row items-center gap-2.5">
					<View className="w-10 h-10 rounded-full bg-muted" />
					<View className="gap-1.5">
						<View className="w-24 h-3.5 bg-muted rounded" />
						<View className="w-16 h-2.5 bg-muted rounded" />
					</View>
				</View>
				<View className="w-20 h-5 bg-muted rounded-full" />
			</View>
			<View className="flex-row justify-between items-center my-3">
				<View className="gap-1">
					<View className="w-12 h-5 bg-muted rounded" />
					<View className="w-16 h-3 bg-muted rounded" />
				</View>
				<View className="w-24 h-1 bg-muted rounded" />
				<View className="gap-1 items-end">
					<View className="w-12 h-5 bg-muted rounded" />
					<View className="w-16 h-3 bg-muted rounded" />
				</View>
			</View>
		</Animated.View>
	);
}

export function BookingListSkeleton() {
	return (
		<View className="px-4 pt-2">
			<SkeletonCard />
			<SkeletonCard />
			<SkeletonCard />
		</View>
	);
}
