import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Clock01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { Palette } from '@/constants/theme';
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
        <Text className="text-muted-foreground text-sm text-center">{t('noRoutes')}</Text>
      </View>
    );
  }

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      contentContainerStyle={{ padding: 16, gap: 12, paddingBottom: 40 }}
    >
      <Text className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-1">
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
            accessibilityRole="button"
            className="bg-card border border-border rounded-2xl p-4 gap-3 active:bg-muted shadow-sm"
          >
            {/* Route header */}
            <View className="flex-row items-center gap-2">
              <Text className="text-base font-bold text-foreground flex-1">
                {originCity}
              </Text>
              <View className="px-2 py-0.5 bg-primary rounded-full">
                <Text className="text-primary-foreground text-xs font-black">→</Text>
              </View>
              <Text className="text-base font-bold text-foreground flex-1 text-right">
                {destCity}
              </Text>
            </View>

            {route.name ? (
              <Text className="text-xs text-muted-foreground">{route.name}</Text>
            ) : null}

            {/* Departure times */}
            {route.schedules.length > 0 && (
              <View className="flex-row flex-wrap gap-1.5">
                {route.schedules.slice(0, 6).map((s) => (
                  <View
                    key={s.id}
                    className="flex-row items-center gap-1 px-2.5 py-1 bg-muted border border-border rounded-full"
                  >
                    <HugeiconsIcon icon={Clock01Icon} size={11} color={Palette.zinc[400]} />
                    <Text className="text-sm font-semibold text-foreground/80">{s.departureTime}</Text>
                  </View>
                ))}
              </View>
            )}

            {/* Price + Book */}
            <View className="flex-row items-center justify-between pt-1 border-t border-border/40">
              {minFare ? (
                <Text className="text-sm text-muted-foreground">
                  {t('fromPrice')}{' '}
                  <Text className="text-primary font-black">
                    {minFare.priceXOF.toLocaleString()} {t('fcfa')}
                  </Text>
                </Text>
              ) : (
                <View />
              )}
              <View className="flex-row items-center gap-1">
                <Text className="text-xs font-bold text-primary">{t('book')}</Text>
                <HugeiconsIcon icon={ArrowRight01Icon} size={13} color={Palette.rose[500]} />
              </View>
            </View>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
