import { View, Text, Pressable, ScrollView } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { ArrowRight01Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { router } from "expo-router";

interface PopularRoute {
  id: string;
  originName: string;
  destinationName: string;
  originSlug: string;
  destinationSlug: string;
}

const POPULAR_ROUTES: PopularRoute[] = [
  {
    id: "r1",
    originName: "Abidjan",
    destinationName: "Yamoussoukro",
    originSlug: "abidjan",
    destinationSlug: "yamoussoukro",
  },
  {
    id: "r2",
    originName: "Abidjan",
    destinationName: "Bouaké",
    originSlug: "abidjan",
    destinationSlug: "bouake",
  },
  {
    id: "r3",
    originName: "Abidjan",
    destinationName: "San-Pédro",
    originSlug: "abidjan",
    destinationSlug: "san-pedro",
  },
  {
    id: "r4",
    originName: "Abidjan",
    destinationName: "Korhogo",
    originSlug: "abidjan",
    destinationSlug: "korhogo",
  },
];

export function PopularRoutesGrid() {
  const handleRoutePress = (route: PopularRoute) => {
    router.push({
      pathname: "/(tabs)/search",
      params: {
        origin: route.originSlug,
        destination: route.destinationSlug,
      },
    });
  };

  return (
    <View className="gap-3">
      {/* Section label — no emoji */}
      <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">
        Popular Routes
      </Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        // contentContainerStyle for reliable gap; negative margin to bleed past H_PADDING
        contentContainerStyle={{ gap: 10 }}
      >
        {POPULAR_ROUTES.map((route) => (
          <Pressable
            key={route.id}
            onPress={() => handleRoutePress(route)}
            className="will-change-pressable bg-white border border-slate-200 px-4 py-3 rounded-2xl flex-row items-center gap-2 shadow-sm active:bg-slate-50"
          >
            <View className="size-8 rounded-full bg-rose-50 items-center justify-center">
              <HugeiconsIcon icon={Location01Icon} size={14} color="#ee237c" />
            </View>
            <View className="flex-row items-center gap-1.5">
              <Text className="text-sm font-bold text-slate-900">
                {route.originName}
              </Text>
              <HugeiconsIcon icon={ArrowRight01Icon} size={12} color="#94a3b8" />
              <Text className="text-sm font-bold text-slate-900">
                {route.destinationName}
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
