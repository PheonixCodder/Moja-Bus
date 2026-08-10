import { TrendingUp } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "@/components/ui/text";

export function TravelBenefits() {
  return (
    <View className="bg-white rounded-2xl border border-slate-100 p-4">
      <View className="flex-row items-center gap-1 mb-3">
        <TrendingUp size={16} color="#ee237c" />
        <Text className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">
          Travel Benefits
        </Text>
      </View>

      <View className="gap-3">
        {/* Benefit 1 */}
        <View className="flex-row gap-2">
          <View className="w-5 h-5 rounded-full bg-pink-50 items-center justify-center">
            <Text className="text-[10px] font-black text-pink-600">1</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-slate-800">Instant Booking</Text>
            <Text className="text-[11px] text-slate-500 mt-0.5 leading-4">
              Book trips instantly without needing to pay each time — the fare is deducted from your wallet.
            </Text>
          </View>
        </View>

        {/* Benefit 2 */}
        <View className="flex-row gap-2">
          <View className="w-5 h-5 rounded-full bg-pink-50 items-center justify-center">
            <Text className="text-[10px] font-black text-pink-600">2</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-slate-800">One-Click Refunds</Text>
            <Text className="text-[11px] text-slate-500 mt-0.5 leading-4">
              Cancelled trips are refunded directly to your wallet — no waiting, no paperwork.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
