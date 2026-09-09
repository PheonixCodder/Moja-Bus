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
import { Palette } from '@/constants/theme';
import { IconColors } from '@/constants/ui-colors';
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
      <View className="flex-1 bg-background" style={{ paddingTop: Math.max(insets.top, 12) }}>
        {/* Header */}
        <View className="flex-row items-center justify-between p-4 border-b border-border bg-card">
          <View className="flex-row items-center gap-2">
            <View className="w-8 h-8 rounded-full bg-primary/10 border border-primary/20 items-center justify-center">
              <HugeiconsIcon icon={Sorting01Icon} size={16} color={Palette.rose[500]} />
            </View>
            <Text className="text-lg font-extrabold text-foreground">{t('sortLabel')}</Text>
          </View>
          <Pressable onPress={onClose} className="p-2 bg-muted rounded-full">
            <HugeiconsIcon icon={Cancel01Icon} size={18} color={IconColors.secondary} />
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
                    ? 'border-primary bg-primary/10 shadow-xs'
                    : 'border-border bg-muted/40 active:bg-muted'
                }`}
              >
                <View
                  className={`w-9 h-9 rounded-2xl items-center justify-center mr-3 ${
                    isSelected ? 'bg-primary/20' : 'bg-muted'
                  }`}
                >
                  <HugeiconsIcon
                    icon={option.icon}
                    size={20}
                    color={isSelected ? Palette.rose[500] : IconColors.secondary}
                  />
                </View>

                <Text
                  className={`text-base flex-1 ${
                    isSelected ? 'font-black text-foreground' : 'text-muted-foreground font-bold'
                  }`}
                >
                  {option.label}
                </Text>

                {isSelected ? (
                  <HugeiconsIcon icon={CheckmarkCircle01Icon} size={20} color={Palette.rose[500]} />
                ) : null}
              </Pressable>
            );
          })}
        </View>

        {/* Bottom Done Button */}
        <View
          className="left-4 right-4 absolute bg-card p-3 border-t border-border rounded-t-2xl shadow-lg"
          style={{ bottom: Math.max(insets.bottom, 16) }}
        >
          <Pressable
            onPress={onClose}
            className="bg-primary min-h-12 h-12 rounded-xl items-center justify-center shadow-md shadow-primary/25"
            style={({ pressed }) => ({
              opacity: pressed ? 0.85 : 1,
            })}
          >
            <Text className="text-primary-foreground font-black text-base uppercase tracking-wider">
              {t('done')}
            </Text>
          </Pressable>
        </View>
      </View>
    </Modal>
  );
}
