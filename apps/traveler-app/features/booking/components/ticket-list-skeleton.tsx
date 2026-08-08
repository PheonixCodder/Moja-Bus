import { View } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import { useEffect } from 'react';

function TicketSkeletonCard() {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(withTiming(0.8, { duration: 600 }), withTiming(0.4, { duration: 600 })),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={animatedStyle}
      className="bg-card border-border mb-4 rounded-2xl border p-4">
      <View className="mb-4 flex-row items-center justify-between">
        <View className="bg-muted h-4 w-24 rounded" />
        <View className="bg-muted h-4 w-16 rounded" />
      </View>
      <View className="mb-4 flex-row justify-between">
        <View className="gap-1">
          <View className="bg-muted h-5 w-20 rounded" />
          <View className="bg-muted h-3 w-12 rounded" />
        </View>
        <View className="items-end gap-1">
          <View className="bg-muted h-5 w-20 rounded" />
          <View className="bg-muted h-3 w-12 rounded" />
        </View>
      </View>
      <View className="bg-border my-2 h-[1px]" />
      <View className="flex-row items-center justify-between pt-2">
        <View className="bg-muted h-4 w-28 rounded" />
        <View className="bg-muted h-10 w-10 rounded-full" />
      </View>
    </Animated.View>
  );
}

export function TicketListSkeleton() {
  return (
    <View
      className="px-4 pt-2"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants">
      <TicketSkeletonCard />
      <TicketSkeletonCard />
    </View>
  );
}
