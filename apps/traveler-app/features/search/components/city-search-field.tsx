import React from 'react';
import { View, Text, TextInput, Modal, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Search01Icon, Cancel01Icon, Location01Icon, Navigation01Icon } from '@hugeicons/core-free-icons';
import { Colors } from '@moja/theme/tokens';
import { useSearchCities } from '../hooks/use-search-cities';
import type { CityValue } from '../types';

interface CitySearchFieldProps {
  visible: boolean;
  onClose: () => void;
  onSelect: (city: CityValue) => void;
  query: string;
  setQuery: (q: string) => void;
}

export function CitySearchField({
  visible,
  onClose,
  onSelect,
  query,
  setQuery,
}: CitySearchFieldProps) {
  const { t } = useTranslation('search');
  const { cities, isLoading, isSearchable } = useSearchCities(query);
  const insets = useSafeAreaInsets();

  const popularCities: CityValue[] = [
    { id: 'Abidjan', text: 'Abidjan (All Hubs)' },
    { id: 'Bouaké', text: 'Bouaké' },
    { id: 'Yamoussoukro', text: 'Yamoussoukro' },
    { id: 'San-Pédro', text: 'San-Pédro' },
    { id: 'Korhogo', text: 'Korhogo' },
  ];

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View className="flex-1 bg-white" style={{ paddingTop: Math.max(insets.top, 12) }}>
        {/* Header Search Input */}
        <View className="flex-row items-center p-4 border-b border-slate-100 gap-3">
          <View className="flex-1 flex-row items-center bg-slate-100/80 border border-slate-200/60 rounded-2xl px-3.5 py-3">
            <HugeiconsIcon icon={Search01Icon} size={18} color={Colors.light.textSecondary} />
            <TextInput
              className="flex-1 ml-2.5 text-base text-slate-900 font-extrabold"
              placeholder={t('fromPlaceholder')}
              placeholderTextColor={Colors.light.textSecondary}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} className="p-1">
                <HugeiconsIcon icon={Cancel01Icon} size={16} color={Colors.light.textSecondary} />
              </Pressable>
            )}
          </View>
          <Pressable onPress={onClose} className="py-2 px-1">
            <Text className="text-slate-600 font-bold text-sm">{t('close')}</Text>
          </Pressable>
        </View>

        {/* Quick Select Popular Cities Chips when query is empty */}
        {query.trim().length === 0 ? (
          <View className="p-4 border-b border-slate-100 bg-slate-50/50">
            <Text className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2.5">
              Popular Hubs
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {popularCities.map((city) => (
                <Pressable
                  key={city.id}
                  onPress={() => {
                    onSelect(city);
                    onClose();
                  }}
                  className="bg-white border border-slate-200 px-3.5 py-2 rounded-full flex-row items-center shadow-xs active:bg-pink-50"
                >
                  <HugeiconsIcon icon={Navigation01Icon} size={12} color="#ee237c" className="mr-1.5" />
                  <Text className="text-xs font-bold text-slate-800">{city.text}</Text>
                </Pressable>
              ))}
            </View>
          </View>
        ) : null}

        {/* City Results List */}
        <FlatList
          data={cities}
          keyExtractor={(item) =>
            `${item.id}-${item.municipalityId ?? ''}-${item.quarterId ?? ''}`
          }
          renderItem={({ item }) => (
            <Pressable
              className="flex-row items-center p-4 border-b border-slate-100 active:bg-pink-50/60"
              onPress={() => {
                onSelect({
                  id: item.id,
                  text: item.hierarchyLabel ?? item.name,
                  municipalityId: item.municipalityId ?? undefined,
                  quarterId: item.quarterId ?? undefined,
                  level: item.level,
                });
                onClose();
              }}
            >
              <View className="w-9 h-9 rounded-2xl bg-pink-50 border border-pink-100 items-center justify-center mr-3">
                <HugeiconsIcon icon={Location01Icon} size={18} color="#ee237c" />
              </View>
              <View className="flex-1">
                <Text className="text-base text-slate-900 font-extrabold">
                  {item.hierarchyLabel ?? item.name}
                </Text>
                {item.level ? (
                  <Text className="text-[10px] font-bold text-slate-400 capitalize mt-0.5">
                    {item.level}
                  </Text>
                ) : null}
              </View>
              {item.isMajorHub && (
                <View className="bg-pink-50 border border-pink-200 px-2.5 py-1 rounded-full">
                  <Text className="text-[#ee237c] text-[10px] font-extrabold uppercase">
                    {t('majorHub')}
                  </Text>
                </View>
              )}
            </Pressable>
          )}
          ListEmptyComponent={() => (
            <View className="p-8 items-center justify-center">
              <Text className="text-slate-500 text-center font-bold text-sm">
                {isSearchable
                  ? isLoading
                    ? t('loading')
                    : t('noCitiesFound')
                  : t('fromPlaceholder')}
              </Text>
            </View>
          )}
        />
      </View>
    </Modal>
  );
}
