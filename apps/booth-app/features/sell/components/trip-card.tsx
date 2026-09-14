import {
  ArrowRight01Icon,
  Clock01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import { useTranslation } from "react-i18next";
import { Pressable, Text, View } from "react-native";
import { IconColors } from "@/constants/ui-colors";
import { formatTerminalDisplay } from "@/lib/format-location-label";
import { BoothFeedback } from "@/lib/haptics";
import type { TodayTrip } from "../types";

export const TRIP_CARD_HEIGHT = 156;

interface TripCardProps {
  item: TodayTrip;
  terminalName: string;
  onSelect: (
    tripId: string,
    destTerminalId: string,
    originLabel?: string,
    destLabel?: string,
    offerId?: string,
  ) => void;
}

export const TripCard = React.memo(function TripCard({
  item,
  terminalName,
  onSelect,
}: TripCardProps) {
  const { t } = useTranslation();

  const isUrban = item.serviceType === "URBAN";
  const pickupStop = item.tripStops.find((s) => s.isPickup) || item.tripStops[0];
  const destStop = item.tripStops.find((s) => s.isDropoff) || item.tripStops[item.tripStops.length - 1];
  const destTerminalId = destStop?.terminalId ?? "";
  const offerId =
    pickupStop && destStop
      ? `${item.id}_${pickupStop.id}_${destStop.id}`
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

  const departureDate = new Date(item.departureDate);
  const diffMs = departureDate.getTime() - Date.now();
  const diffMinutes = Math.round(diffMs / (60 * 1000));

  const departureTime = departureDate.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const isIntercity = item.serviceType === "INTERCITY";
  const farePrice = item.schedule?.fares?.[0]?.priceXOF;
  const busLabel = item.bus?.registrationPlate ?? item.bus?.internalName;
  const gateLabel = item.gate;
  const isSoldOut = item.availableSeats === 0;
  const isClosed =
    item.isClosed ??
    (diffMinutes < 30 ||
      isSoldOut ||
      item.status === "COMPLETED" ||
      item.status === "CANCELLED");
  const isLowSeats =
    !isClosed && item.availableSeats > 0 && item.availableSeats <= 5;

  const handlePress = () => {
    if (isClosed) return;
    BoothFeedback.selection();
    onSelect(item.id, destTerminalId, originLabel, destLabel, offerId);
  };

  return (
    <Pressable
      onPress={handlePress}
      disabled={isClosed}
      accessibilityRole="button"
      accessibilityLabel={`${departureTime} ${originLabel} vers ${destLabel}${isClosed ? " — " + t("sell.closedDeparture") : ""}`}
      className={`bg-card rounded-2xl border p-4 shadow-xs active:scale-[0.99] transition-transform ${
        isClosed
          ? "opacity-60 border-border/40 bg-muted/20"
          : isLowSeats
            ? "border-amber-300/80 bg-amber-50/20"
            : "border-border/80"
      }`}
    >
      {/* Top Row: Time, Countdown, Service Type, and Fare */}
      <View className="flex-row items-center justify-between mb-3">
        <View className="flex-row items-center gap-2">
          <View className="flex-row items-center gap-1.5 bg-muted/50 px-2.5 py-1 rounded-lg">
            <HugeiconsIcon
              icon={Clock01Icon}
              size={14}
              color={IconColors.default}
            />
            <Text className="font-heading text-base font-black text-foreground">
              {departureTime}
            </Text>
          </View>

          {isClosed ? (
            <View className="bg-muted/80 border border-border/60 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-bold text-muted-foreground">
                {t("sell.closedDeparture")}
              </Text>
            </View>
          ) : diffMinutes > 0 && diffMinutes <= 90 ? (
            <View className="bg-primary/10 border border-primary/20 px-2 py-0.5 rounded-full">
              <Text className="text-[10px] font-black text-primary">
                {t("sell.departureIn", { time: `${diffMinutes} min` })}
              </Text>
            </View>
          ) : null}

          {/* Clean monochrome service type badge */}
          <View className="bg-muted/60 border border-border/50 px-2 py-0.5 rounded-md">
            <Text className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              {isIntercity ? "Interurbain" : "Urbain"}
            </Text>
          </View>
        </View>

        {farePrice ? (
          <Text className="text-sm font-extrabold text-foreground">
            {farePrice.toLocaleString("fr-FR")}{" "}
            <Text className="text-[10px] font-bold text-muted-foreground">
              FCFA
            </Text>
          </Text>
        ) : null}
      </View>

      {/* Middle: Route Hierarchy Origin -> Destination */}
      <View className="flex-row items-center justify-between gap-2 mb-3 bg-muted/20 rounded-xl p-2.5 border border-border/40">
        {/* Origin */}
        <View className="flex-1 min-w-0">
          <Text
            className="text-xs font-black text-foreground truncate"
            numberOfLines={1}
          >
            {originLabel}
          </Text>
          {originSecondary ? (
            <Text
              className="text-[10px] font-medium text-muted-foreground truncate mt-0.5"
              numberOfLines={1}
            >
              {originSecondary}
            </Text>
          ) : null}
        </View>

        {/* Direction Arrow */}
        <View className="size-6 rounded-full bg-card border border-border/60 items-center justify-center shrink-0">
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            size={12}
            color={IconColors.muted}
          />
        </View>

        {/* Destination */}
        <View className="flex-1 min-w-0 items-end">
          <Text
            className="text-xs font-black text-foreground truncate text-right"
            numberOfLines={1}
          >
            {destLabel}
          </Text>
          {destSecondary ? (
            <Text
              className="text-[10px] font-medium text-muted-foreground truncate mt-0.5 text-right"
              numberOfLines={1}
            >
              {destSecondary}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Bottom Row: Vehicle info & Clean Seat Status */}
      <View className="flex-row items-center justify-between pt-2.5 border-t border-border/40">
        <View className="flex-row items-center gap-1.5 flex-1 mr-2">
          {busLabel ? (
            <Text
              className="text-xs font-semibold text-muted-foreground truncate"
              numberOfLines={1}
            >
              {busLabel}
              {gateLabel ? ` • Q.${gateLabel}` : ""}
            </Text>
          ) : (
            <Text className="text-xs font-medium text-muted-foreground">
              {gateLabel ? `Quai ${gateLabel}` : "Direct"}
            </Text>
          )}
        </View>

        {/* Sleek Seat Availability Indicator */}
        <View
          className={`flex-row items-center gap-1.5 px-2.5 py-1 rounded-full border ${
            isClosed
              ? "bg-muted/70 border-border/40"
              : isLowSeats
                ? "bg-amber-500/10 border-amber-500/25"
                : "bg-muted/50 border-border/60"
          }`}
        >
          <View
            className={`size-1.5 rounded-full ${
              isClosed
                ? "bg-zinc-400"
                : isLowSeats
                  ? "bg-amber-500"
                  : "bg-foreground"
            }`}
          />
          <Text
            className={`text-xs font-extrabold ${
              isClosed
                ? "text-muted-foreground"
                : isLowSeats
                  ? "text-amber-800"
                  : "text-foreground"
            }`}
          >
            {isClosed
              ? isSoldOut
                ? t("sell.soldOut")
                : t("sell.closedDeparture")
              : isLowSeats
                ? t("sell.seatsRemaining", { count: item.availableSeats })
                : t("sell.seatsAvailable", { count: item.availableSeats })}
          </Text>
        </View>
      </View>
    </Pressable>
  );
});
