import React, { useState } from 'react';
import { View, Text, Modal, Pressable, ScrollView, Switch } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Cancel01Icon, FilterIcon, CheckmarkCircle01Icon } from '@hugeicons/core-free-icons';
import { Colors } from '@moja/theme/tokens';
import type { SearchFilters } from '../types';
import { EMPTY_FILTERS, AMENITY_IDS, TIME_IDS, SEAT_CLASS_IDS } from '../lib/constants';

interface FiltersSheetProps {
  visible: boolean;
  onClose: () => void;
  filters: SearchFilters;
  onApplyFilters: (f: SearchFilters) => void;
  /** Operators derived from current search results */
  operators?: { id: string; name: string }[];
}

export function FiltersSheet({
  visible,
  onClose,
  filters,
  onApplyFilters,
  operators = [],
}: FiltersSheetProps) {
  const { t } = useTranslation('search');
  const insets = useSafeAreaInsets();

  const [localFilters, setLocalFilters] = useState<SearchFilters>(filters);

  React.useEffect(() => {
    if (visible) {
      setLocalFilters(filters);
    }
  }, [visible, filters]);

  const toggleArrayItem = (key: keyof SearchFilters, item: string) => {
    setLocalFilters((prev) => {
      const arr = prev[key] as string[];
      if (arr.includes(item)) {
        return { ...prev, [key]: arr.filter((i) => i !== item) };
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

  const filterCount =
    localFilters.operators.length +
    localFilters.amenities.length +
    localFilters.departureTime.length +
    localFilters.seatClass.length +
    (localFilters.isExpress ? 1 : 0);

  const FilterChipRow = ({
    items,
    selectedItems,
    onToggle,
    getLabel,
  }: {
    items: readonly string[];
    selectedItems: string[];
    onToggle: (item: string) => void;
    getLabel: (item: string) => string;
  }) => (
    <View className="flex-row flex-wrap gap-2 mb-6">
      {items.map((item) => {
        const isSelected = selectedItems.includes(item);
        return (
          <Pressable
            key={item}
            onPress={() => onToggle(item)}
            className={`flex-row items-center px-4 py-2.5 rounded-2xl border ${
              isSelected
                ? 'bg-pink-50/80 border-[#ee237c]'
                : 'bg-slate-50 border-slate-200 active:bg-slate-100'
            }`}
          >
            <Text
              className={`text-xs font-extrabold ${
                isSelected ? 'text-[#ee237c]' : 'text-slate-700'
              }`}
            >
              {getLabel(item)}
            </Text>
            {isSelected ? (
              <HugeiconsIcon
                icon={CheckmarkCircle01Icon}
                size={14}
                color="#ee237c"
                className="ml-1.5"
              />
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white" style={{ paddingTop: Math.max(insets.top, 12) }}>
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-slate-100">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-full bg-pink-50 border border-pink-200 items-center justify-center">
              <HugeiconsIcon icon={FilterIcon} size={16} color="#ee237c" />
            </View>
            <Text className="text-lg font-extrabold text-slate-900">{t('filtersTitle')}</Text>
          </View>

          <Pressable onPress={clearAll} className="px-2 py-1">
            <Text className="text-[#ee237c] font-black text-xs uppercase tracking-wider">
              {t('clearAll')}
            </Text>
          </Pressable>
        </View>

        <ScrollView
          className="flex-1"
          contentContainerStyle={{ padding: 16, paddingBottom: 110 }}
        >
          {/* Express Non-Stop Toggle */}
          <View className="flex-row items-center justify-between mb-6 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <View>
              <Text className="text-sm font-extrabold text-slate-900">{t('expressOnly')}</Text>
              <Text className="text-xs text-slate-500 mt-0.5">{t('directRoutesOnly')}</Text>
            </View>
            <Switch
              value={localFilters.isExpress}
              onValueChange={(val) => setLocalFilters((prev) => ({ ...prev, isExpress: val }))}
              trackColor={{ false: Colors.light.textSecondary, true: '#fbcfe8' }}
              thumbColor={localFilters.isExpress ? '#ee237c' : '#f8fafc'}
            />
          </View>

          {operators.length > 0 ? (
            <>
              <Text className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2.5">
                {t('busOperator')}
              </Text>
              <FilterChipRow
                items={operators.map((o) => o.id)}
                selectedItems={localFilters.operators}
                onToggle={(item) => toggleArrayItem('operators', item)}
                getLabel={(item) => operators.find((o) => o.id === item)?.name ?? item}
              />
            </>
          ) : null}

          {/* Bus Class */}
          <Text className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2.5">
            {t('filterClass')}
          </Text>
          <FilterChipRow
            items={SEAT_CLASS_IDS}
            selectedItems={localFilters.seatClass}
            onToggle={(item) => toggleArrayItem('seatClass', item)}
            getLabel={(item) => t(`seatClass${item}` as any, item)}
          />

          {/* Departure Time */}
          <Text className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2.5">
            {t('filterDeparture')}
          </Text>
          <FilterChipRow
            items={TIME_IDS}
            selectedItems={localFilters.departureTime}
            onToggle={(item) => toggleArrayItem('departureTime', item)}
            getLabel={(item) => t(`time${item}` as any, item)}
          />

          {/* Amenities */}
          <Text className="text-xs font-black uppercase text-slate-400 tracking-widest mb-2.5">
            {t('amenities')}
          </Text>
          <FilterChipRow
            items={AMENITY_IDS}
            selectedItems={localFilters.amenities}
            onToggle={(item) => toggleArrayItem('amenities', item)}
            getLabel={(item) => t(`amenity${item}` as any, item)}
          />
        </ScrollView>

        {/* Sticky Apply Button */}
        <View
          className="absolute left-4 right-4 bg-white p-3 border-t border-slate-100 rounded-t-2xl shadow-lg"
          style={{ bottom: Math.max(insets.bottom, 16) }}
        >
          <Pressable
            onPress={apply}
            style={({ pressed }) => ({
              backgroundColor: pressed ? '#d01867' : '#ee237c',
              padding: 16,
              borderRadius: 16,
              alignItems: 'center',
              justifyContent: 'center',
              shadowColor: '#ee237c',
              shadowOffset: { width: 0, height: 4 },
              shadowOpacity: 0.2,
              shadowRadius: 8,
              elevation: 4,
            })}
          >
            <Text className="text-white font-black text-base uppercase tracking-wider">
              {filterCount > 0 ? t('applyFilters', { count: filterCount }) : t('viewResults')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
