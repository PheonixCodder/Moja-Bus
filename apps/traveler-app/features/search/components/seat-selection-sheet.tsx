import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Cancel01Icon, Ticket01Icon } from '@hugeicons/core-free-icons';
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

export function SeatSelectionSheet({
  offer,
  passengers,
  onClose,
  onContinue,
}: SeatSelectionSheetProps) {
  const { t } = useTranslation('search');
  const insets = useSafeAreaInsets();
  const [selectedSeatIds, setSelectedSeatIds] = useState<string[]>([]);

  // Reset selection whenever a new offer is shown
  React.useEffect(() => {
    setSelectedSeatIds([]);
  }, [offer?.id]);

  const { data: availability, isLoading } = useSeatAvailability(offer?.id ?? '');

  if (!offer) return null;

  // Map API seats → PassengerSeatMap shape
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
    <Modal
      visible={!!offer}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-slate-50" style={{ paddingTop: Math.max(insets.top, 12) }}>
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 bg-white border-b border-slate-100">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-full bg-pink-50 border border-pink-200 items-center justify-center">
              <HugeiconsIcon icon={Ticket01Icon} size={16} color="#ee237c" />
            </View>
            <Text className="text-lg font-extrabold text-slate-900">{t('seatSelection')}</Text>
          </View>

          <Pressable onPress={onClose} className="p-2 bg-slate-100 rounded-full">
            <HugeiconsIcon icon={Cancel01Icon} size={18} color={Colors.light.textSecondary} />
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 130 }}
        >
          {/* Journey Overview Card */}
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

          {/* Seat selection counter bar */}
          <View className="flex-row items-center justify-between bg-white border border-slate-200 rounded-2xl p-4 mb-4 shadow-xs">
            <Text className="text-sm font-extrabold text-slate-900">
              Select {passengers} Seat{passengers > 1 ? 's' : ''}
            </Text>
            <View className="bg-pink-50 border border-pink-200 px-3 py-1.5 rounded-full">
              <Text className="text-[#ee237c] text-xs font-black">
                {selectedSeatIds.length} / {passengers} Selected
              </Text>
            </View>
          </View>

          {/* Interactive Bus Seat Map Container */}
          <View className="bg-white rounded-3xl p-5 shadow-sm border border-slate-100">
            {isLoading ? (
              <View className="py-12 items-center justify-center gap-3">
                <ActivityIndicator size="large" color="#ee237c" />
                <Text className="text-slate-500 text-sm font-bold">{t('loading')}</Text>
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

        {/* Sticky Action Footer */}
        <View
          className="absolute left-4 right-4 bg-white p-3 border-t border-slate-100 rounded-t-2xl shadow-lg"
          style={{ bottom: Math.max(insets.bottom, 16) }}
        >
          <Pressable
            onPress={handleContinue}
            disabled={selectedSeatIds.length !== passengers || isLoading}
            style={({ pressed }) => {
              const isEnabled = selectedSeatIds.length === passengers && !isLoading;
              return {
                backgroundColor: !isEnabled
                  ? '#cbd5e1'
                  : pressed
                  ? '#d01867'
                  : '#ee237c',
                padding: 16,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: isEnabled ? '#ee237c' : 'transparent',
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: isEnabled ? 0.2 : 0,
                shadowRadius: 8,
                elevation: isEnabled ? 4 : 0,
              };
            }}
          >
            <Text className="text-white font-black text-base uppercase tracking-wider">
              {t('continueToPassengers')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
