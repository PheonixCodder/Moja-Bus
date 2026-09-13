import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { type Href, router } from "expo-router";
import type React from "react";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { IconColors } from "@/constants/ui-colors";
import { BoothFeedback } from "@/lib/haptics";

export type SubpageHeaderProps = {
  title: string;
  subtitle?: string;
  backRoute?: Href;
  onBack?: () => void;
  hideBack?: boolean;
  rightAction?: React.ReactNode;
};

export function SubpageHeader({
  title,
  subtitle,
  backRoute,
  onBack,
  hideBack = false,
  rightAction,
}: SubpageHeaderProps) {
  const insets = useSafeAreaInsets();

  const handleBack = () => {
    BoothFeedback.tap();
    if (onBack) {
      onBack();
    } else if (backRoute) {
      router.navigate(backRoute);
    } else {
      router.back();
    }
  };

  return (
    <View
      style={{
        paddingTop: insets.top > 0 ? insets.top + 12 : 24,
        paddingBottom: 14,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "space-between",
      }}
      className="bg-background border-b border-border/40"
    >
      {!hideBack ? (
        <Pressable
          onPress={handleBack}
          accessibilityRole="button"
          accessibilityLabel="Retour"
          className="size-10 rounded-2xl bg-card border border-border/80 items-center justify-center shadow-2xs active:bg-muted/40"
        >
          <HugeiconsIcon
            icon={ArrowLeft02Icon}
            size={20}
            color={IconColors.default}
          />
        </Pressable>
      ) : (
        <View className="size-10" />
      )}

      <View className="flex-1 items-center px-2">
        <Text
          className="text-lg font-heading font-black text-foreground tracking-tight"
          numberOfLines={1}
        >
          {title}
        </Text>
        {subtitle ? (
          <Text
            className="text-xs font-medium text-muted-foreground truncate mt-0.5"
            numberOfLines={1}
          >
            {subtitle}
          </Text>
        ) : null}
      </View>

      <View className="min-w-[40px] items-end">
        {rightAction ?? <View className="size-10" />}
      </View>
    </View>
  );
}
