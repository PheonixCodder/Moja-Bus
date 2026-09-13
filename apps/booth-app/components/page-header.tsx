import type React from "react";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { NotificationBell } from "./notification-bell";
import { Text } from "./ui/text";

export interface PageHeaderProps {
  title: string;
  description?: string;
  tag?: string;
  rightAction?: React.ReactNode;
}

export function PageHeader({
  title,
  description,
  tag,
  rightAction,
}: PageHeaderProps) {
  const insets = useSafeAreaInsets();
  const topPadding = insets.top > 0 ? insets.top + 16 : 28;

  return (
    <View
      style={{
        paddingTop: topPadding,
        paddingBottom: 16,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
      }}
      className="bg-background"
    >
      <View className="flex-1 pr-3 gap-0.5">
        {tag ? (
          <Text
            className="text-[11px] font-extrabold text-muted-foreground uppercase tracking-widest mb-0.5"
            numberOfLines={1}
          >
            {tag}
          </Text>
        ) : null}
        <Text
          className="font-heading text-2xl font-black text-foreground tracking-tight"
          numberOfLines={1}
        >
          {title}
        </Text>
        {description ? (
          <Text
            className="text-muted-foreground text-xs font-medium mt-0.5"
            numberOfLines={1}
          >
            {description}
          </Text>
        ) : null}
      </View>

      <View className="items-end shrink-0 pt-0.5">
        {rightAction !== undefined ? rightAction : <NotificationBell />}
      </View>
    </View>
  );
}
