import { useEffect, useRef } from "react";
import { useIsFocused } from "expo-router";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";

export function useScreenTransition() {
  const isFocused = useIsFocused();
  const animatedValue = useSharedValue(isFocused ? 1 : 0);
  const isFirst = useRef(true);

  useEffect(() => {
    if (isFirst.current) {
      isFirst.current = false;
      return;
    }
    animatedValue.value = withTiming(isFocused ? 1 : 0, {
      duration: 200,
      easing: Easing.out(Easing.cubic),
    });
  }, [isFocused]);

  return useAnimatedStyle(() => ({
    opacity: animatedValue.value,
    transform: [{ translateY: (1 - animatedValue.value) * 12 }],
  }));
}
