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
import { Colors } from '@moja/theme/tokens';
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
  const { t } = useTranslation('search');

  if (isPreSearch) {
    return (
      <View style={{ flex: 1, paddingTop: 28 }}>
        {/* Hero */}
        <View style={{ alignItems: 'center', marginBottom: 32, paddingHorizontal: 24 }}>
          <View
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              backgroundColor: '#fce7f3',
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 16,
              borderWidth: 1,
              borderColor: '#fbcfe8',
            }}
          >
            <HugeiconsIcon icon={Bus01Icon} size={34} color="#ee237c" />
          </View>
          <Text
            style={{
              fontSize: 22,
              fontWeight: '900',
              color: '#0f172a',
              textAlign: 'center',
              lineHeight: 28,
              marginBottom: 6,
            }}
          >
            {t('emptyTitle')}
          </Text>
          <Text
            style={{
              fontSize: 14,
              color: '#94a3b8',
              textAlign: 'center',
              lineHeight: 20,
              maxWidth: 280,
            }}
          >
            {t('emptySubtitle')}
          </Text>
        </View>

        {/* Section label */}
        <Text
          style={{
            fontSize: 10,
            fontWeight: '900',
            color: '#94a3b8',
            textTransform: 'uppercase',
            letterSpacing: 2,
            marginBottom: 14,
            paddingHorizontal: 20,
          }}
        >
          {t('popularRoutes')}
        </Text>

        {/* Horizontal scroll chips */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 20, gap: 10, paddingBottom: 4 }}
          style={{ marginBottom: 20 }}
        >
          {POPULAR_ROUTES.map((route, idx) => (
            <Pressable
              key={idx}
              onPress={() => onPopularRouteSelect?.(route.origin, route.dest)}
              className="will-change-pressable"
              style={{
                backgroundColor: '#fff',
                borderRadius: 20,
                borderWidth: 1.5,
                borderColor: '#f1f5f9',
                paddingHorizontal: 16,
                paddingVertical: 12,
                minWidth: 160,
                shadowColor: '#000',
                shadowOffset: { width: 0, height: 2 },
                shadowOpacity: 0.05,
                shadowRadius: 6,
                elevation: 1,
              }}
            >
              {/* Cities row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 8 }}>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#0f172a', flex: 1 }} numberOfLines={1}>
                  {route.origin.text}
                </Text>
                <View
                  style={{
                    width: 20,
                    height: 20,
                    borderRadius: 10,
                    backgroundColor: '#fce7f3',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={10} color="#ee237c" />
                </View>
                <Text style={{ fontSize: 13, fontWeight: '800', color: '#0f172a', flex: 1, textAlign: 'right' }} numberOfLines={1}>
                  {route.dest.text}
                </Text>
              </View>

              {/* Meta row */}
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  <HugeiconsIcon icon={Clock01Icon} size={10} color="#94a3b8" />
                  <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600' }}>{route.duration}</Text>
                </View>
                <View
                  style={{
                    backgroundColor: '#f0fdf4',
                    borderRadius: 8,
                    paddingHorizontal: 7,
                    paddingVertical: 3,
                    borderWidth: 1,
                    borderColor: '#bbf7d0',
                  }}
                >
                  <Text style={{ fontSize: 10, fontWeight: '800', color: '#15803d' }}>
                    From {route.fromXOF} XOF
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>

        {/* Vertical list (secondary) */}
        <View style={{ paddingHorizontal: 16 }}>
          {POPULAR_ROUTES.slice(0, 4).map((route, idx) => (
            <Pressable
              key={idx}
              onPress={() => onPopularRouteSelect?.(route.origin, route.dest)}
              className="will-change-pressable"
              style={{
                flexDirection: 'row',
                alignItems: 'center',
                backgroundColor: '#fff',
                borderRadius: 14,
                borderWidth: 1,
                borderColor: '#f1f5f9',
                paddingHorizontal: 16,
                paddingVertical: 13,
                marginBottom: 8,
              }}
            >
              {/* Origin */}
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>{route.origin.text}</Text>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 2 }}>
                  <HugeiconsIcon icon={Clock01Icon} size={10} color="#94a3b8" />
                  <Text style={{ fontSize: 11, color: '#94a3b8', fontWeight: '600' }}>{route.duration}</Text>
                </View>
              </View>

              {/* Center arrow */}
              <View style={{ paddingHorizontal: 12 }}>
                <View
                  style={{
                    width: 24,
                    height: 24,
                    borderRadius: 12,
                    backgroundColor: '#fce7f3',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                >
                  <HugeiconsIcon icon={ArrowRight01Icon} size={12} color="#ee237c" />
                </View>
              </View>

              {/* Destination + price */}
              <View style={{ flex: 1, alignItems: 'flex-end' }}>
                <Text style={{ fontSize: 14, fontWeight: '800', color: '#0f172a' }}>{route.dest.text}</Text>
                <Text style={{ fontSize: 11, color: '#15803d', fontWeight: '700', marginTop: 2 }}>
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
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, marginTop: 40 }}>
      <View
        style={{
          width: 68,
          height: 68,
          borderRadius: 20,
          backgroundColor: '#f1f5f9',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: 16,
        }}
      >
        <HugeiconsIcon icon={LocationOffline01Icon} size={32} color={Colors.light.textSecondary} />
      </View>
      <Text style={{ fontSize: 20, fontWeight: '900', color: '#0f172a', marginBottom: 6, textAlign: 'center' }}>
        {t('noResultsTitle')}
      </Text>
      <Text style={{ fontSize: 14, color: '#94a3b8', textAlign: 'center', marginBottom: 24, maxWidth: 280 }}>
        {t('noResultsDesc')}
      </Text>
      {onResetFilters && (
        <Pressable
          onPress={onResetFilters}
          className="will-change-pressable"
          style={{
            borderWidth: 1.5,
            borderColor: '#e2e8f0',
            backgroundColor: '#fff',
            paddingHorizontal: 24,
            paddingVertical: 12,
            borderRadius: 20,
          }}
        >
          <Text style={{ color: '#475569', fontWeight: '700', fontSize: 14 }}>
            {t('resetFilters')}
          </Text>
        </Pressable>
      )}
    </View>
  );
}
