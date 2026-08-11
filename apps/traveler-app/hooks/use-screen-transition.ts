import { useEffect } from "react";
import { useIsFocused } from "expo-router";
import {
  useSharedValue,
  withSpring,
  useAnimatedStyle,
} from "react-native-reanimated";

/**
 * High-performance screen transition hook for traveler-app.
 * Uses snappy spring physics (stiffness: 450, damping: 32) instead of
 * sluggish timing delays. Opacity changes instantly to eliminate tab-switching lag.
 */
export function useScreenTransition() {
  const isFocused = useIsFocused();
  const scale = useSharedValue(isFocused ? 1 : 0.98);

  useEffect(() => {
    scale.value = withSpring(isFocused ? 1 : 0.98, {
      stiffness: 450,
      damping: 32,
      mass: 0.7,
    });
  }, [isFocused]);

  return useAnimatedStyle(() => ({
    opacity: isFocused ? 1 : 0,
    transform: [{ scale: scale.value }],
  }));
}
