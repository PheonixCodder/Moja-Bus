import React, { useState } from 'react';
import { View, Text, Pressable, Image, ActivityIndicator, ScrollView } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useTRPC } from '@/lib/trpc';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  ArrowLeft01Icon,
  Bus01Icon,
  Location01Icon,
  Calendar01Icon,
} from '@hugeicons/core-free-icons';
import { Palette } from '@/constants/theme';
import { OperatorOverviewTab } from '../components/operator-overview-tab';
import { OperatorRoutesTab } from '../components/operator-routes-tab';
import { OperatorTerminalsTab } from '../components/operator-terminals-tab';
import { OperatorReviewsTab } from '../components/operator-reviews-tab';

type Tab = 'overview' | 'routes' | 'terminals' | 'reviews';

interface OperatorProfileViewProps {
  slug: string;
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

export function OperatorProfileView({ slug }: OperatorProfileViewProps) {
  const { t } = useTranslation('operators');
  const insets = useSafeAreaInsets();
  const trpc = useTRPC() as any;
  const [activeTab, setActiveTab] = useState<Tab>('overview');

  const { data: operatorData, isLoading, error } = useQuery({
    ...trpc.public.getOperator.queryOptions({ slug }),
    staleTime: 10 * 60 * 1000,
  });

  const operator = operatorData as any;

  const TABS: { id: Tab; labelKey: keyof typeof import('../../../locales/en/operators.json') }[] = [
    { id: 'overview', labelKey: 'tabOverview' },
    { id: 'routes', labelKey: 'tabRoutes' },
    { id: 'terminals', labelKey: 'tabTerminals' },
    { id: 'reviews', labelKey: 'tabReviews' },
  ];

  // Loading
  if (isLoading) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        {/* Mini header */}
        <View className="bg-card px-4 pb-4 border-b border-border">
          <View className="flex-row items-center gap-3 mt-3">
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t('back', { defaultValue: 'Back' })}
              className="w-9 h-9 rounded-full bg-muted items-center justify-center min-h-9"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color={Palette.zinc[400]} />
            </Pressable>
          </View>
        </View>
        <View className="flex-1 items-center justify-center">
          <ActivityIndicator color={Palette.rose[500]} size="large" />
          <Text className="text-muted-foreground text-sm mt-3">{t('loading')}</Text>
        </View>
      </View>
    );
  }

  // Error / not found
  if (error || !operator) {
    return (
      <View className="flex-1 bg-background" style={{ paddingTop: insets.top }}>
        <View className="bg-card px-4 pb-4 border-b border-border">
          <View className="flex-row items-center gap-3 mt-3">
            <Pressable
              onPress={() => router.back()}
              accessibilityRole="button"
              accessibilityLabel={t('back', { defaultValue: 'Back' })}
              className="w-9 h-9 rounded-full bg-muted items-center justify-center min-h-9"
            >
              <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color={Palette.zinc[400]} />
            </Pressable>
          </View>
        </View>
        <View className="flex-1 items-center justify-center px-8">
          <View className="w-20 h-20 bg-muted rounded-3xl items-center justify-center mb-6">
            <HugeiconsIcon icon={Bus01Icon} size={36} color={Palette.zinc[400]} />
          </View>
          <Text className="text-xl font-bold text-foreground text-center mb-2">
            {t('notFoundTitle')}
          </Text>
          <Text className="text-sm text-muted-foreground text-center mb-8">
            {t('notFoundDesc')}
          </Text>
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            className="bg-primary px-6 py-3 rounded-2xl active:opacity-90 min-h-11 items-center justify-center shadow-sm"
          >
            <Text className="text-primary-foreground font-bold text-sm">{t('backToOperators')}</Text>
          </Pressable>
        </View>
      </View>
    );
  }

  const initials = getInitials(operator.name);

  return (
    <View className="flex-1 bg-background">
      {/* ── Dark hero header ── */}
      <View style={{ paddingTop: insets.top }} className="bg-zinc-950 dark:bg-card border-b border-border">
        <View className="px-4 pt-3 pb-4">
          {/* Back button */}
          <Pressable
            onPress={() => router.back()}
            accessibilityRole="button"
            accessibilityLabel={t('back', { defaultValue: 'Back' })}
            className="w-9 h-9 rounded-full bg-white/10 items-center justify-center mb-4 active:bg-white/20 min-h-9"
          >
            <HugeiconsIcon icon={ArrowLeft01Icon} size={18} color={Palette.zinc[50]} />
          </Pressable>

          {/* Logo + Name row */}
          <View className="flex-row items-start gap-4 mb-4">
            <View className="w-16 h-16 rounded-2xl bg-white overflow-hidden items-center justify-center shrink-0">
              {operator.logoUrl ? (
                <Image
                  source={{ uri: operator.logoUrl }}
                  style={{ width: 64, height: 64 }}
                  resizeMode="cover"
                />
              ) : (
                <Text className="text-xl font-black text-zinc-400">{initials}</Text>
              )}
            </View>
            <View className="flex-1">
              <Text className="text-white font-black text-xl leading-tight mb-1">
                {operator.name}
              </Text>
              {operator.description ? (
                <Text className="text-zinc-400 text-xs leading-relaxed" numberOfLines={2}>
                  {operator.description}
                </Text>
              ) : null}
            </View>
          </View>

          {/* Stats strip */}
          <View className="flex-row gap-4 mb-4">
            <View className="flex-row items-center gap-1.5">
              <HugeiconsIcon icon={Bus01Icon} size={13} color={Palette.rose[500]} />
              <Text className="text-white text-xs font-bold">{operator._count.routes}</Text>
              <Text className="text-zinc-400 text-xs">{t('activeRoutes')}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <HugeiconsIcon icon={Bus01Icon} size={13} color={Palette.zinc[400]} />
              <Text className="text-white text-xs font-bold">{operator._count.fleet}</Text>
              <Text className="text-zinc-400 text-xs">{t('activeBuses')}</Text>
            </View>
            <View className="flex-row items-center gap-1.5">
              <HugeiconsIcon icon={Location01Icon} size={13} color={Palette.zinc[400]} />
              <Text className="text-white text-xs font-bold">{operator.locations.length}</Text>
              <Text className="text-zinc-400 text-xs">{t('terminals')}</Text>
            </View>
            {operator.yearEstablished ? (
              <View className="flex-row items-center gap-1.5">
                <HugeiconsIcon icon={Calendar01Icon} size={13} color={Palette.zinc[400]} />
                <Text className="text-zinc-400 text-xs">
                  {t('est', { year: String(operator.yearEstablished) })}
                </Text>
              </View>
            ) : null}
          </View>
        </View>

        {/* Tab bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{ paddingHorizontal: 16, gap: 4 }}
          className="border-t border-white/10"
        >
          {TABS.map((tab) => {
            const active = activeTab === tab.id;
            const count =
              tab.id === 'routes'
                ? operator.routes.length
                : tab.id === 'terminals'
                  ? operator.locations.length
                  : undefined;

            return (
              <Pressable
                key={tab.id}
                onPress={() => setActiveTab(tab.id)}
                accessibilityRole="button"
                className={`flex-row items-center gap-1.5 px-4 py-3 border-b-2 ${
                  active ? 'border-primary' : 'border-transparent'
                }`}
              >
                <Text
                  className={`text-sm font-bold ${
                    active ? 'text-white' : 'text-zinc-400'
                  }`}
                >
                  {t(tab.labelKey)}
                </Text>
                {count !== undefined && (
                  <View
                    className={`w-5 h-5 rounded-full items-center justify-center ${
                      active ? 'bg-primary' : 'bg-white/10'
                    }`}
                  >
                    <Text
                      className={`text-xs font-black ${
                        active ? 'text-white' : 'text-zinc-400'
                      }`}
                    >
                      {count}
                    </Text>
                  </View>
                )}
              </Pressable>
            );
          })}
        </ScrollView>
      </View>

      {/* ── Tab Content ── */}
      <View style={{ flex: 1 }}>
        {activeTab === 'overview' && (
          <OperatorOverviewTab
            description={operator.description}
            phone={operator.phone}
            email={operator.email}
            website={operator.website}
            yearEstablished={operator.yearEstablished}
            routes={operator.routes}
            locations={operator.locations}
            operatorId={operator.id}
            operatorName={operator.name}
            onTabChange={(tab) => setActiveTab(tab)}
          />
        )}
        {activeTab === 'routes' && (
          <OperatorRoutesTab
            routes={operator.routes}
            operatorId={operator.id}
            operatorName={operator.name}
          />
        )}
        {activeTab === 'terminals' && (
          <OperatorTerminalsTab terminals={operator.locations} />
        )}
        {activeTab === 'reviews' && <OperatorReviewsTab />}
      </View>
    </View>
  );
}
