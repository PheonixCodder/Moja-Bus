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
      <View className="flex-row items-center bg-white border border-slate-200 rounded-2xl px-3 gap-2 mb-3" style={{ height: 48 }}>
        <HugeiconsIcon icon={Search01Icon} size={18} color="#94a3b8" />
        <TextInput
          value={search}
          onChangeText={setSearch}
          placeholder={t('searchPlaceholder')}
          placeholderTextColor="#94a3b8"
          className="flex-1 text-sm font-medium text-slate-800"
          autoCorrect={false}
          autoCapitalize="none"
          returnKeyType="search"
          style={{ height: 48 }}
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
              className={`will-change-pressable px-4 py-2 rounded-full border ${
                active
                  ? 'bg-[#ee237c] border-[#ee237c]'
                  : 'bg-white border-slate-200 active:bg-slate-50'
              }`}
            >
              <Text
                className={`text-xs font-bold ${
                  active ? 'text-white' : 'text-slate-600'
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
    <View style={{ flex: 1, backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <View
        style={{ paddingTop: insets.top }}
        className="bg-slate-900 px-4 pb-4"
      >
        <View className="flex-row items-center gap-3 mt-3">
          <Pressable
            onPress={() => router.back()}
            className="will-change-pressable w-9 h-9 rounded-full bg-white/10 items-center justify-center active:bg-white/20"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color="#fff" />
          </Pressable>
          <Text className="text-white font-black text-lg flex-1">{t('listTitle')}</Text>
        </View>
      </View>

      {/* List */}
      {isLoading ? (
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color="#ee237c" size="large" />
        </View>
      ) : (
        <FlatList
          data={filtered}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={ListHeader}
          ListEmptyComponent={
            <View className="items-center py-20">
              <View className="w-16 h-16 bg-slate-100 rounded-3xl items-center justify-center mb-4">
                <HugeiconsIcon icon={Bus01Icon} size={28} color="#cbd5e1" />
              </View>
              <Text className="text-slate-500 font-semibold text-sm">
                {search.trim() ? t('noResults') : t('emptyTitle')}
              </Text>
              {!search.trim() && (
                <Text className="text-slate-400 text-xs mt-1">{t('emptyDesc')}</Text>
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
