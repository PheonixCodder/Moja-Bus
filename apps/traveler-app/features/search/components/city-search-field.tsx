import React from 'react';
import { View, Text, TextInput, Modal, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Search01Icon, Cancel01Icon, Location01Icon } from '@hugeicons/core-free-icons';
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

export function CitySearchField({ visible, onClose, onSelect, query, setQuery }: CitySearchFieldProps) {
  const { t } = useTranslation("search");
  const { cities, isLoading, isSearchable } = useSearchCities(query);
  const insets = useSafeAreaInsets();

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View className="flex-1 bg-white" style={{ paddingTop: Math.max(insets.top, 12) }}>
        <View className="flex-row items-center p-4 border-b border-slate-200">
          <View className="flex-1 flex-row items-center bg-slate-100 rounded-xl px-3 py-2 mr-3">
            <HugeiconsIcon icon={Search01Icon} size={20} color={Colors.light.textSecondary} />
            <TextInput
              className="flex-1 ml-2 text-base text-slate-900 font-medium"
              placeholder={t("fromPlaceholder")}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')}>
                <HugeiconsIcon icon={Cancel01Icon} size={20} color={Colors.light.textSecondary} />
              </Pressable>
            )}
          </View>
          <Pressable onPress={onClose}>
            <Text className="text-slate-600 font-bold text-base">{t("close")}</Text>
          </Pressable>
        </View>

        <FlatList
          data={cities}
          keyExtractor={(item) => `${item.id}-${item.municipalityId ?? ''}-${item.quarterId ?? ''}`}
          renderItem={({ item }) => (
            <Pressable
              className="flex-row items-center p-4 border-b border-slate-100 active:bg-pink-50"
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
              <HugeiconsIcon icon={Location01Icon} size={20} color="#ee237c" className="mr-3" />
              <View className="flex-1">
                <Text className="text-base text-slate-900 font-bold">{item.hierarchyLabel ?? item.name}</Text>
              </View>
              {item.isMajorHub && (
                <View className="bg-pink-100 px-2.5 py-1 rounded-full">
                  <Text className="text-[#ee237c] text-xs font-bold">{t("majorHub")}</Text>
                </View>
              )}
            </Pressable>
          )}
          ListEmptyComponent={() => (
            <View className="p-8 items-center">
              <Text className="text-slate-500 text-center font-medium">
                {isSearchable ? (isLoading ? t("loading") : t("noCitiesFound")) : t("fromPlaceholder")}
              </Text>
            </View>
          )}
        />
      </View>
    </Modal>
  );
}
