import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { UserIcon } from '@hugeicons/core-free-icons';

type SeatStatus = 'AVAILABLE' | 'HELD' | 'SOLD' | 'BLOCKED' | 'DRIVER' | 'EMPTY';

type SeatGridItem = {
  id: string;
  label: string;
  row: number;
  col: number;
  status: SeatStatus;
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
  const isAvailable = seat.status === 'AVAILABLE';
  const isSold = seat.status === 'SOLD';
  const isHeld = seat.status === 'HELD';
  const isDriver = seat.status === 'DRIVER';
  const isEmpty = seat.status === 'EMPTY' || seat.status === 'BLOCKED';

  if (isEmpty) {
    return <View style={{ flex: 1, height: 46, margin: 3 }} />;
  }

  if (isDriver) {
    return (
      <View
        style={{
          flex: 1,
          height: 46,
          margin: 3,
          borderRadius: 10,
          backgroundColor: '#f0f0ff',
          borderWidth: 1.5,
          borderColor: '#c7d2fe',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <HugeiconsIcon icon={UserIcon} size={16} color="#6366f1" />
      </View>
    );
  }

  return (
    <Pressable
      onPress={isAvailable ? onPress : undefined}
      disabled={!isAvailable}
      style={({ pressed }) => ({
        flex: 1,
        height: 46,
        margin: 3,
        borderRadius: 10,
        alignItems: 'center',
        justifyContent: 'center',
        // Selected
        backgroundColor: isSelected
          ? '#ee237c'
          : isAvailable
          ? '#f0fdf4'
          : isSold
          ? '#fef2f2'
          : isHeld
          ? '#fffbeb'
          : '#f8fafc',
        borderWidth: isSelected ? 0 : 1.5,
        borderColor: isSelected
          ? 'transparent'
          : isAvailable
          ? '#86efac'
          : isSold
          ? '#fca5a5'
          : isHeld
          ? '#fcd34d'
          : '#e2e8f0',
        opacity: pressed ? 0.75 : 1,
        // Seat shape: flat top, curved bottom (like a real chair back)
        borderTopLeftRadius: isSelected ? 10 : 10,
        borderTopRightRadius: isSelected ? 10 : 10,
        borderBottomLeftRadius: 14,
        borderBottomRightRadius: 14,
        // Subtle elevation for available seats
        shadowColor: isSelected ? '#ee237c' : '#000',
        shadowOffset: { width: 0, height: isSelected ? 3 : 1 },
        shadowOpacity: isSelected ? 0.25 : 0.06,
        shadowRadius: isSelected ? 6 : 2,
        elevation: isSelected ? 4 : 1,
      })}
    >
      <Text
        style={{
          fontSize: 11,
          fontWeight: '800',
          color: isSelected
            ? '#fff'
            : isAvailable
            ? '#15803d'
            : isSold
            ? '#dc2626'
            : isHeld
            ? '#d97706'
            : '#94a3b8',
          letterSpacing: 0.3,
        }}
      >
        {seat.label}
      </Text>
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
  const grid: (SeatGridItem | null)[][] = [];
  for (let r = 0; r < rows; r++) {
    grid[r] = [];
    for (let c = 0; c < columns; c++) {
      const seat = seats.find((s) => s.row === r && s.col === c);
      grid[r]?.push(seat ?? null);
    }
  }

  // Detect aisle position (column with no seats = aisle gap)
  // Standard bus: 2 seats | aisle | 2 seats → insert a spacer after col 1
  const hasAisle = columns >= 4;
  const aisleAfterCol = hasAisle ? Math.floor(columns / 2) - 1 : -1;

  return (
    <View style={{ gap: 0 }}>
      {/* Bus front indicator */}
      <View
        style={{
          alignItems: 'center',
          marginBottom: 16,
          paddingBottom: 12,
          borderBottomWidth: 1,
          borderBottomColor: '#f1f5f9',
        }}
      >
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#fdf2f8',
            borderRadius: 20,
            paddingHorizontal: 16,
            paddingVertical: 6,
            borderWidth: 1,
            borderColor: '#fbcfe8',
            gap: 6,
          }}
        >
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#ee237c',
            }}
          />
          <Text style={{ fontSize: 11, fontWeight: '700', color: '#db2777', letterSpacing: 1 }}>
            FRONT OF BUS
          </Text>
          <View
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: '#ee237c',
            }}
          />
        </View>
      </View>

      {/* Column headers */}
      <View
        style={{
          flexDirection: 'row',
          paddingHorizontal: 4,
          marginBottom: 4,
        }}
      >
        {/* Row number placeholder */}
        <View style={{ width: 24 }} />
        {Array.from({ length: columns }).map((_, i) => (
          <React.Fragment key={i}>
            <View style={{ flex: 1, alignItems: 'center' }}>
              <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', letterSpacing: 0.5 }}>
                {String.fromCharCode(65 + i)}
              </Text>
            </View>
            {i === aisleAfterCol && <View style={{ width: 20 }} />}
          </React.Fragment>
        ))}
      </View>

      {/* Seat rows */}
      {grid.map((row, rowIndex) => (
        <View
          key={rowIndex}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 4,
          }}
        >
          {/* Row number */}
          <View style={{ width: 24, alignItems: 'center' }}>
            <Text style={{ fontSize: 10, fontWeight: '600', color: '#cbd5e1' }}>
              {rowIndex + 1}
            </Text>
          </View>

          {row.map((seat, colIndex) => (
            <React.Fragment key={seat?.id ?? `empty-${rowIndex}-${colIndex}`}>
              {seat ? (
                <SeatCell
                  seat={seat}
                  isSelected={selectedSeats.includes(seat.id)}
                  onPress={() => onSelectSeat(seat.id)}
                />
              ) : (
                <View style={{ flex: 1, height: 46, margin: 3 }} />
              )}
              {colIndex === aisleAfterCol && (
                <View style={{ width: 20, alignItems: 'center' }}>
                  <View style={{ width: 1, height: 30, backgroundColor: '#e2e8f0' }} />
                </View>
              )}
            </React.Fragment>
          ))}
        </View>
      ))}

      {/* Legend */}
      <View
        style={{
          flexDirection: 'row',
          flexWrap: 'wrap',
          gap: 8,
          marginTop: 20,
          paddingTop: 16,
          borderTopWidth: 1,
          borderTopColor: '#f1f5f9',
          justifyContent: 'center',
        }}
      >
        {[
          { label: 'Available', bg: '#f0fdf4', border: '#86efac', text: '#15803d' },
          { label: 'Selected', bg: '#ee237c', border: '#ee237c', text: '#fff' },
          { label: 'Held', bg: '#fffbeb', border: '#fcd34d', text: '#d97706' },
          { label: 'Taken', bg: '#fef2f2', border: '#fca5a5', text: '#dc2626' },
        ].map(({ label, bg, border, text }) => (
          <View
            key={label}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              backgroundColor: '#fafafa',
              paddingHorizontal: 10,
              paddingVertical: 5,
              borderRadius: 20,
              borderWidth: 1,
              borderColor: '#f1f5f9',
            }}
          >
            <View
              style={{
                width: 16,
                height: 16,
                borderRadius: 4,
                backgroundColor: bg,
                borderWidth: 1.5,
                borderColor: border,
              }}
            />
            <Text style={{ fontSize: 11, fontWeight: '600', color: '#64748b' }}>{label}</Text>
          </View>
        ))}
      </View>
    </View>
  );
}
