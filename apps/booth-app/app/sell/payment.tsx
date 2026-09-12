import {
  ArrowLeft01Icon,
  BanknoteIcon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useMutation } from "@tanstack/react-query";
import { router } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import { Alert, Text, TouchableOpacity, View } from "react-native";
import { PaystackQR } from "@/components/paystack-qr";
import { useNetworkStatus } from "@/hooks/use-network-status";
import { BoothFeedback } from "@/lib/haptics";
import { useTRPC } from "@/lib/trpc";
import { useOfflineQueue } from "@/stores/offline-queue";
import { useSellSession } from "@/stores/sell-session";
import { IconColors } from "@/constants/ui-colors";

export default function PaymentScreen() {
  const { t } = useTranslation();
  const trpc = useTRPC();
  const sellSession = useSellSession();

  const [mode, setMode] = useState<"select" | "cash" | "paystack">("select");
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

  const fareAmountXOF = sellSession.fareAmountXOF ?? 5000;

  const { isOnline } = useNetworkStatus();
  const { enqueue } = useOfflineQueue();

  async function handleCashConfirm() {
    const { tripId, passengerId, passengerName, passengerEmail } = sellSession;
    if (!tripId || !passengerId || !passengerName || !passengerEmail) {
      Alert.alert(
        "Données passager manquantes",
        "Veuillez vérifier les informations du passager avant d'encaisser.",
      );
      return;
    }

    if (!sellSession.terminalId || !sellSession.destinationTerminalId) {
      Alert.alert(
        "Terminaux non configurés",
        "Le terminal de départ ou de destination n'a pas été défini.",
      );
      return;
    }

    if (!isOnline) {
      const { useHoldPoolStore } = await import("@/stores/hold-pool");
      const poolHolds = sellSession.tripId
        ? useHoldPoolStore.getState().getAvailableForTrip(sellSession.tripId)
        : [];
      const poolHold = poolHolds[0];
      if (!poolHold) {
        Alert.alert(t("errors.network"), t("sell.offlineExpired"));
        return;
      }

      const currentTripId = sellSession.tripId;
      if (currentTripId) {
        useHoldPoolStore.getState().consumeHold(currentTripId, poolHold.holdId);
      }

      enqueue({
        tripId,
        holdId: poolHold.holdId,
        seatId: poolHold.seatId,
        seatLabel: poolHold.seatLabel,
        terminalId: sellSession.terminalId,
        destinationTerminalId: sellSession.destinationTerminalId,
        passengerId,
        passengerName,
        passengerEmail,
        passengerPhone: sellSession.passengerPhone,
        cashAmountXOF: fareAmountXOF,
        walkedUpPassenger: true,
        passengerAccountCreated: sellSession.isNewAccount,
        isIntercity: sellSession.isIntercity,
        passengerCount: sellSession.passengerCount,
      });

      BoothFeedback.paymentSuccess();
      router.replace({
        pathname: "/sell/confirmation",
        params: {
          bookingId: "OFFLINE_PENDING",
          passengerEmail: sellSession.passengerEmail,
          isOffline: "true",
        },
      });
      return;
    }

    setLoading(true);
    try {
      const result = await createCashSale.mutateAsync({
        tripId,
        terminalId: sellSession.terminalId,
        destinationTerminalId: sellSession.destinationTerminalId,
        seatIds: sellSession.seatId ? [sellSession.seatId] : undefined,
        passengerCount:
          sellSession.isIntercity === false
            ? sellSession.passengerCount
            : undefined,
        passengerId,
        passengerName,
        passengerEmail,
        passengerPhone: sellSession.passengerPhone ?? undefined,
        cashAmountXOF: fareAmountXOF,
        wasOffline: false,
        walkedUpPassenger: true,
        passengerAccountCreated: sellSession.isNewAccount,
      });

      BoothFeedback.paymentSuccess();
      router.replace({
        pathname: "/sell/confirmation",
        params: {
          bookingId: result.bookingId,
          passengerEmail: sellSession.passengerEmail,
        },
      });
    } catch (e: unknown) {
      BoothFeedback.invalidScan();
      const message = e instanceof Error ? e.message : t("errors.generic");
      Alert.alert("Erreur", message);
    } finally {
      setLoading(false);
    }
  }

  async function handlePaystackInitiate() {
    const { tripId, passengerId, passengerName, passengerEmail } = sellSession;
    if (!tripId || !passengerId || !passengerName || !passengerEmail) {
      Alert.alert(
        "Données passager manquantes",
        "Veuillez renseigner le nom et l'email du passager pour générer le lien de paiement.",
      );
      return;
    }

    if (!sellSession.terminalId || !sellSession.destinationTerminalId) {
      Alert.alert(
        "Terminaux non configurés",
        "Le terminal de départ ou de destination n'a pas été défini.",
      );
      return;
    }

    setLoading(true);
    try {
      const result = await initiatePaystack.mutateAsync({
        tripId,
        terminalId: sellSession.terminalId,
        destinationTerminalId: sellSession.destinationTerminalId,
        seatIds: sellSession.seatId ? [sellSession.seatId] : undefined,
        passengerCount:
          sellSession.isIntercity === false
            ? sellSession.passengerCount
            : undefined,
        passengerId,
        passengerEmail,
        passengerName,
        passengerPhone: sellSession.passengerPhone ?? undefined,
        walkedUpPassenger: true,
        passengerAccountCreated: sellSession.isNewAccount,
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
      BoothFeedback.invalidScan();
      const message = e instanceof Error ? e.message : t("errors.generic");
      Alert.alert("Erreur", message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <View className="flex-row items-center px-6 pt-14 pb-4 gap-4">
        <TouchableOpacity
          onPress={() => {
            BoothFeedback.tap();
            if (mode === "paystack") {
              setMode("select");
              setPaystackData(null);
            } else {
              router.back();
            }
          }}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color={IconColors.default} />
        </TouchableOpacity>
        <Text className="font-heading text-xl font-bold text-foreground flex-1">
          {t("payment.title")}
        </Text>
      </View>

      {mode === "select" && (
        <>
          <View className="mx-6 mb-6 bg-card border border-border rounded-xl px-5 py-4">
            <Text className="text-foreground/60 text-sm">
              {sellSession.passengerName}
            </Text>
            <Text className="text-2xl font-bold text-foreground mt-1">
              {fareAmountXOF.toLocaleString("fr-CI")} XOF
            </Text>
          </View>

          <View className="px-6 gap-4">
            <TouchableOpacity
              className="bg-green-50 border border-green-200 rounded-xl px-5 py-6 flex-row items-center gap-4"
              onPress={handleCashConfirm}
              disabled={loading}
            >
              <HugeiconsIcon icon={BanknoteIcon} size={32} color={IconColors.success} />
              <View>
                <Text className="font-semibold text-green-800 text-lg">
                  {t("payment.methodCash")}
                </Text>
                <Text className="text-green-700 text-sm mt-0.5">
                  {t("payment.cashConfirm")}
                </Text>
              </View>
            </TouchableOpacity>

            {isOnline && (
              <TouchableOpacity
                className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-6 flex-row items-center gap-4"
                onPress={handlePaystackInitiate}
                disabled={loading}
              >
                <HugeiconsIcon
                  icon={SmartPhone01Icon}
                  size={32}
                  color={IconColors.info}
                />
                <View>
                  <Text className="font-semibold text-blue-800 text-lg">
                    {t("payment.methodPaystack")}
                  </Text>
                  <Text className="text-blue-700 text-sm mt-0.5">
                    {t("payment.qrInstruction")}
                  </Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        </>
      )}

      {mode === "paystack" && paystackData && (
        <PaystackQR
          holdId={paystackData.holdId}
          paymentUrl={paystackData.paymentUrl}
          reference={paystackData.reference}
          amountXOF={paystackData.amountXOF}
          onPaid={async () => {
            setLoading(true);
            try {
              const confirmed = await confirmPaystack.mutateAsync({
                holdGroupId: paystackData.holdId,
                paystackReference: paystackData.reference,
                terminalId: sellSession.terminalId!,
                passengerId: sellSession.passengerId!,
                passengerEmail: sellSession.passengerEmail!,
                passengerName: sellSession.passengerName!,
                walkedUpPassenger: true,
                passengerAccountCreated: sellSession.isNewAccount,
              });

              BoothFeedback.paymentSuccess();
              router.replace({
                pathname: "/sell/confirmation",
                params: {
                  bookingId: confirmed.bookingId,
                  passengerEmail: sellSession.passengerEmail,
                },
              });
            } catch (err) {
              BoothFeedback.invalidScan();
              Alert.alert(
                "Erreur de confirmation",
                "Le paiement a été validé par Paystack mais la confirmation du billet a échoué. Veuillez réessayer.",
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
      )}
    </View>
  );
}
