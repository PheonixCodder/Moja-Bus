import { ScrollView, Text, TouchableOpacity, View } from "react-native";

interface Seat {
  seatId: string;
  tripSeatId: string;
  label: string;
  row: number;
  col: number;
  deck: number;
  seatType: string;
  status: "AVAILABLE" | "SOLD" | "HELD" | "DRIVER" | "EMPTY" | "BLOCKED";
}

interface SeatMapProps {
  rows: number;
  columns: number;
  deck: number;
  seats: Seat[];
  selectedSeatId: string | null;
  onSeatSelect: (seat: Seat) => void;
  offlineAvailableSeatIds?: Set<string>;
}

function getSeatColor(
  seat: Seat,
  isSelected: boolean,
  isOfflinePool?: boolean,
): string {
  if (isSelected) return "bg-primary";
  if (isOfflinePool) return "bg-amber-400";

  switch (seat.status) {
    case "AVAILABLE":
      return "bg-green-500";
    case "SOLD":
      return "bg-foreground/20";
    case "HELD":
      return "bg-orange-400";
    case "DRIVER":
      return "bg-foreground/10";
    case "EMPTY":
      return "bg-transparent";
    case "BLOCKED":
      return "bg-foreground/30";
    default:
      return "bg-foreground/20";
  }
}

function getSeatTextColor(
  seat: Seat,
  isSelected: boolean,
  isOfflinePool?: boolean,
): string {
  if (isSelected) return "text-white";
  if (isOfflinePool) return "text-white";

  if (
    seat.status === "DRIVER" ||
    seat.status === "EMPTY" ||
    seat.status === "BLOCKED"
  ) {
    return "text-foreground/30";
  }
  return "text-white";
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

  const selectedSeat = seats.find((s) => s.seatId === selectedSeatId);
  const selectedSeatObj = selectedSeat;

  return (
    <ScrollView className="px-4">
      {/* Legend */}
      <View className="flex-row gap-4 justify-center mb-6">
        <View className="flex-row items-center gap-1.5">
          <View className="w-4 h-4 rounded bg-green-500" />
          <Text className="text-xs text-foreground/60">Disponible</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-4 h-4 rounded bg-primary" />
          <Text className="text-xs text-foreground/60">Sélectionné</Text>
        </View>
        <View className="flex-row items-center gap-1.5">
          <View className="w-4 h-4 rounded bg-foreground/20" />
          <Text className="text-xs text-foreground/60">Réservé</Text>
        </View>
        {offlineAvailableSeatIds && offlineAvailableSeatIds.size > 0 && (
          <View className="flex-row items-center gap-1.5">
            <View className="w-4 h-4 rounded bg-amber-400" />
            <Text className="text-xs text-foreground/60">Réserve</Text>
          </View>
        )}
      </View>

      {/* Seat grid — render row by row */}
      <View className="items-center gap-1">
        {Array.from({ length: rows }, (_, rowIndex) => (
          <View
            // biome-ignore lint/suspicious/noArrayIndexKey: static grid rows, no reordering
            key={`row-${rowIndex}`}
            className="flex-row gap-1 justify-center"
          >
            <Text className="text-xs text-foreground/50 w-6 text-right pr-1">
              {rowIndex + 1}
            </Text>
            {Array.from({ length: columns }, (_, colIndex) => {
              const seat = grid[rowIndex]?.[colIndex];
              if (!seat) {
                return (
                  // biome-ignore lint/suspicious/noArrayIndexKey: static grid cells, no reordering
                  <View key={`empty-${colIndex}`} className="w-10 h-10" />
                );
              }

              const isDriverArea =
                seat.seatType === "DRIVER_AREA" ||
                seat.seatType === "EMPTY_SPACE";
              if (isDriverArea) {
                return (
                  <View
                    key={seat.tripSeatId}
                    className="w-10 h-10 rounded items-center justify-center"
                  >
                    <Text className="text-xs text-foreground/30">
                      {seat.status === "DRIVER" ? "🚗" : ""}
                    </Text>
                  </View>
                );
              }

              const isSelected = seat.seatId === selectedSeatId;
              const isOfflinePool = offlineAvailableSeatIds?.has(seat.seatId);
              const isDisabled =
                seat.status !== "AVAILABLE" && !isSelected && !isOfflinePool;

              const bgColor = getSeatColor(seat, isSelected, isOfflinePool);
              const textColor = getSeatTextColor(
                seat,
                isSelected ?? false,
                isOfflinePool,
              );

              return (
                <TouchableOpacity
                  key={seat.tripSeatId}
                  className={`w-10 h-10 rounded items-center justify-center ${bgColor}`}
                  onPress={() => onSeatSelect(seat)}
                  disabled={isDisabled}
                  style={{ aspectRatio: 1 }}
                >
                  <Text className={`text-xs font-bold ${textColor}`}>
                    {seat.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        ))}
      </View>

      {/* Selected seat info */}
      {selectedSeatObj && (
        <View className="mt-6 bg-card border border-border rounded-xl p-4">
          <Text className="text-sm text-foreground/60">Siège sélectionné</Text>
          <Text className="text-xl font-bold text-foreground mt-1">
            {selectedSeatObj.label}
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
