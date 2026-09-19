import {
  BanknoteIcon,
  CheckmarkCircle02Icon,
  SmartPhone01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { router } from "expo-router";
import React, { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PaystackQR } from "@/components/paystack-qr";
import { SubpageHeader } from "@/components/subpage-header";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
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
  const queryClient = useQueryClient();
  const fareAmountXOF = useSellSession((s) => s.fareAmountXOF ?? 0);
  const seatId = useSellSession((s) => s.seatId);
  const passengerName = useSellSession((s) => s.passengerName);
  const passengerEmail = useSellSession((s) => s.passengerEmail);
  const originLabel = useSellSession((s) => s.originLabel);
  const destinationLabel = useSellSession((s) => s.destinationLabel);

  const [mode, setMode] = useState<"select" | "paystack">("select");
  const [loadingMethod, setLoadingMethod] = useState<"cash" | "paystack" | null>(
    null,
  );

  // Mistouch confirmation & change calculator state
  const [showCashModal, setShowCashModal] = useState(false);
  const [showPaystackModal, setShowPaystackModal] = useState(false);
  const [tenderedInput, setTenderedInput] = useState<string>(
    fareAmountXOF > 0 ? String(fareAmountXOF) : "0",
  );

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

  // Change calculator numbers
  const tenderedAmount = useMemo(() => {
    const parsed = parseInt(tenderedInput.replace(/\D/g, ""), 10);
    return Number.isNaN(parsed) ? 0 : parsed;
  }, [tenderedInput]);

  const changeAmount = tenderedAmount - fareAmountXOF;

  // Quick cash pills for West African CFA banknotes
  const quickPills = useMemo(() => {
    const standardBills = [5000, 10000, 20000, 50000];
    const pills = new Set<number>();
    if (fareAmountXOF > 0) {
      pills.add(fareAmountXOF);
      const roundedTo5k = Math.ceil(fareAmountXOF / 5000) * 5000;
      if (roundedTo5k > fareAmountXOF) {
        pills.add(roundedTo5k);
      }
    }
    standardBills.forEach((b) => {
      if (b >= fareAmountXOF) {
        pills.add(b);
      }
    });
    return Array.from(pills).sort((a, b) => a - b);
  }, [fareAmountXOF]);

  function openCashConfirmation() {
    BoothFeedback.tap();
    setTenderedInput(String(fareAmountXOF));
    setShowCashModal(true);
  }

  function openPaystackConfirmation() {
    BoothFeedback.tap();
    setShowPaystackModal(true);
  }

  async function executeCashSale() {
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

      setShowCashModal(false);
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

    setLoadingMethod("cash");
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

      await queryClient.invalidateQueries(trpc.booth.pathFilter());
      setShowCashModal(false);
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
      setLoadingMethod(null);
    }
  }

  async function executePaystackInitiate() {
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

    setLoadingMethod("paystack");
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

      setShowPaystackModal(false);
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
      setLoadingMethod(null);
    }
  }

  return (
    <View className="flex-1 bg-background">
      <SubpageHeader
        title={t("payment.title")}
        subtitle="Étape 3 sur 3 · Encaissement"
        onBack={() => {
          void BoothFeedback.tap();
          if (mode === "paystack") {
            setMode("select");
            setPaystackData(null);
          } else {
            router.back();
          }
        }}
        rightAction={
          !isOnline ? (
            <Badge variant="offline" label="Mode Hors-Ligne" />
          ) : undefined
        }
      />

      {mode === "select" ? (
        <View className="flex-1 px-5 pt-5 gap-5">
          {/* Sale Summary Card with Double-Bezel */}
          <Card variant="double-bezel" className="gap-2.5">
            <View className="flex-row items-center justify-between">
              <Text className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                Montant total à encaisser
              </Text>
              {seatId ? (
                <Badge variant="default" label={`Place ${seatId}`} />
              ) : null}
            </View>

            <Text className="text-3xl font-heading font-black text-foreground tracking-tight">
              {fareAmountXOF.toLocaleString("fr-CI")} FCFA
            </Text>

            <View className="pt-3 mt-1 border-t border-border/40 gap-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-muted-foreground">
                  Passager
                </Text>
                <Text className="text-xs font-bold text-foreground">
                  {passengerName}
                </Text>
              </View>

              {originLabel && destinationLabel ? (
                <View className="flex-row items-center justify-between">
                  <Text className="text-xs font-semibold text-muted-foreground">
                    Itinéraire
                  </Text>
                  <Text className="text-xs font-bold text-foreground">
                    {originLabel} → {destinationLabel}
                  </Text>
                </View>
              ) : null}

              <View className="flex-row items-center justify-between">
                <Text className="text-xs font-semibold text-muted-foreground">
                  Contact
                </Text>
                <Text className="text-xs text-muted-foreground">
                  {passengerEmail}
                </Text>
              </View>
            </View>
          </Card>

          {/* Payment Method Cards */}
          <View className="gap-3.5">
            <Text className="text-xs uppercase tracking-wider font-bold text-muted-foreground px-1">
              Sélectionnez le mode de règlement
            </Text>

            {/* Cash Payment Option */}
            <Card
              onPress={openCashConfirmation}
              disabled={loadingMethod !== null}
              className="bg-emerald-500/10 border-emerald-500/30 p-5 flex-row items-center gap-4 active:bg-emerald-500/20 active:scale-[0.99] transition-transform"
            >
              <View className="w-14 h-14 rounded-2xl bg-emerald-600 items-center justify-center shadow-xs">
                {loadingMethod === "cash" ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <HugeiconsIcon icon={BanknoteIcon} size={28} color="white" />
                )}
              </View>

              <View className="flex-1">
                <View className="flex-row items-center justify-between">
                  <Text className="font-heading font-black text-foreground text-lg">
                    {t("payment.methodCash")}
                  </Text>
                  <Badge variant="cash" label="Guichet" />
                </View>
                <Text className="text-muted-foreground text-xs mt-0.5">
                  Encaissement direct en billets & calcul de monnaie
                </Text>
              </View>
            </Card>

            {/* Paystack QR Option (Only if online) */}
            {isOnline ? (
              <Card
                onPress={openPaystackConfirmation}
                disabled={loadingMethod !== null}
                className="bg-primary/10 border-primary/25 p-5 flex-row items-center gap-4 active:bg-primary/20 active:scale-[0.99] transition-transform"
              >
                <View className="w-14 h-14 rounded-2xl bg-primary items-center justify-center shadow-xs">
                  {loadingMethod === "paystack" ? (
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
                    <Text className="font-heading font-black text-foreground text-lg">
                      {t("payment.methodPaystack")}
                    </Text>
                    <Badge variant="intercity" label="Mobile Money" />
                  </View>
                  <Text className="text-muted-foreground text-xs mt-0.5">
                    Génère un QR code à scanner par le passager
                  </Text>
                </View>
              </Card>
            ) : null}
          </View>
        </View>
      ) : null}

      {/* Paystack QR Screen */}
      {mode === "paystack" && paystackData ? (
        <PaystackQR
          holdId={paystackData.holdId}
          paymentUrl={paystackData.paymentUrl}
          reference={paystackData.reference}
          amountXOF={paystackData.amountXOF}
          onPaid={async () => {
            setLoadingMethod("paystack");
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

              await queryClient.invalidateQueries(trpc.booth.pathFilter());
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
              setLoadingMethod(null);
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

      {/* Cash Payment Confirmation & Live Change Modal */}
      <Modal
        visible={showCashModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (loadingMethod === null) setShowCashModal(false);
        }}
      >
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : undefined}
          className="flex-1 justify-end bg-black/60"
        >
          <Pressable
            className="flex-1"
            onPress={() => {
              if (loadingMethod === null) setShowCashModal(false);
            }}
          />
          <View
            className="bg-card rounded-t-3xl border-t border-border/80 px-6 pt-5 pb-8 shadow-2xl gap-4"
            style={{ paddingBottom: Math.max(insets.bottom + 12, 28) }}
          >
            {/* Modal Drag Indicator */}
            <View className="w-12 h-1.5 rounded-full bg-muted-foreground/30 self-center mb-1" />

            {/* Header */}
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-heading font-black text-foreground">
                {t("payment.confirmCashTitle")}
              </Text>
              <Badge variant="cash" label="Espèces" />
            </View>

            {/* Due amount highlight */}
            <View className="p-3.5 bg-muted/30 rounded-2xl border border-border/60 flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-bold text-muted-foreground uppercase">
                  Net à payer
                </Text>
                <Text className="text-xl font-heading font-black text-foreground">
                  {fareAmountXOF.toLocaleString("fr-CI")} FCFA
                </Text>
              </View>
              {seatId ? (
                <Badge variant="outline" label={`Siège ${seatId}`} />
              ) : null}
            </View>

            {/* Cash Tendered Input */}
            <View className="gap-2">
              <Text className="text-xs font-bold text-muted-foreground">
                {t("payment.cashTendered")} (FCFA)
              </Text>
              <Input
                keyboardType="numeric"
                value={tenderedInput}
                onChangeText={(text) => {
                  setTenderedInput(text);
                }}
                className="h-14 bg-muted/20 border-border/80 rounded-2xl"
                placeholder="0"
                selectTextOnFocus
                rightIcon={
                  <Text className="text-xs font-bold text-muted-foreground mr-1">
                    FCFA
                  </Text>
                }
              />

              {/* Quick Bill Pills */}
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={{ gap: 8, paddingTop: 4 }}
              >
                {quickPills.map((pill) => {
                  const isSelected = tenderedAmount === pill;
                  return (
                    <TouchableOpacity
                      key={pill}
                      onPress={() => {
                        BoothFeedback.tap();
                        setTenderedInput(String(pill));
                      }}
                      className={`px-3.5 py-1.5 rounded-full border ${
                        isSelected
                          ? "bg-primary border-primary"
                          : "bg-muted/40 border-border/70"
                      }`}
                    >
                      <Text
                        className={`text-xs font-extrabold ${
                          isSelected ? "text-white" : "text-foreground"
                        }`}
                      >
                        {pill === fareAmountXOF
                          ? `Montant exact (${pill.toLocaleString("fr-CI")})`
                          : `${pill.toLocaleString("fr-CI")} FCFA`}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </ScrollView>
            </View>

            {/* Live Change Calculation Display */}
            {tenderedAmount > 0 ? (
              <View
                className={`p-3.5 rounded-2xl border flex-row items-center justify-between ${
                  changeAmount >= 0
                    ? "bg-emerald-500/10 border-emerald-500/30"
                    : "bg-amber-500/10 border-amber-500/30"
                }`}
              >
                <View className="flex-row items-center gap-2">
                  {changeAmount >= 0 ? (
                    <HugeiconsIcon
                      icon={CheckmarkCircle02Icon}
                      size={18}
                      color="#059669"
                    />
                  ) : null}
                  <Text
                    className={`text-xs font-bold ${
                      changeAmount >= 0 ? "text-emerald-800" : "text-amber-800"
                    }`}
                  >
                    {changeAmount >= 0
                      ? t("payment.changeToReturn")
                      : "Montant insuffisant"}
                  </Text>
                </View>
                <Text
                  className={`text-lg font-heading font-black ${
                    changeAmount >= 0 ? "text-emerald-900" : "text-amber-900"
                  }`}
                >
                  {changeAmount >= 0
                    ? `${changeAmount.toLocaleString("fr-CI")} FCFA`
                    : `-${Math.abs(changeAmount).toLocaleString("fr-CI")} FCFA`}
                </Text>
              </View>
            ) : null}

            {/* Modal Actions */}
            <View className="gap-2.5 pt-2">
              <TouchableOpacity
                onPress={() => {
                  BoothFeedback.tap();
                  executeCashSale();
                }}
                disabled={changeAmount < 0 || loadingMethod === "cash"}
                className={`h-13 rounded-2xl items-center justify-center ${
                  changeAmount < 0 || loadingMethod === "cash"
                    ? "bg-muted opacity-50"
                    : "bg-emerald-600 active:bg-emerald-700"
                }`}
              >
                {loadingMethod === "cash" ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-heading font-black text-base">
                    {t("payment.confirmPaymentBtn")}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  BoothFeedback.tap();
                  setShowCashModal(false);
                }}
                disabled={loadingMethod === "cash"}
                className="h-11 rounded-2xl items-center justify-center bg-muted/40 active:bg-muted/70"
              >
                <Text className="text-foreground font-bold text-sm">
                  {t("payment.cancel")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>

      {/* Paystack / Mobile Money Prompt Modal */}
      <Modal
        visible={showPaystackModal}
        transparent
        animationType="slide"
        onRequestClose={() => {
          if (loadingMethod === null) setShowPaystackModal(false);
        }}
      >
        <Pressable
          className="flex-1 justify-end bg-black/60"
          onPress={() => {
            if (loadingMethod === null) setShowPaystackModal(false);
          }}
        >
          <View
            className="bg-card rounded-t-3xl border-t border-border/80 px-6 pt-5 pb-8 shadow-2xl gap-4"
            style={{ paddingBottom: Math.max(insets.bottom + 12, 28) }}
          >
            {/* Modal Drag Indicator */}
            <View className="w-12 h-1.5 rounded-full bg-muted-foreground/30 self-center mb-1" />

            {/* Header */}
            <View className="flex-row items-center justify-between">
              <Text className="text-lg font-heading font-black text-foreground">
                {t("payment.confirmPaystackTitle")}
              </Text>
              <Badge variant="intercity" label="Paystack QR" />
            </View>

            <Text className="text-xs text-muted-foreground leading-relaxed">
              {t("payment.confirmPaystackDesc")}
            </Text>

            {/* Price recap */}
            <View className="p-4 bg-muted/30 rounded-2xl border border-border/60 flex-row items-center justify-between">
              <View>
                <Text className="text-[11px] font-bold text-muted-foreground uppercase">
                  Montant à régler
                </Text>
                <Text className="text-2xl font-heading font-black text-foreground">
                  {fareAmountXOF.toLocaleString("fr-CI")} FCFA
                </Text>
              </View>
              {seatId ? (
                <Badge variant="outline" label={`Siège ${seatId}`} />
              ) : null}
            </View>

            {/* Passenger details */}
            <View className="p-3 bg-muted/20 rounded-xl border border-border/40 gap-1">
              <Text className="text-xs font-bold text-foreground">
                {passengerName}
              </Text>
              <Text className="text-xs text-muted-foreground">
                {passengerEmail}
              </Text>
            </View>

            {/* Modal Actions */}
            <View className="gap-2.5 pt-2">
              <TouchableOpacity
                onPress={() => {
                  BoothFeedback.tap();
                  executePaystackInitiate();
                }}
                disabled={loadingMethod === "paystack"}
                className="h-13 rounded-2xl items-center justify-center bg-primary active:opacity-90"
              >
                {loadingMethod === "paystack" ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text className="text-white font-heading font-black text-base">
                    {t("payment.proceedToQR")}
                  </Text>
                )}
              </TouchableOpacity>

              <TouchableOpacity
                onPress={() => {
                  BoothFeedback.tap();
                  setShowPaystackModal(false);
                }}
                disabled={loadingMethod === "paystack"}
                className="h-11 rounded-2xl items-center justify-center bg-muted/40 active:bg-muted/70"
              >
                <Text className="text-foreground font-bold text-sm">
                  {t("payment.cancel")}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}
