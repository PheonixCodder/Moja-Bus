import {
  CheckCircle,
  Share01Icon,
  ShoppingCart01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text, TouchableOpacity, View } from "react-native";
import { BoothFeedback } from "@/lib/haptics";
import { useSellSession } from "@/stores/sell-session";
import { IconColors } from "@/constants/ui-colors";

export default function ConfirmationScreen() {
  const { t } = useTranslation();
  const { bookingId, passengerEmail } = useLocalSearchParams<{
    bookingId: string;
    passengerEmail: string;
  }>();

  const sellSession = useSellSession();
  const resetSellSession = useSellSession((s) => s.reset);

  function handleSellAnother() {
    BoothFeedback.tap();
    resetSellSession();
    router.replace("/(tabs)");
  }

  function handleShare() {
    BoothFeedback.tap();
    // Phase 7: native share sheet
  }

  return (
    <View className="flex-1 bg-background items-center justify-center px-6">
      <HugeiconsIcon icon={CheckCircle} size={60} color={IconColors.success} />

      <Text className="font-heading text-2xl font-bold text-foreground mt-4 text-center">
        {t("confirmation.title")}
      </Text>

      <View className="mt-8 bg-card border border-border rounded-xl px-5 py-4 w-full max-w-sm">
        <Text className="text-foreground/60 text-sm">
          {t("confirmation.ticketSent", { email: passengerEmail })}
        </Text>
        <Text className="text-foreground/60 text-sm mt-1">
          Booking #{bookingId?.slice(0, 8)}
        </Text>
        {sellSession.passengerName && (
          <Text className="text-foreground font-medium mt-1">
            {sellSession.passengerName}
          </Text>
        )}
      </View>

      <View className="w-full gap-3 mt-8 max-w-sm">
        <TouchableOpacity
          className="border border-border rounded-xl py-3.5 flex-row items-center justify-center gap-2"
          onPress={handleShare}
        >
          <HugeiconsIcon icon={Share01Icon} size={18} color={IconColors.muted} />
          <Text className="text-foreground/70 font-medium">
            {t("confirmation.shareButton")}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          className="bg-primary rounded-xl py-4 flex-row items-center justify-center gap-2"
          onPress={handleSellAnother}
        >
          <HugeiconsIcon icon={ShoppingCart01Icon} size={18} color="white" />
          <Text className="text-white font-semibold">
            {t("confirmation.sellAnother")}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
