import {
  ArrowLeft01Icon,
  ArrowRight01Icon,
  Call02Icon,
  Mail01Icon,
  Search01Icon,
  UserAdd01Icon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import Toast from "react-native-toast-message";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { IconColors } from "@/constants/ui-colors";
import { BoothFeedback } from "@/lib/haptics";
import { useTRPC } from "@/lib/trpc";
import { useSellSession } from "@/stores/sell-session";

interface Passenger {
  userId: string;
  fullName: string;
  email: string;
  phone: string | null;
  emailVerified: boolean;
  isNewAccount: boolean;
}

export default function PassengerScreen() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{
    tripId: string;
    seatId: string;
    tripSeatId: string;
    destinationTerminalId: string;
    isIntercity: string;
  }>();
  const trpc = useTRPC();

  const setPassenger = useSellSession((s) => s.setPassenger);
  const initialSession = useSellSession.getState();

  const [mode, setMode] = useState<"search" | "create" | "confirmed">(
    initialSession.passengerId ? "confirmed" : "search",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(
    initialSession.passengerId
      ? {
          userId: initialSession.passengerId,
          fullName: initialSession.passengerName ?? "",
          email: initialSession.passengerEmail ?? "",
          phone: initialSession.passengerPhone ?? null,
          emailVerified: false,
          isNewAccount: initialSession.isNewAccount,
        }
      : null,
  );

  const lookupMutation = useMutation(
    trpc.booth.lookupOrCreatePassenger.mutationOptions(),
  );

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const queryVal = searchQuery.trim();
      const result = await lookupMutation.mutateAsync({
        query: queryVal,
      });
      setSelectedPassenger(result);
      setMode("confirmed");
      void BoothFeedback.successScan();
    } catch {
      setMode("create");
      const clean = searchQuery.trim();
      if (clean.includes("@")) {
        setEmail(clean);
      } else {
        setPhone(clean);
      }
      Toast.show({
        type: "info",
        text1: "Passager non trouvé",
        text2: "Créez une fiche passager rapide pour ce billet.",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!fullName.trim()) return;
    setLoading(true);
    try {
      const result = await lookupMutation.mutateAsync({
        fullName: fullName.trim(),
        email: email.trim().toLowerCase() || undefined,
        phone: phone.trim() || undefined,
        query: email.trim().toLowerCase() || phone.trim() || undefined,
      });
      setSelectedPassenger(result);
      setMode("confirmed");
      void BoothFeedback.successScan();
    } catch (err: unknown) {
      Toast.show({
        type: "error",
        text1: "Erreur création passager",
        text2: (err as Error)?.message ?? "Veuillez vérifier les informations.",
      });
    } finally {
      setLoading(false);
    }
  }

  function handleQuickWalkup() {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    setFullName(`Passager Guichet ${randomSuffix}`);
    setEmail(`guichet-${randomSuffix}@mojaride.local`);
    setPhone("+22500000000");
    setMode("create");
  }

  function handleContinue() {
    if (!selectedPassenger) return;

    setPassenger({
      passengerId: selectedPassenger.userId,
      passengerName: selectedPassenger.fullName,
      passengerEmail: selectedPassenger.email,
      passengerPhone: selectedPassenger.phone,
      isNewAccount: selectedPassenger.isNewAccount,
    });

    const destTerminalId =
      params.destinationTerminalId ||
      useSellSession.getState().destinationTerminalId ||
      "";

    router.push({
      pathname: "/sell/payment",
      params: {
        ...params,
        destinationTerminalId: destTerminalId,
        passengerId: selectedPassenger.userId,
        passengerName: selectedPassenger.fullName,
        passengerEmail: selectedPassenger.email,
        passengerPhone: selectedPassenger.phone ?? "",
        isNewAccount: String(selectedPassenger.isNewAccount),
      },
    });
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1 bg-background"
    >
      <View style={{ paddingTop: Math.max(insets.top, 16) }} className="flex-1">
        {/* Header Bar */}
        <View className="flex-row items-center px-5 pb-4 gap-3 border-b border-border/60">
          <TouchableOpacity
            accessibilityRole="button"
            accessibilityLabel="Retour"
            className="w-11 h-11 rounded-2xl bg-card border border-border items-center justify-center active:bg-muted"
            onPress={() => {
              void BoothFeedback.tap();
              router.back();
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
              {t("passenger.title")}
            </Text>
            <Text className="text-muted-foreground text-xs font-medium mt-0.5">
              Étape 2 sur 3 · Identification client
            </Text>
          </View>
        </View>

        <ScrollView
          className="flex-1 px-5 pt-4"
          keyboardShouldPersistTaps="handled"
          contentContainerClassName="pb-10"
        >
          {(mode === "search" || mode === "create") && (
            <View className="gap-5">
              {/* Lookup Card */}
              <Card className="gap-3">
                <Text className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
                  Recherche client existant
                </Text>
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Input
                      placeholder={t("passenger.searchPlaceholder")}
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      leftIcon={
                        <HugeiconsIcon
                          icon={Search01Icon}
                          size={18}
                          color={IconColors.muted}
                        />
                      }
                      onSubmitEditing={handleSearch}
                    />
                  </View>
                  <Button
                    variant="primary"
                    size="md"
                    loading={loading}
                    onPress={handleSearch}
                    icon={
                      <HugeiconsIcon
                        icon={Search01Icon}
                        size={18}
                        color="white"
                      />
                    }
                  />
                </View>

                {mode === "search" ? (
                  <View className="flex-row items-center justify-between pt-2 border-t border-border/50">
                    <Text className="text-xs text-muted-foreground">
                      Client sans compte ?
                    </Text>
                    <TouchableOpacity
                      onPress={handleQuickWalkup}
                      className="py-1 px-2 rounded-lg active:bg-muted"
                    >
                      <Text className="text-xs font-bold text-primary">
                        + Remplissage rapide guichet
                      </Text>
                    </TouchableOpacity>
                  </View>
                ) : null}
              </Card>

              {/* Create New Passenger Form */}
              {mode === "create" && (
                <Card className="gap-4">
                  <View className="flex-row items-center justify-between pb-2 border-b border-border/50">
                    <View className="flex-row items-center gap-2">
                      <HugeiconsIcon
                        icon={UserAdd01Icon}
                        size={18}
                        color={IconColors.brand}
                      />
                      <Text className="font-heading font-bold text-base text-foreground">
                        {t("passenger.newPassenger")}
                      </Text>
                    </View>
                    <Badge variant="warning" label="Nouveau" />
                  </View>

                  <View className="gap-1.5">
                    <Text className="text-xs font-semibold text-foreground">
                      {t("passenger.fullNameLabel")} *
                    </Text>
                    <Input
                      placeholder="ex. Konan Yao"
                      value={fullName}
                      onChangeText={setFullName}
                      autoCapitalize="words"
                      leftIcon={
                        <HugeiconsIcon
                          icon={UserIcon}
                          size={18}
                          color={IconColors.muted}
                        />
                      }
                    />
                  </View>

                  <View className="gap-1.5">
                    <Text className="text-xs font-semibold text-foreground">
                      {t("passenger.emailLabel")} *
                    </Text>
                    <Input
                      placeholder="client@email.com"
                      value={email}
                      onChangeText={setEmail}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      leftIcon={
                        <HugeiconsIcon
                          icon={Mail01Icon}
                          size={18}
                          color={IconColors.muted}
                        />
                      }
                    />
                  </View>

                  <View className="gap-1.5">
                    <Text className="text-xs font-semibold text-foreground">
                      {t("passenger.phoneLabel")} (Optionnel)
                    </Text>
                    <Input
                      placeholder="+225 07..."
                      value={phone}
                      onChangeText={setPhone}
                      keyboardType="phone-pad"
                      leftIcon={
                        <HugeiconsIcon
                          icon={Call02Icon}
                          size={18}
                          color={IconColors.muted}
                        />
                      }
                    />
                  </View>

                  <Button
                    variant="primary"
                    size="lg"
                    loading={loading}
                    disabled={!fullName.trim() || !email.trim()}
                    onPress={handleCreate}
                    title={t("passenger.createButton")}
                  />
                </Card>
              )}
            </View>
          )}

          {/* Confirmed Passenger Card */}
          {mode === "confirmed" && selectedPassenger && (
            <View className="gap-4">
              <Card
                variant="double-bezel"
                className="gap-3 border-emerald-500/30 bg-emerald-50/40"
              >
                <View className="flex-row items-center justify-between">
                  <Badge
                    variant="success"
                    label={
                      selectedPassenger.isNewAccount
                        ? "Nouveau compte"
                        : "Passager vérifié"
                    }
                  />
                  <TouchableOpacity
                    onPress={() => {
                      setMode("search");
                      setSelectedPassenger(null);
                      setSearchQuery("");
                    }}
                    className="py-1 px-2.5 rounded-lg active:bg-emerald-100"
                  >
                    <Text className="text-xs font-bold text-emerald-800">
                      Changer de passager
                    </Text>
                  </TouchableOpacity>
                </View>

                <View className="flex-row items-center gap-3 pt-1">
                  <View className="w-12 h-12 rounded-2xl bg-emerald-600 items-center justify-center shadow-xs">
                    <Text className="text-white font-heading font-extrabold text-lg">
                      {selectedPassenger.fullName.slice(0, 2).toUpperCase()}
                    </Text>
                  </View>

                  <View className="flex-1">
                    <Text className="text-lg font-heading font-bold text-foreground">
                      {selectedPassenger.fullName}
                    </Text>
                    <Text className="text-sm text-muted-foreground font-medium">
                      {selectedPassenger.email}
                    </Text>
                    {selectedPassenger.phone ? (
                      <Text className="text-xs text-muted-foreground">
                        {selectedPassenger.phone}
                      </Text>
                    ) : null}
                  </View>
                </View>
              </Card>
            </View>
          )}
        </ScrollView>

        {/* Sticky Continue Footer */}
        {mode === "confirmed" && selectedPassenger ? (
          <View
            style={{ paddingBottom: Math.max(insets.bottom, 20) }}
            className="px-6 pt-4 border-t border-border bg-card/80 backdrop-blur-md"
          >
            <Button
              variant="primary"
              size="lg"
              onPress={handleContinue}
              title="Passer au paiement"
              trailingIslandIcon={
                <HugeiconsIcon
                  icon={ArrowRight01Icon}
                  size={16}
                  color="#ffffff"
                />
              }
            />
          </View>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
