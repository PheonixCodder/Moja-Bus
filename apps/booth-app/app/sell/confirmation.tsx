import {
  CheckCircle,
  PrinterIcon,
  Share01Icon,
  ShoppingCart01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { router, useLocalSearchParams } from "expo-router";
import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Share, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { IconColors } from "@/constants/ui-colors";
import { printTicket } from "@/lib/bluetooth-print";
import { BoothFeedback } from "@/lib/haptics";
import { useSellSession } from "@/stores/sell-session";
import { useSessionStore } from "@/stores/session";

export default function ConfirmationScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const { bookingId, passengerEmail, isOffline } = useLocalSearchParams<{
    bookingId: string;
    passengerEmail: string;
    isOffline?: string;
  }>();

  const passengerName = useSellSession((s) => s.passengerName);
  const seatId = useSellSession((s) => s.seatId);
  const fareAmountXOF = useSellSession((s) => s.fareAmountXOF ?? 0);
  const resetSellSession = useSellSession((s) => s.reset);
  const [printing, setPrinting] = useState(false);

  useEffect(() => {
    void BoothFeedback.paymentSuccess();
  }, []);

  function handleSellAnother() {
    void BoothFeedback.tap();
    resetSellSession();
    router.replace("/(tabs)");
  }

  async function handleShare() {
    void BoothFeedback.lightTap();
    const session = useSessionStore.getState();
    const sellSession = useSellSession.getState();
    const reference = bookingId?.slice(0, 8) ?? "MJ-TICKET";
    const message = [
      `🎟️ Billet Moja Ride — Réf: #${reference}`,
      `Passager : ${sellSession.passengerName ?? "Passager"}`,
      `Trajet : ${session.terminal?.name ?? "Départ"} → Arrivée`,
      `Siège : ${sellSession.seatId ?? "Non spécifié"}`,
      `Montant : ${(sellSession.fareAmountXOF ?? 0).toLocaleString("fr-CI")} XOF`,
      `Statut : ${isOffline === "true" ? "Payé en espèces (hors ligne)" : "Confirmé"}`,
    ].join("\n");

    try {
      await Share.share({
        message,
        title: `Billet Moja Ride #${reference}`,
      });
    } catch {}
  }

  async function handlePrint() {
    setPrinting(true);
    void BoothFeedback.tap();
    const session = useSessionStore.getState();
    const sellSession = useSellSession.getState();
    try {
      const res = await printTicket({
        passengerName: sellSession.passengerName ?? "Passager",
        bookingReference: bookingId?.slice(0, 8) ?? "MJ-TICKET",
        route: `${session.terminal?.name ?? "Départ"} → Arrivée`,
        departureDate: new Date().toLocaleDateString("fr-FR"),
        seatLabel: sellSession.seatId ?? null,
        amountXOF: sellSession.fareAmountXOF ?? 0,
        terminalName: session.terminal?.name ?? "Terminal",
        companyName: session.profile?.companyName ?? "Moja Ride",
      });

      if (res.success) {
        Toast.show({
          type: "success",
          text1: "Impression terminée",
          text2: "Le ticket thermique a été édité.",
        });
      } else {
        Toast.show({
          type: "info",
          text1: "Imprimante non connectée",
          text2: res.error ?? "Configurez l'imprimante dans l'onglet Profil.",
        });
      }
    } catch {
      Toast.show({
        type: "error",
        text1: "Erreur d'impression",
        text2: "Vérifiez la connexion Bluetooth de l'imprimante.",
      });
    } finally {
      setPrinting(false);
    }
  }

  const bookingRef = bookingId?.slice(0, 8) ?? "MJ-TICKET";

  return (
    <View
      style={{
        paddingTop: Math.max(insets.top, 24),
        paddingBottom: Math.max(insets.bottom, 24),
      }}
      className="flex-1 bg-background items-center justify-between px-6"
    >
      {/* Top Header & Success Icon */}
      <View className="items-center w-full pt-4">
        <View className="w-20 h-20 rounded-full bg-emerald-100 items-center justify-center border-4 border-emerald-50 mb-3 shadow-sm">
          <HugeiconsIcon
            icon={CheckCircle}
            size={48}
            color={IconColors.success}
          />
        </View>

        <Text className="font-heading text-2xl font-bold text-foreground text-center">
          {t("confirmation.title")}
        </Text>

        <Text className="text-muted-foreground text-sm text-center mt-1">
          {isOffline === "true"
            ? "Vente enregistrée hors ligne et ajoutée à la file de synchronisation."
            : t("confirmation.ticketSent", { email: passengerEmail })}
        </Text>
      </View>

      {/* Ticket Boarding Pass Card */}
      <Card className="w-full max-w-sm bg-card border-2 border-dashed border-border p-5 rounded-3xl gap-3 shadow-xs">
        <View className="flex-row items-center justify-between pb-3 border-b border-border/50">
          <View>
            <Text className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Référence Billet
            </Text>
            <Text className="font-mono font-bold text-base text-foreground mt-0.5">
              #{bookingRef}
            </Text>
          </View>
          <Badge
            variant={isOffline === "true" ? "offline" : "success"}
            label={isOffline === "true" ? "En attente sync" : "Confirmé"}
          />
        </View>

        <View className="flex-row items-center justify-between py-1">
          <View className="flex-1">
            <Text className="text-xs text-muted-foreground">Passager</Text>
            <Text className="font-bold text-foreground text-base mt-0.5">
              {passengerName ?? "Passager"}
            </Text>
            <Text className="text-xs text-muted-foreground">
              {passengerEmail}
            </Text>
          </View>

          {seatId ? (
            <View className="items-end">
              <Text className="text-xs text-muted-foreground">Siège</Text>
              <View className="px-3 py-1 rounded-xl bg-primary/10 border border-primary/20 mt-0.5">
                <Text className="font-bold text-primary text-base">
                  {seatId}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <View className="pt-3 border-t border-border/50 flex-row items-center justify-between">
          <Text className="text-xs text-muted-foreground uppercase font-semibold">
            Montant réglé
          </Text>
          <Text className="text-xl font-heading font-extrabold text-foreground">
            {fareAmountXOF.toLocaleString("fr-CI")} XOF
          </Text>
        </View>
      </Card>

      {/* Action Buttons */}
      <View className="w-full gap-3 max-w-sm">
        <Button
          variant="outline"
          size="default"
          loading={printing}
          onPress={handlePrint}
          icon={
            <HugeiconsIcon
              icon={PrinterIcon}
              size={20}
              color={IconColors.default}
            />
          }
          title={t("confirmation.printButton")}
        />

        <Button
          variant="outline"
          size="default"
          onPress={handleShare}
          icon={
            <HugeiconsIcon
              icon={Share01Icon}
              size={20}
              color={IconColors.default}
            />
          }
          title={t("confirmation.shareButton")}
        />

        <Button
          variant="primary"
          size="lg"
          onPress={handleSellAnother}
          trailingIslandIcon={
            <HugeiconsIcon icon={ShoppingCart01Icon} size={16} color="white" />
          }
          title={t("confirmation.sellAnother")}
        />
      </View>
    </View>
  );
}
