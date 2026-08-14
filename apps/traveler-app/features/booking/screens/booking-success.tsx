import { useState, useEffect } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { useTranslation } from "react-i18next";
import * as Haptics from "expo-haptics";
import { HugeiconsIcon } from "@hugeicons/react-native";
import {
  CheckmarkCircle01Icon,
  Ticket01Icon,
  Calendar03Icon,
  Location01Icon,
  Wallet01Icon,
  CreditCardIcon,
  ArrowRight01Icon,
  CustomerSupportIcon,
  Copy01Icon,
} from "@hugeicons/core-free-icons";
import { Text } from "@/components/ui/text";
import { SubpageHeader } from "@/components/subpage-header";
import { BottomTabInset } from "@/constants/theme";
import { useGetBooking } from "../hooks/use-bookings";
import { formatPriceXOF, formatDateWithWeekday, formatTimeOnly } from "../lib/format-time";
import { formatLocationLabel } from "@/lib/format-location-label";

interface BookingSuccessViewProps {
  bookingReference: string;
  totalAmountXOF?: number;
  paymentMethod?: "WALLET" | "PAYSTACK";
}

export function BookingSuccessView({
  bookingReference,
  totalAmountXOF,
  paymentMethod = "PAYSTACK",
}: BookingSuccessViewProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { t } = useTranslation("booking");

  const { data: booking, isLoading } = useGetBooking(bookingReference, true);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  }, []);

  const handleCopyReference = () => {
    Haptics.selectionAsync();
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-50">
        <ActivityIndicator size="large" color="#ee237c" />
        <Text className="text-slate-500 mt-3 text-xs font-semibold">
          {t("confirmingBooking")}
        </Text>
      </View>
    );
  }

  const isUrban = booking?.serviceType === "URBAN";
  const originFormatted = booking
    ? formatLocationLabel({
        cityName: booking.originCityName,
        municipalityName: booking.originMunicipalityName,
        quarterName: booking.originQuarterName,
        isUrban,
      })
    : "";

  const destFormatted = booking
    ? formatLocationLabel({
        cityName: booking.destinationCityName,
        municipalityName: booking.destinationMunicipalityName,
        quarterName: booking.destinationQuarterName,
        isUrban,
      })
    : "";

  const displayTotal = totalAmountXOF || booking?.totalAmountXOF || 0;
  const seatLabels = booking?.seats?.map((s) => s.seatLabel).join(", ") || "";

  return (
    <View className="flex-1 bg-slate-50">
      <SubpageHeader title={t("bookingConfirmedTitle")} />

      <ScrollView
        style={{ flex: 1 }}
        contentContainerStyle={{
          paddingHorizontal: 16,
          paddingTop: 16,
          paddingBottom: BottomTabInset + insets.bottom + 32,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. SUCCESS HERO BANNER ── */}
        <View className="bg-white rounded-3xl p-6 border border-slate-100 shadow-sm items-center text-center">
          <View className="w-16 h-16 rounded-full bg-emerald-100 items-center justify-center mb-3">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={36} color="#10b981" />
          </View>

          <Text className="text-2xl font-black text-slate-900 text-center">
            {t("bookingConfirmed")}
          </Text>

          <Text className="text-xs text-slate-500 mt-1 text-center font-medium">
            {t("bookingConfirmedSubtitle")}
          </Text>

          {/* Reference Badge */}
          <Pressable
            onPress={handleCopyReference}
            className="mt-4 flex-row items-center gap-2 bg-slate-100 px-3.5 py-2 rounded-xl border border-slate-200"
          >
            <Text className="text-xs text-slate-500 font-bold uppercase tracking-wider">
              {t("refLabel")}
            </Text>
            <Text className="text-sm font-mono font-black text-slate-900">
              {bookingReference}
            </Text>
            <HugeiconsIcon icon={Copy01Icon} size={14} color="#64748b" />
            {copied && (
              <Text className="text-xs text-emerald-600 font-bold ml-1">{t("copiedLabel")}</Text>
            )}
          </Pressable>
        </View>

        {/* ── 2. TRIP DETAILS CARD ── */}
        {booking ? (
          <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm gap-4">
            {/* Operator Header */}
            <View className="flex-row items-center justify-between border-b border-slate-100 pb-3">
              <View>
                <Text className="text-sm font-extrabold text-slate-400 uppercase tracking-wider">
                  {booking.companyName}
                </Text>
                <Text className="text-base font-black text-slate-900 mt-0.5">
                  {t("confirmedTrip")}
                </Text>
              </View>
              <View className="bg-pink-50 border border-pink-200 px-3 py-1.5 rounded-full">
                <Text className="text-[#ee237c] font-black text-xs">
                  {seatLabels ? `${t("seatLabel")} ${seatLabels}` : t("seatReserved")}
                </Text>
              </View>
            </View>

            {/* Route Timeline */}
            <View className="gap-3">
              {/* Origin */}
              <View className="flex-row items-start gap-3">
                <View className="w-7 h-7 rounded-full bg-pink-100 items-center justify-center mt-0.5">
                  <HugeiconsIcon icon={Location01Icon} size={14} color="#ee237c" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t("departure", "Departure")}
                  </Text>
                  <Text className="text-sm font-black text-slate-900 mt-0.5">
                    {originFormatted}
                  </Text>
                  <Text className="text-xs text-slate-500 font-medium mt-0.5">
                    {booking.originTerminalName}
                  </Text>
                </View>
                <Text className="text-sm font-black text-slate-900">
                  {formatTimeOnly(booking.departureTime)}
                </Text>
              </View>

              {/* Destination */}
              <View className="flex-row items-start gap-3">
                <View className="w-7 h-7 rounded-full bg-emerald-100 items-center justify-center mt-0.5">
                  <HugeiconsIcon icon={Location01Icon} size={14} color="#10b981" />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    {t("destination")}
                  </Text>
                  <Text className="text-sm font-black text-slate-900 mt-0.5">
                    {destFormatted}
                  </Text>
                  <Text className="text-xs text-slate-500 font-medium mt-0.5">
                    {booking.destinationTerminalName}
                  </Text>
                </View>
              </View>
            </View>

            {/* Date Footer */}
            <View className="flex-row items-center justify-between pt-3 border-t border-slate-100">
              <View className="flex-row items-center gap-1.5">
                <HugeiconsIcon icon={Calendar03Icon} size={15} color="#64748b" />
                <Text className="text-xs font-bold text-slate-700">
                  {formatDateWithWeekday(booking.departureTime)}
                </Text>
              </View>

              <Text className="text-xs font-semibold text-slate-500">
                {t("passengerLabel")} <Text className="font-bold text-slate-900">{booking.passengerName}</Text>
              </Text>
            </View>
          </View>
        ) : null}

        {/* ── 3. PAYMENT SUMMARY CARD ── */}
        <View className="bg-white rounded-3xl p-5 border border-slate-100 shadow-sm flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-2xl bg-pink-50 items-center justify-center border border-pink-100">
              <HugeiconsIcon
                icon={paymentMethod === "WALLET" ? Wallet01Icon : CreditCardIcon}
                size={20}
                color="#ee237c"
              />
            </View>
            <View>
              <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                {paymentMethod === "WALLET" ? t("paidViaMojaWallet") : t("paidViaPaystack")}
              </Text>
              <Text className="text-sm font-black text-slate-900 mt-0.5">
                {t("totalPaid")}
              </Text>
            </View>
          </View>

          <View className="items-end">
            <Text className="text-base font-black text-[#ee237c]">
              {formatPriceXOF(displayTotal)}
            </Text>
            {paymentMethod === "WALLET" && (
              <Text className="text-xs text-emerald-600 font-bold mt-0.5">
                {t("zeroFee")}
              </Text>
            )}
          </View>
        </View>

        {/* ── 4. ACTION BUTTONS ── */}
        <View className="gap-3 pt-2">
          {/* Primary Action: View Digital Ticket (QR) */}
          <Pressable
            onPress={() => router.push("/(tabs)/tickets" as any)}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#d01867" : "#ee237c",
              paddingVertical: 16,
              paddingHorizontal: 20,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 10,
              shadowColor: "#ee237c",
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.25,
              shadowRadius: 10,
              elevation: 4,
            })}
          >
            <HugeiconsIcon icon={Ticket01Icon} size={20} color="#ffffff" />
            <Text className="text-white font-black text-base uppercase tracking-wider">
              {t("viewDigitalTicket")}
            </Text>
          </Pressable>

          {/* Secondary Action: Go to My Bookings */}
          <Pressable
            onPress={() => router.push("/(tabs)/bookings")}
            style={({ pressed }) => ({
              backgroundColor: pressed ? "#f1f5f9" : "#ffffff",
              borderWidth: 1,
              borderColor: "#e2e8f0",
              paddingVertical: 14,
              borderRadius: 20,
              flexDirection: "row",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
            })}
          >
            <Text className="text-slate-800 font-bold text-sm">
              {t("myBookings")}
            </Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="#475569" />
          </Pressable>

          {/* Tertiary Action: Search More Trips */}
          <Pressable
            onPress={() => router.push("/(tabs)/search")}
            className="py-2 items-center"
          >
            <Text className="text-xs font-bold text-slate-500">
              {t("bookAnotherTrip")}
            </Text>
          </Pressable>
        </View>

        {/* ── 5. HELP & SUPPORT CARD ── */}
        <View className="bg-white rounded-3xl p-4 border border-slate-100 flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-2xl bg-slate-100 items-center justify-center">
            <HugeiconsIcon icon={CustomerSupportIcon} size={20} color="#475569" />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-slate-900">
              {t("needHelpTitle")}
            </Text>
            <Text className="text-sm text-slate-500 font-medium">
              {t("needHelpDesc")}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/help-support")}
            className="px-3 py-1.5 rounded-full bg-slate-100"
          >
            <Text className="text-xs font-bold text-[#ee237c]">{t("helpButton")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
