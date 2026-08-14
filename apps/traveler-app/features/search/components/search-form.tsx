import React, { useState } from 'react';
import {
  View,
  Text,
  Pressable,
  Alert,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTranslation } from 'react-i18next';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from 'react-native-reanimated';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowUpDownIcon,
  Location01Icon,
  Calendar01Icon,
  UserGroupIcon,
  Add01Icon,
  Remove01Icon,
  Navigation01Icon,
} from '@hugeicons/core-free-icons';
import * as Haptics from 'expo-haptics';
import type { CityValue } from '../types';

interface SearchFormProps {
  origin: CityValue | null;
  destination: CityValue | null;
  date: Date;
  passengers: number;
  onOriginPress: () => void;
  onDestinationPress: () => void;
  onDatePress: () => void;
  onSwap: () => void;
  setPassengers: (p: number) => void;
  onSubmit: () => void;
  onDateChange?: (date: Date) => void;
}

// Clean date formatter that removes trailing locale dots (e.g. "mar." -> "Mar") and capitalizes month/day
function formatFormDate(d: Date, lang: string) {
  const isFr = lang.startsWith('fr');
  const locale = isFr ? 'fr-FR' : 'en-US';
  const raw = d.toLocaleDateString(locale, {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  return raw
    .replace(/\./g, '')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

export function SearchForm({
  origin,
  destination,
  date,
  passengers,
  onOriginPress,
  onDestinationPress,
  onSwap,
  setPassengers,
  onDateChange,
}: SearchFormProps) {
  const { t, i18n } = useTranslation('search');
  const [showDatePicker, setShowDatePicker] = useState(false);

  const rotation = useSharedValue(0);
  const animatedSwapStyle = useAnimatedStyle(() => ({
    transform: [{ rotate: `${rotation.value}deg` }],
  }));

  const handleSwap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    rotation.value = withSpring(rotation.value + 180, { damping: 12 });
    onSwap();
  };

  const handleDecrease = () => {
    if (passengers > 1) {
      Haptics.selectionAsync();
      setPassengers(passengers - 1);
    }
  };

  const handleIncrease = () => {
    if (passengers < 6) {
      Haptics.selectionAsync();
      setPassengers(passengers + 1);
    }
  };

  const handleDatePickerChange = (_: any, selectedDate?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (selectedDate) onDateChange?.(selectedDate);
  };

  const formattedDate = formatFormDate(date, i18n.language || 'en');

  return (
    <View className="px-4 pb-4">
      {/* ── Box 1: Route Inputs Container ── */}
      <View className="rounded-[20px] bg-white border border-slate-100 mb-2.5 relative">
        {/* Origin */}
        <Pressable
          onPress={onOriginPress}
          className="flex-row items-center px-4 py-3.5 border-b border-slate-50 rounded-t-[20px] bg-white"
          style={({ pressed }) => ({ backgroundColor: pressed ? '#f8fafc' : '#ffffff' })}
        >
          <View className="w-[34px] h-[34px] rounded-full bg-pink-50 items-center justify-center mr-3">
            <HugeiconsIcon icon={Navigation01Icon} size={15} color="#ee237c" />
          </View>
          <View className="flex-1 pr-9">
            <Text className="text-[9px] font-black text-slate-400 tracking-[1.5px] uppercase mb-0.5">
              {t('leavingFrom')}
            </Text>
            <Text
              numberOfLines={1}
              className={`text-sm ${
                origin ? 'font-bold text-slate-900' : 'font-normal text-slate-400'
              }`}
            >
              {origin ? origin.text : t('fromPlaceholder')}
            </Text>
          </View>
        </Pressable>

        {/* Floating Swap Button */}
        <Pressable
          onPress={handleSwap}
          className="absolute right-4 top-1/2 -mt-4 w-8 h-8 rounded-full border border-pink-100 items-center justify-center z-50 elevation-2 bg-white"
          style={({ pressed }) => ({ backgroundColor: pressed ? '#fce7f3' : '#ffffff', shadowColor: '#ee237c', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 4 })}
        >
          <Animated.View style={animatedSwapStyle}>
            <HugeiconsIcon icon={ArrowUpDownIcon} size={13} color="#ee237c" />
          </Animated.View>
        </Pressable>

        {/* Destination */}
        <Pressable
          onPress={onDestinationPress}
          className="flex-row items-center px-4 py-3.5 rounded-b-[20px] bg-white"
          style={({ pressed }) => ({ backgroundColor: pressed ? '#f8fafc' : '#ffffff' })}
        >
          <View className="w-[34px] h-[34px] rounded-full bg-slate-100 items-center justify-center mr-3">
            <HugeiconsIcon icon={Location01Icon} size={15} color="#64748b" />
          </View>
          <View className="flex-1 pr-9">
            <Text className="text-[9px] font-black text-slate-400 tracking-[1.5px] uppercase mb-0.5">
              {t('goingTo')}
            </Text>
            <Text
              numberOfLines={1}
              className={`text-sm ${
                destination ? 'font-bold text-slate-900' : 'font-normal text-slate-400'
              }`}
            >
              {destination ? destination.text : t('toPlaceholder')}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* ── Box 2 & Box 3: Date + PAX Row ── */}
      <View className="flex-row gap-2.5">
        {/* Box 2: Calendar Box */}
        <Pressable
          onPress={() => setShowDatePicker(true)}
          className="flex-1 flex-row items-center border border-slate-100 rounded-[20px] px-3.5 py-3 bg-white"
          style={({ pressed }) => ({ backgroundColor: pressed ? '#f8fafc' : '#ffffff' })}
        >
          <View className="w-8 h-8 rounded-xl bg-pink-50 items-center justify-center mr-2.5">
            <HugeiconsIcon icon={Calendar01Icon} size={15} color="#ee237c" />
          </View>
          <View className="flex-1">
            <Text className="text-[9px] font-black text-slate-400 tracking-[1.5px] uppercase">
              {t('datePlaceholder')}
            </Text>
            <Text className="text-xs font-bold text-slate-900" numberOfLines={1}>
              {formattedDate}
            </Text>
          </View>
        </Pressable>

        {/* Box 3: Passenger Box */}
        <View className="flex-row items-center bg-white border border-slate-100 rounded-[20px] px-2.5 py-2.5 gap-2">
          <Pressable
            onPress={handleDecrease}
            disabled={passengers <= 1}
            className="w-7 h-7 rounded-lg border border-slate-100 items-center justify-center bg-slate-50"
            style={({ pressed }) => ({ backgroundColor: pressed ? '#e2e8f0' : '#f8fafc' })}
          >
            <HugeiconsIcon
              icon={Remove01Icon}
              size={11}
              color={passengers > 1 ? '#0f172a' : '#cbd5e1'}
            />
          </Pressable>

          <View className="items-center">
            <Text className="text-[8px] font-black text-slate-400 tracking-widest uppercase mb-0.5">
              {t('paxPlaceholder')}
            </Text>
            <View className="flex-row items-center gap-1">
              <HugeiconsIcon icon={UserGroupIcon} size={12} color="#ee237c" />
              <Text className="text-sm font-black text-slate-900 min-w-[14px] text-center">
                {passengers}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleIncrease}
            disabled={passengers >= 6}
            className="w-7 h-7 rounded-lg border border-slate-100 items-center justify-center bg-slate-50"
            style={({ pressed }) => ({ backgroundColor: pressed ? '#e2e8f0' : '#f8fafc' })}
          >
            <HugeiconsIcon
              icon={Add01Icon}
              size={11}
              color={passengers < 6 ? '#0f172a' : '#cbd5e1'}
            />
          </Pressable>
        </View>
      </View>

      {/* Native Date Picker */}
      {showDatePicker && (
        <DateTimePicker
          value={date}
          mode="date"
          display={Platform.OS === 'ios' ? 'spinner' : 'default'}
          minimumDate={new Date()}
          onChange={handleDatePickerChange}
          onTouchCancel={() => setShowDatePicker(false)}
        />
      )}
    </View>
  );
}
