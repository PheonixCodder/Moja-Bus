import { useState } from "react";
import { View, Pressable, TextInput, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { Palette, Colors } from "@/constants/theme";
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
          <DialogTitle className="text-lg font-extrabold text-foreground">
            Top Up Wallet
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground leading-[18px]">
            Add funds to your wallet via Paystack. Minimum top-up is 100 XOF.
          </DialogDescription>
        </DialogHeader>

        <View className="gap-3 py-2">
          {/* Quick amounts */}
          <View className="gap-2">
            <Text className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Quick Amount</Text>
            <View className="flex-row gap-1">
              {PRESETS.map((amount) => {
                const isSelected = topupAmount === amount.toString();
                return (
                  <Pressable
                    key={amount}
                    onPress={() => setTopupAmount(amount.toString())}
                    accessibilityRole="button"
                    className={`flex-1 py-2 rounded-xl border items-center min-h-10 justify-center ${
                      isSelected ? "border-primary bg-primary/10" : "border-border bg-muted/40"
                    }`}
                  >
                    <Text className={`text-sm font-bold ${isSelected ? "text-primary" : "text-foreground"}`}>
                      +{amount.toLocaleString()}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </View>

          {/* Custom amount */}
          <View className="gap-2">
            <Text className="text-xs font-bold text-muted-foreground tracking-widest uppercase">Custom Amount</Text>
            <View className="relative">
              <TextInput
                value={topupAmount}
                onChangeText={setTopupAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor={Colors.light.textMuted}
                className="bg-background rounded-xl border border-border px-4 py-2.5 text-sm font-semibold text-foreground pr-12"
              />
              <Text className="absolute right-3 top-[10px] text-xs font-bold text-muted-foreground">XOF</Text>
            </View>
          </View>
        </View>

        <DialogFooter className="flex-row gap-2 pt-2">
          <Pressable
            onPress={onClose}
            accessibilityRole="button"
            className="flex-1 py-2 rounded-xl border border-border items-center min-h-10 justify-center"
          >
            <Text className="text-sm font-semibold text-muted-foreground">Cancel</Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            disabled={isPending}
            accessibilityRole="button"
            className={`flex-1 py-2 rounded-xl bg-primary items-center min-h-10 justify-center ${isPending ? "opacity-60" : ""}`}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={Palette.zinc[50]} />
            ) : (
              <Text className="text-sm font-bold text-primary-foreground">Proceed</Text>
            )}
          </Pressable>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
