import { View, Text, Pressable, Image } from 'react-native';
import { router } from 'expo-router';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Bus01Icon, Location01Icon, ArrowRight01Icon } from '@hugeicons/core-free-icons';
import { useTranslation } from 'react-i18next';
import { Colors, Palette } from '@/constants/theme';
import { useOperatorsPrefetch } from '@/features/operators/hooks/use-operators-prefetch';

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
  const { prefetchOperator } = useOperatorsPrefetch();
  const initials = getInitials(operator.name);

  const handlePress = () => {
    router.push({
      pathname: '/operators/[slug]',
      params: { slug: operator.slug },
    });
  };

  const handlePressIn = () => {
    prefetchOperator(operator.slug);
  };

  if (variant === 'home') {
    return (
      <Pressable
        onPressIn={handlePressIn}
        onPress={handlePress}
        className="will-change-pressable w-60 bg-card border border-border p-3.5 rounded-2xl gap-2.5 shadow-xs active:bg-muted"
      >
        {/* Header: Logo + Name */}
        <View className="flex-row items-center gap-3">
          {operator.logoUrl ? (
            <Image
              source={{ uri: operator.logoUrl }}
              className="size-10 rounded-xl bg-muted"
              resizeMode="cover"
            />
          ) : (
            <View className="size-10 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center">
              <Text className="text-xs font-black text-primary">{initials}</Text>
            </View>
          )}
          <View className="flex-1 pr-1">
            <Text className="text-xs font-bold text-foreground leading-snug" numberOfLines={1}>
              {operator.name}
            </Text>
            <Text className="text-xs font-medium text-muted-foreground">
              {operator._count.fleet}+ {t('activeBuses')}
            </Text>
          </View>
        </View>

        {/* Stats & Cities */}
        <View className="bg-muted/40 p-2 rounded-xl flex-row items-center justify-between border border-border">
          <View className="flex-row items-center gap-1">
            <HugeiconsIcon icon={Bus01Icon} size={12} color={Palette.rose[500]} />
            <Text className="text-xs font-extrabold text-foreground">
              {operator._count.routes} {t('activeRoutes')}
            </Text>
          </View>
          {operator.cityNames.length > 0 && (
            <View className="flex-row items-center gap-1">
              <HugeiconsIcon icon={Location01Icon} size={11} color={Colors.light.textMuted} />
              <Text className="text-xs font-medium text-muted-foreground" numberOfLines={1}>
                {operator.cityNames.slice(0, 2).join(', ')}
              </Text>
            </View>
          )}
        </View>

        {/* Action */}
        <View className="flex-row items-center justify-between pt-0.5">
          <Text className="text-sm font-bold text-primary">{t('viewProfile')}</Text>
          <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={Palette.rose[500]} />
        </View>
      </Pressable>
    );
  }

  // variant === 'list'
  return (
    <Pressable
      onPressIn={handlePressIn}
      onPress={handlePress}
      className="will-change-pressable bg-card border border-border rounded-2xl p-4 gap-3 active:bg-muted shadow-xs"
    >
      {/* Header row */}
      <View className="flex-row items-center gap-3">
        {operator.logoUrl ? (
          <Image
            source={{ uri: operator.logoUrl }}
            className="w-14 h-14 rounded-2xl bg-muted"
            resizeMode="cover"
          />
        ) : (
          <View className="w-14 h-14 rounded-2xl bg-primary/10 border border-primary/20 items-center justify-center">
            <Text className="text-lg font-black text-primary">{initials}</Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="text-base font-bold text-foreground mb-0.5" numberOfLines={1}>
            {operator.name}
          </Text>
          {operator.description ? (
            <Text className="text-xs text-muted-foreground leading-relaxed" numberOfLines={2}>
              {operator.description}
            </Text>
          ) : null}
        </View>
      </View>

      {/* Stats row */}
      <View className="flex-row gap-3">
        <View className="flex-1 bg-muted/40 rounded-xl p-2.5 border border-border">
          <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
            {t('activeRoutes')}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <HugeiconsIcon icon={Bus01Icon} size={13} color={Palette.rose[500]} />
            <Text className="text-sm font-black text-foreground">{operator._count.routes}</Text>
          </View>
        </View>
        <View className="flex-1 bg-muted/40 rounded-xl p-2.5 border border-border">
          <Text className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-0.5">
            {t('activeBuses')}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <HugeiconsIcon icon={Bus01Icon} size={13} color={Colors.light.textMuted} />
            <Text className="text-sm font-black text-foreground">{operator._count.fleet}</Text>
          </View>
        </View>
      </View>

      {/* City pills */}
      {operator.cityNames.length > 0 && (
        <View className="flex-row flex-wrap gap-1.5">
          {operator.cityNames.slice(0, 4).map((city) => (
            <View key={city} className="flex-row items-center gap-1 px-2 py-0.5 bg-muted rounded-full">
              <HugeiconsIcon icon={Location01Icon} size={10} color={Colors.light.textMuted} />
              <Text className="text-xs font-medium text-muted-foreground">{city}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Footer action */}
      <View className="flex-row items-center justify-end gap-1">
        <Text className="text-xs font-bold text-primary">{t('viewProfile')}</Text>
        <HugeiconsIcon icon={ArrowRight01Icon} size={13} color={Palette.rose[500]} />
      </View>
    </Pressable>
  );
}
