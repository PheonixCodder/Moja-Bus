import {
  ArrowLeft01Icon,
  BanknoteIcon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaystackQR } from "@/components/paystack-qr";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { IconColors } from "@/constants/ui-colors";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { BoothFeedback } from "@/lib/haptics";
import { useTRPC } from "@/lib/trpc";
import { useHoldPoolStore } from "@/stores/hold-pool";
import { useOfflineQueue } from "@/stores/offline-queue";
import { useSellSession } from "@/stores/sell-session";

export default function PaymentScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const trpc = useTRPC();
  const fareAmountXOF = useSellSession((s) => s.fareAmountXOF ?? 0);
  const seatId = useSellSession((s) => s.seatId);
  const passengerName = useSellSession((s) => s.passengerName);
  const passengerEmail = useSellSession((s) => s.passengerEmail);

  const [mode, setMode] = useState<"select" | "paystack">("select");
  const [loading, setLoading] = useState(false);

  const [paystackData, setPaystackData] = useState<{
    holdId: string;
    reference: string;
    paymentUrl: string;
    amountXOF: number;
  } | null>(null);

  const createCashSale = useMutation(
    trpc.booth.createCashSale.mutationOptions(),
  );
  const initiatePaystack = useMutation(
    trpc.booth.initiatePaystackLink.mutationOptions(),
  );
  const confirmPaystack = useMutation(
    trpc.booth.confirmPaystackSale.mutationOptions(),
  );

  const { isOnline } = useNetworkStatus();
  const enqueue = useOfflineQueue((s) => s.enqueue);

  async function handleCashConfirm() {
    const session = useSellSession.getState();
    const validation = session.validateSession();
    if (!validation.valid) {
      Alert.alert(
        "Données de vente incomplètes",
        `Vérifiez les paramètres suivants : ${validation.errors.join(", ")}`,
      );
      return;
    }

    const {
      tripId,
      passengerId,
      passengerName: pName,
      passengerEmail: pEmail,
      passengerPhone,
      terminalId,
      destinationTerminalId,
      seatId: sId,
      isIntercity,
      passengerCount,
      isNewAccount,
    } = session;

    if (
      !tripId ||
      !passengerId ||
      !pName ||
      !pEmail ||
      !terminalId ||
      !destinationTerminalId
    ) {
      return;
    }

    if (!isOnline) {
      const poolHolds = useHoldPoolStore.getState().getAvailableForTrip(tripId);
      const poolHold = poolHolds[0];
      if (!poolHold) {
        Alert.alert(t("errors.network"), t("sell.offlineExpired"));
        return;
      }

      useHoldPoolStore.getState().consumeHold(tripId, poolHold.holdId);

      enqueue({
        tripId,
        holdId: poolHold.holdId,
        seatId: poolHold.seatId,
        seatLabel: poolHold.seatLabel,
        terminalId,
        destinationTerminalId,
        passengerId,
        passengerName: pName,
        passengerEmail: pEmail,
        passengerPhone,
        cashAmountXOF: fareAmountXOF,
        walkedUpPassenger: true,
        passengerAccountCreated: isNewAccount,
        isIntercity,
        passengerCount,
      });

      void BoothFeedback.paymentSuccess();
      router.replace({
        pathname: "/sell/confirmation",
        params: {
          bookingId: "OFFLINE_PENDING",
          passengerEmail: pEmail,
          isOffline: "true",
        },
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createCashSale.mutateAsync({
        tripId,
        terminalId,
        destinationTerminalId,
        seatIds: sId ? [sId] : undefined,
        passengerCount: !isIntercity ? passengerCount : undefined,
        passengerId,
        passengerName: pName,
        passengerEmail: pEmail,
        passengerPhone: passengerPhone ?? undefined,
        cashAmountXOF: fareAmountXOF,
        wasOffline: false,
        walkedUpPassenger: true,
        passengerAccountCreated: isNewAccount,
      });

      void BoothFeedback.paymentSuccess();
      router.replace({
        pathname: "/sell/confirmation",
        params: {
          bookingId: result.bookingId,
          passengerEmail: pEmail,
        },
      });
    } catch (e: unknown) {
      void BoothFeedback.invalidScan();
      const message = e instanceof Error ? e.message : t("errors.generic");
      Alert.alert("Erreur de paiement", message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePaystackInitiate() {
    const session = useSellSession.getState();
    const validation = session.validateSession();
    if (!validation.valid) {
      Alert.alert(
        "Données incomplètes",
        `Vérifiez les paramètres suivants : ${validation.errors.join(", ")}`,
      );
      return;
    }

    const {
      tripId,
      passengerId,
      passengerName: pName,
      passengerEmail: pEmail,
      passengerPhone,
      terminalId,
      destinationTerminalId,
      seatId: sId,
      isIntercity,
      passengerCount,
      isNewAccount,
    } = session;

    if (
      !tripId ||
      !passengerId ||
      !pName ||
      !pEmail ||
      !terminalId ||
      !destinationTerminalId
    ) {
      return;
    }

    setLoading(true);
    try {
      const result = await initiatePaystack.mutateAsync({
        tripId,
        terminalId,
        destinationTerminalId,
        seatIds: sId ? [sId] : undefined,
        passengerCount: !isIntercity ? passengerCount : undefined,
        passengerId,
        passengerEmail: pEmail,
        passengerName: pName,
        passengerPhone: passengerPhone ?? undefined,
        walkedUpPassenger: true,
        passengerAccountCreated: isNewAccount,
        quotedAmountXOF: fareAmountXOF,
      });

      setPaystackData({
        holdId: result.bookingId,
        reference: result.paystackReference,
        paymentUrl: result.authorizationUrl,
        amountXOF: result.amountXOF,
      });
      setMode("paystack");
    } catch (e: unknown) {
      void BoothFeedback.invalidScan();
      const message = e instanceof Error ? e.message : t("errors.generic");
      Alert.alert("Erreur Paystack", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View
      style={{ paddingTop: Math.max(insets.top, 16) }}
      className="flex-1 bg-background"
    >
      {/* Top Header Bar */}
      <View className="flex-row items-center px-5 pb-4 gap-3 border-b border-border/60">
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel="Retour"
          className="w-11 h-11 rounded-2xl bg-card border border-border items-center justify-center active:bg-muted"
          onPress={() => {
            void BoothFeedback.tap();
            if (mode === "paystack") {
              setMode("select");
              setPaystackData(null);
            } else {
              router.back();
            }
          }}
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            size={20}
            color={IconColors.default}
          />
        </TouchableOpacity>

        <View className="flex-1">
          <Text className="font-heading text-xl font-bold text-foreground">
            {t("payment.title")}
          </Text>
          <Text className="text-muted-foreground text-xs font-medium mt-0.5">
            Étape 3 sur 3 · Encaissement
          </Text>
        </View>

        {!isOnline ? <Badge variant="offline" label="Mode Hors-Ligne" /> : null}
      </View>

      {mode === "select" ? (
        <View className="flex-1 px-5 pt-5 gap-5">
          {/* Sale Summary Card with Double-Bezel */}
          <Card variant="double-bezel" className="gap-2">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs uppercase tracking-wider font-semibold text-muted-foreground">
                Montant à encaisser
              </Text>
              {seatId ? (
                <Badge variant="default" label={`Siège ${seatId}`} />
              ) : null}
            </View>

            <Text className="text-3xl font-heading font-extrabold text-foreground tracking-tight">
              {fareAmountXOF.toLocaleString("fr-CI")} XOF
            </Text>

            <View className="pt-2 mt-1 border-t border-border/40 flex-row items-center justify-between">
              <Text className="text-sm font-medium text-foreground">
                Passager : {passengerName}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {passengerEmail}
              </Text>
            </View>
          </Card>

          {/* Payment Method Cards */}
          <View className="gap-3.5">
            <Text className="text-xs uppercase tracking-wider font-bold text-muted-foreground px-1">
              Sélectionnez le mode de règlement
            </Text>

            {/* Cash Payment Option */}
            <Card
              onPress={handleCashConfirm}
              disabled={loading}
              className="bg-emerald-50/60 border-emerald-300/80 p-5 flex-row items-center gap-4 active:bg-emerald-100"
            >
              <View className="w-14 h-14 rounded-2xl bg-emerald-600 items-center justify-center shadow-xs">
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <HugeiconsIcon icon={BanknoteIcon} size={28} color="white" />
                )}
              </View>

              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="font-heading font-bold text-emerald-950 text-lg">
                    {t("payment.methodCash")}
                  </Text>
                  <Badge variant="cash" label="Direct" />
                </View>
                <Text className="text-emerald-800 text-xs mt-0.5">
                  {t("payment.cashConfirm")}
                </Text>
              </View>
            </Card>

            {/* Paystack QR Option (Only if online) */}
            {isOnline ? (
              <Card
                onPress={handlePaystackInitiate}
                disabled={loading}
                className="bg-blue-50/60 border-blue-300/80 p-5 flex-row items-center gap-4 active:bg-blue-100"
              >
                <View className="w-14 h-14 rounded-2xl bg-blue-600 items-center justify-center shadow-xs">
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <HugeiconsIcon
                      icon={SmartPhone01Icon}
                      size={28}
                      color="white"
                    />
                  )}
                </View>

                <View className="flex-1">
                  <View className="flex-row items-center justify-between">
                    <Text className="font-heading font-bold text-blue-950 text-lg">
                      {t("payment.methodPaystack")}
                    </Text>
                    <Badge variant="intercity" label="Mobile Money" />
                  </View>
                  <Text className="text-blue-800 text-xs mt-0.5">
                    {t("payment.qrInstruction")}
                  </Text>
                </View>
              </Card>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Paystack QR Modal View */}
      {mode === "paystack" && paystackData ? (
        <PaystackQR
          holdId={paystackData.holdId}
          paymentUrl={paystackData.paymentUrl}
          reference={paystackData.reference}
          amountXOF={paystackData.amountXOF}
          onPaid={async () => {
            setLoading(true);
            const currentSession = useSellSession.getState();
            try {
              const confirmed = await confirmPaystack.mutateAsync({
                holdGroupId: paystackData.holdId,
                paystackReference: paystackData.reference,
                terminalId: currentSession.terminalId!,
                passengerId: currentSession.passengerId!,
                passengerEmail: currentSession.passengerEmail!,
                passengerName: currentSession.passengerName!,
                walkedUpPassenger: true,
                passengerAccountCreated: currentSession.isNewAccount,
              });

              void BoothFeedback.paymentSuccess();
              router.replace({
                pathname: "/sell/confirmation",
                params: {
                  bookingId: confirmed.bookingId,
                  passengerEmail: currentSession.passengerEmail,
                },
              });
            } catch {
              void BoothFeedback.invalidScan();
              Alert.alert(
                "Erreur de confirmation",
                "Le paiement a été validé par Paystack mais la confirmation du billet a échoué. Veuillez vérifier dans les réservations du jour.",
              );
            } finally {
              setLoading(false);
            }
          }}
          onTimeout={() => {
            setMode("select");
            setPaystackData(null);
          }}
          onBack={() => {
            setMode("select");
            setPaystackData(null);
          }}
        />
      ) : null}
    </View>
  );
}
