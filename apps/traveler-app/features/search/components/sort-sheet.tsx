import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Cancel01Icon,
  Money01Icon,
  FastForwardIcon,
  Clock01Icon,
  Sorting01Icon,
  CheckmarkCircle01Icon,
} from '@hugeicons/core-free-icons';
import { Colors } from '@moja/theme/tokens';
import type { SortKey } from '../types';

interface SortSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedSort: SortKey;
  onSelectSort: (sort: SortKey) => void;
}

export function SortSheet({
  visible,
  onClose,
  selectedSort,
  onSelectSort,
}: SortSheetProps) {
  const { t } = useTranslation('search');
  const insets = useSafeAreaInsets();

  const options: { value: SortKey; label: string; icon: any }[] = [
    { value: 'BEST', label: t('sortBest'), icon: Sorting01Icon },
    { value: 'CHEAPEST', label: t('sortCheapest'), icon: Money01Icon },
    { value: 'FASTEST', label: t('sortFastest'), icon: FastForwardIcon },
    { value: 'EARLIEST', label: t('sortEarliest'), icon: Clock01Icon },
    { value: 'LATEST', label: t('sortLatest'), icon: Clock01Icon },
  ];

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
              <HugeiconsIcon icon={Sorting01Icon} size={16} color="#ee237c" />
            </View>
            <Text className="text-lg font-extrabold text-slate-900">{t('sortLabel')}</Text>
          </View>
          <Pressable onPress={onClose} className="p-2 bg-slate-100 rounded-full">
            <HugeiconsIcon icon={Cancel01Icon} size={18} color={Colors.light.textSecondary} />
          </Pressable>
        </View>

        <View className="p-4 gap-3">
          {options.map((option) => {
            const isSelected = selectedSort === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => onSelectSort(option.value)}
                className={`flex-row items-center p-4 rounded-2xl border ${
                  isSelected
                    ? 'border-[#ee237c] bg-pink-50/60 shadow-xs'
                    : 'border-slate-200 bg-slate-50/60 active:bg-slate-100'
                }`}
              >
                <View
                  className={`w-9 h-9 rounded-2xl items-center justify-center mr-3 ${
                    isSelected ? 'bg-pink-100' : 'bg-slate-200'
                  }`}
                >
                  <HugeiconsIcon
                    icon={option.icon}
                    size={20}
                    color={isSelected ? '#ee237c' : Colors.light.textSecondary}
                  />
                </View>

                <Text
                  className={`text-base flex-1 ${
                    isSelected ? 'font-black text-slate-900' : 'text-slate-700 font-bold'
                  }`}
                >
                  {option.label}
                </Text>

                {isSelected ? (
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color="#ee237c" />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* Bottom Done Button */}
        <View
          className="left-4 right-4 absolute bg-white p-3 border-t border-slate-100 rounded-t-2xl shadow-lg"
          style={{ bottom: Math.max(insets.bottom, 16) }}
        >
          <Pressable
            onPress={onClose}
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
              {t('done')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
