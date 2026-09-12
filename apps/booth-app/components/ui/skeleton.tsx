import React, { useEffect } from "react";
import type { ViewProps } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { cn } from "@/lib/utils";

export interface SkeletonProps extends ViewProps {
  className?: string;
}

function Skeleton({ className, style, ...props }: SkeletonProps) {
  const opacity = useSharedValue(0.4);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(0.85, { duration: 750 }),
        withTiming(0.4, { duration: 750 }),
      ),
      -1,
      true,
    );
  }, [opacity]);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View
      style={[animatedStyle, style]}
      className={cn("bg-muted/70 rounded-xl", className)}
      {...props}
    />
  );
}

export { Skeleton };
