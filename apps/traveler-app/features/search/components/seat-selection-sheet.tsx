import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { Colors } from '@moja/theme/tokens';
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

export function SeatSelectionSheet({ offer, passengers, onClose, onContinue }: SeatSelectionSheetProps) {
  const { t } = useTranslation('search');
  const insets = useSafeAreaInsets();
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);

  // Reset selection whenever a new offer is shown
  React.useEffect(() => {
    setSelectedSeatIds([]);
  }, [offer?.id]);

  const { data: availability, isLoading } = useSeatAvailability(offer?.id ?? '');

  if (!offer) return null;

  // Map API seats → PassengerSeatMap shape (use seatId as `id`)
  const seats = (availability?.seats ?? []).map((s) => ({
    id: s.seatId,
    label: s.label,
    row: s.row,
    col: s.col,
    status: s.status as 'AVAILABLE' | 'SOLD' | 'HELD' | 'BLOCKED' | 'DRIVER' | 'EMPTY',
  }));

  const rows = availability?.rows ?? 5;
  const columns = availability?.columns ?? 4;

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
    <Modal visible={!!offer} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-slate-50" style={{ paddingTop: Math.max(insets.top, 12) }}>
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 bg-white border-b border-slate-100">
          <Text className="text-lg font-bold text-slate-900">{t('seatSelection')}</Text>
          <Pressable onPress={onClose} className="p-2 bg-slate-100 rounded-full">
            <HugeiconsIcon icon={Cancel01Icon} size={18} color={Colors.light.textSecondary} />
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 120 }}>
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

          <Text className="text-base font-extrabold text-slate-900 mb-3">
            {t('seatsSelected', { count: selectedSeatIds.length })} ({selectedSeatIds.length}/{passengers})
          </Text>

          <View className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
            {isLoading ? (
              <View className="py-10 items-center gap-3">
                <ActivityIndicator size="large" color="#ee237c" />
                <Text className="text-slate-500 text-sm font-medium">{t('loading')}</Text>
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
          className="absolute left-4 right-4 bg-white p-2 border-t border-slate-100"
          style={{ bottom: Math.max(insets.bottom, 16) }}
        >
          <Pressable
            onPress={handleContinue}
            disabled={selectedSeatIds.length !== passengers || isLoading}
            className={`p-4 rounded-xl items-center shadow-md shadow-pink-500/20 will-change-pressable ${
              selectedSeatIds.length === passengers && !isLoading
                ? 'bg-[#ee237c] active:bg-pink-700'
                : 'bg-slate-300'
            }`}
          >
            <Text className="text-white font-bold text-base">{t('continueToPassengers')}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
