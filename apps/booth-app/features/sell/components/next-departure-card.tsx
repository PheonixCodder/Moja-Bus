import {
  ArrowRight01Icon,
  Clock01Icon,
  Ticket01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { IconColors } from "@/constants/ui-colors";
import { formatTerminalDisplay } from "@/lib/format-location-label";
import { BoothFeedback } from "@/lib/haptics";
import type { TodayTrip } from "../types";

interface NextDepartureCardProps {
  trip: TodayTrip | null;
  terminalName: string;
  onSelect: (
    tripId: string,
    destTerminalId: string,
    originLabel?: string,
    destLabel?: string,
    offerId?: string,
  ) => void;
}

export const NextDepartureCard = React.memo(function NextDepartureCard({
  trip,
  terminalName,
  onSelect,
}: NextDepartureCardProps) {
  const { t } = useTranslation();

  if (!trip) return null;

  const isUrban = trip.serviceType === "URBAN";
  const isIntercity = trip.serviceType === "INTERCITY";
  const pickupStop = trip.tripStops.find((s) => s.isPickup) || trip.tripStops[0];
  const destStop = trip.tripStops.find((s) => s.isDropoff) || trip.tripStops[trip.tripStops.length - 1];
  const destTerminalId = destStop?.terminalId ?? "";
  const offerId =
    pickupStop && destStop
      ? `${trip.id}_${pickupStop.id}_${destStop.id}`
      : undefined;

  const originDisplay = formatTerminalDisplay(pickupStop?.terminal, isUrban);
  const originLabel =
    originDisplay.primary !== "—"
      ? originDisplay.primary
      : terminalName || "Départ";
  const originSecondary = originDisplay.secondary;

  const destDisplay = formatTerminalDisplay(destStop?.terminal, isUrban);
  const destLabel =
    destDisplay.primary !== "—"
      ? destDisplay.primary
      : destStop?.terminal?.name || "Arrivée";
  const destSecondary = destDisplay.secondary;

  const departureDate = new Date(trip.departureDate);
  const diffMs = departureDate.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (60 * 1000));

  // Only spotlight trips departing within 75 minutes or slightly in boarding
  if (diffMinutes < -10 || diffMinutes > 75) {
    return null;
  }

  const timeCountdown =
    diffMinutes <= 0
      ? "Embarquement en cours"
      : t("sell.departureIn", { time: `${diffMinutes} min` });

  const departureTime = departureDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const farePrice = trip.schedule?.fares?.[0]?.priceXOF;
  const busLabel = trip.bus?.registrationPlate ?? trip.bus?.internalName;
  const gateLabel = trip.gate;
  const total = trip.totalSeats || 45;
  const booked = trip.bookedCount || 0;
  const available = Math.max(0, trip.availableSeats);
  const occupancyPercent = Math.min(100, Math.round((booked / total) * 100));

  const handlePress = () => {
    BoothFeedback.selection();
    onSelect(trip.id, destTerminalId, originLabel, destLabel, offerId);
  };

  return (
    <View className="mb-6">
      {/* Section Header */}
      <View className="flex-row items-center justify-between mb-2.5">
        <View className="flex-row items-center gap-2">
          <Text className="text-xs font-black text-muted-foreground uppercase tracking-widest">
            {t("sell.nextDeparture")}
          </Text>
          <View className="bg-muted/60 border border-border/50 px-2 py-0.5 rounded-md">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {isIntercity ? "Interurbain" : "Urbain"}
            </Text>
          </View>
        </View>

        <View className="bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
          <Text className="text-[11px] font-extrabold text-primary">
            {timeCountdown}
          </Text>
        </View>
      </View>

      {/* Crisp White Spotlight Card */}
      <View className="bg-card border border-border/80 rounded-3xl p-5 shadow-xs gap-4">
        {/* Row 1: Time, Clock, and Fare */}
        <View className="flex-row items-baseline justify-between">
          <View className="flex-row items-center gap-2">
            <HugeiconsIcon
              icon={Clock01Icon}
              size={22}
              color={IconColors.default}
            />
            <Text className="font-heading text-3xl font-black text-foreground tracking-tight">
              {departureTime}
            </Text>
          </View>

          {farePrice ? (
            <Text className="text-base font-black text-foreground">
              {farePrice.toLocaleString("fr-FR")}{" "}
              <Text className="text-xs font-bold text-muted-foreground">
                FCFA
              </Text>
            </Text>
          ) : null}
        </View>

        {/* Row 2: Route Origin -> Destination with hierarchy */}
        <View className="flex-row items-center justify-between gap-3 bg-muted/25 rounded-2xl p-3 border border-border/40">
          <View className="flex-1 min-w-0">
            <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
              Départ
            </Text>
            <Text
              className="text-sm font-black text-foreground truncate"
              numberOfLines={1}
            >
              {originLabel}
            </Text>
            {originSecondary ? (
              <Text
                className="text-[11px] font-medium text-muted-foreground truncate mt-0.5"
                numberOfLines={1}
              >
                {originSecondary}
              </Text>
            ) : null}
          </View>

          <View className="size-8 rounded-full bg-card border border-border/70 items-center justify-center shrink-0 shadow-2xs">
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              size={14}
              color={IconColors.muted}
            />
          </View>

          <View className="flex-1 min-w-0 items-end">
            <Text className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-0.5 text-right">
              Arrivée
            </Text>
            <Text
              className="text-sm font-black text-foreground truncate text-right"
              numberOfLines={1}
            >
              {destLabel}
            </Text>
            {destSecondary ? (
              <Text
                className="text-[11px] font-medium text-muted-foreground truncate mt-0.5 text-right"
                numberOfLines={1}
              >
                {destSecondary}
              </Text>
            ) : null}
          </View>
        </View>

        {/* Row 3: Vehicle, Gate & Progress Capacity Bar */}
        <View className="gap-2 pt-1 border-t border-border/40">
          <View className="flex-row items-center justify-between">
            <Text className="text-xs font-medium text-muted-foreground">
              {busLabel ? `Car ${busLabel}` : "Car assigné"}
              {gateLabel ? ` • ${t("sell.gateLabel")} ${gateLabel}` : ""}
            </Text>
            <Text className="text-xs font-extrabold text-foreground">
              {available === 0
                ? t("sell.soldOut")
                : `${available} places libres`}
            </Text>
          </View>

          <View className="h-1.5 bg-muted/60 rounded-full overflow-hidden">
            <View
              className={`h-full rounded-full ${
                available <= 5 ? "bg-amber-500" : "bg-primary"
              }`}
              style={{ width: `${occupancyPercent}%` }}
            />
          </View>
        </View>

        {/* Row 4: Single Clear Action Button */}
        <Pressable
          onPress={handlePress}
          disabled={available === 0}
          accessibilityRole="button"
          accessibilityLabel={t("sell.sellThisTrip")}
          className={`h-12 flex-row items-center justify-center gap-2 rounded-2xl active:opacity-90 shadow-2xs ${
            available === 0 ? "bg-muted" : "bg-primary"
          }`}
        >
          <HugeiconsIcon
            icon={Ticket01Icon}
            size={18}
            color={available === 0 ? IconColors.muted : "#ffffff"}
          />
          <Text
            className={`font-heading font-extrabold text-sm uppercase tracking-wider ${
              available === 0 ? "text-muted-foreground" : "text-white"
            }`}
          >
            {available === 0 ? t("sell.soldOut") : t("sell.sellThisTrip")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
});
