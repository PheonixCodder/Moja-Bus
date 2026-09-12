import {
  CheckCircle,
  PrinterIcon,
  Share01Icon,
  ShoppingCart01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { router, useLocalSearchParams } from "expo-router";
import { useTranslation } from "react-i18next";
import { Text, View } from "react-native";
import { Button } from "@/components/ui/button";
import { BoothFeedback } from "@/lib/haptics";
import { printTicket } from "@/lib/bluetooth-print";
import { useSellSession } from "@/stores/sell-session";
import { useSessionStore } from "@/stores/session";
import { IconColors } from "@/constants/ui-colors";

export default function ConfirmationScreen() {
  const { t } = useTranslation();
  const { bookingId, passengerEmail } = useLocalSearchParams<{
    bookingId: string;
    passengerEmail: string;
  }>();

  const sellSession = useSellSession();
  const resetSellSession = useSellSession((s) => s.reset);
  const session = useSessionStore();

  function handleSellAnother() {
    BoothFeedback.tap();
    resetSellSession();
    router.replace("/(tabs)");
  }

  function handleShare() {
    BoothFeedback.tap();
  }

  async function handlePrint() {
    BoothFeedback.tap();
    await printTicket({
      passengerName: sellSession.passengerName ?? "Passager",
      bookingReference: bookingId?.slice(0, 8) ?? "MJ-TICKET",
      route: `${session.terminal?.name ?? "Départ"} → Arrivée`,
      departureDate: new Date().toLocaleDateString("fr-FR"),
      seatLabel: sellSession.seatId ?? null,
      amountXOF: sellSession.fareAmountXOF ?? 0,
      terminalName: session.terminal?.name ?? "Terminal",
      companyName: session.profile?.companyName ?? "Moja Ride",
    });
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
        <Button
          variant="outline"
          className="min-h-[48px] h-12 flex-row items-center justify-center gap-2"
          onPress={handlePrint}
        >
          <HugeiconsIcon icon={PrinterIcon} size={18} color={IconColors.muted} />
          <Text className="text-foreground font-medium">
            {t("confirmation.printButton")}
          </Text>
        </Button>

        <Button
          variant="outline"
          className="min-h-[48px] h-12 flex-row items-center justify-center gap-2"
          onPress={handleShare}
        >
          <HugeiconsIcon icon={Share01Icon} size={18} color={IconColors.muted} />
          <Text className="text-foreground/70 font-medium">
            {t("confirmation.shareButton")}
          </Text>
        </Button>

        <Button
          variant="default"
          className="min-h-[48px] h-12 flex-row items-center justify-center gap-2"
          onPress={handleSellAnother}
        >
          <HugeiconsIcon icon={ShoppingCart01Icon} size={18} color="white" />
          <Text className="text-white font-semibold">
            {t("confirmation.sellAnother")}
          </Text>
        </Button>
      </View>
    </View>
  );
}
