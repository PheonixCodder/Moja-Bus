import React from 'react';
import { View, Text, Pressable, Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowUpDownIcon, Location01Icon, Calendar01Icon, UserGroupIcon, Add01Icon, Remove01Icon } from '@hugeicons/core-free-icons';
import { Colors } from '@moja/theme/tokens';
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
}

export function SearchForm({
  origin,
  destination,
  date,
  passengers,
  onOriginPress,
  onDestinationPress,
  onDatePress,
  onSwap,
  setPassengers,
  onSubmit,
}: SearchFormProps) {
  const { t } = useTranslation("search");

  const handleSwap = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
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

  const handleSubmit = () => {
    if (!origin || !destination) {
      Alert.alert(t("error"), t("originRequired"));
      return;
    }
    if (origin.id === destination.id && origin.municipalityId === destination.municipalityId) {
      Alert.alert(t("error"), t("sameCity"));
      return;
    }
    onSubmit();
  };

  return (
    <View className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mx-4 mt-2">
      <View className="flex-row items-center border border-slate-200 rounded-xl mb-4 relative">
        <View className="flex-1">
          <Pressable onPress={onOriginPress} className="p-3 border-b border-slate-200 flex-row items-center">
            <HugeiconsIcon icon={Location01Icon} size={20} color={Colors.light.textSecondary} className="mr-3" />
            <Text className={`text-base flex-1 ${origin ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}`}>
              {origin ? origin.text : t("leavingFrom")}
            </Text>
          </Pressable>
          <Pressable onPress={onDestinationPress} className="p-3 flex-row items-center">
            <HugeiconsIcon icon={Location01Icon} size={20} color={Colors.light.textSecondary} className="mr-3" />
            <Text className={`text-base flex-1 ${destination ? 'text-slate-900 font-bold' : 'text-slate-400 font-medium'}`}>
              {destination ? destination.text : t("goingTo")}
            </Text>
          </Pressable>
        </View>
        <Pressable 
          onPress={handleSwap}
          className="absolute right-4 top-1/2 -mt-4 bg-slate-50 p-2 rounded-full border border-slate-200 shadow-sm active:scale-95"
        >
          <HugeiconsIcon icon={ArrowUpDownIcon} size={18} color="#ee237c" />
        </Pressable>
      </View>

      <View className="flex-row mb-4 gap-3">
        <Pressable onPress={onDatePress} className="flex-1 border border-slate-200 rounded-xl p-3 flex-row items-center">
          <HugeiconsIcon icon={Calendar01Icon} size={20} color={Colors.light.textSecondary} className="mr-2" />
          <Text className="text-slate-900 font-bold text-sm">
            {date.toLocaleDateString('fr-CI', { weekday: 'short', month: 'short', day: 'numeric' })}
          </Text>
        </Pressable>
        
        <View className="flex-1 border border-slate-200 rounded-xl p-1 flex-row items-center justify-between">
          <Pressable onPress={handleDecrease} className="p-2" disabled={passengers <= 1}>
            <HugeiconsIcon icon={Remove01Icon} size={18} color={passengers > 1 ? Colors.light.text : Colors.light.textSecondary} />
          </Pressable>
          <View className="flex-row items-center">
            <HugeiconsIcon icon={UserGroupIcon} size={16} color={Colors.light.textSecondary} className="mr-1" />
            <Text className="text-slate-900 font-bold text-base">{passengers}</Text>
          </View>
          <Pressable onPress={handleIncrease} className="p-2" disabled={passengers >= 10}>
            <HugeiconsIcon icon={Add01Icon} size={18} color={passengers < 10 ? Colors.light.text : Colors.light.textSecondary} />
          </Pressable>
        </View>
      </View>

      <Pressable 
        onPress={handleSubmit}
        className="bg-[#ee237c] rounded-xl p-4 items-center justify-center shadow-md shadow-pink-500/20 active:bg-pink-700"
      >
        <Text className="text-white font-black text-base uppercase tracking-wider">{t("findBus")}</Text>
      </Pressable>
    </View>
  );
}
