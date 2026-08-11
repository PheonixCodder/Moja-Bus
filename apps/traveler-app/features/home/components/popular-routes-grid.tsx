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
  priceXOF: number;
}

const POPULAR_ROUTES: PopularRoute[] = [
  {
    id: "r1",
    originName: "Abidjan",
    destinationName: "Yamoussoukro",
    originSlug: "abidjan",
    destinationSlug: "yamoussoukro",
    priceXOF: 4500,
  },
  {
    id: "r2",
    originName: "Abidjan",
    destinationName: "Bouaké",
    originSlug: "abidjan",
    destinationSlug: "bouake",
    priceXOF: 7000,
  },
  {
    id: "r3",
    originName: "Abidjan",
    destinationName: "San-Pédro",
    originSlug: "abidjan",
    destinationSlug: "san-pedro",
    priceXOF: 8500,
  },
  {
    id: "r4",
    originName: "Abidjan",
    destinationName: "Korhogo",
    originSlug: "abidjan",
    destinationSlug: "korhogo",
    priceXOF: 12000,
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
    <View className="space-y-2">
      <Text className="text-sm font-extrabold text-slate-900 uppercase tracking-wider px-1">
        Popular Routes 🚌
      </Text>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} className="flex-row">
        {POPULAR_ROUTES.map((route) => (
          <Pressable
            key={route.id}
            onPress={() => handleRoutePress(route)}
            className="mr-2.5 bg-white border border-slate-200 px-3.5 py-2.5 rounded-xl flex-row items-center gap-2 shadow-3xs active:bg-slate-50"
          >
            <View className="size-7 rounded-full bg-rose-50 items-center justify-center">
              <HugeiconsIcon icon={Location01Icon} size={14} color="#ee237c" />
            </View>
            <View>
              <View className="flex-row items-center gap-1">
                <Text className="text-xs font-bold text-slate-900">{route.originName}</Text>
                <HugeiconsIcon icon={ArrowRight01Icon} size={10} color="#94a3b8" />
                <Text className="text-xs font-bold text-slate-900">{route.destinationName}</Text>
              </View>
              <Text className="text-[10px] text-slate-500 font-medium">
                From {route.priceXOF.toLocaleString("fr-FR")} F CFA
              </Text>
            </View>
          </Pressable>
        ))}
      </ScrollView>
    </View>
  );
}
