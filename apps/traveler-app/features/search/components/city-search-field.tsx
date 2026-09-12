import React from 'react';
import { View, Text, TextInput, Modal, FlatList, Pressable } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Search01Icon, Cancel01Icon, Location01Icon, Navigation01Icon, Bus01Icon } from '@hugeicons/core-free-icons';
import { Colors, Palette } from '@/constants/theme';
import { IconColors } from '@/constants/ui-colors';
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
      <View className="flex-1 bg-background" style={{ paddingTop: Math.max(insets.top, 12) }}>
        {/* Header Search Input */}
        <View className="flex-row items-center p-4 border-b border-border gap-3">
          <View className="flex-1 flex-row items-center bg-muted/60 border border-border rounded-2xl px-3.5 py-3">
            <HugeiconsIcon icon={Search01Icon} size={18} color={IconColors.secondary} />
            <TextInput
              className="flex-1 ml-2.5 text-base text-foreground font-extrabold"
              placeholder={t('fromPlaceholder')}
              placeholderTextColor={IconColors.secondary}
              value={query}
              onChangeText={setQuery}
              autoFocus
            />
            {query.length > 0 && (
              <Pressable onPress={() => setQuery('')} className="p-1">
                <HugeiconsIcon icon={Cancel01Icon} size={16} color={IconColors.secondary} />
              </Pressable>
            )}
          </View>
          <Pressable onPress={onClose} className="py-2 px-1">
            <Text className="text-muted-foreground font-bold text-sm">{t('close')}</Text>
          </Pressable>
        </View>

        {/* Quick Select Popular Cities Chips when query is empty */}
        {query.trim().length === 0 ? (
          <View className="p-4 border-b border-border bg-muted/30">
            <Text className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2.5">
              {t('popularHubs')}
            </Text>
            <View className="flex-row flex-wrap gap-2">
              {popularCities.map((city) => (
                <Pressable
                  key={city.id}
                  onPress={() => {
                    onSelect(city);
                    onClose();
                  }}
                  className="bg-card border border-border px-3.5 py-2 rounded-full flex-row items-center shadow-xs active:bg-primary/10"
                >
                  <HugeiconsIcon icon={Navigation01Icon} size={12} color={Palette.rose[500]} className="mr-1.5" />
                  <Text className="text-xs font-bold text-foreground">{city.text}</Text>
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
              className="flex-row items-center p-4 border-b border-border active:bg-muted"
              onPress={() => {
                onSelect({
                  id: item.id,
                  text: item.hierarchyLabel ?? item.name,
                  municipalityId: item.municipalityId ?? undefined,
                  quarterId: item.quarterId ?? undefined,
                  level: item.level,
                  terminalId: item.terminalId ?? undefined,
                  companyName: item.companyName ?? undefined,
                  companyId: item.companyId ?? undefined,
                });
                onClose();
              }}
            >
              <View className="w-9 h-9 rounded-2xl bg-primary/10 border border-primary/20 items-center justify-center mr-3">
                {item.level === 'terminal' ? (
                  <HugeiconsIcon icon={Bus01Icon} size={18} color={Palette.rose[500]} />
                ) : (
                  <HugeiconsIcon icon={Location01Icon} size={18} color={Palette.rose[500]} />
                )}
              </View>
              <View className="flex-1">
                <Text className="text-base text-foreground font-extrabold">
                  {item.hierarchyLabel ?? item.name}
                </Text>
                <View className="flex-row items-center gap-1.5 mt-0.5">
                  {item.level ? (
                    <Text className="text-xs font-bold text-muted-foreground capitalize">
                      {item.level}
                    </Text>
                  ) : null}
                  {item.level === 'terminal' && item.companyName ? (
                    <View className="bg-muted rounded-full px-2 py-0.5">
                      <Text className="text-[11px] font-bold text-muted-foreground">
                        {item.companyName}
                      </Text>
                    </View>
                  ) : null}
                </View>
              </View>
              {item.isMajorHub && (
                <View className="bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full">
                  <Text className="text-primary text-xs font-extrabold uppercase">
                    {t('majorHub')}
                  </Text>
                </View>
              )}
            </Pressable>
          )}
          ListEmptyComponent={() => (
            <View className="p-8 items-center justify-center">
              <Text className="text-muted-foreground text-center font-bold text-sm">
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
