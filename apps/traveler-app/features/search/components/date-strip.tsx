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
  const { t } = useTranslation('search');
  const { data: cheapestData, isLoading } = useCheapestByDate(from, to, selectedDate);

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
    <View style={{ backgroundColor: '#ffffff', paddingTop: 16, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#f1f5f9', overflow: 'visible' }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ overflow: 'visible' }}
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
              style={({ pressed }) => ({
                minWidth: 74,
                paddingHorizontal: 12,
                paddingVertical: 10,
                borderRadius: 16,
                alignItems: 'center',
                justifyContent: 'center',
                position: 'relative',
                backgroundColor: isSelected
                  ? '#ee237c'
                  : pressed
                  ? '#fce7f3'
                  : isSelectable
                  ? '#f8fafc'
                  : '#f1f5f9',
                borderWidth: 1.5,
                borderColor: isSelected
                  ? '#ee237c'
                  : isSelectable
                  ? '#e2e8f0'
                  : '#f1f5f9',
                opacity: !isSelectable ? 0.45 : 1,
                shadowColor: isSelected ? '#ee237c' : '#000',
                shadowOffset: { width: 0, height: isSelected ? 4 : 1 },
                shadowOpacity: isSelected ? 0.25 : 0.03,
                shadowRadius: isSelected ? 8 : 2,
                elevation: isSelected ? 4 : 1,
              })}
            >
              {isCheapest && !isSelected && (
                <View
                  style={{
                    position: 'absolute',
                    top: -11,
                    backgroundColor: '#10b981',
                    borderRadius: 10,
                    paddingHorizontal: 7,
                    paddingVertical: 2.5,
                    zIndex: 20,
                    shadowColor: '#10b981',
                    shadowOffset: { width: 0, height: 2 },
                    shadowOpacity: 0.3,
                    shadowRadius: 4,
                    elevation: 4,
                  }}
                >
                  <Text style={{ color: '#ffffff', fontSize: 8, fontWeight: '900', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                    {t('bestBadge')}
                  </Text>
                </View>
              )}

              <Text
                style={{
                  fontSize: 10,
                  textTransform: 'uppercase',
                  fontWeight: '800',
                  letterSpacing: 1,
                  color: isSelected ? '#fbcfe8' : '#94a3b8',
                }}
              >
                {weekday}
              </Text>

              <Text
                style={{
                  fontSize: 20,
                  fontWeight: '900',
                  marginVertical: 2,
                  color: isSelected ? '#ffffff' : '#0f172a',
                }}
              >
                {day}
              </Text>

              <Text
                style={{
                  fontSize: 10,
                  fontWeight: '700',
                  marginBottom: 4,
                  color: isSelected ? '#fbcfe8' : '#94a3b8',
                }}
              >
                {month}
              </Text>

              {isLoading && !!from && !!to ? (
                <View style={{ height: 12, width: 32, backgroundColor: '#e2e8f0', borderRadius: 4 }} />
              ) : hasTrips ? (
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '900',
                    color: isSelected ? '#ffffff' : isCheapest ? '#059669' : '#ee237c',
                  }}
                >
                  {formatPriceXOF(priceXOF)}
                </Text>
              ) : (
                <Text
                  style={{
                    fontSize: 10,
                    fontWeight: '700',
                    color: isSelected ? '#fbcfe8' : '#cbd5e1',
                  }}
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
