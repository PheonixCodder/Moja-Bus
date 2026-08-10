import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  TextInput,
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Cancel01Icon, UserIcon, Call02Icon } from '@hugeicons/core-free-icons';
import { Colors } from '@moja/theme/tokens';
import { useCreateHold } from '@/features/booking/hooks/use-booking-actions';
import type { Offer } from './offer-card';

export interface PassengerDraft {
  seatId: string;
  passengerName: string;
  passengerPhone: string;
}

interface PassengerFormSheetProps {
  visible: boolean;
  offer: Offer | null;
  seatIds: string[];
  onClose: () => void;
  onBack: () => void;
}

export function PassengerFormSheet({
  visible,
  offer,
  seatIds,
  onClose,
  onBack,
}: PassengerFormSheetProps) {
  const { t } = useTranslation('search');
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const createHold = useCreateHold();

  const [passengers, setPassengers] = useState<PassengerDraft[]>(() =>
    seatIds.map((id) => ({ seatId: id, passengerName: '', passengerPhone: '' }))
  );

  // Re-sync if seatIds change (e.g. going back to change seats)
  React.useEffect(() => {
    setPassengers(
      seatIds.map((id) => ({ seatId: id, passengerName: '', passengerPhone: '' }))
    );
  }, [seatIds.join(',')]);

  const updatePassenger = (idx: number, field: 'passengerName' | 'passengerPhone', value: string) => {
    setPassengers((prev) =>
      prev.map((p, i) => (i === idx ? { ...p, [field]: value } : p))
    );
  };

  const isValid = passengers.every(
    (p) => p.passengerName.trim().length >= 2 && p.passengerPhone.trim().length >= 6
  );

  const handleConfirm = async () => {
    if (!offer) return;
    if (!isValid) {
      Alert.alert(t('passengerFormTitle'), t('passengerFormValidation'));
      return;
    }

    try {
      const result = await createHold.mutateAsync({
        offerId: offer.id,
        passengers: passengers.map((p) => ({
          seatId: p.seatId,
          passenger: {
            passengerName: p.passengerName.trim(),
            passengerPhone: p.passengerPhone.trim(),
          },
        })),
      });

      onClose();
      // createHold returns an array of refs (one per seat); navigate using the first
      const reference = result.bookingReferences?.[0] ?? result.holdId;
      router.push(`/booking/${reference}`);
    } catch (err: any) {
      Alert.alert(t('error'), err?.message ?? t('holdFailed'));
    }
  };

  if (!offer) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onBack}
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        className="flex-1"
      >
        <View
          className="flex-1 bg-slate-50"
          style={{ paddingTop: Math.max(insets.top, 12) }}
        >
          {/* Header */}
          <View className="flex-row items-center justify-between p-4 bg-white border-b border-slate-100">
            <Pressable onPress={onBack} className="p-2 -ml-2">
              <Text className="text-[#ee237c] font-bold text-sm">
                ← {t('back')}
              </Text>
            </Pressable>
            <Text className="text-base font-bold text-slate-900">
              {t('passengerFormTitle')}
            </Text>
            <Pressable onPress={onClose} className="p-2 bg-slate-100 rounded-full">
              <HugeiconsIcon icon={Cancel01Icon} size={18} color={Colors.light.textSecondary} />
            </Pressable>
          </View>

          <ScrollView
            className="flex-1"
            contentContainerStyle={{ padding: 16, paddingBottom: 120 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Route summary pill */}
            <View className="flex-row items-center bg-pink-50 border border-pink-200 rounded-xl px-4 py-3 mb-5">
              <Text className="text-[#ee237c] font-bold text-sm flex-1" numberOfLines={1}>
                {offer.departureCity} → {offer.arrivalCity}
              </Text>
              <Text className="text-slate-600 font-bold text-sm ml-2">
                {offer.departureTime}
              </Text>
            </View>

            {/* One card per seat */}
            {passengers.map((pax, idx) => (
              <View
                key={pax.seatId}
                className="bg-white rounded-2xl border border-slate-100 shadow-sm mb-4 overflow-hidden"
              >
                {/* Card header */}
                <View className="flex-row items-center px-4 py-3 bg-slate-50 border-b border-slate-100">
                  <View className="w-7 h-7 rounded-full bg-[#ee237c] items-center justify-center mr-2">
                    <Text className="text-white text-xs font-black">{idx + 1}</Text>
                  </View>
                  <Text className="text-sm font-bold text-slate-700">
                    {t('passengerLabel', { number: idx + 1 })}
                  </Text>
                  <View className="ml-auto bg-slate-200 px-2 py-0.5 rounded-full">
                    <Text className="text-slate-600 text-xs font-bold">
                      {t('seatLabel')} {idx + 1}
                    </Text>
                  </View>
                </View>

                <View className="p-4 gap-3">
                  {/* Name field */}
                  <View>
                    <Text className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                      {t('passengerNameLabel')}
                    </Text>
                    <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
                      <HugeiconsIcon icon={UserIcon} size={18} color={Colors.light.textSecondary} />
                      <TextInput
                        className="flex-1 ml-2.5 text-base text-slate-900 font-medium"
                        placeholder={t('passengerNamePlaceholder')}
                        placeholderTextColor={Colors.light.textSecondary}
                        value={pax.passengerName}
                        onChangeText={(v) => updatePassenger(idx, 'passengerName', v)}
                        autoCapitalize="words"
                        returnKeyType="next"
                      />
                    </View>
                  </View>

                  {/* Phone field */}
                  <View>
                    <Text className="text-xs font-bold text-slate-500 mb-1.5 uppercase tracking-wider">
                      {t('passengerPhoneLabel')}
                    </Text>
                    <View className="flex-row items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-3">
                      <HugeiconsIcon icon={Call02Icon} size={18} color={Colors.light.textSecondary} />
                      <TextInput
                        className="flex-1 ml-2.5 text-base text-slate-900 font-medium"
                        placeholder={t('passengerPhonePlaceholder')}
                        placeholderTextColor={Colors.light.textSecondary}
                        value={pax.passengerPhone}
                        onChangeText={(v) => updatePassenger(idx, 'passengerPhone', v)}
                        keyboardType="phone-pad"
                        returnKeyType={idx < passengers.length - 1 ? 'next' : 'done'}
                      />
                    </View>
                  </View>
                </View>
              </View>
            ))}
          </ScrollView>

          {/* CTA */}
          <View
            className="absolute left-4 right-4 bg-white p-3 border-t border-slate-100 rounded-t-2xl"
            style={{ bottom: Math.max(insets.bottom, 16) }}
          >
            <Pressable
              onPress={handleConfirm}
              disabled={!isValid || createHold.isPending}
              className={`p-4 rounded-xl items-center flex-row justify-center gap-2 shadow-md shadow-pink-500/20 will-change-pressable ${
                isValid && !createHold.isPending ? 'bg-[#ee237c] active:bg-pink-700' : 'bg-slate-300'
              }`}
            >
              {createHold.isPending ? (
                <ActivityIndicator size="small" color="white" />
              ) : null}
              <Text className="text-white font-bold text-base">
                {createHold.isPending ? t('holdingSeats') : t('confirmAndPay')}
              </Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}
