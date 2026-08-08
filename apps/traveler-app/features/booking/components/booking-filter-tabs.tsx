import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { Colors } from '@moja/theme/tokens';

export type BookingFilterTab = 'upcoming' | 'pending' | 'past';

type BookingFilterTabsProps = {
  activeTab: BookingFilterTab;
  onTabChange: (tab: BookingFilterTab) => void;
  upcomingCount?: number;
  pendingCount?: number;
};

const TABS: { id: BookingFilterTab; labelKey: 'upcoming' | 'pending' | 'past' }[] = [
  { id: 'upcoming', labelKey: 'upcoming' },
  { id: 'pending', labelKey: 'pending' },
  { id: 'past', labelKey: 'past' },
];

export function BookingFilterTabs({
  activeTab,
  onTabChange,
  upcomingCount,
  pendingCount,
}: BookingFilterTabsProps) {
  const { t } = useTranslation('booking');

  const getBadgeCount = (tab: BookingFilterTab) => {
    if (tab === 'upcoming') return upcomingCount;
    if (tab === 'pending') return pendingCount;
    return undefined;
  };

  return (
    <View className="bg-muted/50 border-border mx-4 my-2 flex-row rounded-full border p-1">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = getBadgeCount(tab.id);

        return (
          <Pressable
            key={tab.id}
            onPress={() => onTabChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            className="flex-1 flex-row items-center justify-center gap-1.5 rounded-full py-2"
            style={({ pressed }) => ({
              backgroundColor: isActive ? Colors.light.primary : 'transparent',
              opacity: pressed ? 0.8 : 1,
            })}>
            <Text
              className={`text-xs font-bold capitalize ${
                isActive ? 'text-white' : 'text-muted-foreground'
              }`}>
              {t(tab.labelKey)}
            </Text>
            {count !== undefined && count > 0 ? (
              <View
                className={`rounded-full px-1.5 py-0.5 ${
                  isActive ? 'bg-white/20' : 'bg-primary/10'
                }`}>
                <Text
                  className={`text-[10px] font-extrabold ${
                    isActive ? 'text-white' : 'text-primary'
                  }`}>
                  {count}
                </Text>
              </View>
            ) : null}
          </Pressable>
        );
      })}
    </View>
  );
}
