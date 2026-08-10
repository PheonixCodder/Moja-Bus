import React, { useEffect } from 'react';
import { View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming, withSequence } from 'react-native-reanimated';

export function SearchSkeleton() {
  return (
    <View className="px-4 py-2">
      {[1, 2, 3].map((key) => (
        <SkeletonCard key={key} />
      ))}
    </View>
  );
}

function SkeletonCard() {
  const opacity = useSharedValue(0.5);

  useEffect(() => {
    opacity.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 800 }),
        withTiming(0.5, { duration: 800 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={animatedStyle} className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4">
      {/* Header */}
      <View className="flex-row justify-between items-center mb-4">
        <View className="flex-row items-center">
          <View className="w-8 h-8 rounded-full bg-slate-200 mr-2" />
          <View className="w-24 h-4 rounded bg-slate-200" />
        </View>
        <View className="w-16 h-5 rounded bg-slate-200" />
      </View>

      {/* Timeline */}
      <View className="flex-row mb-4">
        <View className="flex-1">
          <View className="w-16 h-6 rounded bg-slate-200 mb-2" />
          <View className="w-20 h-3 rounded bg-slate-200 mb-1" />
          <View className="w-12 h-3 rounded bg-slate-200" />
        </View>
        <View className="flex-1 items-center justify-center">
          <View className="w-full h-[1px] bg-slate-200" />
        </View>
        <View className="flex-1 items-end">
          <View className="w-16 h-6 rounded bg-slate-200 mb-2" />
          <View className="w-20 h-3 rounded bg-slate-200 mb-1" />
          <View className="w-12 h-3 rounded bg-slate-200" />
        </View>
      </View>

      <View className="h-[1px] bg-slate-100 my-3" />

      {/* Footer */}
      <View className="flex-row justify-between items-center">
        <View>
          <View className="w-24 h-6 rounded bg-slate-200 mb-2" />
          <View className="w-16 h-3 rounded bg-slate-200" />
        </View>
        <View className="w-28 h-10 rounded-xl bg-slate-200" />
      </View>
    </Animated.View>
  );
}
