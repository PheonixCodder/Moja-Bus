import { Tabs } from "expo-router";
import {
  Text,
  Pressable,
  View,
  useWindowDimensions,
} from "react-native";
import Svg, { Path } from "react-native-svg";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Animated, {
  useSharedValue,
  withTiming,
  useAnimatedStyle,
  Easing,
} from "react-native-reanimated";
import { useEffect, useRef } from "react";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Home01Icon,
  Calendar01Icon,
  Search01Icon,
  Ticket01Icon,
  Settings01Icon,
} from "@hugeicons/core-free-icons";

const iconMap: Record<string, { icon: typeof Home01Icon; label: string }> = {
  index: { icon: Home01Icon, label: "Home" },
  bookings: { icon: Calendar01Icon, label: "Bookings" },
  tickets: { icon: Ticket01Icon, label: "Tickets" },
  settings: { icon: Settings01Icon, label: "Settings" },
};

const CR = 24;
const BAR_HEIGHT = 64;
const CIRCLE_SIZE = 54;
const PEAK = 22;
const TOTAL_HEIGHT = BAR_HEIGHT + PEAK;
const INDICATOR_WIDTH = 20;
const INDICATOR_HEIGHT = 3;

function getCurvedPath(w: number): string {
  const cx = w / 2;
  const hw = CIRCLE_SIZE * 0.6 + 12;
  const peak = PEAK;

  return [
    `M ${CR} 0`,
    `L ${cx - hw} 0`,
    `C ${cx - hw + 8} 0, ${cx - hw + 14} -${peak}, ${cx} -${peak}`,
    `C ${cx + hw - 14} -${peak}, ${cx + hw - 8} 0, ${cx + hw} 0`,
    `L ${w - CR} 0`,
    `Q ${w} 0, ${w} ${CR}`,
    `L ${w} ${BAR_HEIGHT - CR}`,
    `Q ${w} ${BAR_HEIGHT}, ${w - CR} ${BAR_HEIGHT}`,
    `L ${CR} ${BAR_HEIGHT}`,
    `Q 0 ${BAR_HEIGHT}, 0 ${BAR_HEIGHT - CR}`,
    `L 0 ${CR}`,
    `Q 0 0, ${CR} 0`,
    "Z",
  ].join(" ");
}

