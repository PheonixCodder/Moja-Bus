import {
  Cancel01Icon,
  MapPinIcon,
  Search01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { FlatList, Platform, Pressable, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { IconColors } from "@/constants/ui-colors";
import { BoothFeedback } from "@/lib/haptics";
import { useTRPC } from "@/lib/trpc";
import { useSessionStore } from "@/stores/session";

interface Terminal {
  id: string;
  name: string;
  addressLine1: string | null;
  cityRelation: { id: string; name: string } | null;
  municipality: { id: string; name: string } | null;
  latitude: number | null;
  longitude: number | null;
}

const TERMINAL_CARD_HEIGHT = 72;

const getTerminalItemLayout = (_: unknown, index: number) => ({
  length: TERMINAL_CARD_HEIGHT,
  offset: TERMINAL_CARD_HEIGHT * index,
  index,
});

const TerminalCard = React.memo(function TerminalCard({
  item,
  onSelect,
}: {
  item: Terminal;
  onSelect: (t: Terminal) => void;
}) {
  return (
    <Card variant="elevated" className="p-4" onPress={() => onSelect(item)}>
      <View className="flex-row items-center gap-3.5">
        <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
          <HugeiconsIcon icon={MapPinIcon} size={20} color={IconColors.brand} />
        </View>
        <View className="flex-1">
          <Text className="font-heading font-bold text-foreground text-base">
            {item.name}
          </Text>
          {item.cityRelation ? (
            <Text className="text-muted-foreground text-xs font-medium mt-0.5">
              {item.municipality?.name ? `${item.municipality.name}, ` : ""}
              {item.cityRelation.name}
            </Text>
          ) : null}
        </View>
      </View>
    </Card>
  );
});

export default function TerminalSelectScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const trpc = useTRPC();
  const setTerminal = useSessionStore((s) => s.setTerminal);
  const [search, setSearch] = useState("");

  const {
    data: terminals,
    isPending,
    isError,
    refetch,
  } = useQuery(trpc.booth.getTerminals.queryOptions());

  const filteredTerminals = useMemo(() => {
    if (!terminals) return [];
    if (!search.trim()) return terminals;
    const lower = search.toLowerCase();
    return terminals.filter(
      (item) =>
        item.name.toLowerCase().includes(lower) ||
        item.cityRelation?.name.toLowerCase().includes(lower) ||
        item.municipality?.name.toLowerCase().includes(lower),
    );
  }, [terminals, search]);

  const handleSelectTerminal = useCallback(
    (terminal: Terminal) => {
      BoothFeedback.successScan();

      setTerminal({
        id: terminal.id,
        name: terminal.name,
      });

      router.replace("/(tabs)");
    },
    [setTerminal],
  );

  const renderItem = useCallback(
    ({ item }: { item: Terminal }) => (
      <TerminalCard item={item} onSelect={handleSelectTerminal} />
    ),
    [handleSelectTerminal],
  );

  return (
    <View
      className="flex-1 bg-background"
      style={{
        paddingTop: Math.max(insets.top, 16),
        paddingBottom: Math.max(insets.bottom, 16),
      }}
    >
      {/* Header */}
      <View className="px-6 pt-3 pb-3">
        <Text className="font-heading text-2xl font-bold text-foreground tracking-tight">
          {t("terminalSelect.title")}
        </Text>
        <Text className="text-muted-foreground text-sm font-medium mt-0.5">
          {t("terminalSelect.subtitle")}
        </Text>
      </View>

      {/* Search Input */}
      <View className="px-6 mb-3">
        <Input
          placeholder={
            t("terminalSelect.searchPlaceholder") || "Rechercher une gare..."
          }
          value={search}
          onChangeText={setSearch}
          leftIcon={
            <HugeiconsIcon
              icon={Search01Icon}
              size={18}
              color={IconColors.muted}
            />
          }
          rightIcon={
            search ? (
              <Pressable
                onPress={() => {
                  BoothFeedback.tap();
                  setSearch("");
                }}
                hitSlop={8}
              >
                <HugeiconsIcon
                  icon={Cancel01Icon}
                  size={18}
                  color={IconColors.muted}
                />
              </Pressable>
            ) : null
          }
        />
      </View>

      {/* Loading Skeletons */}
      {isPending ? (
        <View className="px-6 gap-3 pt-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Card key={i} className="p-4 gap-2">
              <Skeleton className="h-5 w-44 rounded-md" />
              <Skeleton className="h-4 w-28 rounded-md" />
            </Card>
          ))}
        </View>
      ) : isError ? (
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-16 h-16 rounded-full bg-destructive/10 items-center justify-center mb-4">
            <HugeiconsIcon
              icon={MapPinIcon}
              size={32}
              color={IconColors.error}
            />
          </View>
          <Text className="text-foreground font-heading font-bold text-lg text-center mb-2">
            {t("errors.generic")}
          </Text>
          <Text className="text-muted-foreground text-sm text-center mb-6">
            {t("errors.networkRetry") ||
              "Impossible de charger la liste des gares."}
          </Text>
          <Button
            className="w-full max-w-xs"
            onPress={() => {
              BoothFeedback.tap();
              void refetch();
            }}
          >
            <Text className="text-primary-foreground font-semibold">
              {t("common.retry") || "Réessayer"}
            </Text>
          </Button>
        </View>
      ) : (
        <FlatList
          data={filteredTerminals}
          keyExtractor={(item) => item.id}
          contentContainerClassName="px-6 gap-3 pb-8"
          getItemLayout={getTerminalItemLayout}
          initialNumToRender={10}
          maxToRenderPerBatch={12}
          windowSize={5}
          removeClippedSubviews={Platform.OS === "android"}
          renderItem={renderItem}
          ListEmptyComponent={
            <View className="items-center justify-center py-20 px-4">
              <View className="w-14 h-14 rounded-full bg-muted/30 items-center justify-center mb-3">
                <HugeiconsIcon
                  icon={Search01Icon}
                  size={24}
                  color={IconColors.muted}
                />
              </View>
              <Text className="text-foreground font-semibold text-base text-center">
                {t("terminalSelect.noResults") || "Aucune gare trouvée"}
              </Text>
            </View>
          }
        />
      )}
    </View>
  );
}
