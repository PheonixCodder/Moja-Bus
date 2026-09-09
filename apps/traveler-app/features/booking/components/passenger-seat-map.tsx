import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { UserIcon } from "@hugeicons/core-free-icons";
import { Colors, Palette } from "@/constants/theme";
import { IconColors } from "@/constants/ui-colors";
import {
  buildSeatGrid,
  getColumnHeaders,
  isPassengerSeat,
} from "@/features/booking/lib/seat-grid";

type SeatStatus =
  | "AVAILABLE"
  | "HELD"
  | "SOLD"
  | "BLOCKED"
  | "DRIVER"
  | "EMPTY";

type SeatGridItem = {
  id: string;
  label: string;
  row: number;
  col: number;
  status: SeatStatus;
  seatType?: string;
  priceXOF?: number;
};

type PassengerSeatMapProps = {
  seats: SeatGridItem[];
  selectedSeats: string[];
  onSelectSeat: (seatId: string) => void;
  rows?: number;
  columns?: number;
};

function SeatCell({
  seat,
  isSelected,
  onPress,
}: {
  seat: SeatGridItem;
  isSelected: boolean;
  onPress: () => void;
}) {
  const isAvailable = seat.status === "AVAILABLE";
  const isSold = seat.status === "SOLD";
  const isHeld = seat.status === "HELD";
  const isDriver = seat.status === "DRIVER";
  const isBlocked = seat.status === "BLOCKED";
  const isEmpty = seat.status === "EMPTY";
  const showLabel = isPassengerSeat(seat.seatType);

  if (isEmpty) {
    return <View className="flex-1 h-[46px] m-[3px]" />;
  }

  if (isDriver) {
    return (
      <View className="flex-1 h-[46px] m-[3px] rounded-xl bg-foreground border-[1.5px] border-border items-center justify-center">
        <HugeiconsIcon icon={UserIcon} size={16} color={IconColors.onCard} />
      </View>
    );
  }

  if (isBlocked) {
    return (
      <View className="flex-1 h-[46px] m-[3px] items-center justify-center rounded-t-xl rounded-b-2xl bg-muted/40 border-[1.5px] border-border">
        {showLabel ? (
          <Text className="text-sm font-extrabold tracking-wide text-muted-foreground/40">
            {seat.label}
          </Text>
        ) : null}
      </View>
    );
  }

  return (
    <Pressable
      onPress={isAvailable ? onPress : undefined}
      disabled={!isAvailable && !isSelected}
      className={`flex-1 h-[46px] m-[3px] items-center justify-center rounded-t-xl rounded-b-2xl ${
        isSelected
          ? "bg-primary shadow-md shadow-primary/30"
          : isAvailable
            ? "bg-success/10 border-[1.5px] border-success/30"
            : isSold
              ? "bg-muted border-[1.5px] border-border"
              : isHeld
                ? "bg-warning/10 border-[1.5px] border-warning/30"
                : "bg-muted/40 border-[1.5px] border-border"
      }`}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      {showLabel || isSelected ? (
        <Text
          className={`text-sm font-extrabold tracking-wide ${
            isSelected
              ? "text-primary-foreground"
              : isAvailable
                ? "text-success"
                : isSold
                  ? "text-muted-foreground"
                  : isHeld
                    ? "text-warning"
                    : "text-muted-foreground"
          }`}
        >
          {seat.label}
        </Text>
      ) : null}
    </Pressable>
  );
}

export function PassengerSeatMap({
  seats,
  selectedSeats,
  onSelectSeat,
  rows = 5,
  columns = 4,
}: PassengerSeatMapProps) {
  const { t } = useTranslation("booking");
  const grid = buildSeatGrid(seats, rows, columns);
  const colHeaders = getColumnHeaders(columns);

  return (
    <View className="gap-0">
      <View className="items-center mb-4 pb-3 border-b border-border/60">
        <View className="flex-row items-center bg-primary/10 rounded-full px-4 py-1.5 border border-primary/20 gap-1.5">
          <View className="w-2 h-2 rounded-full bg-primary" />
          <Text className="text-sm font-bold text-primary tracking-widest">
            {t("frontOfBus", "FRONT OF BUS")}
          </Text>
          <View className="w-2 h-2 rounded-full bg-primary" />
        </View>
      </View>

      <View className="flex-row px-1 mb-1">
        <View className="w-6" />
        {colHeaders.map((header) => (
          <View key={header} className="flex-1 items-center">
            <Text className="text-xs font-bold text-muted-foreground tracking-wide">
              {header}
            </Text>
          </View>
        ))}
      </View>

      {grid.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row items-center px-1">
          <View className="w-6 items-center">
            <Text className="text-xs font-semibold text-muted-foreground/60">
              {rowIndex + 1}
            </Text>
          </View>

          {row.map((seat, colIndex) =>
            seat ? (
              <SeatCell
                key={seat.id}
                seat={seat}
                isSelected={selectedSeats.includes(seat.id)}
                onPress={() => onSelectSeat(seat.id)}
              />
            ) : (
              <View
                key={`empty-${rowIndex}-${colIndex}`}
                className="flex-1 h-[46px] m-[3px]"
              />
            ),
          )}
        </View>
      ))}

      <View className="flex-row flex-wrap gap-2 mt-5 pt-4 border-t border-border/60 justify-center">
        {[
          {
            label: t("available", "Available"),
            bgClass: "bg-success/10 border-success/30",
          },
          {
            label: t("selected", "Selected"),
            bgClass: "bg-primary border-primary",
          },
          {
            label: t("held", "Held"),
            bgClass: "bg-warning/10 border-warning/30",
          },
          {
            label: t("taken", "Taken"),
            bgClass: "bg-muted border-border",
          },
          {
            label: t("blocked", "Blocked"),
            bgClass: "bg-muted/40 border-border",
          },
        ].map(({ label, bgClass }) => (
          <View
            key={label}
            className="flex-row items-center gap-1.5 bg-muted/20 px-2.5 py-1 rounded-full border border-border/50"
          >
            <View className={`w-4 h-4 rounded border-[1.5px] ${bgClass}`} />
            <Text className="text-sm font-semibold text-muted-foreground">{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
