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
    if (passengers < 10) {
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
    <View style={{ paddingHorizontal: 16, paddingBottom: 16 }}>
      {/* ── Box 1: Route Inputs Container ── */}
      <View
        style={{
          borderRadius: 20,
          backgroundColor: '#ffffff',
          borderWidth: 1,
          borderColor: '#f1f5f9',
          marginBottom: 10,
          position: 'relative',
        }}
      >
        {/* Origin */}
        <Pressable
          onPress={onOriginPress}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            borderBottomWidth: 1,
            borderBottomColor: '#f8fafc',
            backgroundColor: pressed ? '#f8fafc' : '#ffffff',
            borderTopLeftRadius: 20,
            borderTopRightRadius: 20,
          })}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: '#fce7f3',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <HugeiconsIcon icon={Navigation01Icon} size={15} color="#ee237c" />
          </View>
          <View style={{ flex: 1, paddingRight: 36 }}>
            <Text
              style={{
                fontSize: 9,
                fontWeight: '900',
                color: '#94a3b8',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginBottom: 2,
              }}
            >
              {t('leavingFrom')}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 15,
                fontWeight: origin ? '700' : '400',
                color: origin ? '#0f172a' : '#94a3b8',
              }}
            >
              {origin ? origin.text : t('fromPlaceholder')}
            </Text>
          </View>
        </Pressable>

        {/* Floating Swap Button */}
        <Pressable
          onPress={handleSwap}
          style={({ pressed }) => ({
            position: 'absolute',
            right: 16,
            top: '50%',
            marginTop: -16,
            width: 32,
            height: 32,
            borderRadius: 16,
            backgroundColor: pressed ? '#fdf2f8' : '#ffffff',
            borderWidth: 1,
            borderColor: '#fce7f3',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 50,
            elevation: 4,
            shadowColor: '#ee237c',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.1,
            shadowRadius: 4,
          })}
        >
          <Animated.View style={animatedSwapStyle}>
            <HugeiconsIcon icon={ArrowUpDownIcon} size={13} color="#ee237c" />
          </Animated.View>
        </Pressable>

        {/* Destination */}
        <Pressable
          onPress={onDestinationPress}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            paddingHorizontal: 16,
            paddingVertical: 14,
            backgroundColor: pressed ? '#f8fafc' : '#ffffff',
            borderBottomLeftRadius: 20,
            borderBottomRightRadius: 20,
          })}
        >
          <View
            style={{
              width: 34,
              height: 34,
              borderRadius: 17,
              backgroundColor: '#f1f5f9',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 12,
            }}
          >
            <HugeiconsIcon icon={Location01Icon} size={15} color="#64748b" />
          </View>
          <View style={{ flex: 1, paddingRight: 36 }}>
            <Text
              style={{
                fontSize: 9,
                fontWeight: '900',
                color: '#94a3b8',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
                marginBottom: 2,
              }}
            >
              {t('goingTo')}
            </Text>
            <Text
              numberOfLines={1}
              style={{
                fontSize: 15,
                fontWeight: destination ? '700' : '400',
                color: destination ? '#0f172a' : '#94a3b8',
              }}
            >
              {destination ? destination.text : t('toPlaceholder')}
            </Text>
          </View>
        </Pressable>
      </View>

      {/* ── Box 2 & Box 3: Date + PAX Row ── */}
      <View style={{ flexDirection: 'row', gap: 10 }}>
        {/* Box 2: Calendar Box */}
        <Pressable
          onPress={() => setShowDatePicker(true)}
          style={({ pressed }) => ({
            flex: 1,
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: pressed ? '#f8fafc' : '#ffffff',
            borderWidth: 1,
            borderColor: '#f1f5f9',
            borderRadius: 20,
            paddingHorizontal: 14,
            paddingVertical: 12,
          })}
        >
          <View
            style={{
              width: 32,
              height: 32,
              borderRadius: 10,
              backgroundColor: '#fce7f3',
              alignItems: 'center',
              justifyContent: 'center',
              marginRight: 10,
            }}
          >
            <HugeiconsIcon icon={Calendar01Icon} size={15} color="#ee237c" />
          </View>
          <View style={{ flex: 1 }}>
            <Text
              style={{
                fontSize: 9,
                fontWeight: '900',
                color: '#94a3b8',
                letterSpacing: 1.5,
                textTransform: 'uppercase',
              }}
            >
              Date
            </Text>
            <Text
              style={{ fontSize: 13, fontWeight: '700', color: '#0f172a' }}
              numberOfLines={1}
            >
              {formattedDate}
            </Text>
          </View>
        </Pressable>

        {/* Box 3: Passenger Box */}
        <View
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            backgroundColor: '#ffffff',
            borderWidth: 1,
            borderColor: '#f1f5f9',
            borderRadius: 20,
            paddingHorizontal: 10,
            paddingVertical: 10,
            gap: 8,
          }}
        >
          <Pressable
            onPress={handleDecrease}
            disabled={passengers <= 1}
            style={({ pressed }) => ({
              width: 28,
              height: 28,
              borderRadius: 9,
              backgroundColor: pressed ? '#f1f5f9' : '#f8fafc',
              borderWidth: 1,
              borderColor: '#f1f5f9',
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <HugeiconsIcon
              icon={Remove01Icon}
              size={11}
              color={passengers > 1 ? '#0f172a' : '#cbd5e1'}
            />
          </Pressable>

          <View style={{ alignItems: 'center' }}>
            <Text
              style={{
                fontSize: 8,
                fontWeight: '900',
                color: '#94a3b8',
                letterSpacing: 1.2,
                textTransform: 'uppercase',
                marginBottom: 1,
              }}
            >
              PAX
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
              <HugeiconsIcon icon={UserGroupIcon} size={12} color="#ee237c" />
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: '900',
                  color: '#0f172a',
                  minWidth: 14,
                  textAlign: 'center',
                }}
              >
                {passengers}
              </Text>
            </View>
          </View>

          <Pressable
            onPress={handleIncrease}
            disabled={passengers >= 10}
            style={({ pressed }) => ({
              width: 28,
              height: 28,
              borderRadius: 9,
              backgroundColor: pressed ? '#f1f5f9' : '#f8fafc',
              borderWidth: 1,
              borderColor: '#f1f5f9',
              alignItems: 'center',
              justifyContent: 'center',
            })}
          >
            <HugeiconsIcon
              icon={Add01Icon}
              size={11}
              color={passengers < 10 ? '#0f172a' : '#cbd5e1'}
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
