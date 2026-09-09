import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Cancel01Icon, Ticket01Icon } from '@hugeicons/core-free-icons';
import { Colors, Palette } from '@/constants/theme';
import { IconColors } from '@/constants/ui-colors';
import { PassengerSeatMap } from '@/features/booking/components/passenger-seat-map';
import { TripSummaryCard } from '@/features/booking/components/trip-summary-card';
import { useSeatAvailability } from '@/features/booking/hooks/use-seat-availability';
import type { Offer } from './offer-card';

interface SeatSelectionSheetProps {
  offer: Offer | null;
  passengers: number;
  onClose: () => void;
  onContinue: (seatIds: string[]) => void;
}

export function SeatSelectionSheet({
  offer,
  passengers,
  onClose,
  onContinue,
}: SeatSelectionSheetProps) {
  const { t } = useTranslation('search');
  const insets = useSafeAreaInsets();
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);

  React.useEffect(() => {
    setSelectedSeatIds([]);
  }, [offer?.id]);

  const {
    data: availability,
    isLoading,
    isError,
    refetch,
  } = useSeatAvailability(offer?.id ?? '');

  if (!offer) return null;

  const seats = (availability?.seats ?? []).map((s) => ({
    id: s.seatId,
    label: s.label,
    row: s.row,
    col: s.col,
    seatType: s.seatType,
    status: s.status as 'AVAILABLE' | 'SOLD' | 'HELD' | 'BLOCKED' | 'DRIVER' | 'EMPTY',
  }));

  const rows = availability?.rows ?? 5;
  const columns = availability?.columns ?? 4;
  const availableCount = seats.filter((s) => s.status === 'AVAILABLE').length;
  const isSoldOut =
    offer.availability === 'SOLD_OUT' ||
    (!isLoading && !isError && availableCount === 0);

  const handleToggleSeat = (seatId: string) => {
    if (selectedSeatIds.includes(seatId)) {
      setSelectedSeatIds((prev) => prev.filter((id) => id !== seatId));
    } else {
      if (selectedSeatIds.length >= passengers) {
        Alert.alert(t('seatSelection'), t('needMoreSeats', { count: 0 }));
        return;
      }
      setSelectedSeatIds((prev) => [...prev, seatId]);
    }
  };

  const handleContinue = () => {
    if (selectedSeatIds.length < passengers) {
      Alert.alert(
        t('seatSelection'),
        t('needMoreSeats', { count: passengers - selectedSeatIds.length })
      );
      return;
    }
    onContinue(selectedSeatIds);
  };

  return (
    <Modal
      visible={!!offer}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-background" style={{ paddingTop: Math.max(insets.top, 12) }}>
        <View className="flex-row items-center justify-between p-4 bg-card border-b border-border">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 items-center justify-center">
              <HugeiconsIcon icon={Ticket01Icon} size={16} color={Palette.rose[500]} />
            </View>
            <Text className="text-lg font-extrabold text-card-foreground">{t('seatSelection')}</Text>
          </View>

          <Pressable onPress={onClose} className="p-2 bg-muted rounded-full">
            <HugeiconsIcon icon={Cancel01Icon} size={18} color={IconColors.secondary} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 130 }}
        >
          <View className="mb-4">
            <TripSummaryCard
              companyName={offer.operatorName}
              origin={offer.departureCity}
              destination={offer.arrivalCity}
              departureTime={offer.departureTime}
              arrivalTime={offer.arrivalTime}
              duration={offer.duration}
              farePaidXOF={offer.priceXOF}
            />
          </View>

          <View className="flex-row items-center justify-between bg-card border border-border rounded-2xl p-4 mb-4 shadow-xs">
            <Text className="text-sm font-extrabold text-card-foreground">
              Select {passengers} Seat{passengers > 1 ? 's' : ''}
            </Text>
            <View className="bg-primary/10 border border-primary/20 px-3 py-1.5 rounded-full">
              <Text className="text-primary text-xs font-black">
                {selectedSeatIds.length} / {passengers} Selected
              </Text>
            </View>
          </View>

          <View className="bg-card rounded-3xl p-5 shadow-sm border border-border">
            {isLoading ? (
              <View className="py-12 items-center justify-center gap-3">
                <ActivityIndicator size="large" color={Palette.rose[500]} />
                <Text className="text-muted-foreground text-sm font-bold">{t('loading')}</Text>
              </View>
            ) : isError ? (
              <View className="py-12 items-center justify-center gap-3">
                <Text className="text-foreground text-sm font-bold text-center">
                  {t('seatLoadError')}
                </Text>
                <Pressable
                  onPress={() => refetch()}
                  accessibilityRole="button"
                  className="bg-primary/10 border border-primary/20 px-4 py-2 rounded-xl min-h-11 items-center justify-center"
                >
                  <Text className="text-primary text-xs font-bold">{t('retry', { defaultValue: 'Retry' })}</Text>
                </Pressable>
              </View>
            ) : isSoldOut ? (
              <View className="py-12 items-center justify-center gap-2">
                <Text className="text-foreground text-base font-black text-center">
                  {t('soldOutTrip')}
                </Text>
                <Text className="text-muted-foreground text-sm font-semibold text-center">
                  {t('soldOut')}
                </Text>
              </View>
            ) : (
              <PassengerSeatMap
                seats={seats}
                selectedSeats={selectedSeatIds}
                onSelectSeat={handleToggleSeat}
                rows={rows}
                columns={columns}
              />
            )}
          </View>
        </ScrollView>

        <View
          className="absolute left-4 right-4 bg-card p-3 border-t border-border rounded-t-2xl shadow-lg"
          style={{ bottom: Math.max(insets.bottom, 16) }}
        >
          <Pressable
            onPress={handleContinue}
            disabled={
              selectedSeatIds.length !== passengers || isLoading || isError || isSoldOut
            }
            className={`min-h-12 h-12 rounded-xl items-center justify-center ${
              selectedSeatIds.length === passengers && !isLoading && !isError && !isSoldOut
                ? 'bg-primary shadow-md shadow-primary/25'
                : 'bg-muted opacity-60'
            }`}
            style={({ pressed }) => ({
              opacity: pressed ? 0.85 : undefined,
            })}
          >
            <Text className="text-primary-foreground font-black text-base uppercase tracking-wider">
              {t('continueToPassengers')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
