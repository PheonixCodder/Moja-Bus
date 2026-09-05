import React, { useState, useMemo, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useTRPC } from '@/lib/trpc';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowLeft01Icon, Search01Icon, Bus01Icon } from '@hugeicons/core-free-icons';
import { Palette } from '@/constants/theme';
import { OperatorCard, type OperatorCardItem } from '../components/operator-card';

type SortKey = 'all' | 'routes' | 'buses';

export function OperatorsListView() {
  const { t } = useTranslation('operators');
  const insets = useSafeAreaInsets();
  const trpc = useTRPC() as any;

  const { data: operators, isLoading } = useQuery({
    ...trpc.public.listOperators.queryOptions(),
    staleTime: 10 * 60 * 1000,
  });

  const [search, setSearch] = useState('');
  const [sort, setSort] = useState<SortKey>('all');

  const SORT_OPTIONS: { key: SortKey; label: string }[] = [
    { key: 'all', label: t('sortAll') },
    { key: 'routes', label: t('sortMostRoutes') },
    { key: 'buses', label: t('sortMostBuses') },
  ];

  const filtered = useMemo<OperatorCardItem[]>(() => {
    if (!operators) return [];
    let list: OperatorCardItem[] = operators as OperatorCardItem[];

    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(
        (op) =>
          op.name.toLowerCase().includes(q) ||
          op.cityNames.some((c) => c.toLowerCase().includes(q)),
      );
    }

    if (sort === 'routes') return [...list].sort((a, b) => b._count.routes - a._count.routes);
    if (sort === 'buses') return [...list].sort((a, b) => b._count.fleet - a._count.fleet);
    return list;
  }, [operators, search, sort]);

  const renderItem = useCallback(
    ({ item }: { item: OperatorCardItem }) => (
      <OperatorCard operator={item} variant="list" />
    ),
    [],
  );

  const ListHeader = (
    <>
      {/* Search input */}
      <View className="flex-row items-center bg-card border border-border rounded-2xl px-3 gap-2 mb-3 min-h-12">
        <HugeiconsIcon icon={Search01Icon} size={18} color={Palette.zinc[400]} />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor={Palette.zinc[400]}
          className="flex-1 text-sm font-medium text-foreground min-h-12"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
        />
      </View>

      {/* Sort chips */}
      <View className="flex-row gap-2 mb-4">
        {SORT_OPTIONS.map((opt) => {
          const active = sort === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setSort(opt.key)}
              accessibilityRole="button"
              className={`px-4 py-2 rounded-full border min-h-9 justify-center ${
                active
                  ? 'bg-primary border-primary'
                  : 'bg-card border-border active:bg-muted'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  active ? 'text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </>
  );

  return (
    <View className="flex-1 bg-background">
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-zinc-950 dark:bg-card border-b border-border px-4 pb-4"
      >
        <View className="flex-row items-center gap-3 mt-3">
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('back', { defaultValue: 'Back' })}
            className="w-9 h-9 rounded-full bg-white/10 items-center justify-center active:bg-white/20 min-h-9"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color={Palette.zinc[50]} />
          </Pressable>
          <Text className="text-white font-black text-lg flex-1">{t('listTitle')}</Text>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Palette.rose[500]} size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View className="items-center py-20">
              <View className="w-16 h-16 bg-muted rounded-3xl items-center justify-center mb-4">
                <HugeiconsIcon icon={Bus01Icon} size={28} color={Palette.zinc[400]} />
              </View>
              <Text className="text-foreground font-semibold text-sm">
                {search.trim() ? t('noResults') : t('emptyTitle')}
              </Text>
              {!search.trim() && (
                <Text className="text-muted-foreground text-xs mt-1">{t('emptyDesc')}</Text>
              )}
            </View>
          }
          contentContainerStyle={{
            padding: 16,
            paddingBottom: insets.bottom + 32,
            gap: 12,
          }}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}
