import { useState } from "react";
import { View, Text, Pressable } from "react-native";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Search01Icon,
  ArrowUpDownIcon,
  Location01Icon,
  Calendar01Icon,
} from "@hugeicons/core-free-icons";
import { router } from "expo-router";

export function HomeSearchWidget() {
  const [origin, setOrigin] = useState({ name: "Abidjan", slug: "abidjan" });
  const [destination, setDestination] = useState({
    name: "Yamoussoukro",
    slug: "yamoussoukro",
  });
  const [selectedDateQuick, setSelectedDateQuick] = useState<"today" | "tomorrow">(
    "today"
  );

  const handleSwap = () => {
    setOrigin(destination);
    setDestination(origin);
  };

  const handleSearch = () => {
    const targetDate = new Date();
    if (selectedDateQuick === "tomorrow") {
      targetDate.setDate(targetDate.getDate() + 1);
    }
    const isoDate = targetDate.toISOString().split("T")[0];

    router.push({
      pathname: "/(tabs)/search",
      params: {
        origin: origin.slug,
        destination: destination.slug,
        date: isoDate,
      },
    });
  };

  return (
    <View className="bg-white rounded-2xl border border-slate-200 p-4 shadow-sm gap-3">
      {/* Widget Header Badge */}
      <View className="flex-row items-center justify-between">
        <View className="flex-row items-center gap-1.5 bg-rose-50 px-2.5 py-1 rounded-full border border-rose-100">
          <HugeiconsIcon icon={Search01Icon} size={12} color="#ee237c" />
          <Text className="text-[10px] font-extrabold text-rose-700 uppercase tracking-widest">
            Bus Express Search
          </Text>
        </View>

        {/* Date Quick Selector */}
        <View className="flex-row items-center bg-slate-100 p-0.5 rounded-lg gap-0.5">
          <Pressable
            onPress={() => setSelectedDateQuick("today")}
            className={`px-2 py-1 rounded-md ${
              selectedDateQuick === "today" ? "bg-white shadow-xs" : ""
            }`}
          >
            <Text
              className={`text-[10px] font-bold ${
                selectedDateQuick === "today" ? "text-slate-900" : "text-slate-500"
              }`}
            >
              Aujourd&apos;hui
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setSelectedDateQuick("tomorrow")}
            className={`px-2 py-1 rounded-md ${
              selectedDateQuick === "tomorrow" ? "bg-white shadow-xs" : ""
            }`}
          >
            <Text
              className={`text-[10px] font-bold ${
                selectedDateQuick === "tomorrow" ? "text-slate-900" : "text-slate-500"
              }`}
            >
              Demain
            </Text>
          </Pressable>
        </View>
      </View>

      {/* Origin / Swap / Destination Input Card */}
      <View className="bg-slate-50 rounded-xl p-3 border border-slate-200/80 gap-2 relative">
        {/* Origin Row */}
        <Pressable
          onPress={handleSearch}
          className="flex-row items-center gap-2.5 py-1"
        >
          <View className="size-7 rounded-full bg-rose-100 items-center justify-center">
            <HugeiconsIcon icon={Location01Icon} size={14} color="#ee237c" />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Départ
            </Text>
            <Text className="text-sm font-extrabold text-slate-900">
              {origin.name}
            </Text>
          </View>
        </Pressable>

        {/* Separator + Swap Button */}
        <View className="h-px bg-slate-200/80 my-0.5 relative justify-center">
          <Pressable
            onPress={handleSwap}
            className="absolute right-2 size-7 rounded-full bg-white border border-slate-300 items-center justify-center shadow-xs active:bg-slate-100"
          >
            <HugeiconsIcon icon={ArrowUpDownIcon} size={12} color="#64748b" />
          </Pressable>
        </View>

        {/* Destination Row */}
        <Pressable
          onPress={handleSearch}
          className="flex-row items-center gap-2.5 py-1"
        >
          <View className="size-7 rounded-full bg-rose-100 items-center justify-center">
            <HugeiconsIcon icon={Location01Icon} size={14} color="#ee237c" />
          </View>
          <View className="flex-1">
            <Text className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">
              Destination
            </Text>
            <Text className="text-sm font-extrabold text-slate-900">
              {destination.name}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* Submit Button */}
      <Pressable
        onPress={handleSearch}
        className="bg-rose-600 active:bg-rose-700 py-3.5 rounded-xl flex-row items-center justify-center gap-2 shadow-sm"
      >
        <HugeiconsIcon icon={Search01Icon} size={16} color="#ffffff" />
        <Text className="text-sm font-extrabold text-white">
          Rechercher des bus
        </Text>
      </Pressable>
    </View>
  );
}
