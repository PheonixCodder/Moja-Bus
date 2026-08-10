import React from 'react';
import { View, Text, Modal, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Cancel01Icon, Money01Icon, FastForwardIcon, Clock01Icon } from '@hugeicons/core-free-icons';
import { Colors } from '@moja/theme/tokens';
import type { SortKey } from '../types';

interface SortSheetProps {
  visible: boolean;
  onClose: () => void;
  selectedSort: SortKey;
  onSelectSort: (sort: SortKey) => void;
}

export function SortSheet({ visible, onClose, selectedSort, onSelectSort }: SortSheetProps) {
  const { t } = useTranslation("search");
  const insets = useSafeAreaInsets();

  const options: { value: SortKey; label: string; icon: any }[] = [
    { value: 'CHEAPEST', label: t("sortCheapest"), icon: Money01Icon },
    { value: 'FASTEST', label: t("sortFastest"), icon: FastForwardIcon },
    { value: 'EARLIEST', label: t("sortEarliest"), icon: Clock01Icon },
    { value: 'LATEST', label: t("sortLatest"), icon: Clock01Icon },
  ];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white" style={{ paddingTop: Math.max(insets.top, 12) }}>
        <View className="flex-row items-center justify-between p-4 border-b border-slate-100">
          <Text className="text-lg font-bold text-slate-900">{t("sortLabel")}</Text>
          <Pressable onPress={onClose} className="p-2 bg-slate-100 rounded-full">
            <HugeiconsIcon icon={Cancel01Icon} size={18} color={Colors.light.textSecondary} />
          </Pressable>
        </View>

        <View className="p-4">
          {options.map((option) => {
            const isSelected = selectedSort === option.value;
            return (
              <Pressable
                key={option.value}
                onPress={() => onSelectSort(option.value)}
                className={`flex-row items-center p-4 mb-3 rounded-xl border-2
                  ${isSelected ? 'border-[#ee237c] bg-pink-50' : 'border-slate-100 bg-white'}
                `}
              >
                <HugeiconsIcon icon={option.icon} size={22} color={isSelected ? '#ee237c' : Colors.light.textSecondary} className="mr-3" />
                <Text className={`text-base flex-1 ${isSelected ? 'font-bold text-[#ee237c]' : 'text-slate-700 font-medium'}`}>
                  {option.label}
                </Text>
                <View className={`w-5 h-5 rounded-full border-2 items-center justify-center
                  ${isSelected ? 'border-[#ee237c]' : 'border-slate-300'}
                `}>
                  {isSelected && <View className="w-2.5 h-2.5 rounded-full bg-[#ee237c]" />}
                </View>
              </Pressable>
            );
          })}
        </View>

        <View className="left-4 right-4 absolute" style={{ bottom: Math.max(insets.bottom, 24) }}>
          <Pressable onPress={onClose} className="bg-[#ee237c] p-4 rounded-xl items-center shadow-md shadow-pink-500/20 active:bg-pink-700">
            <Text className="text-white font-bold text-base">{t("done")}</Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
