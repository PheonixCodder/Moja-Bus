import { useQuery } from "@tanstack/react-query";
import { router } from "expo-router";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  FlatList,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { BoothFeedback } from "@/lib/haptics";
import { useTRPC } from "@/lib/trpc";
import { useSessionStore } from "@/stores/session";
import { IconColors } from "@/constants/ui-colors";

interface Terminal {
  id: string;
  name: string;
  addressLine1: string | null;
  cityRelation: { id: string; name: string } | null;
  municipality: { id: string; name: string } | null;
  latitude: number | null;
  longitude: number | null;
}

export default function TerminalSelectScreen() {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const { setTerminal } = useSessionStore();

  const {
    data: terminals,
    isPending,
    isError,
    refetch,
  } = useQuery(trpc.booth.getTerminals.queryOptions());

  async function handleSelectTerminal(terminal: Terminal) {
    BoothFeedback.successScan();

    setTerminal({
      id: terminal.id,
      name: terminal.name,
    });

    router.replace("/(tabs)");
  }

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={IconColors.brand} />
      </View>
    );
  }

  if (isError) {
    return (
      <View className="flex-1 items-center justify-center bg-background px-6">
        <Text className="text-foreground/60 text-center mb-4">
          {t("errors.generic")}
        </Text>
        <TouchableOpacity
          className="bg-primary rounded-lg px-6 py-3"
          onPress={() => refetch()}
        >
          <Text className="text-white font-semibold">
            {t("errors.generic")}
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View className="flex-1 bg-background">
      <View className="px-6 pt-16 pb-6">
        <Text className="font-heading text-2xl font-bold text-foreground">
          {t("terminalSelect.title")}
        </Text>
        <Text className="text-foreground/60 mt-1">
          {t("terminalSelect.subtitle")}
        </Text>
      </View>

      <FlatList
        data={terminals ?? []}
        keyExtractor={(item) => item.id}
        contentContainerClassName="px-6 gap-3 pb-8"
        renderItem={({ item }) => (
          <TouchableOpacity
            className="bg-card border border-border rounded-xl px-5 py-4 active:opacity-70"
            onPress={() => handleSelectTerminal(item)}
          >
            <Text className="font-semibold text-foreground text-base">
              {item.name}
            </Text>
            {item.cityRelation && (
              <Text className="text-foreground/60 text-sm mt-0.5">
                {item.municipality?.name ? `${item.municipality.name}, ` : ""}
                {item.cityRelation.name}
              </Text>
            )}
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View className="items-center py-12">
            <Text className="text-foreground/50">{t("errors.generic")}</Text>
          </View>
        }
      />
    </View>
  );
}
