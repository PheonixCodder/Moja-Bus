import { UserIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import React from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { colors } from "@/constants/theme";
import { IconColors } from "@/constants/ui-colors";
import { BoothFeedback } from "@/lib/haptics";
import { cn } from "@/lib/utils";

export interface Seat {
  seatId: string;
  tripSeatId: string;
  label: string;
  row: number;
  col: number;
  deck: number;
  seatType: string;
  status: "AVAILABLE" | "SOLD" | "HELD" | "DRIVER" | "EMPTY" | "BLOCKED";
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

export function SeatMap({
  rows,
  columns,
  deck: _deck,
  seats,
  selectedSeatId,
  onSeatSelect,
  offlineAvailableSeatIds,
}: SeatMapProps) {
  const grid: (Seat | null)[][] = Array.from({ length: rows }, () =>
    Array(columns).fill(null),
  );

  for (const seat of seats) {
    if (
      seat.row >= 1 &&
      seat.row <= rows &&
      seat.col >= 1 &&
      seat.col <= columns
    ) {
      const row = grid[seat.row - 1];
      if (row) {
        row[seat.col - 1] = seat;
      }
    }
  }

  const selectedSeatObj = seats.find((s) => s.seatId === selectedSeatId);

  return (
    <ScrollView className="flex-1 px-4" contentContainerClassName="pb-10">
      {/* Legend */}
      <View className="flex-row flex-wrap gap-3 justify-center mb-6 py-2 px-3 bg-muted/30 rounded-2xl border border-border/50">
        <View className="flex-row items-center gap-1.5">
          <View className="w-3.5 h-3.5 rounded-t-sm rounded-b-md bg-emerald-50 border border-emerald-500" />
          <Text className="text-xs font-medium text-foreground/70">
            Disponible
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5">
          <View className="w-3.5 h-3.5 rounded-t-sm rounded-b-md bg-primary border border-primary shadow-xs" />
          <Text className="text-xs font-semibold text-primary">
            Sélectionné
          </Text>
        </View>

        <View className="flex-row items-center gap-1.5">
          <View className="w-3.5 h-3.5 rounded-t-sm rounded-b-md bg-muted border border-border" />
          <Text className="text-xs font-medium text-foreground/50">Occupé</Text>
        </View>

        {offlineAvailableSeatIds && offlineAvailableSeatIds.size > 0 ? (
          <View className="flex-row items-center gap-1.5">
            <View className="w-3.5 h-3.5 rounded-t-sm rounded-b-md bg-amber-100 border border-amber-500" />
            <Text className="text-xs font-semibold text-amber-800">
              Réserve
            </Text>
          </View>
        ) : null}
      </View>

      {/* Bus Front Cap / Cockpit Indicator */}
      <View className="items-center mb-4">
        <View className="w-36 h-3 rounded-t-full bg-border/80 border-t-2 border-primary/40" />
        <Text className="text-xs uppercase tracking-widest text-muted-foreground font-bold mt-1">
          Avant du bus
        </Text>
      </View>

      {/* Seat grid — render row by row */}
      <View className="items-center gap-2">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <View
            // biome-ignore lint/suspicious/noArrayIndexKey: physical bus row layout coordinate
            key={`row-${rowIndex}`}
            className="flex-row gap-2 items-center justify-center"
          >
            {/* Row Number Marker */}
            <Text className="text-xs font-bold text-muted-foreground/60 w-5 text-center">
              {rowIndex + 1}
            </Text>

            {Array.from({ length: columns }, (_, colIndex) => {
              const seat = grid[rowIndex]?.[colIndex];
              if (!seat) {
                return (
                  <View
                    // biome-ignore lint/suspicious/noArrayIndexKey: physical bus column coordinate
                    key={`empty-${rowIndex}-${colIndex}`}
                    className="w-11 h-11"
                  />
                );
              }

              const isDriverArea =
                seat.seatType === "DRIVER_AREA" || seat.status === "DRIVER";

              if (isDriverArea) {
                return (
                  <View
                    key={seat.tripSeatId || `driver-${rowIndex}-${colIndex}`}
                    className="w-11 h-11 rounded-2xl bg-foreground/10 border border-border items-center justify-center"
                  >
                    <HugeiconsIcon
                      icon={UserIcon}
                      size={18}
                      color={IconColors.muted}
                    />
                  </View>
                );
              }

              if (seat.status === "EMPTY") {
                return (
                  <View
                    key={
                      seat.tripSeatId || `empty-space-${rowIndex}-${colIndex}`
                    }
                    className="w-11 h-11"
                  />
                );
              }

              const isSelected = seat.seatId === selectedSeatId;
              const isOfflinePool = offlineAvailableSeatIds?.has(seat.seatId);
              const isAvailable = seat.status === "AVAILABLE" || isOfflinePool;
              const isOccupied = !isAvailable && !isSelected;

              // Compute cell classes based on state
              let cellClass = "bg-muted/40 border-border";
              let textClass = "text-muted-foreground/50";

              if (isSelected) {
                cellClass =
                  "bg-primary border-primary shadow-sm shadow-primary/30";
                textClass = "text-white";
              } else if (isOfflinePool) {
                cellClass = "bg-amber-100 border-amber-500";
                textClass = "text-amber-900";
              } else if (isAvailable) {
                cellClass =
                  "bg-emerald-50 border-emerald-500 active:bg-emerald-100";
                textClass = "text-emerald-800";
              }

              return (
                <TouchableOpacity
                  key={seat.tripSeatId}
                  accessibilityRole="button"
                  accessibilityLabel={`Siège ${seat.label}, ${isSelected ? "sélectionné" : isAvailable ? "disponible" : "occupé"}`}
                  accessibilityState={{
                    selected: isSelected,
                    disabled: isOccupied,
                  }}
                  disabled={isOccupied}
                  onPress={() => {
                    void BoothFeedback.selection();
                    onSeatSelect(seat);
                  }}
                  className={cn(
                    "w-11 h-11 rounded-t-xl rounded-b-2xl border-[1.5px] items-center justify-center active:scale-95",
                    cellClass,
                  )}
                >
                  <Text
                    className={cn(
                      "text-xs font-extrabold tracking-tight",
                      textClass,
                    )}
                  >
                    {seat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Selected seat info banner */}
      {selectedSeatObj ? (
        <View className="mt-8 bg-card border border-primary/20 rounded-2xl p-4 shadow-sm flex-row items-center justify-between">
          <View>
            <Text className="text-xs uppercase tracking-wider text-muted-foreground font-semibold">
              Siège sélectionné
            </Text>
            <Text className="text-xl font-heading font-extrabold text-foreground mt-0.5">
              Siège {selectedSeatObj.label}
            </Text>
          </View>
          <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center border border-primary/30">
            <Text className="text-primary font-bold text-base">
              {selectedSeatObj.label}
            </Text>
          </View>
        </View>
      ) : null}
    </ScrollView>
  );
}
