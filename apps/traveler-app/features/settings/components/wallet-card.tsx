import { Wallet, Plus, ShieldCheck } from "lucide-react-native";
import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";

type WalletCardProps = {
  availableBalance: number;
  walletId: string;
  onOpenTopup: () => void;
};

export function WalletCard({ availableBalance, walletId, onOpenTopup }: WalletCardProps) {
  const accountSuffix = walletId ? walletId.slice(-6).toUpperCase() : "XXXXXX";

  return (
    <View className="bg-pink-600 rounded-3xl px-4 py-5 min-h-[200px] overflow-hidden shadow-xl shadow-pink-500/40">
      {/* Decorative circles */}
      <View className="absolute -top-10 -right-10 w-48 h-48 rounded-full bg-white/[0.08]" />
      <View className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-black/[0.06]" />

      <View className="z-10">
        {/* Header row */}
        <View className="flex-row items-start justify-between">
          <View className="flex-row items-center gap-2">
            <View className="w-10 h-10 rounded-2xl bg-white/10 items-center justify-center">
              <Wallet size={20} color="#fff" />
            </View>
            <View>
              <Text className="text-xs font-extrabold tracking-widest text-white/90 uppercase">Moja Wallet</Text>
              <Text className="text-[10px] text-white/60 font-mono mt-0.5">•••• {accountSuffix}</Text>
            </View>
          </View>

          <View className="flex-row items-center gap-1 px-2.5 py-1 rounded-full bg-white/10">
            <ShieldCheck size={14} color="#6ee7b7" />
            <Text className="text-[9px] font-extrabold tracking-widest text-white uppercase">Verified</Text>
          </View>
        </View>

        {/* Balance */}
        <View className="mt-5">
          <Text className="text-[10px] font-bold text-white/60 tracking-[2px] uppercase">Balance</Text>
          <View className="flex-row items-baseline gap-1 mt-1">
            <Text className="text-[36px] font-black text-white tracking-tight">
              {availableBalance.toLocaleString()}
            </Text>
            <Text className="text-base font-bold text-white/80">XOF</Text>
          </View>
        </View>

        {/* Footer */}
        <View className="flex-row items-center justify-between border-t border-white/10 pt-4 mt-2">
          <Text className="text-[10px] font-semibold text-white/70">Pre-funded account</Text>

          <Pressable
            onPress={onOpenTopup}
            className="flex-row items-center gap-1 bg-white px-4 py-2.5 rounded-2xl active:opacity-90"
          >
            <Plus size={16} color="#ee237c" />
            <Text className="text-xs font-bold text-pink-600">Top Up</Text>
          </Pressable>
        </View>
      </View>
    </View>
  );
}