function TabItem({
  config,
  isFocused,
  onPress,
  onPressIn,
}: {
  config: { icon: typeof Home01Icon; label: string };
  isFocused: boolean;
  onPress: () => void;
  onPressIn?: () => void;
}) {
  const labelOpacity = useSharedValue(isFocused ? 1 : 0);
  const labelTranslateY = useSharedValue(isFocused ? 0 : 8);

  useEffect(() => {
    labelOpacity.value = withTiming(isFocused ? 1 : 0, { duration: 200 });
    labelTranslateY.value = withTiming(isFocused ? 0 : 8, { duration: 200 });
  }, [isFocused]);

  const labelAnimatedStyle = useAnimatedStyle(() => ({
    opacity: labelOpacity.value,
    transform: [{ translateY: labelTranslateY.value }],
  }));

  return (
    <Pressable
      onPress={onPress}
      onPressIn={onPressIn}
      style={({ pressed }) => ({
        flex: 1,
        alignItems: "center",
        justifyContent: "center",
        gap: 2,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <HugeiconsIcon
        icon={config.icon}
        size={24}
        color={isFocused ? "#ee237c" : "#a3a3a3"}
      />
      <Animated.Text
        style={[
          {
            fontSize: 11,
            fontWeight: "700",
            color: "#ee237c",
            letterSpacing: 0.3,
          },
          labelAnimatedStyle,
        ]}
      >
        {config.label}
      </Animated.Text>
    </Pressable>
  );
}

function SearchButton({ onPress }: { onPress: () => void }) {
  return (
    <View style={{ flex: 1, alignItems: "center" }}>
      <Pressable
        onPress={onPress}
        style={({ pressed }) => ({
          width: CIRCLE_SIZE,
          height: CIRCLE_SIZE,
          borderRadius: CIRCLE_SIZE / 2,
          backgroundColor: "#ee237c",
          alignItems: "center",
          justifyContent: "center",
          marginTop: -(CIRCLE_SIZE / 2 + 6) + PEAK,
          opacity: pressed ? 0.85 : 1,
          shadowColor: "#ee237c",
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.4,
          shadowRadius: 12,
          elevation: 10,
        })}
      >
        <HugeiconsIcon icon={Search01Icon} size={26} color="#ffffff" />
      </Pressable>
    </View>
  );
}

import { useBookingPrefetch } from "@/features/booking/hooks/use-booking-prefetch";

function CustomTabBar({ state, descriptors, navigation }: any) {
  const { width: screenWidth } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const { prefetchBookings, prefetchStats } = useBookingPrefetch();
  const centerIndex = Math.floor(state.routes.length / 2);
  const margin = 16;
  const barWidth = screenWidth - margin * 2;
  const tabCount = state.routes.length;
  const tabWidth = barWidth / tabCount;

  const indicatorX = useSharedValue(0);
  const indicatorOpacity = useSharedValue(state.index === 2 ? 0 : 1);
  const isFirstIndicator = useRef(true);

  useEffect(() => {
    const centerX = tabWidth * state.index + tabWidth / 2;
    const x = centerX - INDICATOR_WIDTH / 2;

    if (isFirstIndicator.current) {
      isFirstIndicator.current = false;
      indicatorX.value = x;
      indicatorOpacity.value = state.index === 2 ? 0 : 1;
      return;
    }

    indicatorOpacity.value = withTiming(state.index === 2 ? 0 : 1, {
      duration: 200,
    });
    indicatorX.value = withTiming(x, {
      duration: 250,
      easing: Easing.out(Easing.cubic),
    });
  }, [state.index]);

  const indicatorAnimatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
    opacity: indicatorOpacity.value,
  }));

  return (
    <View
      style={{
        position: "absolute",
        bottom: 0,
        left: 0,
        right: 0,
        alignItems: "center",
        paddingBottom: insets.bottom + 8,
      }}
    >
      <View style={{ width: barWidth, height: TOTAL_HEIGHT }}>
        <Svg width="100%" height="100%" viewBox={`0 0 ${barWidth} ${TOTAL_HEIGHT}`}>
          <Path
            d={getCurvedPath(barWidth)}
            fill="#ffffff"
            stroke="#e5e5e5"
            strokeWidth={0.5}
          />
        </Svg>

        <View
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            flexDirection: "row",
            height: BAR_HEIGHT,
          }}
        >
          {state.routes.map((route: any, index: number) => {
            const isFocused = state.index === index;
            const isSearch = route.name === "search";

            const onPress = () => {
              const event = navigation.emit({
                type: "tabPress",
                target: route.key,
                canPreventDefault: true,
              });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name, { merge: true });
              }
            };

            const handlePressIn = () => {
              if (route.name === "bookings") {
                prefetchBookings("upcoming");
                prefetchStats();
              } else if (route.name === "tickets") {
                prefetchBookings("upcoming");
              }
            };

            if (isSearch) {
              return <SearchButton key={route.key} onPress={onPress} />;
            }

            const config = iconMap[route.name];
            if (!config) return null;

            return (
              <TabItem
                key={route.key}
                config={config}
                isFocused={isFocused}
                onPress={onPress}
                onPressIn={handlePressIn}
              />
            );
          })}

          <Animated.View
            pointerEvents="none"
            style={[
              {
                position: "absolute",
                bottom: 6,
                left: 0,
                width: INDICATOR_WIDTH,
                height: INDICATOR_HEIGHT,
                borderRadius: INDICATOR_HEIGHT / 2,
                backgroundColor: "#ee237c",
              },
              indicatorAnimatedStyle,
            ]}
          />
        </View>
      </View>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{ headerShown: false }}
      tabBar={(props) => <CustomTabBar {...props} />}
    >
      <Tabs.Screen name="index" options={{ title: "Home" }} />
      <Tabs.Screen name="bookings" options={{ title: "Bookings" }} />
      <Tabs.Screen name="search" options={{ title: "Search" }} />
      <Tabs.Screen name="tickets" options={{ title: "Tickets" }} />
      <Tabs.Screen name="settings" options={{ title: "Settings" }} />
    </Tabs>
  );
}
