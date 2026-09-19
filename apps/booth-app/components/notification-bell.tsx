import { Notification03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useCounts } from "@novu/react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { Pressable, Text, View } from "react-native";
import { Palette } from "@/constants/theme";
import { IconColors } from "@/constants/ui-colors";
import { authClient } from "@/lib/auth-client";
import { BoothFeedback } from "@/lib/haptics";
import { useTRPC } from "@/lib/trpc";

export function NotificationBell() {
  const { data: session, isPending: sessionPending } = authClient.useSession();
  const trpc = useTRPC();
  const { data: token, isPending: tokenPending } = useQuery({
    ...trpc.public.getNotificationToken.queryOptions(undefined, {
      staleTime: Infinity,
    }),
    enabled: !!session?.user,
  });

  const isReady = !!session?.user && !!token?.subscriberId && !!token?.appId;

  if (sessionPending || !session?.user || tokenPending || !isReady) {
    return (
      <View className="size-10 rounded-2xl bg-card border border-border/80 items-center justify-center opacity-60">
        <HugeiconsIcon
          icon={Notification03Icon}
          size={18}
          color={IconColors.muted}
        />
      </View>
    );
  }

  return <BellWithCount />;
}

function BellWithCount() {
  const { counts } = useCounts({ filters: [{ read: false }] });
  const unread = counts?.[0]?.count ?? 0;

  const handlePress = () => {
    BoothFeedback.tap();
    router.push("/notifications");
  };

  return (
    <Pressable
      onPress={handlePress}
      accessibilityRole="button"
      accessibilityLabel="Notifications"
      className="size-10 rounded-2xl bg-card border border-border/80 items-center justify-center shadow-2xs active:bg-muted/40 relative"
    >
      <HugeiconsIcon
        icon={Notification03Icon}
        size={19}
        color={unread > 0 ? Palette.rose[500] : IconColors.default}
      />
      {unread > 0 && (
        <View className="absolute -top-1 -right-1 min-w-[18px] h-[18px] rounded-full bg-primary items-center justify-center px-1 shadow-2xs">
          <Text className="text-[10px] font-black text-white">
            {unread > 99 ? "99+" : unread}
          </Text>
        </View>
      )}
    </Pressable>
  );
}
