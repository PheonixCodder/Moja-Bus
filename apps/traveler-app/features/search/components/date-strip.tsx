import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCheapestByDate } from '../hooks/use-cheapest-by-date';
import { parseDateStrip, formatPriceXOF } from '../lib/format';

interface DateStripProps {
  from: string;
  to: string;
  fromMuni?: string;
  toMuni?: string;
  fromQuarter?: string;
  toQuarter?: string;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
}

export function DateStrip({
  from,
  to,
  fromMuni,
  toMuni,
  fromQuarter,
  toQuarter,
  selectedDate,
  onSelectDate,
}: DateStripProps) {
  const { t } = useTranslation('search');
  const { data: cheapestData, isLoading } = useCheapestByDate(
    from,
    to,
    selectedDate,
    fromMuni,
    toMuni,
    fromQuarter,
    toQuarter,
  );

  // Generate 7 dates centered on selectedDate
  const days = useMemo(() => {
    const [y, m, d] = selectedDate.split('-').map(Number) as [number, number, number];
    const centerDate = new Date(Date.UTC(y, m - 1, d));
    return Array.from({ length: 7 }, (_, i) => {
      const dt = new Date(centerDate);
      dt.setUTCDate(centerDate.getUTCDate() + (i - 3));
      const dateStr = dt.toISOString().split('T')[0]!;
      const parsed = parseDateStrip(dateStr);
      return {
        dateStr,
        ...parsed,
      };
    });
  }, [selectedDate]);

  // Find lowest price for "Best" badge
  const allPrices = cheapestData
    ? cheapestData.map((d) => d.priceXOF).filter((p): p is number => p !== null)
    : [];
  const minPrice = allPrices.length > 0 ? Math.min(...allPrices) : null;

  return (
    <View className="bg-card pt-4 pb-3 border-b border-border overflow-visible">
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        className="overflow-visible"
        contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 10, gap: 10, alignItems: 'center' }}
      >
        {days.map(({ dateStr, weekday, day, month }) => {
          const isSelected = dateStr === selectedDate;
          const priceEntry = cheapestData?.find((entry) => entry.date === dateStr);
          const priceXOF = priceEntry?.priceXOF ?? null;
          const hasTrips = priceXOF !== null;
          const isCheapest = hasTrips && priceXOF === minPrice && allPrices.length > 1;
          const isSelectable = hasTrips || isSelected || !from || !to;

          return (
            <Pressable
              key={dateStr}
              onPress={() => isSelectable && onSelectDate(dateStr)}
              disabled={!isSelectable}
              className={`min-w-[74px] px-3 py-2.5 rounded-2xl items-center justify-center relative border-[1.5px] ${
                isSelected
                  ? 'bg-primary border-primary shadow-md shadow-primary/25'
                  : isSelectable
                  ? 'bg-muted/50 border-border'
                  : 'bg-muted/20 border-border/40 opacity-45'
              }`}
              style={({ pressed }) => ({ opacity: !isSelectable ? 0.45 : pressed ? 0.7 : 1 })}
            >
              {isCheapest && !isSelected && (
                <View className="absolute -top-2.5 bg-success rounded-full px-2 py-0.5 z-20 shadow-xs shadow-success/50">
                  <Text className="text-white text-[8px] font-black uppercase tracking-wide">
                    {t('bestBadge')}
                  </Text>
                </View>
              )}

              <Text
                className={`text-[11px] uppercase font-extrabold tracking-widest ${
                  isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                }`}
              >
                {weekday}
              </Text>

              <Text
                className={`text-xl font-black my-0.5 ${
                  isSelected ? 'text-primary-foreground' : 'text-foreground'
                }`}
              >
                {day}
              </Text>

              <Text
                className={`text-[11px] font-bold mb-1 ${
                  isSelected ? 'text-primary-foreground/80' : 'text-muted-foreground'
                }`}
              >
                {month}
              </Text>

              {isLoading && !!from && !!to ? (
                <View className="h-3 w-8 bg-muted rounded" />
              ) : hasTrips ? (
                <Text
                  className={`text-[11px] font-black ${
                    isSelected
                      ? 'text-primary-foreground'
                      : isCheapest
                      ? 'text-success'
                      : 'text-primary'
                  }`}
                >
                  {formatPriceXOF(priceXOF)}
                </Text>
              ) : (
                <Text
                  className={`text-[11px] font-bold ${
                    isSelected ? 'text-primary-foreground/60' : 'text-muted-foreground/60'
                  }`}
                >
                  —
                </Text>
              )}
            </Pressable>
          );
        })}
      </ScrollView>
    </View>
  );
}
