import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Cancel01Icon } from '@hugeicons/core-free-icons';
import { Colors } from '@moja/theme/tokens';
import type { SearchFilters } from '../types';
import { EMPTY_FILTERS, AMENITY_IDS, TIME_IDS, SEAT_CLASS_IDS } from '../lib/constants';

interface FiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApplyFilters: (f: SearchFilters) => void;
}

export function FiltersSheet({ visible, onClose, filters, onApplyFilters }: FiltersSheetProps) {
  const { t } = useTranslation("search");
  const insets = useSafeAreaInsets();
  
  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  React.useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const toggleArrayItem = (key: keyof SearchFilters, item: string) => {
    setLocalFilters(prev => {
      const arr = prev[key] as string[];
      if (arr.includes(item)) {
        return { ...prev, [key]: arr.filter(i => i !== item) };
      } else {
        return { ...prev, [key]: [...arr, item] };
      }
    });
  };

  const clearAll = () => {
    setLocalFilters(EMPTY_FILTERS);
  };

  const apply = () => {
    onApplyFilters(localFilters);
    onClose();
  };

  const filterCount = localFilters.operators.length + localFilters.amenities.length + localFilters.departureTime.length + localFilters.seatClass.length + (localFilters.isExpress ? 1 : 0);

  const CheckboxRow = ({ label, checked, onPress }: { label: string, checked: boolean, onPress: () => void }) => (
    <Pressable onPress={onPress} className="flex-row items-center justify-between py-3 border-b border-slate-100">
      <Text className="text-sm font-bold text-slate-800">{label}</Text>
      <View className={`w-5 h-5 rounded border items-center justify-center
        ${checked ? 'bg-[#ee237c] border-[#ee237c]' : 'border-slate-300 bg-white'}
      `}>
        {checked && <Text className="text-white text-xs font-black">✓</Text>}
      </View>
    </Pressable>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white" style={{ paddingTop: Math.max(insets.top, 12) }}>
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-slate-100">
          <Pressable onPress={onClose} className="p-2 -ml-2">
            <HugeiconsIcon icon={Cancel01Icon} size={20} color={Colors.light.textSecondary} />
          </Pressable>
          <Text className="text-lg font-bold text-slate-900">{t("filtersTitle")}</Text>
          <Pressable onPress={clearAll}>
            <Text className="text-[#ee237c] font-bold text-sm">{t("clearAll")}</Text>
          </Pressable>
        </View>

        <ScrollView className="flex-1" contentContainerStyle={{ padding: 16, paddingBottom: 100 }}>
          {/* Express Only */}
          <View className="flex-row items-center justify-between mb-6 bg-slate-50 p-4 rounded-xl border border-slate-200">
            <View>
              <Text className="text-sm font-bold text-slate-900">{t("expressOnly")}</Text>
            </View>
            <Switch
              value={localFilters.isExpress}
              onValueChange={(val) => setLocalFilters(prev => ({ ...prev, isExpress: val }))}
              trackColor={{ false: Colors.light.textSecondary, true: '#fbcfe8' }}
              thumbColor={localFilters.isExpress ? '#ee237c' : '#f8fafc'}
            />
          </View>

          {/* Bus Class */}
          <Text className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-2">{t("filterClass")}</Text>
          <View className="mb-6">
            {SEAT_CLASS_IDS.map(c => (
              <CheckboxRow
                key={c}
                label={t(`seatClass${c}` as any, c)}
                checked={localFilters.seatClass.includes(c)}
                onPress={() => toggleArrayItem('seatClass', c)}
              />
            ))}
          </View>

          {/* Departure Time */}
          <Text className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-2">{t("filterDeparture")}</Text>
          <View className="mb-6">
            {TIME_IDS.map(tId => (
              <CheckboxRow
                key={tId}
                label={t(`time${tId}` as any, tId)}
                checked={localFilters.departureTime.includes(tId)}
                onPress={() => toggleArrayItem('departureTime', tId)}
              />
            ))}
          </View>

          {/* Amenities */}
          <Text className="text-xs font-extrabold uppercase text-slate-400 tracking-wider mb-2">{t("amenities")}</Text>
          <View className="mb-6">
            {AMENITY_IDS.map(aId => (
              <CheckboxRow
                key={aId}
                label={t(`amenity${aId}` as any, aId)}
                checked={localFilters.amenities.includes(aId)}
                onPress={() => toggleArrayItem('amenities', aId)}
              />
            ))}
          </View>
        </ScrollView>

        <View className="absolute left-4 right-4 bg-white p-2" style={{ bottom: Math.max(insets.bottom, 16) }}>
          <Pressable onPress={apply} className="bg-[#ee237c] p-4 rounded-xl items-center shadow-md shadow-pink-500/20 active:bg-pink-700">
            <Text className="text-white font-bold text-base uppercase tracking-wider">
              {filterCount > 0 ? t("applyFilters", { count: filterCount }) : t("viewResults")}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
