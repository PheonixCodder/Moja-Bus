import { View, Text, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Bus01Icon, Location01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { useTranslation } from 'react-i18next';

export interface OperatorCardItem {
  id: string;
  slug: string;
  name: string;
  description?: string | null;
  logoUrl?: string | null;
  _count: {
    routes: number;
    fleet: number;
  };
  cityNames: string[];
}

interface OperatorCardProps {
  operator: OperatorCardItem;
  /** 'home' = compact card for horizontal scroll, 'list' = full-width listing card */
  variant?: 'home' | 'list';
}

function getInitials(name: string) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 3)
    .toUpperCase();
}

export function OperatorCard({ operator, variant = 'list' }: OperatorCardProps) {
  const { t } = useTranslation('operators');
  const initials = getInitials(operator.name);

  const handlePress = () => {
    router.push({
      pathname: '/operators/[slug]',
      params: { slug: operator.slug },
    });
  };

  if (variant === 'home') {
    return (
      <Pressable
        onPress={handlePress}
        className="will-change-pressable w-60 bg-white border border-slate-200 p-3.5 rounded-2xl gap-2.5 shadow-sm active:bg-slate-50"
      >
        {/* Header: Logo + Name */}
        <View className="flex-row items-center gap-3">
          {operator.logoUrl ? (
            <Image
              source={{ uri: operator.logoUrl }}
              className="size-10 rounded-xl bg-slate-100"
              resizeMode="cover"
            />
          ) : (
            <View className="size-10 rounded-xl bg-pink-50 border border-pink-100 items-center justify-center">
              <Text className="text-xs font-black text-[#ee237c]">{initials}</Text>
            </View>
          )}
          <View className="flex-1 pr-1">
            <Text className="text-xs font-bold text-slate-900 leading-snug" numberOfLines={1}>
              {operator.name}
            </Text>
            <Text className="text-xs font-medium text-slate-400">
              {operator._count.fleet}+ {t('activeBuses')}
            </Text>
          </View>
        </View>

        {/* Stats & Cities */}
        <View className="bg-slate-50 p-2 rounded-xl flex-row items-center justify-between border border-slate-100">
          <View className="flex-row items-center gap-1">
            <HugeiconsIcon icon={Bus01Icon} size={12} color="#ee237c" />
            <Text className="text-xs font-extrabold text-slate-700">
              {operator._count.routes} {t('activeRoutes')}
            </Text>
          </View>
          {operator.cityNames.length > 0 && (
            <View className="flex-row items-center gap-1">
              <HugeiconsIcon icon={Location01Icon} size={11} color="#94a3b8" />
              <Text className="text-xs font-medium text-slate-500" numberOfLines={1}>
                {operator.cityNames.slice(0, 2).join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Action */}
        <View className="flex-row items-center justify-between pt-0.5">
          <Text className="text-sm font-bold text-[#ee237c]">{t('viewProfile')}</Text>
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="#ee237c" />
        </View>
      </Pressable>
    );
  }

  // variant === 'list'
  return (
    <Pressable
      onPress={handlePress}
      className="will-change-pressable bg-white border border-slate-200 rounded-2xl p-4 gap-3 active:bg-slate-50"
      style={{ shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.06, shadowRadius: 4, elevation: 2 }}
    >
      {/* Header row */}
      <View className="flex-row items-center gap-3">
        {operator.logoUrl ? (
          <Image
            source={{ uri: operator.logoUrl }}
            className="w-14 h-14 rounded-2xl bg-slate-100"
            resizeMode="cover"
          />
        ) : (
          <View className="w-14 h-14 rounded-2xl bg-pink-50 border border-pink-100 items-center justify-center">
            <Text className="text-lg font-black text-[#ee237c]">{initials}</Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="text-base font-bold text-slate-900 mb-0.5" numberOfLines={1}>
            {operator.name}
          </Text>
          {operator.description ? (
            <Text className="text-xs text-slate-500 leading-relaxed" numberOfLines={2}>
              {operator.description}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Stats row */}
      <View className="flex-row gap-3">
        <View className="flex-1 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            {t('activeRoutes')}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <HugeiconsIcon icon={Bus01Icon} size={13} color="#ee237c" />
            <Text className="text-sm font-black text-slate-800">{operator._count.routes}</Text>
          </View>
        </View>
        <View className="flex-1 bg-slate-50 rounded-xl p-2.5 border border-slate-100">
          <Text className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-0.5">
            {t('activeBuses')}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <HugeiconsIcon icon={Bus01Icon} size={13} color="#94a3b8" />
            <Text className="text-sm font-black text-slate-800">{operator._count.fleet}</Text>
          </View>
        </View>
      </View>

      {/* City pills */}
      {operator.cityNames.length > 0 && (
        <View className="flex-row flex-wrap gap-1.5">
          {operator.cityNames.slice(0, 4).map((city) => (
            <View key={city} className="flex-row items-center gap-1 px-2 py-0.5 bg-slate-100 rounded-full">
              <HugeiconsIcon icon={Location01Icon} size={10} color="#94a3b8" />
              <Text className="text-xs font-medium text-slate-600">{city}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer action */}
      <View className="flex-row items-center justify-end gap-1">
        <Text className="text-xs font-bold text-[#ee237c]">{t('viewProfile')}</Text>
        <HugeiconsIcon icon={ArrowRight01Icon} size={13} color="#ee237c" />
      </View>
    </Pressable>
  );
}
