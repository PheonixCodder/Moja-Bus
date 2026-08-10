import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Bus01Icon, LocationOffline01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { Colors } from '@moja/theme/tokens';
import type { CityValue } from '../types';

interface SearchEmptyStateProps {
  isPreSearch: boolean;
  onPopularRouteSelect?: (origin: CityValue, dest: CityValue) => void;
  onResetFilters?: () => void;
}

export function SearchEmptyState({ isPreSearch, onPopularRouteSelect, onResetFilters }: SearchEmptyStateProps) {
  const { t } = useTranslation("search");

  if (isPreSearch) {
    const popularRoutes = [
      {
        origin: { id: 'Abidjan', text: 'Abidjan' },
        dest: { id: 'Bouaké', text: 'Bouaké' },
      },
      {
        origin: { id: 'Abidjan', text: 'Abidjan' },
        dest: { id: 'Yamoussoukro', text: 'Yamoussoukro' },
      },
      {
        origin: { id: 'San-Pédro', text: 'San-Pédro' },
        dest: { id: 'Abidjan', text: 'Abidjan' },
      },
      {
        origin: { id: 'Korhogo', text: 'Korhogo' },
        dest: { id: 'Abidjan', text: 'Abidjan' },
      },
    ];

    return (
      <View className="flex-1 items-center justify-center p-6 mt-6">
        <View className="bg-pink-50 p-5 rounded-full mb-4 border border-pink-100">
          <HugeiconsIcon icon={Bus01Icon} size={40} color="#ee237c" />
        </View>
        <Text className="text-xl font-extrabold text-slate-900 mb-1 text-center">
          {t("emptyTitle")}
        </Text>
        <Text className="text-sm text-slate-500 text-center mb-6 px-4">
          {t("emptySubtitle")}
        </Text>

        <View className="w-full">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3">
            {t("popularRoutes")}
          </Text>
          {popularRoutes.map((route, idx) => (
            <Pressable
              key={idx}
              onPress={() => onPopularRouteSelect?.(route.origin, route.dest)}
              className="flex-row items-center justify-between bg-white border border-slate-200 p-4 rounded-xl mb-2.5 shadow-xs active:bg-pink-50"
            >
              <Text className="text-sm font-bold text-slate-800">{route.origin.text}</Text>
              <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="#ee237c" />
              <Text className="text-sm font-bold text-slate-800">{route.dest.text}</Text>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  return (
    <View className="flex-1 items-center justify-center p-6 mt-8">
      <View className="bg-slate-100 p-5 rounded-full mb-4">
        <HugeiconsIcon icon={LocationOffline01Icon} size={40} color={Colors.light.textSecondary} />
      </View>
      <Text className="text-xl font-extrabold text-slate-900 mb-1 text-center">
        {t("noResultsTitle")}
      </Text>
      <Text className="text-sm text-slate-500 text-center mb-6 max-w-xs">
        {t("noResultsDesc")}
      </Text>
      
      {onResetFilters && (
        <Pressable
          onPress={onResetFilters}
          className="border-2 border-slate-200 px-6 py-3 rounded-full active:bg-slate-50"
        >
          <Text className="text-slate-700 font-bold text-sm">{t("resetFilters")}</Text>
        </Pressable>
      )}
    </View>
  );
}
