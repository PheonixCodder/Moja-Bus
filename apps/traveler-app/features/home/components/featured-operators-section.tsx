import { View, Text, Pressable, ScrollView, Image } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Bus01Icon, ArrowRight01Icon, Location01Icon } from "@hugeicons/core-free-icons";
import { router } from "expo-router";

interface OperatorItem {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  _count?: {
    routes: number;
    fleet: number;
  };
  cityNames?: string[];
}

interface FeaturedOperatorsSectionProps {
  operators?: OperatorItem[];
}

const FALLBACK_OPERATORS: OperatorItem[] = [
  {
    id: "op-1",
    slug: "utb",
    name: "Union des Transports de Bouaké",
    _count: { routes: 14, fleet: 32 },
    cityNames: ["Abidjan", "Yamoussoukro", "Bouaké"],
  },
  {
    id: "op-2",
    slug: "avs",
    name: "Abidjan Voyage Services",
    _count: { routes: 9, fleet: 21 },
    cityNames: ["Abidjan", "San-Pédro", "Daloa"],
  },
  {
    id: "op-3",
    slug: "gtt",
    name: "General Transport Company",
    _count: { routes: 7, fleet: 18 },
    cityNames: ["Korhogo", "Man", "Abidjan"],
  },
];

export function FeaturedOperatorsSection({ operators }: FeaturedOperatorsSectionProps) {
  const displayOperators =
    operators && operators.length > 0 ? operators : FALLBACK_OPERATORS;

  const handleOperatorPress = (op: OperatorItem) => {
    router.push({
      pathname: "/(tabs)/search",
      params: {
        operatorSlug: op.slug,
      },
    });
  };

  return (
    <View className="gap-3">
      {/* Section Label */}
      <View className="flex-row items-center justify-between px-0.5">
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          Verified Bus Carriers
        </Text>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
      >
        {displayOperators.map((op) => {
          const initials = op.name
            .split(" ")
            .map((w) => w[0])
            .join("")
            .slice(0, 3)
            .toUpperCase();

          return (
            <Pressable
              key={op.id}
              onPress={() => handleOperatorPress(op)}
              className="will-change-pressable w-60 bg-white border border-slate-200 p-3.5 rounded-2xl gap-2.5 shadow-sm active:bg-slate-50"
            >
              {/* Header: Logo avatar + Name */}
              <View className="flex-row items-center gap-3">
                {op.logoUrl ? (
                  <Image
                    source={{ uri: op.logoUrl }}
                    className="size-10 rounded-xl bg-slate-100"
                    resizeMode="cover"
                  />
                ) : (
                  <View className="size-10 rounded-xl bg-rose-50 border border-rose-100 items-center justify-center">
                    <Text className="text-xs font-black text-rose-700">
                      {initials}
                    </Text>
                  </View>
                )}

                <View className="flex-1 pr-1">
                  <Text
                    className="text-xs font-bold text-slate-900 leading-snug"
                    numberOfLines={1}
                  >
                    {op.name}
                  </Text>
                  <Text className="text-[10px] font-medium text-slate-400">
                    {op._count?.fleet || 10}+ Active Buses
                  </Text>
                </View>
              </View>

              {/* Stats & Cities */}
              <View className="bg-slate-50 p-2 rounded-xl flex-row items-center justify-between border border-slate-100">
                <View className="flex-row items-center gap-1">
                  <HugeiconsIcon icon={Bus01Icon} size={12} color="#ee237c" />
                  <Text className="text-[10px] font-extrabold text-slate-700">
                    {op._count?.routes || 5} Routes
                  </Text>
                </View>

                {op.cityNames && op.cityNames.length > 0 && (
                  <View className="flex-row items-center gap-1">
                    <HugeiconsIcon icon={Location01Icon} size={11} color="#94a3b8" />
                    <Text
                      className="text-[10px] font-medium text-slate-500"
                      numberOfLines={1}
                    >
                      {op.cityNames.slice(0, 2).join(", ")}
                    </Text>
                  </View>
                )}
              </View>

              {/* Action Link */}
              <View className="flex-row items-center justify-between pt-0.5">
                <Text className="text-[11px] font-bold text-rose-600">
                  View Schedules
                </Text>
                <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="#ee237c" />
              </View>
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
