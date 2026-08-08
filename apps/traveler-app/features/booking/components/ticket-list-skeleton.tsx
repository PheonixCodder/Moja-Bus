import { View } from "react-native";
import Animated, {
	useAnimatedStyle,
	useSharedValue,
	withRepeat,
	withSequence,
	withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

function TicketSkeletonCard() {
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
			className="bg-card rounded-2xl p-4 border border-border mb-4"
		>
			<View className="flex-row items-center justify-between mb-4">
				<View className="w-24 h-4 bg-muted rounded" />
				<View className="w-16 h-4 bg-muted rounded" />
			</View>
			<View className="flex-row justify-between mb-4">
				<View className="gap-1">
					<View className="w-20 h-5 bg-muted rounded" />
					<View className="w-12 h-3 bg-muted rounded" />
				</View>
				<View className="gap-1 items-end">
					<View className="w-20 h-5 bg-muted rounded" />
					<View className="w-12 h-3 bg-muted rounded" />
				</View>
			</View>
			<View className="h-[1px] bg-border my-2" />
			<View className="flex-row justify-between items-center pt-2">
				<View className="w-28 h-4 bg-muted rounded" />
				<View className="w-10 h-10 rounded-full bg-muted" />
			</View>
		</Animated.View>
	);
}

export function TicketListSkeleton() {
	return (
		<View className="px-4 pt-2">
			<TicketSkeletonCard />
			<TicketSkeletonCard />
		</View>
	);
}
