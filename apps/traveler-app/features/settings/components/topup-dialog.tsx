import { useState } from "react";
import { View, Pressable, TextInput, ActivityIndicator } from "react-native";
import { Text } from "@/components/ui/text";
import { Colors, Spacing } from "@moja/theme/tokens";
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
          <DialogTitle style={{ fontSize: 18, fontWeight: "800", color: Colors.light.text }}>
            Top Up Wallet
          </DialogTitle>
          <DialogDescription style={{ fontSize: 13, color: Colors.light.textSecondary, lineHeight: 18 }}>
            Add funds to your wallet via Paystack. Minimum top-up is 100 XOF.
          </DialogDescription>
        </DialogHeader>

        <View style={{ gap: Spacing.three, paddingVertical: Spacing.two }}>
          <View style={{ gap: Spacing.two }}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: Colors.light.textSecondary, letterSpacing: 1, textTransform: "uppercase" }}>
              Quick Amount
            </Text>
            <View style={{ flexDirection: "row", gap: Spacing.one }}>
              {PRESETS.map((amount) => (
                <Pressable
                  key={amount}
                  onPress={() => setTopupAmount(amount.toString())}
                  style={{
                    flex: 1,
                    paddingVertical: Spacing.two,
                    borderRadius: 12,
                    borderWidth: 1,
                    borderColor: topupAmount === amount.toString() ? Colors.light.primary : Colors.light.backgroundSelected,
                    backgroundColor: topupAmount === amount.toString() ? "rgba(238, 35, 124, 0.05)" : "transparent",
                    alignItems: "center",
                  }}
                >
                  <Text style={{
                    fontSize: 11,
                    fontWeight: "700",
                    color: topupAmount === amount.toString() ? Colors.light.primary : Colors.light.text,
                  }}>
                    +{amount.toLocaleString()}
                  </Text>
                </Pressable>
              ))}
            </View>
          </View>

          <View style={{ gap: Spacing.two }}>
            <Text style={{ fontSize: 10, fontWeight: "700", color: Colors.light.textSecondary, letterSpacing: 1, textTransform: "uppercase" }}>
              Custom Amount
            </Text>
            <View style={{ position: "relative" }}>
              <TextInput
                value={topupAmount}
                onChangeText={setTopupAmount}
                keyboardType="numeric"
                placeholder="Enter amount"
                placeholderTextColor={Colors.light.textSecondary}
                style={{
                  backgroundColor: Colors.light.backgroundElement,
                  borderRadius: 12,
                  borderWidth: 1,
                  borderColor: Colors.light.backgroundSelected,
                  paddingHorizontal: Spacing.four,
                  paddingVertical: Spacing.two,
                  fontSize: 14,
                  fontWeight: "600",
                  color: Colors.light.text,
                  paddingRight: 50,
                }}
              />
              <Text style={{
                position: "absolute",
                right: 12,
                top: 10,
                fontSize: 12,
                fontWeight: "700",
                color: Colors.light.textSecondary,
              }}>
                XOF
              </Text>
            </View>
          </View>
        </View>

        <DialogFooter style={{ flexDirection: "row", gap: Spacing.two, paddingTop: Spacing.two }}>
          <Pressable
            onPress={onClose}
            style={{
              flex: 1,
              paddingVertical: Spacing.two,
              borderRadius: 12,
              borderWidth: 1,
              borderColor: Colors.light.backgroundSelected,
              alignItems: "center",
            }}
          >
            <Text style={{ fontSize: 13, fontWeight: "600", color: Colors.light.textSecondary }}>
              Cancel
            </Text>
          </Pressable>
          <Pressable
            onPress={handleSubmit}
            disabled={isPending}
            style={{
              flex: 1,
              paddingVertical: Spacing.two,
              borderRadius: 12,
              backgroundColor: Colors.light.primary,
              alignItems: "center",
              opacity: isPending ? 0.6 : 1,
            }}
          >
            {isPending ? (
              <ActivityIndicator size="small" color={Colors.light.primaryForeground} />
            ) : (
              <Text style={{ fontSize: 13, fontWeight: "700", color: Colors.light.primaryForeground }}>
                Proceed
              </Text>
            )}
          </Pressable>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
