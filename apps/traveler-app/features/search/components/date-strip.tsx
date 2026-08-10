import React, { useMemo } from 'react';
import { View, Text, Pressable, ScrollView } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useCheapestByDate } from '../hooks/use-cheapest-by-date';
import { parseDateStrip, formatPriceXOF } from '../lib/format';

interface DateStripProps {
  from: string;
  to: string;
  selectedDate: string; // YYYY-MM-DD
  onSelectDate: (dateStr: string) => void;
}

export function DateStrip({ from, to, selectedDate, onSelectDate }: DateStripProps) {
  const { t } = useTranslation("search");

  const { data: cheapestData, isLoading } = useCheapestByDate(from, to, selectedDate);

  // Generate 7 days centered on selectedDate
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
    <View className="bg-white border-b border-slate-100 py-3">
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ paddingHorizontal: 16 }}>
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
              className={`mr-2.5 rounded-xl border px-3 py-2 items-center justify-center min-w-[72px] relative will-change-pressable will-change-variable
                ${isSelected ? 'bg-[#ee237c] border-[#ee237c] shadow-sm' : isSelectable ? 'bg-white border-slate-200 active:bg-pink-50' : 'bg-slate-50 border-slate-100 opacity-40'}
              `}
            >
              {isCheapest && !isSelected && (
                <View className="absolute -top-2 bg-emerald-500 rounded-full px-1.5 py-0.5 z-10">
                  <Text className="text-white text-[8px] font-black uppercase">{t("bestBadge")}</Text>
                </View>
              )}
              <Text className={`text-[10px] uppercase font-bold tracking-wider ${isSelected ? 'text-rose-100' : 'text-slate-400'}`}>
                {weekday}
              </Text>
              <Text className={`text-xl font-extrabold my-0.5 ${isSelected ? 'text-white' : 'text-slate-900'}`}>
                {day}
              </Text>
              <Text className={`text-[10px] font-semibold mb-1 ${isSelected ? 'text-rose-100' : 'text-slate-400'}`}>
                {month}
              </Text>

              {isLoading && !!from && !!to ? (
                <View className="h-3 w-8 bg-slate-200 rounded animate-pulse" />
              ) : hasTrips ? (
                <Text className={`text-[10px] font-extrabold ${isSelected ? 'text-white' : isCheapest ? 'text-emerald-600' : 'text-[#ee237c]'}`}>
                  {formatPriceXOF(priceXOF)}
                </Text>
              ) : (
                <Text className={`text-[10px] font-bold ${isSelected ? 'text-rose-200' : 'text-slate-300'}`}>
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
