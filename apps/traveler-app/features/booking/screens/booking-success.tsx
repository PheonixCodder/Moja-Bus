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
import { BottomTabInset, Colors, Palette } from "@/constants/theme";
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
      <View className="flex-1 items-center justify-center bg-background">
        <ActivityIndicator size="large" color={Palette.rose[500]} />
        <Text className="text-muted-foreground mt-3 text-xs font-semibold">
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
        isUrban: booking.serviceType === 'URBAN',
      })
    : "";

  const seatLabels = (booking?.seats ?? [])
    .map((s) => s.seatLabel)
    .filter(Boolean)
    .join(", ");

  const displayTotal = booking?.totalAmountXOF ?? totalAmountXOF ?? 0;

  return (
    <View className="flex-1 bg-background">
      <SubpageHeader title={t("bookingConfirmed")} />

      <ScrollView
        contentContainerStyle={{
          paddingHorizontal: 20,
          paddingTop: 16,
          paddingBottom: BottomTabInset + insets.bottom + 32,
          gap: 16,
        }}
        showsVerticalScrollIndicator={false}
      >
        {/* ── 1. SUCCESS HERO BANNER ── */}
        <View className="bg-card rounded-3xl p-6 border border-border shadow-sm items-center text-center">
          <View className="w-16 h-16 rounded-full bg-emerald-500/10 items-center justify-center mb-3">
            <HugeiconsIcon icon={CheckmarkCircle01Icon} size={36} color={Palette.emerald[500]} />
          </View>

          <Text className="text-2xl font-black text-foreground text-center">
            {t("bookingConfirmed")}
          </Text>

          <Text className="text-xs text-muted-foreground mt-1 text-center font-medium">
            {t("bookingConfirmedSubtitle")}
          </Text>

          {/* Reference Badge */}
          <Pressable
            onPress={handleCopyReference}
            accessibilityRole="button"
            className="mt-4 flex-row items-center gap-2 bg-muted px-3.5 py-2 rounded-xl border border-border"
          >
            <Text className="text-xs text-muted-foreground font-bold uppercase tracking-wider">
              {t("refLabel")}
            </Text>
            <Text className="text-sm font-mono font-black text-foreground">
              {bookingReference}
            </Text>
            <HugeiconsIcon icon={Copy01Icon} size={14} color={Palette.zinc[400]} />
            {copied && (
              <Text className="text-xs text-emerald-600 font-bold ml-1">{t("copiedLabel")}</Text>
            )}
          </Pressable>
        </View>

        {/* ── 2. TRIP DETAILS CARD ── */}
        {booking ? (
          <View className="bg-card rounded-3xl p-5 border border-border shadow-sm gap-4">
            {/* Operator Header */}
            <View className="flex-row items-center justify-between border-b border-border/40 pb-3">
              <View>
                <Text className="text-sm font-extrabold text-muted-foreground uppercase tracking-wider">
                  {booking.companyName}
                </Text>
                <Text className="text-base font-black text-foreground mt-0.5">
                  {t("confirmedTrip")}
                </Text>
              </View>
              <View className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
                <Text className="text-primary font-black text-xs">
                  {seatLabels ? `${t("seatLabel")} ${seatLabels}` : t("seatReserved")}
                </Text>
              </View>
            </View>

            {/* Route Timeline */}
            <View className="gap-3">
              {/* Origin */}
              <View className="flex-row items-start gap-3">
                <View className="w-7 h-7 rounded-full bg-primary/10 items-center justify-center mt-0.5">
                  <HugeiconsIcon icon={Location01Icon} size={14} color={Palette.rose[500]} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t("departure", "Departure")}
                  </Text>
                  <Text className="text-sm font-black text-foreground mt-0.5">
                    {originFormatted}
                  </Text>
                  <Text className="text-xs text-muted-foreground font-medium mt-0.5">
                    {booking.originTerminalName}
                  </Text>
                </View>
                <Text className="text-sm font-black text-foreground">
                  {formatTimeOnly(booking.departureTime)}
                </Text>
              </View>

              {/* Destination */}
              <View className="flex-row items-start gap-3">
                <View className="w-7 h-7 rounded-full bg-success/10 items-center justify-center mt-0.5">
                  <HugeiconsIcon icon={Location01Icon} size={14} color={Palette.emerald[500]} />
                </View>
                <View className="flex-1">
                  <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                    {t("destination")}
                  </Text>
                  <Text className="text-sm font-black text-foreground mt-0.5">
                    {destFormatted}
                  </Text>
                  <Text className="text-xs text-muted-foreground font-medium mt-0.5">
                    {booking.destinationTerminalName}
                  </Text>
                </View>
              </View>
            </View>

            {/* Date Footer */}
            <View className="flex-row items-center justify-between pt-3 border-t border-border/40">
              <View className="flex-row items-center gap-1.5">
                <HugeiconsIcon icon={Calendar03Icon} size={15} color={Palette.zinc[400]} />
                <Text className="text-xs font-bold text-foreground">
                  {formatDateWithWeekday(booking.departureTime)}
                </Text>
              </View>

              <Text className="text-xs font-semibold text-muted-foreground">
                {t("passengerLabel")} <Text className="font-bold text-foreground">{booking.passengerName}</Text>
              </Text>
            </View>
          </View>
        ) : null}

        {/* ── 3. PAYMENT SUMMARY CARD ── */}
        <View className="bg-card rounded-3xl p-5 border border-border shadow-sm flex-row items-center justify-between">
          <View className="flex-row items-center gap-3">
            <View className="w-10 h-10 rounded-2xl bg-primary/10 items-center justify-center border border-primary/20">
              <HugeiconsIcon
                icon={paymentMethod === "WALLET" ? Wallet01Icon : CreditCardIcon}
                size={20}
                color={Palette.rose[500]}
              />
            </View>
            <View>
              <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                {paymentMethod === "WALLET" ? t("paidViaMojaWallet") : t("paidViaPaystack")}
              </Text>
              <Text className="text-sm font-black text-foreground mt-0.5">
                {t("totalPaid")}
              </Text>
            </View>
          </View>

          <View className="items-end">
            <Text className="text-base font-black text-primary">
              {formatPriceXOF(displayTotal)}
            </Text>
            {paymentMethod === "WALLET" && (
              <Text className="text-xs text-success font-bold mt-0.5">
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
            accessibilityRole="button"
            className="bg-primary py-4 px-5 rounded-2xl flex-row items-center justify-center gap-2.5 shadow-sm min-h-12 active:opacity-90"
          >
            <HugeiconsIcon icon={Ticket01Icon} size={20} color={Palette.zinc[50]} />
            <Text className="text-primary-foreground font-black text-base uppercase tracking-wider">
              {t("viewDigitalTicket")}
            </Text>
          </Pressable>

          {/* Secondary Action: Go to My Bookings */}
          <Pressable
            onPress={() => router.push("/(tabs)/bookings")}
            accessibilityRole="button"
            className="bg-card border border-border py-3.5 px-5 rounded-2xl flex-row items-center justify-center gap-2 min-h-11"
          >
            <Text className="text-foreground font-bold text-sm">
              {t("myBookings")}
            </Text>
            <HugeiconsIcon icon={ArrowRight01Icon} size={16} color={Palette.zinc[400]} />
          </Pressable>

          {/* Tertiary Action: Search More Trips */}
          <Pressable
            onPress={() => router.push("/(tabs)/search")}
            accessibilityRole="button"
            className="py-2 items-center min-h-11 justify-center"
          >
            <Text className="text-xs font-bold text-muted-foreground">
              {t("bookAnotherTrip")}
            </Text>
          </Pressable>
        </View>

        {/* ── 5. HELP & SUPPORT CARD ── */}
        <View className="bg-card rounded-3xl p-4 border border-border flex-row items-center gap-3">
          <View className="w-10 h-10 rounded-2xl bg-muted items-center justify-center">
            <HugeiconsIcon icon={CustomerSupportIcon} size={20} color={Palette.zinc[500]} />
          </View>
          <View className="flex-1">
            <Text className="text-xs font-bold text-foreground">
              {t("needHelpTitle")}
            </Text>
            <Text className="text-sm text-muted-foreground font-medium">
              {t("needHelpDesc")}
            </Text>
          </View>
          <Pressable
            onPress={() => router.push("/help-support")}
            accessibilityRole="button"
            className="px-3 py-1.5 rounded-full bg-muted min-h-8 justify-center"
          >
            <Text className="text-xs font-bold text-primary">{t("helpButton")}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </View>
  );
}
