import { View, Text, ScrollView, Pressable } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { ArrowRight01Icon, Bus01Icon, Location01Icon, Calendar01Icon } from '@hugeicons/core-free-icons';
import { Palette } from '@/constants/theme';

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
        <View className="bg-card border border-border rounded-2xl p-4">
          <Text className="text-xs font-black text-muted-foreground uppercase tracking-widest mb-2">
            {t('aboutHeading')}
          </Text>
          <Text className="text-sm text-foreground/80 leading-relaxed">{description}</Text>
        </View>
      ) : null}

      {/* Quick stats */}
      <View className="flex-row gap-3">
        <Pressable
          onPress={() => onTabChange('routes')}
          accessibilityRole="button"
          className="flex-1 bg-card border border-border rounded-2xl p-4 items-center gap-1 active:bg-muted min-h-12 justify-center"
        >
          <HugeiconsIcon icon={Bus01Icon} size={20} color={Palette.rose[500]} />
          <Text className="text-2xl font-black text-foreground">{routes.length}</Text>
          <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">
            {t('activeRoutes')}
          </Text>
        </Pressable>
        <Pressable
          onPress={() => onTabChange('terminals')}
          accessibilityRole="button"
          className="flex-1 bg-card border border-border rounded-2xl p-4 items-center gap-1 active:bg-muted min-h-12 justify-center"
        >
          <HugeiconsIcon icon={Location01Icon} size={20} color={Palette.rose[500]} />
          <Text className="text-2xl font-black text-foreground">{locations.length}</Text>
          <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">
            {t('terminals')}
          </Text>
        </Pressable>
        {yearEstablished ? (
          <View className="flex-1 bg-card border border-border rounded-2xl p-4 items-center gap-1 justify-center">
            <HugeiconsIcon icon={Calendar01Icon} size={20} color={Palette.zinc[400]} />
            <Text className="text-xl font-black text-foreground">{yearEstablished}</Text>
            <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider text-center">
              {t('est', { year: String(yearEstablished) })}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Quick routes preview */}
      {routes.length > 0 && (
        <View className="bg-card border border-border rounded-2xl overflow-hidden">
          <View className="flex-row items-center justify-between px-4 pt-4 pb-2">
            <Text className="text-xs font-black text-muted-foreground uppercase tracking-widest">
              {t('tabRoutes')}
            </Text>
            <Pressable onPress={() => onTabChange('routes')} accessibilityRole="button" className="flex-row items-center gap-1 py-1">
              <Text className="text-xs font-bold text-primary">{t('viewAllRoutes')}</Text>
              <HugeiconsIcon icon={ArrowRight01Icon} size={12} color={Palette.rose[500]} />
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
                className={`flex-row items-center justify-between px-4 py-3 ${idx < routes.slice(0, 3).length - 1 ? 'border-b border-border/40' : ''}`}
              >
                <Text className="text-sm font-semibold text-foreground flex-1">
                  {originCity} → {destCity}
                </Text>
                {minFare ? (
                  <Text className="text-xs font-bold text-primary">
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
        accessibilityRole="button"
        className="bg-primary rounded-2xl p-4 flex-row items-center justify-center gap-2 active:opacity-90 min-h-12 shadow-sm"
      >
        <Text className="text-primary-foreground font-black text-sm uppercase tracking-wider">{t('bookTrip')}</Text>
        <HugeiconsIcon icon={ArrowRight01Icon} size={16} color={Palette.zinc[50]} />
      </Pressable>
    </ScrollView>
  );
}
