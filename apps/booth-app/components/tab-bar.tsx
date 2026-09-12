import {
  BarcodeScanIcon,
  Invoice01Icon,
  Ticket01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import type { Tabs } from "expo-router";
import type { ComponentProps } from "react";
import { useEffect } from "react";
import { useTranslation } from "react-i18next";
import { Dimensions, Text, TouchableOpacity, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { colors } from "@/constants/theme";
import { BoothFeedback } from "@/lib/haptics";
import { useOfflineQueue } from "@/stores/offline-queue";

export type TabBarProps = Parameters<
  NonNullable<ComponentProps<typeof Tabs>["tabBar"]>
>[0];

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const CIRCLE_SIZE = 48;
const TAB_HEIGHT = 64;

interface TabConfig {
  name: string;
  labelKey: string;
  defaultTitle: string;
  icon: typeof Ticket01Icon;
}

const DEFAULT_TAB: TabConfig = {
  name: "index",
  labelKey: "sell.tabLabel",
  defaultTitle: "Vente",
  icon: Ticket01Icon,
};

const TABS: TabConfig[] = [
  DEFAULT_TAB,
  {
    name: "checkin",
    labelKey: "checkin.tabLabel",
    defaultTitle: "Contrôle",
    icon: BarcodeScanIcon,
  },
  {
    name: "bookings",
    labelKey: "bookings.tabLabel",
    defaultTitle: "Ventes",
    icon: Invoice01Icon,
  },
  {
    name: "profile",
    labelKey: "profile.tabLabel",
    defaultTitle: "Profil",
    icon: UserIcon,
  },
];

export function TabBar({ state, navigation }: TabBarProps) {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const offlineQueueCount = useOfflineQueue((s) => s.queue.length);

  const activeTabs = TABS;
  const tabWidth = SCREEN_WIDTH / activeTabs.length;

  const indicatorX = useSharedValue(
    state.index * tabWidth + (tabWidth - CIRCLE_SIZE) / 2,
  );

  useEffect(() => {
    indicatorX.value = withTiming(
      state.index * tabWidth + (tabWidth - CIRCLE_SIZE) / 2,
      {
        duration: 220,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      },
    );
  }, [state.index, tabWidth, indicatorX]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.value }],
  }));

  return (
    <View
      className="flex-row bg-card border-t border-border"
      style={{ height: TAB_HEIGHT + 8, paddingBottom: insets.bottom || 8 }}
    >
      <Animated.View
        className="absolute rounded-full bg-primary shadow-xs"
        style={[
          {
            top: (TAB_HEIGHT - CIRCLE_SIZE) / 2,
            left: 0,
            width: CIRCLE_SIZE,
            height: CIRCLE_SIZE,
          },
          indicatorStyle,
        ]}
      />

      {state.routes
        .filter((route) => TABS.some((tab) => tab.name === route.name))
        .map((route, index) => {
          const tab =
            TABS.find((item) => item.name === route.name) ??
            TABS[index] ??
            DEFAULT_TAB;
          const isFocused = state.index === index;
          const showBadge = tab.name === "bookings" && offlineQueueCount > 0;
          const title = tab.labelKey
            ? t(tab.labelKey, tab.defaultTitle)
            : tab.defaultTitle;

          const onPress = () => {
            BoothFeedback.tap();
            const event = navigation.emit({
              type: "tabPress",
              target: route.key,
              canPreventDefault: true,
            });
            if (!isFocused && !event.defaultPrevented) {
              navigation.navigate(route.name);
            }
          };

          return (
            <TouchableOpacity
              key={route.key}
              onPress={onPress}
              activeOpacity={0.8}
              accessibilityRole="tab"
              accessibilityState={{ selected: isFocused }}
              accessibilityLabel={title}
              className="flex-1 items-center justify-center"
              style={{ height: TAB_HEIGHT }}
            >
              <View className="items-center justify-center">
                <HugeiconsIcon
                  icon={tab.icon}
                  size={22}
                  color={isFocused ? "#ffffff" : colors.neutral.textMuted}
                />

                {showBadge ? (
                  <View className="absolute -top-1 -right-2.5 bg-amber-500 rounded-full min-w-4 h-4 items-center justify-center px-1">
                    <Text className="text-[9px] font-extrabold text-white">
                      {offlineQueueCount > 99 ? "99+" : offlineQueueCount}
                    </Text>
                  </View>
                ) : null}
              </View>

              {!isFocused ? (
                <Text className="text-xs font-semibold text-muted-foreground mt-0.5">
                  {title}
                </Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
    </View>
  );
}
