import { Pressable, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Text } from '@/components/ui/text';
import type { BookingFilterType } from '../hooks/use-bookings';

export type BookingFilterTab = BookingFilterType;

type BookingFilterTabsProps = {
  activeTab: BookingFilterTab;
  onTabChange: (tab: BookingFilterTab) => void;
  onTabPressIn?: (tab: BookingFilterTab) => void;
  upcomingCount?: number;
  pendingCount?: number;
};

const TABS: { id: BookingFilterTab; labelKey: string }[] = [
  { id: 'upcoming', labelKey: 'upcomingLabel' },
  { id: 'pending', labelKey: 'pendingLabel' },
  { id: 'past', labelKey: 'pastLabel' },
];

export function BookingFilterTabs({
  activeTab,
  onTabChange,
  onTabPressIn,
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
    <View className="bg-muted/40 border-border mx-4 my-2 flex-row rounded-full border p-1">
      {TABS.map((tab) => {
        const isActive = activeTab === tab.id;
        const count = getBadgeCount(tab.id);

        return (
          <Pressable
            key={tab.id}
            onPressIn={() => onTabPressIn?.(tab.id)}
            onPress={() => onTabChange(tab.id)}
            accessibilityRole="tab"
            accessibilityState={{ selected: isActive }}
            className={`flex-1 flex-row items-center justify-center gap-1.5 rounded-full py-2.5 shadow-2xs ${
              isActive ? 'bg-primary' : 'bg-transparent'
            }`}
          >
            <Text
              className={`text-xs font-black capitalize ${
                isActive ? 'text-white' : 'text-muted-foreground'
              }`}>
              {t(tab.labelKey as any)}
            </Text>
            {count !== undefined && count > 0 ? (
              <View
                className={`rounded-full px-1.5 py-0.5 ${
                  isActive ? 'bg-white/25' : 'bg-primary/10'
                }`}>
                <Text
                  className={`text-xs font-extrabold ${
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
