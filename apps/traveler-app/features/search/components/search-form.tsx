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
import { Colors, Palette } from '@/constants/theme';
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
      <View className="rounded-[20px] bg-card border border-border mb-2.5 relative">
        {/* Origin */}
        <Pressable
          onPress={onOriginPress}
          className="flex-row items-center px-4 py-3.5 border-b border-border/50 rounded-t-[20px] bg-card active:bg-muted/50"
        >
          <View className="w-[34px] h-[34px] rounded-full bg-primary/10 items-center justify-center mr-3">
            <HugeiconsIcon icon={Navigation01Icon} size={15} color={Palette.rose[500]} />
          </View>
          <View className="flex-1 pr-9">
            <Text className="text-[9px] font-black text-muted-foreground tracking-[1.5px] uppercase mb-0.5">
              {t('leavingFrom')}
            </Text>
            <Text
              numberOfLines={1}
              className={`text-sm ${
                origin ? 'font-bold text-foreground' : 'font-normal text-muted-foreground'
              }`}
            >
              {origin ? origin.text : t('fromPlaceholder')}
            </Text>
          </View>
        </Pressable>

        {/* Floating Swap Button */}
        <Pressable
          onPress={handleSwap}
          className="absolute right-4 top-1/2 -mt-4 w-8 h-8 rounded-full border border-primary/20 items-center justify-center z-50 bg-card active:bg-primary/10"
        >
          <Animated.View style={animatedSwapStyle}>
            <HugeiconsIcon icon={ArrowUpDownIcon} size={13} color={Palette.rose[500]} />
          </Animated.View>
        </Pressable>

        {/* Destination */}
        <Pressable
          onPress={onDestinationPress}
          className="flex-row items-center px-4 py-3.5 rounded-b-[20px] bg-card active:bg-muted/50"
        >
          <View className="w-[34px] h-[34px] rounded-full bg-muted items-center justify-center mr-3">
            <HugeiconsIcon icon={Location01Icon} size={15} color={Colors.light.textSecondary} />
          </View>
          <View className="flex-1 pr-9">
            <Text className="text-[9px] font-black text-muted-foreground tracking-[1.5px] uppercase mb-0.5">
              {t('goingTo')}
            </Text>
            <Text
              numberOfLines={1}
              className={`text-sm ${
                destination ? 'font-bold text-foreground' : 'font-normal text-muted-foreground'
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
          className="flex-1 flex-row items-center border border-border rounded-[20px] px-3.5 py-3 bg-card active:bg-muted/50"
        >
          <View className="w-8 h-8 rounded-xl bg-primary/10 items-center justify-center mr-2.5">
            <HugeiconsIcon icon={Calendar01Icon} size={15} color={Palette.rose[500]} />
          </View>
          <View className="flex-1">
            <Text className="text-[9px] font-black text-muted-foreground tracking-[1.5px] uppercase">
              {t('datePlaceholder')}
            </Text>
            <Text className="text-xs font-bold text-foreground" numberOfLines={1}>
              {formattedDate}
            </Text>
          </View>
        </Pressable>

        {/* Box 3: Passenger Box */}
        <View className="flex-row items-center bg-card border border-border rounded-[20px] px-2.5 py-2.5 gap-2">
          <Pressable
            onPress={handleDecrease}
            disabled={passengers <= 1}
            className="w-7 h-7 rounded-lg border border-border items-center justify-center bg-muted/50 active:bg-muted"
          >
            <HugeiconsIcon
              icon={Remove01Icon}
              size={11}
              color={passengers > 1 ? Colors.light.textPrimary : Colors.light.borderStrong}
            />
          </Pressable>

          <View className="items-center">
            <Text className="text-[8px] font-black text-muted-foreground tracking-widest uppercase mb-0.5">
              {t('paxPlaceholder')}
            </Text>
            <View className="flex-row items-center gap-1">
              <HugeiconsIcon icon={UserGroupIcon} size={12} color={Palette.rose[500]} />
              <Text className="text-sm font-black text-foreground min-w-[14px] text-center">
                {passengers}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleIncrease}
            disabled={passengers >= 6}
            className="w-7 h-7 rounded-lg border border-border items-center justify-center bg-muted/50 active:bg-muted"
          >
            <HugeiconsIcon
              icon={Add01Icon}
              size={11}
              color={passengers < 6 ? Colors.light.textPrimary : Colors.light.borderStrong}
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
