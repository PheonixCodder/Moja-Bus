import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowRight01Icon, Bus01Icon, Location01Icon, Calendar01Icon } from '@hugeicons/core-free-icons';

interface RoutePreviewItem {
  id: string;
  name: string;
  originTerminal: {
    city?: string | null;
    cityRelation?: { id: string; name: string } | null;
  };
  destTerminal: {
    city?: string | null;
    cityRelation?: { id: string; name: string } | null;
  };
  schedules: Array<{
    fares: Array<{ priceXOF: number }>;
  }>;
}

interface OperatorOverviewTabProps {
  description?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  yearEstablished?: number | null;
  routes: RoutePreviewItem[];
  locations: Array<{ id: string }>;
  operatorId: string;
  operatorName: string;
  onTabChange: (tab: 'routes' | 'terminals') => void;
}

export function OperatorOverviewTab({
  description,
  phone,
  email,
  website,
  yearEstablished,
  routes,
  locations,
  operatorId,
  operatorName,
  onTabChange,
}: OperatorOverviewTabProps) {
  const { t } = useTranslation('operators');

  const handleBookTrip = () => {
    router.push({
      pathname: '/(tabs)/search',
      params: { operatorId, operatorName },
    });
  };

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: 40 }}
    >
      {/* Description */}
      {description ? (
        <View className="bg-white border border-slate-100 rounded-2xl p-4">
          <Text className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">
            {t('aboutHeading')}
          </Text>
          <Text className="text-sm text-slate-600 leading-relaxed">{description}</Text>
        </View>
      ) : null}

      {/* Quick stats */}
      <View className="flex-row gap-3">
        <Pressable
          onPress={() => onTabChange('routes')}
          className="will-change-pressable flex-1 bg-white border border-slate-100 rounded-2xl p-4 items-center gap-1 active:bg-slate-50"
        >
          <HugeiconsIcon icon={Bus01Icon} size={20} color="#ee237c" />
          <Text className="text-2xl font-black text-slate-900">{routes.length}</Text>
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
            {t('activeRoutes')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onTabChange('terminals')}
          className="will-change-pressable flex-1 bg-[#ffffff] border border-slate-100 rounded-2xl p-4 items-center gap-1 active:bg-slate-50"
        >
          <HugeiconsIcon icon={Location01Icon} size={20} color="#ee237c" />
          <Text className="text-2xl font-black text-slate-900">{locations.length}</Text>
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
            {t('terminals')}
          </Text>
        </Pressable>
        {yearEstablished ? (
          <View className="flex-1 bg-white border border-slate-100 rounded-2xl p-4 items-center gap-1">
            <HugeiconsIcon icon={Calendar01Icon} size={20} color="#94a3b8" />
            <Text className="text-xl font-black text-slate-900">{yearEstablished}</Text>
            <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider text-center">
              {t('est', { year: String(yearEstablished) })}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Quick routes preview */}
      {routes.length > 0 && (
        <View className="bg-white border border-slate-100 rounded-2xl overflow-hidden">
          <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
            <Text className="text-xs font-black text-slate-400 uppercase tracking-widest">
              {t('tabRoutes')}
            </Text>
            <Pressable onPress={() => onTabChange('routes')} className="will-change-pressable flex-row items-center gap-1">
              <Text className="text-xs font-bold text-[#ee237c]">{t('viewAllRoutes')}</Text>
              <HugeiconsIcon icon={ArrowRight01Icon} size={12} color="#ee237c" />
            </Pressable>
          </View>
          {routes.slice(0, 3).map((route, idx) => {
            const originCity = route.originTerminal.cityRelation?.name ?? route.originTerminal.city ?? '';
            const destCity = route.destTerminal.cityRelation?.name ?? route.destTerminal.city ?? '';
            const minFare = route.schedules
              .flatMap((s) => s.fares)
              .sort((a, b) => a.priceXOF - b.priceXOF)[0];

            return (
              <View
                key={route.id}
                className={`flex-row items-center justify-between px-4 py-3 ${idx < routes.slice(0, 3).length - 1 ? 'border-b border-slate-50' : ''}`}
              >
                <Text className="text-sm font-semibold text-slate-800 flex-1">
                  {originCity} → {destCity}
                </Text>
                {minFare ? (
                  <Text className="text-xs font-bold text-[#ee237c]">
                    {t('fromPrice')} {minFare.priceXOF.toLocaleString()}
                  </Text>
                ) : null}
              </View>
            );
          })}
        </View>
      )}

      {/* Book trip CTA */}
      <Pressable
        onPress={handleBookTrip}
        className="will-change-pressable bg-[#ee237c] rounded-2xl p-4 flex-row items-center justify-center gap-2 active:bg-[#d01867]"
        style={{ shadowColor: '#ee237c', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.25, shadowRadius: 12, elevation: 6 }}
      >
        <Text className="text-white font-black text-sm uppercase tracking-wider">{t('bookTrip')}</Text>
        <HugeiconsIcon icon={ArrowRight01Icon} size={16} color="#fff" />
      </Pressable>
    </ScrollView>
  );
}
