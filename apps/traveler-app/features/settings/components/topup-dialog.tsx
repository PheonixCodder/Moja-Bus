import { useState } from "react";
import { View, Pressable, TextInput, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type TopupDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  onSubmitTopup: (amount: number) => void;
  isPending: boolean;
};

const PRESETS = [1000, 5000, 10000, 25000];

export function TopupDialog({ isOpen, onClose, onSubmitTopup, isPending }: TopupDialogProps) {
  const [topupAmount, setTopupAmount] = useState("");

  const handleSubmit = () => {
    const amount = parseInt(topupAmount, 10);
    if (!isNaN(amount) && amount >= 100) {
      onSubmitTopup(amount);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { if (!open) onClose(); }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-lg font-extrabold text-slate-900">
            Top Up Wallet
          </DialogTitle>
          <DialogDescription className="text-sm text-slate-500 leading-[18px]">
            Add funds to your wallet via Paystack. Minimum top-up is 100 XOF.
          </DialogDescription>
        </DialogHeader>

        <View className="gap-3 py-2">
          {/* Quick amounts */}
          <View className="gap-2">
            <Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">Quick Amount</Text>
            <View className="flex-row gap-1">
              {PRESETS.map((amount) => {
                const isSelected = topupAmount === amount.toString();
                return (
                  <Pressable
                    key={amount}
                    onPress={() => setTopupAmount(amount.toString())}
                    className={`flex-1 py-2 rounded-xl border items-center ${
                      isSelected ? "border-pink-500 bg-pink-50" : "border-slate-200"
                    }`}
                  >
                    <Text className={`text-sm font-bold ${isSelected ? "text-pink-600" : "text-slate-800"}`}>
                      +{amount.toLocaleString()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Custom amount */}
          <View className="gap-2">
            <Text className="text-xs font-bold text-slate-400 tracking-widest uppercase">Custom Amount</Text>
            <View className="relative">
              <TextInput
                value={topupAmount}
                onChangeText={setTopupAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor="#94a3b8"
                className="bg-slate-50 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-900 pr-12"
              />
              <Text className="absolute right-3 top-[10px] text-xs font-bold text-slate-400">XOF</Text>
            </View>
          </View>
        </View>

        <DialogFooter className="flex-row gap-2 pt-2">
          <Pressable
            onPress={onClose}
            className="flex-1 py-2 rounded-xl border border-slate-200 items-center"
          >
            <Text className="text-sm font-semibold text-slate-500">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            disabled={isPending}
            className={`flex-1 py-2 rounded-xl bg-pink-600 items-center ${isPending ? "opacity-60" : ""}`}
          >
            {isPending ? (
              <ActivityIndicator size="small" color="#ffffff" />
            ) : (
              <Text className="text-sm font-bold text-white">Proceed</Text>
            )}
          </Pressable>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
