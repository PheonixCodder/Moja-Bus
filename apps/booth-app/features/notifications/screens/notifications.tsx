import {
  CheckmarkCircle01Icon,
  Notification03Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useNotifications, useNovu } from "@novu/react-native";
import { useCallback, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  View,
} from "react-native";
import { SubpageHeader } from "@/components/subpage-header";
import { Text } from "@/components/ui/text";
import { Palette } from "@/constants/theme";
import { IconColors } from "@/constants/ui-colors";
import { BoothFeedback } from "@/lib/haptics";

type NotificationItem = {
  id: string;
  body?: string;
  subject?: string;
  createdAt: string | Date;
  read?: boolean;
  isRead?: boolean;
};

function timeAgo(dateString: string | Date): string {
  const now = Date.now();
  const date = new Date(dateString).getTime();
  const diffMs = now - date;
  const diffSec = Math.floor(diffMs / 1000);

  if (diffSec < 60) return "À l'instant";
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return `Il y a ${diffMin} min`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `Il y a ${diffHr} h`;
  const diffDay = Math.floor(diffHr / 24);
  if (diffDay < 7) return `Il y a ${diffDay} j`;
  return new Date(dateString).toLocaleDateString("fr-FR");
}

function NotificationRow({
  item,
  onPress,
}: {
  item: NotificationItem;
  onPress: () => void;
}) {
  const isRead =
    typeof item.isRead === "boolean"
      ? item.isRead
      : typeof item.read === "boolean"
        ? item.read
        : false;

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      className={`rounded-2xl border p-4 active:opacity-80 transition-opacity ${
        isRead
          ? "border-border/70 bg-card shadow-2xs"
          : "border-primary/25 bg-primary/5 shadow-xs"
      }`}
    >
      <View className="flex-row gap-3.5">
        <View
          className={`size-10 rounded-2xl items-center justify-center shrink-0 ${
            isRead ? "bg-muted/40" : "bg-primary/10"
          }`}
        >
          <HugeiconsIcon
            icon={Notification03Icon}
            size={18}
            color={isRead ? IconColors.muted : Palette.rose[500]}
          />
        </View>

        <View className="flex-1 gap-1 min-w-0">
          <View className="flex-row items-center justify-between gap-2">
            <Text
              className={`flex-1 text-sm ${
                isRead
                  ? "font-semibold text-foreground"
                  : "font-black text-foreground"
              }`}
              numberOfLines={2}
            >
              {item.subject || "Notification"}
            </Text>
            {!isRead && (
              <View className="size-2 rounded-full bg-primary shrink-0" />
            )}
          </View>

          {item.body ? (
            <Text
              className="text-xs font-normal text-muted-foreground leading-relaxed"
              numberOfLines={3}
            >
              {item.body}
            </Text>
          ) : null}

          <Text className="text-[10px] font-bold text-muted-foreground/70 mt-1">
            {timeAgo(item.createdAt)}
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

export function NotificationsView() {
  const { t } = useTranslation();
  const novu = useNovu();
  const { notifications, isLoading, fetchMore, hasMore, refetch } =
    useNotifications();

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const handleMarkAllRead = useCallback(async () => {
    BoothFeedback.tap();
    try {
      const client = (novu as any)?.notifications ? novu : (novu as any)?.novu;
      if (client?.notifications?.readAll) {
        await client.notifications.readAll();
      }
      void refetch();
    } catch (_e) {}
  }, [novu, refetch]);

  const handleNotificationPress = useCallback(
    async (item: NotificationItem) => {
      BoothFeedback.selection();
      const isRead =
        typeof item.isRead === "boolean"
          ? item.isRead
          : typeof item.read === "boolean"
            ? item.read
            : false;

      if (!isRead) {
        try {
          const client = (novu as any)?.notifications ? novu : (novu as any)?.novu;
          if (client?.notifications?.read) {
            await client.notifications.read(item.id);
          }
          void refetch();
        } catch (_e) {}
      }
    },
    [novu, refetch],
  );

  const items = ((notifications ?? []) as unknown) as NotificationItem[];
  const hasUnread = items.some((n) =>
    typeof n.isRead === "boolean" ? !n.isRead : !n.read,
  );

  return (
    <View className="flex-1 bg-background">
      <SubpageHeader
        title={t("notifications.title", "Notifications")}
        rightAction={
          hasUnread ? (
            <Pressable
              onPress={handleMarkAllRead}
              accessibilityRole="button"
              accessibilityLabel={t("notifications.markAllRead", "Tout lire")}
              className="size-10 rounded-2xl bg-card border border-border/80 items-center justify-center shadow-2xs active:bg-muted/40"
            >
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                size={18}
                color={Palette.rose[500]}
              />
            </Pressable>
          ) : undefined
        }
      />

      {isLoading && items.length === 0 ? (
        <View className="flex-1 items-center justify-center py-20">
          <ActivityIndicator size="large" color={Palette.rose[500]} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{
            paddingHorizontal: 20,
            paddingBottom: 40,
            gap: 10,
          }}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => (
            <NotificationRow
              item={item}
              onPress={() => handleNotificationPress(item)}
            />
          )}
          onEndReached={() => {
            if (hasMore && !isLoading) {
              fetchMore();
            }
          }}
          onEndReachedThreshold={0.3}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[Palette.rose[500]]}
              tintColor={Palette.rose[500]}
            />
          }
          ListEmptyComponent={
            <View className="items-center justify-center py-24 px-6">
              <View className="size-16 rounded-full bg-muted/40 items-center justify-center mb-4">
                <HugeiconsIcon
                  icon={Notification03Icon}
                  size={26}
                  color={IconColors.muted}
                />
              </View>
              <Text className="text-foreground font-black text-base text-center">
                {t("notifications.emptyTitle", "Aucune notification")}
              </Text>
              <Text className="text-muted-foreground text-xs text-center mt-2 max-w-[260px] leading-relaxed">
                {t(
                  "notifications.emptySubtitle",
                  "Vous serez averti des alertes de service et des mises à jour de caisse ici.",
                )}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
