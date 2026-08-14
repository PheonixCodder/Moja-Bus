import { View, Text, Pressable, ScrollView } from 'react-native';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { OperatorCard, type OperatorCardItem } from '@/features/operators/components/operator-card';

interface FeaturedOperatorsSectionProps {
  operators?: OperatorCardItem[];
}

const FALLBACK_OPERATORS: OperatorCardItem[] = [
  {
    id: 'op-1',
    slug: 'utb',
    name: 'Union des Transports de Bouaké',
    _count: { routes: 14, fleet: 32 },
    cityNames: ['Abidjan', 'Yamoussoukro', 'Bouaké'],
  },
  {
    id: 'op-2',
    slug: 'avs',
    name: 'Abidjan Voyage Services',
    _count: { routes: 9, fleet: 21 },
    cityNames: ['Abidjan', 'San-Pédro', 'Daloa'],
  },
  {
    id: 'op-3',
    slug: 'gtt',
    name: 'General Transport Company',
    _count: { routes: 7, fleet: 18 },
    cityNames: ['Korhogo', 'Man', 'Abidjan'],
  },
];

export function FeaturedOperatorsSection({ operators }: FeaturedOperatorsSectionProps) {
  const { t } = useTranslation('operators');
  const displayOperators =
    operators && operators.length > 0 ? operators : FALLBACK_OPERATORS;

  return (
    <View className="gap-3">
      {/* Section header with View All */}
      <View className="flex-row items-center justify-between px-0.5">
        <Text className="text-xs font-bold text-slate-400 uppercase tracking-widest">
          {t('sectionTitle')}
        </Text>
        <Pressable
          onPress={() => router.push('/operators' as any)}
          className="will-change-pressable active:opacity-70"
        >
          <Text className="text-xs font-bold text-[#ee237c]">{t('viewAll')}</Text>
        </Pressable>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 12 }}
      >
        {displayOperators.map((op) => (
          <OperatorCard key={op.id} operator={op} variant="home" />
        ))}
      </ScrollView>
    </View>
  );
}
