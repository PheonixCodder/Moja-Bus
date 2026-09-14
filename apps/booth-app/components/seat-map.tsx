import { UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React, { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Pressable, ScrollView, Text, View } from "react-native";
import { IconColors } from "@/constants/ui-colors";
import { BoothFeedback } from "@/lib/haptics";
import {
  buildSeatGrid,
  getColumnHeaders,
  isPassengerSeat,
} from "@/lib/seat-grid";
import { cn } from "@/lib/utils";

export type SeatStatus =
  | "AVAILABLE"
  | "HELD"
  | "SOLD"
  | "BLOCKED"
  | "DRIVER"
  | "EMPTY";

export interface Seat {
  seatId: string;
  tripSeatId: string;
  label: string;
  row: number;
  col: number;
  deck: number;
  seatType: string;
  status: SeatStatus;
  priceXOF?: number;
}

export interface SeatMapProps {
  rows: number;
  columns: number;
  deck: number;
  seats: Seat[];
  selectedSeatId: string | null;
  onSeatSelect: (seat: Seat) => void;
  offlineAvailableSeatIds?: Set<string>;
}

const SeatCell = React.memo(function SeatCell({
  seat,
  isSelected,
  isOfflinePool,
  onPress,
}: {
  seat: Seat;
  isSelected: boolean;
  isOfflinePool: boolean;
  onPress: () => void;
}) {
  const isAvailable = seat.status === "AVAILABLE" || isOfflinePool;
  const isSold = seat.status === "SOLD";
  const isHeld = seat.status === "HELD";
  const isDriver = seat.status === "DRIVER" || seat.seatType === "DRIVER_AREA";
  const isBlocked = seat.status === "BLOCKED";
  const isEmpty = seat.status === "EMPTY";
  const showLabel = isPassengerSeat(seat.seatType);

  if (isEmpty) {
    return <View className="flex-1 h-[48px] m-[3px]" />;
  }

  if (isDriver) {
    return (
      <View className="flex-1 h-[48px] m-[3px] rounded-xl bg-foreground/10 border-[1.5px] border-border items-center justify-center">
        <HugeiconsIcon icon={UserIcon} size={16} color={IconColors.muted} />
      </View>
    );
  }

  if (isBlocked) {
    return (
      <View className="flex-1 h-[48px] m-[3px] items-center justify-center rounded-t-xl rounded-b-2xl bg-muted/40 border-[1.5px] border-border">
        {showLabel ? (
          <Text className="text-sm font-extrabold tracking-wide text-muted-foreground/40">
            {seat.label}
          </Text>
        ) : null}
      </View>
    );
  }

  // Consistent background and border classes with will-change-variable
  let bgClass = "bg-muted border-[1.5px] border-border";
  let textClass = "text-muted-foreground/50";

  if (isSelected) {
    bgClass = "bg-primary border-[1.5px] border-primary";
    textClass = "text-primary-foreground";
  } else if (isOfflinePool) {
    bgClass = "bg-amber-100 border-[1.5px] border-amber-500";
    textClass = "text-amber-900";
  } else if (isAvailable) {
    bgClass = "bg-emerald-50 border-[1.5px] border-emerald-500/40";
    textClass = "text-emerald-700";
  } else if (isHeld) {
    bgClass = "bg-amber-50 border-[1.5px] border-amber-500/30";
    textClass = "text-amber-700";
  } else if (isSold) {
    bgClass = "bg-muted/80 border-[1.5px] border-border/80";
    textClass = "text-muted-foreground/50";
  }

  return (
    <Pressable
      onPress={isAvailable ? onPress : undefined}
      disabled={!isAvailable && !isSelected}
      accessibilityRole="button"
      accessibilityLabel={`Siège ${seat.label}, ${
        isSelected ? "sélectionné" : isAvailable ? "disponible" : "occupé"
      }`}
      accessibilityState={{
        selected: isSelected,
        disabled: !isAvailable && !isSelected,
      }}
      className={cn(
        "flex-1 h-[48px] m-[3px] items-center justify-center rounded-t-xl rounded-b-2xl will-change-variable",
        bgClass,
      )}
      style={({ pressed }) => ({
        opacity: pressed && isAvailable ? 0.8 : 1,
      })}
    >
      {showLabel || isSelected ? (
        <Text
          className={cn("text-sm font-extrabold tracking-wide", textClass)}
        >
          {seat.label}
        </Text>
      ) : null}
    </Pressable>
  );
});

export function SeatMap({
  rows = 5,
  columns = 4,
  deck: _deck,
  seats,
  selectedSeatId,
  onSeatSelect,
  offlineAvailableSeatIds,
}: SeatMapProps) {
  const { t } = useTranslation();

  const grid = useMemo(
    () => buildSeatGrid(seats, rows, columns),
    [seats, rows, columns],
  );

  const colHeaders = useMemo(
    () => getColumnHeaders(columns),
    [columns],
  );

  const selectedSeatObj = useMemo(
    () => seats.find((s) => s.seatId === selectedSeatId),
    [seats, selectedSeatId],
  );

  return (
    <ScrollView
      className="flex-1 px-4"
      contentContainerStyle={{ paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Front of Bus Indicator */}
      <View className="items-center mb-4 pb-3 border-b border-border/60">
        <View className="flex-row items-center bg-primary/10 rounded-full px-4 py-1.5 border border-primary/20 gap-2">
          <View className="w-2 h-2 rounded-full bg-primary" />
          <Text className="text-xs font-black text-primary tracking-widest uppercase">
            {t("sell.frontOfBus", "AVANT DU BUS")}
          </Text>
          <View className="w-2 h-2 rounded-full bg-primary" />
        </View>
      </View>

      {/* Column Headers (A, B, C, D) */}
      <View className="flex-row px-1 mb-1 items-center">
        <View className="w-6" />
        {colHeaders.map((header) => (
          <View key={header} className="flex-1 items-center">
            <Text className="text-xs font-extrabold text-muted-foreground tracking-wider">
              {header}
            </Text>
          </View>
        ))}
      </View>

      {/* Grid of Seats */}
      {grid.map((row, rowIndex) => (
        <View
          // biome-ignore lint/suspicious/noArrayIndexKey: row index is physical coordinate
          key={`row-${rowIndex}`}
          className="flex-row items-center px-1"
        >
          {/* Row Number Marker */}
          <View className="w-6 items-center">
            <Text className="text-xs font-bold text-muted-foreground/60">
              {rowIndex + 1}
            </Text>
          </View>

          {row.map((seat, colIndex) =>
            seat ? (
              <SeatCell
                key={seat.tripSeatId || seat.seatId}
                seat={seat}
                isSelected={seat.seatId === selectedSeatId}
                isOfflinePool={Boolean(
                  offlineAvailableSeatIds?.has(seat.seatId),
                )}
                onPress={() => {
                  void BoothFeedback.selection();
                  onSeatSelect(seat);
                }}
              />
            ) : (
              <View
                // biome-ignore lint/suspicious/noArrayIndexKey: column index is physical coordinate
                key={`empty-${rowIndex}-${colIndex}`}
                className="flex-1 h-[48px] m-[3px]"
              />
            ),
          )}
        </View>
      ))}

      {/* Legend Pills */}
      <View className="flex-row flex-wrap gap-2 mt-5 pt-4 border-t border-border/60 justify-center">
        {[
          {
            label: t("sell.available", "Disponible"),
            bgClass: "bg-emerald-50 border-emerald-500/40",
          },
          {
            label: t("sell.selected", "Sélectionné"),
            bgClass: "bg-primary border-primary",
          },
          {
            label: t("sell.held", "En attente"),
            bgClass: "bg-amber-50 border-amber-500/30",
          },
          {
            label: t("sell.sold", "Occupé"),
            bgClass: "bg-muted border-border",
          },
        ].map(({ label, bgClass }) => (
          <View
            key={label}
            className="flex-row items-center gap-1.5 bg-muted/20 px-2.5 py-1 rounded-full border border-border/50"
          >
            <View className={cn("w-3.5 h-3.5 rounded border-[1.5px]", bgClass)} />
            <Text className="text-xs font-semibold text-muted-foreground">
              {label}
            </Text>
          </View>
        ))}

        {offlineAvailableSeatIds && offlineAvailableSeatIds.size > 0 ? (
          <View className="flex-row items-center gap-1.5 bg-muted/20 px-2.5 py-1 rounded-full border border-border/50">
            <View className="w-3.5 h-3.5 rounded border-[1.5px] bg-amber-100 border-amber-500" />
            <Text className="text-xs font-semibold text-amber-800">
              {t("sell.offlinePoolBadge", "Réserve")}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Selected Seat Info Banner */}
      {selectedSeatObj ? (
        <View className="mt-5 bg-card border border-primary/25 rounded-2xl p-4 shadow-sm flex-row items-center justify-between">
          <View>
            <Text className="text-[11px] uppercase tracking-wider text-muted-foreground font-bold">
              {t("sell.selectedSeat", "Siège sélectionné")}
            </Text>
            <Text className="text-xl font-heading font-black text-foreground mt-0.5">
              Siège {selectedSeatObj.label}
            </Text>
          </View>
          <View className="w-11 h-11 rounded-xl bg-primary/10 items-center justify-center border border-primary/30">
            <Text className="text-primary font-black text-base">
              {selectedSeatObj.label}
            </Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
