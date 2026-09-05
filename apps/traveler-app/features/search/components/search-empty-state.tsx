import React from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Bus01Icon,
  LocationOffline01Icon,
  ArrowRight01Icon,
  Clock01Icon,
} from '@hugeicons/core-free-icons';
import { Colors, Palette } from '@/constants/theme';
import type { CityValue } from '../types';

interface SearchEmptyStateProps {
  isPreSearch: boolean;
  onPopularRouteSelect?: (origin: CityValue, dest: CityValue) => void;
  onResetFilters?: () => void;
}

const POPULAR_ROUTES = [
  { origin: { id: 'Abidjan', text: 'Abidjan' }, dest: { id: 'Bouaké', text: 'Bouaké' }, duration: '4h 30m', fromXOF: '2 500' },
  { origin: { id: 'Abidjan', text: 'Abidjan' }, dest: { id: 'Yamoussoukro', text: 'Yamoussoukro' }, duration: '3h 00m', fromXOF: '2 000' },
  { origin: { id: 'San-Pédro', text: 'San-Pédro' }, dest: { id: 'Abidjan', text: 'Abidjan' }, duration: '5h 00m', fromXOF: '3 000' },
  { origin: { id: 'Korhogo', text: 'Korhogo' }, dest: { id: 'Abidjan', text: 'Abidjan' }, duration: '7h 30m', fromXOF: '5 500' },
  { origin: { id: 'Abidjan', text: 'Abidjan' }, dest: { id: 'Man', text: 'Man' }, duration: '8h 00m', fromXOF: '6 000' },
  { origin: { id: 'Daloa', text: 'Daloa' }, dest: { id: 'Abidjan', text: 'Abidjan' }, duration: '5h 30m', fromXOF: '4 000' },
];

export function SearchEmptyState({
  isPreSearch,
  onPopularRouteSelect,
  onResetFilters,
}: SearchEmptyStateProps) {
  const { t } = useTranslation(['search', 'operators']);

  if (isPreSearch) {
    return (
      <View className="flex-1 pt-7">
        {/* Hero */}
        <View className="items-center mb-8 px-6">
          <View className="w-18 h-18 rounded-2xl bg-primary/10 border border-primary/20 items-center justify-center mb-4">
            <HugeiconsIcon icon={Bus01Icon} size={34} color={Palette.rose[500]} />
          </View>
          <Text className="text-2xl font-black text-foreground text-center leading-7 mb-1.5">
            {t('emptyTitle')}
          </Text>
          <Text className="text-sm text-muted-foreground text-center leading-5 max-w-[280px]">
            {t('emptySubtitle')}
          </Text>
        </View>

        {/* Section label */}
        <Text className="text-[10px] font-black text-muted-foreground uppercase tracking-widest mb-3.5 px-5">
          {t('popularRoutes')}
        </Text>

        {/* Horizontal scroll chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 4 }}
          className="mb-5"
        >
          {POPULAR_ROUTES.map((route, idx) => (
            <Pressable
              key={idx}
              onPress={() => onPopularRouteSelect?.(route.origin, route.dest)}
              className="bg-card rounded-2xl border border-border px-4 py-3 min-w-[160px] shadow-xs active:bg-muted/60"
            >
              {/* Cities row */}
              <View className="flex-row items-center gap-1.5 mb-2">
                <Text className="text-xs font-extrabold text-card-foreground flex-1" numberOfLines={1}>
                  {route.origin.text}
                </Text>
                <View className="w-5 h-5 rounded-full bg-primary/10 items-center justify-center">
                  <HugeiconsIcon icon={ArrowRight01Icon} size={10} color={Palette.rose[500]} />
                </View>
                <Text className="text-xs font-extrabold text-card-foreground flex-1 text-right" numberOfLines={1}>
                  {route.dest.text}
                </Text>
              </View>

              {/* Meta row */}
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-1">
                  <HugeiconsIcon icon={Clock01Icon} size={10} color={Colors.light.textSecondary} />
                  <Text className="text-[11px] text-muted-foreground font-semibold">{route.duration}</Text>
                </View>
                <View className="bg-success/10 rounded-lg px-2 py-0.5 border border-success/20">
                  <Text className="text-[10px] font-extrabold text-success">
                    {t('operators:fromPrice')} {route.fromXOF} XOF
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Vertical list (secondary) */}
        <View className="px-4">
          {POPULAR_ROUTES.slice(0, 4).map((route, idx) => (
            <Pressable
              key={idx}
              onPress={() => onPopularRouteSelect?.(route.origin, route.dest)}
              className="flex-row items-center bg-card rounded-xl border border-border px-4 py-3 mb-2 active:bg-muted/60"
            >
              {/* Origin */}
              <View className="flex-1">
                <Text className="text-sm font-extrabold text-card-foreground">{route.origin.text}</Text>
                <View className="flex-row items-center gap-1 mt-0.5">
                  <HugeiconsIcon icon={Clock01Icon} size={10} color={Colors.light.textSecondary} />
                  <Text className="text-[11px] text-muted-foreground font-semibold">{route.duration}</Text>
                </View>
              </View>

              {/* Center arrow */}
              <View className="px-3">
                <View className="w-6 h-6 rounded-full bg-primary/10 items-center justify-center">
                  <HugeiconsIcon icon={ArrowRight01Icon} size={12} color={Palette.rose[500]} />
                </View>
              </View>

              {/* Destination + price */}
              <View className="flex-1 items-end">
                <Text className="text-sm font-extrabold text-card-foreground">{route.dest.text}</Text>
                <Text className="text-[11px] text-success font-bold mt-0.5">
                  {route.fromXOF} XOF
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      </View>
    );
  }

  // Post-search no-results state
  return (
    <View className="flex-1 items-center justify-center p-8 mt-10">
      <View className="w-16 h-16 rounded-2xl bg-muted items-center justify-center mb-4">
        <HugeiconsIcon icon={LocationOffline01Icon} size={32} color={Colors.light.textSecondary} />
      </View>
      <Text className="text-xl font-extrabold text-foreground mb-1.5 text-center">
        {t('noResultsTitle')}
      </Text>
      <Text className="text-sm text-muted-foreground text-center mb-6 max-w-[280px] leading-5">
        {t('noResultsDesc')}
      </Text>
      {onResetFilters && (
        <Pressable
          onPress={onResetFilters}
          className="border border-border bg-card px-6 py-3 rounded-2xl active:bg-muted"
        >
          <Text className="text-foreground font-bold text-sm">
            {t('resetFilters')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
