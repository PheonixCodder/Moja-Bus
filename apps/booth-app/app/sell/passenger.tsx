import {
  ArrowLeft01Icon,
  Search01Icon,
  UserAdd01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { useMutation } from "@tanstack/react-query";
import { router, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { BoothFeedback } from "@/lib/haptics";
import { useTRPC } from "@/lib/trpc";
import { useSellSession } from "@/stores/sell-session";
import { IconColors } from "@/constants/ui-colors";

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
  const params = useLocalSearchParams<{
    tripId: string;
    seatId: string;
    tripSeatId: string;
    isIntercity: string;
  }>();
  const trpc = useTRPC();

  const setPassenger = useSellSession((s) => s.setPassenger);
  const sellSession = useSellSession();

  const [mode, setMode] = useState<"search" | "create" | "confirmed">(
    sellSession.passengerId ? "confirmed" : "search",
  );
  const [searchQuery, setSearchQuery] = useState("");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [selectedPassenger, setSelectedPassenger] = useState<Passenger | null>(
    null,
  );

  const lookupMutation = useMutation(
    trpc.booth.lookupOrCreatePassenger.mutationOptions(),
  );

  async function handleSearch() {
    if (!searchQuery.trim()) return;
    setLoading(true);
    try {
      const result = await lookupMutation.mutateAsync({
        email: searchQuery.trim(),
        fullName: "",
        phone: undefined,
      });
      setSelectedPassenger(result);
      setMode("confirmed");
      BoothFeedback.successScan();
    } catch {
      setMode("create");
      if (searchQuery.includes("@")) setEmail(searchQuery.trim());
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate() {
    if (!fullName.trim() || !email.trim()) return;
    setLoading(true);
    try {
      const result = await lookupMutation.mutateAsync({
        email: email.trim().toLowerCase(),
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
      });
      setSelectedPassenger(result);
      setMode("confirmed");
      BoothFeedback.successScan();
    } catch {
      // Error handled by Toast or inline
    } finally {
      setLoading(false);
    }
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

    router.push({
      pathname: "/sell/payment",
      params: {
        ...params,
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
      <View className="flex-row items-center px-6 pt-14 pb-4 gap-4">
        <TouchableOpacity
          onPress={() => {
            BoothFeedback.tap();
            router.back();
          }}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color={IconColors.default} />
        </TouchableOpacity>
        <Text className="font-heading text-xl font-bold text-foreground flex-1">
          {t("passenger.title")}
        </Text>
      </View>

      <ScrollView className="flex-1 px-6" keyboardShouldPersistTaps="handled">
        {(mode === "search" || mode === "create") && (
          <View className="gap-4 mt-2">
            <View className="gap-1.5">
              <Text className="text-sm font-medium text-foreground">
                {t("passenger.searchLabel")}
              </Text>
              <View className="flex-row gap-2">
                <TextInput
                  className="flex-1 border border-input rounded-lg px-4 py-3 bg-card text-foreground"
                  placeholder={t("passenger.searchPlaceholder")}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
                <TouchableOpacity
                  className="bg-primary rounded-lg px-4 items-center justify-center"
                  onPress={handleSearch}
                  disabled={loading}
                >
                  {loading ? (
                    <ActivityIndicator size="small" color="white" />
                  ) : (
                    <HugeiconsIcon
                      icon={Search01Icon}
                      size={20}
                      color="white"
                    />
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {mode === "create" && (
              <View className="gap-4 mt-4">
                <View className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3">
                  <Text className="text-amber-800 text-sm">
                    {t("passenger.newPassenger")}
                  </Text>
                </View>

                <View className="gap-1.5">
                  <Text className="text-sm font-medium text-foreground">
                    {t("passenger.fullNameLabel")} *
                  </Text>
                  <TextInput
                    className="border border-input rounded-lg px-4 py-3 bg-card text-foreground"
                    value={fullName}
                    onChangeText={setFullName}
                    autoCapitalize="words"
                  />
                </View>

                <View className="gap-1.5">
                  <Text className="text-sm font-medium text-foreground">
                    {t("passenger.emailLabel")} *
                  </Text>
                  <TextInput
                    className="border border-input rounded-lg px-4 py-3 bg-card text-foreground"
                    value={email}
                    onChangeText={setEmail}
                    keyboardType="email-address"
                    autoCapitalize="none"
                  />
                </View>

                <View className="gap-1.5">
                  <Text className="text-sm font-medium text-foreground">
                    {t("passenger.phoneLabel")}
                  </Text>
                  <TextInput
                    className="border border-input rounded-lg px-4 py-3 bg-card text-foreground"
                    value={phone}
                    onChangeText={setPhone}
                    keyboardType="phone-pad"
                    placeholder="+225..."
                  />
                </View>

                <TouchableOpacity
                  className="bg-primary rounded-xl py-4 items-center flex-row justify-center gap-2"
                  onPress={handleCreate}
                  disabled={loading || !fullName.trim() || !email.trim()}
                >
                  <HugeiconsIcon icon={UserAdd01Icon} size={18} color="white" />
                  <Text className="text-white font-semibold">
                    {loading ? "..." : t("passenger.createButton")}
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}

        {mode === "confirmed" && selectedPassenger && (
          <View className="gap-4 mt-2">
            <View className="bg-green-50 border border-green-200 rounded-xl px-5 py-4">
              <Text className="text-green-800 font-semibold text-base">
                {selectedPassenger.isNewAccount
                  ? t("passenger.newPassenger")
                  : t("passenger.existingFound")}
              </Text>
              <Text className="text-green-700 text-sm mt-1">
                {selectedPassenger.fullName}
              </Text>
              <Text className="text-green-600 text-sm">
                {selectedPassenger.email}
              </Text>
              {selectedPassenger.phone && (
                <Text className="text-green-600 text-sm">
                  {selectedPassenger.phone}
                </Text>
              )}
            </View>

            <TouchableOpacity
              className="border border-border rounded-lg py-3 items-center"
              onPress={() => {
                setMode("search");
                setSelectedPassenger(null);
                setSearchQuery("");
              }}
            >
              <Text className="text-foreground/70">
                {t("passenger.selectButton")}
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {mode === "confirmed" && selectedPassenger && (
        <View className="px-6 pb-8 pt-4 border-t border-border">
          <TouchableOpacity
            className="bg-primary rounded-xl py-4 items-center"
            onPress={handleContinue}
          >
            <Text className="text-white font-semibold text-base">
              {t("passenger.selectButton")} →
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}
