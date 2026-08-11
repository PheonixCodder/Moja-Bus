import { View, Text, Pressable } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  Ticket01Icon,
  Search01Icon,
  ArrowRight01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { router } from "expo-router";

interface ActiveTripCardProps {
  booking?: any;
}

export function ActiveTripCard({ booking }: ActiveTripCardProps) {
  if (booking) {
    const originName = booking.originTerminal?.city?.name || booking.originTerminal?.name || "Abidjan";
    const destName = booking.destinationTerminal?.city?.name || booking.destinationTerminal?.name || "Yamoussoukro";
    const departureTime = booking.scheduledDeparture
      ? new Date(booking.scheduledDeparture).toLocaleTimeString("fr-FR", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "14:00";

    return (
      <Pressable onPress={() => router.push("/(tabs)/tickets")}>
        <LinearGradient
          colors={["#0f172a", "#ee237c"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={{ borderRadius: 20, padding: 18 }}
        >
          <View className="flex-row items-center justify-between mb-3">
            <View className="bg-rose-500/20 px-2.5 py-1 rounded-full border border-rose-400/30 flex-row items-center gap-1">
              <HugeiconsIcon icon={Clock01Icon} size={12} color="#f472b6" />
              <Text className="text-[11px] font-extrabold text-rose-300 uppercase tracking-wider">
                Upcoming Trip Today
              </Text>
            </View>
            <Text className="text-xs font-mono font-bold text-slate-300">
              Ref: {booking.referenceCode || "MOJA-123"}
            </Text>
          </View>

          <View className="flex-row items-center justify-between my-2">
            <View>
              <Text className="text-lg font-black text-white">{originName}</Text>
              <Text className="text-[11px] text-slate-300">Departure: {departureTime}</Text>
            </View>
            <HugeiconsIcon icon={ArrowRight01Icon} size={20} color="#ffffff" />
            <View className="items-end">
              <Text className="text-lg font-black text-white">{destName}</Text>
              <Text className="text-[11px] text-slate-300">Seat {booking.seatNumber || "12A"}</Text>
            </View>
          </View>

          <View className="pt-3 mt-2 border-t border-white/10 flex-row items-center justify-between">
            <Text className="text-xs font-medium text-slate-200">
              Show QR at station gate
            </Text>
            <View className="bg-white px-3 py-1.5 rounded-full flex-row items-center gap-1.5 shadow-sm">
              <HugeiconsIcon icon={Ticket01Icon} size={14} color="#0f172a" />
              <Text className="text-xs font-extrabold text-slate-900">Show Ticket QR</Text>
            </View>
          </View>
        </LinearGradient>
      </Pressable>
    );
  }

  // Fallback: Compact "Where to next?" search launcher card
  return (
    <Pressable onPress={() => router.push("/(tabs)/search")}>
      <LinearGradient
        colors={["#ffffff", "#fff1f2"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{
          borderRadius: 20,
          padding: 16,
          borderWidth: 1,
          borderColor: "#fecdd3",
        }}
      >
        <View className="flex-row items-center justify-between">
          <View className="flex-1 pr-3">
            <View className="bg-rose-100 self-start px-2 py-0.5 rounded-full mb-1">
              <Text className="text-[10px] font-extrabold text-rose-800 uppercase tracking-widest">
                Moja Express Search
              </Text>
            </View>
            <Text className="text-base font-extrabold text-slate-900">
              Where are you traveling next?
            </Text>
            <Text className="text-xs text-slate-500 mt-0.5">
              Compare bus companies, seats & fares across Cote d'Ivoire
            </Text>
          </View>

          <View className="size-12 rounded-full bg-rose-500 items-center justify-center shadow-md">
            <HugeiconsIcon icon={Search01Icon} size={22} color="#ffffff" />
          </View>
        </View>
      </LinearGradient>
    </Pressable>
  );
}
