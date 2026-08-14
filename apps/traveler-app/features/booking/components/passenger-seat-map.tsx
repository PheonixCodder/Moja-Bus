import React from "react";
import { View, Text, Pressable } from "react-native";
import { useTranslation } from "react-i18next";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { UserIcon } from "@hugeicons/core-free-icons";
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
      <View className="flex-1 h-[46px] m-[3px] rounded-xl bg-slate-800 border-[1.5px] border-slate-600 items-center justify-center">
        <HugeiconsIcon icon={UserIcon} size={16} color="#ffffff" />
      </View>
    );
  }

  if (isBlocked) {
    return (
      <View className="flex-1 h-[46px] m-[3px] items-center justify-center rounded-t-xl rounded-b-2xl bg-slate-50 border-[1.5px] border-slate-200">
        {showLabel ? (
          <Text className="text-sm font-extrabold tracking-wide text-slate-300">
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
          ? "bg-[#ee237c] shadow-md shadow-pink-500/30"
          : isAvailable
            ? "bg-emerald-50 border-[1.5px] border-emerald-300"
            : isSold
              ? "bg-slate-100 border-[1.5px] border-slate-200"
              : isHeld
                ? "bg-amber-50 border-[1.5px] border-amber-300"
                : "bg-slate-50 border-[1.5px] border-slate-200"
      }`}
      style={({ pressed }) => ({ opacity: pressed ? 0.75 : 1 })}
    >
      {showLabel || isSelected ? (
        <Text
          className={`text-sm font-extrabold tracking-wide ${
            isSelected
              ? "text-white"
              : isAvailable
                ? "text-emerald-700"
                : isSold
                  ? "text-slate-400"
                  : isHeld
                    ? "text-amber-600"
                    : "text-slate-400"
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
      <View className="items-center mb-4 pb-3 border-b border-slate-100">
        <View className="flex-row items-center bg-pink-50 rounded-full px-4 py-1.5 border border-pink-200 gap-1.5">
          <View className="w-2 h-2 rounded-full bg-[#ee237c]" />
          <Text className="text-sm font-bold text-pink-600 tracking-widest">
            {t("frontOfBus", "FRONT OF BUS")}
          </Text>
          <View className="w-2 h-2 rounded-full bg-[#ee237c]" />
        </View>
      </View>

      <View className="flex-row px-1 mb-1">
        <View className="w-6" />
        {colHeaders.map((header) => (
          <View key={header} className="flex-1 items-center">
            <Text className="text-xs font-bold text-slate-400 tracking-wide">
              {header}
            </Text>
          </View>
        ))}
      </View>

      {grid.map((row, rowIndex) => (
        <View key={rowIndex} className="flex-row items-center px-1">
          <View className="w-6 items-center">
            <Text className="text-xs font-semibold text-slate-300">
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

      <View className="flex-row flex-wrap gap-2 mt-5 pt-4 border-t border-slate-100 justify-center">
        {[
          {
            label: t("available", "Available"),
            bgClass: "bg-emerald-50 border-emerald-300",
          },
          {
            label: t("selected", "Selected"),
            bgClass: "bg-[#ee237c] border-[#ee237c]",
          },
          {
            label: t("held", "Held"),
            bgClass: "bg-amber-50 border-amber-300",
          },
          {
            label: t("taken", "Taken"),
            bgClass: "bg-slate-100 border-slate-200",
          },
          {
            label: t("blocked", "Blocked"),
            bgClass: "bg-slate-50 border-slate-200",
          },
        ].map(({ label, bgClass }) => (
          <View
            key={label}
            className="flex-row items-center gap-1.5 bg-slate-50 px-2.5 py-1 rounded-full border border-slate-100"
          >
            <View className={`w-4 h-4 rounded border-[1.5px] ${bgClass}`} />
            <Text className="text-sm font-semibold text-slate-500">{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
