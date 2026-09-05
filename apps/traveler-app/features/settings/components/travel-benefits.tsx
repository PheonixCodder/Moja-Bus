import { TrendingUp } from "lucide-react-native";
import { View } from "react-native";
import { Text } from "@/components/ui/text";
import { Palette } from "@/constants/theme";

export function TravelBenefits() {
  return (
    <View className="bg-card rounded-2xl border border-border p-4">
      <View className="flex-row items-center gap-1 mb-3">
        <TrendingUp size={16} color={Palette.rose[500]} />
        <Text className="text-sm font-bold text-muted-foreground tracking-widest uppercase">
          Travel Benefits
        </Text>
      </View>

      <View className="gap-3">
        {/* Benefit 1 */}
        <View className="flex-row gap-2">
          <View className="w-5 h-5 rounded-full bg-primary/10 items-center justify-center">
            <Text className="text-xs font-black text-primary">1</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">Instant Booking</Text>
            <Text className="text-sm text-muted-foreground mt-0.5 leading-4">
              Book trips instantly without needing to pay each time — the fare is deducted from your wallet.
            </Text>
          </View>
        </View>

        {/* Benefit 2 */}
        <View className="flex-row gap-2">
          <View className="w-5 h-5 rounded-full bg-primary/10 items-center justify-center">
            <Text className="text-xs font-black text-primary">2</Text>
          </View>
          <View className="flex-1">
            <Text className="text-sm font-semibold text-foreground">One-Click Refunds</Text>
            <Text className="text-sm text-muted-foreground mt-0.5 leading-4">
              Cancelled trips are refunded directly to your wallet — no waiting, no paperwork.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
}
