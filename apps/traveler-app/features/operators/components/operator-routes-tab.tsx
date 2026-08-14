import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Clock01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { toLocalISODate } from '@/features/search/lib/format';

interface RouteItem {
  id: string;
  name: string;
  distanceKm?: number | null;
  originTerminal: {
    name: string;
    city?: string | null;
    cityRelation?: { id: string; name: string } | null;
  };
  destTerminal: {
    name: string;
    city?: string | null;
    cityRelation?: { id: string; name: string } | null;
  };
  schedules: Array<{
    id: string;
    departureTime: string;
    fares: Array<{ priceXOF: number }>;
  }>;
}

interface OperatorRoutesTabProps {
  routes: RouteItem[];
  operatorId: string;
  operatorName: string;
}

export function OperatorRoutesTab({ routes, operatorId, operatorName }: OperatorRoutesTabProps) {
  const { t } = useTranslation('operators');

  const handleRoutePress = (route: RouteItem) => {
    const originCityId = route.originTerminal.cityRelation?.id ?? '';
    const originCityName = route.originTerminal.cityRelation?.name ?? route.originTerminal.city ?? '';
    const destCityId = route.destTerminal.cityRelation?.id ?? '';
    const destCityName = route.destTerminal.cityRelation?.name ?? route.destTerminal.city ?? '';

    router.push({
      pathname: '/(tabs)/search',
      params: {
        from: originCityId,
        fromText: originCityName,
        to: destCityId,
        toText: destCityName,
        // operatorId is the company DB ID – used to filter search results
        operatorId,
        operatorName,
        date: toLocalISODate(new Date()),
        passengers: '1',
      },
    });
  };

  if (routes.length === 0) {
    return (
      <View className="flex-1 items-center justify-center py-20">
        <Text className="text-slate-400 text-sm text-center">{t('noRoutes')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
    >
      <Text className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">
        {t('activeRoutesCount_other', { count: routes.length })}
      </Text>
      {routes.map((route) => {
        const originCity = route.originTerminal.cityRelation?.name ?? route.originTerminal.city ?? '';
        const destCity = route.destTerminal.cityRelation?.name ?? route.destTerminal.city ?? '';
        const minFare = route.schedules
          .flatMap((s) => s.fares)
          .sort((a, b) => a.priceXOF - b.priceXOF)[0];

        return (
          <Pressable
            key={route.id}
            onPress={() => handleRoutePress(route)}
            className="will-change-pressable bg-white border border-slate-200 rounded-2xl p-4 gap-3 active:bg-slate-50"
            style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}
          >
            {/* Route header */}
            <View className="flex-row items-center gap-2">
              <Text className="text-base font-bold text-slate-900 flex-1">
                {originCity}
              </Text>
              <View className="px-2 py-0.5 bg-[#ee237c] rounded-full">
                <Text className="text-white text-xs font-black">→</Text>
              </View>
              <Text className="text-base font-bold text-slate-900 flex-1 text-right">
                {destCity}
              </Text>
            </View>

            {route.name ? (
              <Text className="text-xs text-slate-400">{route.name}</Text>
            ) : null}

            {/* Departure times */}
            {route.schedules.length > 0 && (
              <View className="flex-row flex-wrap gap-1.5">
                {route.schedules.slice(0, 6).map((s) => (
                  <View
                    key={s.id}
                    className="flex-row items-center gap-1 px-2.5 py-1 bg-slate-50 border border-slate-200 rounded-full"
                  >
                    <HugeiconsIcon icon={Clock01Icon} size={11} color="#94a3b8" />
                    <Text className="text-sm font-semibold text-slate-600">{s.departureTime}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Price + Book */}
            <View className="flex-row items-center justify-between pt-1 border-t border-slate-100">
              {minFare ? (
                <Text className="text-sm text-slate-500">
                  {t('fromPrice')}{' '}
                  <Text className="text-[#ee237c] font-black">
                    {minFare.priceXOF.toLocaleString()} {t('fcfa')}
                  </Text>
                </Text>
              ) : (
                <View />
              )}
              <View className="flex-row items-center gap-1">
                <Text className="text-xs font-bold text-[#ee237c]">{t('book')}</Text>
                <HugeiconsIcon icon={ArrowRight01Icon} size={13} color="#ee237c" />
              </View>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
