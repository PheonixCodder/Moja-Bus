import { View, Text, Pressable, ScrollView } from "react-native";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowRight01Icon, Clock01Icon } from "@hugeicons/core-free-icons";
import { router } from "expo-router";
import type { CityValue } from "@/features/search/types";
import { toLocalISODate } from "@/features/search/lib/format";

interface PopularRoute {
  id: string;
  origin: CityValue;
  destination: CityValue;
  duration: string;
  fromXOF: string;
}

const POPULAR_ROUTES: PopularRoute[] = [
  {
    id: "r1",
    origin: { id: "Abidjan", text: "Abidjan (All Hubs)" },
    destination: { id: "Yamoussoukro", text: "Yamoussoukro" },
    duration: "3h 00m",
    fromXOF: "2 000",
  },
  {
    id: "r2",
    origin: { id: "Abidjan", text: "Abidjan (All Hubs)" },
    destination: { id: "Bouaké", text: "Bouaké" },
    duration: "4h 30m",
    fromXOF: "2 500",
  },
  {
    id: "r3",
    origin: { id: "Abidjan", text: "Abidjan (All Hubs)" },
    destination: { id: "San-Pédro", text: "San-Pédro" },
    duration: "5h 00m",
    fromXOF: "3 000",
  },
  {
    id: "r4",
    origin: { id: "Abidjan", text: "Abidjan (All Hubs)" },
    destination: { id: "Korhogo", text: "Korhogo" },
    duration: "7h 30m",
    fromXOF: "5 500",
  },
  {
    id: "r5",
    origin: { id: "Abidjan", text: "Abidjan (All Hubs)" },
    destination: { id: "Man", text: "Man" },
    duration: "8h 00m",
    fromXOF: "6 000",
  },
];

export function PopularRoutesGrid() {
  const { t } = useTranslation("search");

  const handleRoutePress = (route: PopularRoute) => {
    router.push({
      pathname: "/(tabs)/search",
      params: {
        from: route.origin.id,
        fromText: route.origin.text,
        to: route.destination.id,
        toText: route.destination.text,
        date: toLocalISODate(new Date()),
        passengers: "1",
      },
    });
  };

  return (
    <View className="gap-3">
      {/* Section Label */}
      <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">
        {t("popularRoutes")}
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 10, paddingBottom: 2 }}
      >
        {POPULAR_ROUTES.map((route) => (
          <Pressable
            key={route.id}
            onPress={() => handleRoutePress(route)}
            accessibilityRole="button"
            accessibilityLabel={`${route.origin.text} to ${route.destination.text}`}
            className="will-change-pressable bg-white border border-slate-200 px-4 py-3 rounded-2xl gap-2 shadow-xs active:bg-slate-50 min-w-[170px]"
          >
            {/* Origin -> Destination Row */}
            <View className="flex-row items-center justify-between gap-2">
              <Text
                className="text-xs font-black text-slate-900 flex-1"
                numberOfLines={1}
              >
                {route.origin.id}
              </Text>
              <View className="size-5 rounded-full bg-rose-50 border border-rose-100 items-center justify-center">
                <HugeiconsIcon icon={ArrowRight01Icon} size={10} color="#ee237c" />
              </View>
              <Text
                className="text-xs font-black text-slate-900 flex-1 text-right"
                numberOfLines={1}
              >
                {route.destination.text}
              </Text>
            </View>

            {/* Duration & Price Footer */}
            <View className="flex-row items-center justify-between mt-0.5">
              <View className="flex-row items-center gap-1">
                <HugeiconsIcon icon={Clock01Icon} size={11} color="#94a3b8" />
                <Text className="text-sm font-semibold text-slate-400">
                  {route.duration}
                </Text>
              </View>

              <View className="bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                <Text className="text-xs font-extrabold text-emerald-700">
                  {route.fromXOF} F
                </Text>
              </View>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
