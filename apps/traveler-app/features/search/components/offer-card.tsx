import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Bus01Icon,
  ArrowRight01Icon,
  SparklesIcon,
} from '@hugeicons/core-free-icons';
import { Colors, Palette } from '@/constants/theme';
import { IconColors } from '@/constants/ui-colors';
import { formatPriceXOF } from '../lib/format';
import { formatLocationLabel } from '@/lib/format-location-label';

export interface Offer {
  id: string;
  companyId?: string;
  operatorName: string;
  isExpress: boolean;
  busClass: 'Economy' | 'Standard' | 'VIP';
  busTypeName?: string;
  departureTime: string;
  departureTerminal: string;
  departureCity: string;
  departureMunicipality?: string | null;
  departureQuarter?: string | null;
  arrivalTime: string;
  arrivalTerminal: string;
  arrivalCity: string;
  arrivalMunicipality?: string | null;
  arrivalQuarter?: string | null;
  duration: string;
  stopCount: number;
  priceXOF: number;
  availability: 'AVAILABLE' | 'FEW_LEFT' | 'SOLD_OUT';
  remainingSeats?: number;
  amenities: string[];
  serviceType?: 'INTERCITY' | 'URBAN';
}

interface OfferCardProps {
  offer: Offer;
  onSelect: (offer: Offer) => void;
  onPressIn?: (offer: Offer) => void;
}

export function OfferCard({ offer, onSelect, onPressIn }: OfferCardProps) {
  const { t } = useTranslation('search');
  const isSoldOut = offer.availability === 'SOLD_OUT';
  const isUrban = offer.serviceType === 'URBAN';

  const originLabel = formatLocationLabel({
    cityName: offer.departureCity,
    municipalityName: offer.departureMunicipality,
    quarterName: offer.departureQuarter,
    isUrban,
  });
  const destLabel = formatLocationLabel({
    cityName: offer.arrivalCity,
    municipalityName: offer.arrivalMunicipality,
    quarterName: offer.arrivalQuarter,
    isUrban,
  });

  const getClassBadgeStyle = (c: string) => {
    switch (c) {
      case 'VIP':
        return { bgClass: 'bg-warning/10', borderClass: 'border-warning/20', textClass: 'text-warning' };
      case 'Standard':
        return { bgClass: 'bg-info/10', borderClass: 'border-info/20', textClass: 'text-info' };
      default:
        return { bgClass: 'bg-muted', borderClass: 'border-border', textClass: 'text-muted-foreground' };
    }
  };

  const badgeStyle = getClassBadgeStyle(offer.busClass);
  const amenityLabels = offer.amenities.slice(0, 3).map((a) =>
    t(`amenity${a}` as 'amenityAC', a),
  );

  return (
    <View
      className={`bg-card rounded-3xl p-4 mx-4 mb-3.5 border border-border shadow-sm shadow-black/5 ${
        isSoldOut ? 'opacity-65' : ''
      }`}
    >
      <View className="flex-row items-center justify-between mb-3.5">
        <View className="flex-row items-center gap-2.5 flex-1">
          <View className="w-9 h-9 rounded-xl bg-primary/10 border border-primary/20 items-center justify-center">
            <Text className="text-primary font-black text-xs">
              {(offer.operatorName || 'MB').substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-extrabold text-card-foreground" numberOfLines={1}>
              {offer.operatorName}
            </Text>
            <View className="flex-row items-center mt-0.5 gap-2 flex-wrap">
              {offer.isExpress ? (
                <View className="flex-row items-center gap-1">
                  <HugeiconsIcon icon={SparklesIcon} size={10} color={Palette.rose[500]} />
                  <Text className="text-[11px] font-extrabold text-primary uppercase tracking-wide">
                    {t('expressNonStop')}
                  </Text>
                </View>
              ) : null}
              {offer.busTypeName ? (
                <Text className="text-[11px] font-semibold text-muted-foreground">{offer.busTypeName}</Text>
              ) : null}
            </View>
          </View>
        </View>

        <View className={`px-2.5 py-1 rounded-xl border ${badgeStyle.bgClass} ${badgeStyle.borderClass}`}>
          <Text className={`text-[11px] font-black uppercase tracking-wider ${badgeStyle.textClass}`}>
            {offer.busClass}
          </Text>
        </View>
      </View>

      <View className="bg-muted/50 rounded-2xl p-3 flex-row items-center border border-border mb-3">
        <View className="flex-1">
          <Text className="text-lg font-black text-foreground">{offer.departureTime}</Text>
          <Text className="text-xs font-bold text-foreground/80 mt-0.5" numberOfLines={2}>
            {originLabel}
          </Text>
          <Text className="text-[11px] font-medium text-muted-foreground mt-0.5" numberOfLines={1}>
            {offer.departureTerminal}
          </Text>
        </View>

        <View className="flex-1 items-center justify-center px-1.5">
          <Text className="text-[11px] font-bold text-muted-foreground mb-1">{offer.duration}</Text>
          <View className="w-full flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-border" />
            <View className="flex-1 h-[1px] bg-border" />
            <View className="w-6 h-6 rounded-full bg-card border-[1.5px] border-primary/20 items-center justify-center shadow-xs">
              <HugeiconsIcon icon={Bus01Icon} size={12} color={Palette.rose[500]} />
            </View>
            <View className="flex-1 h-[1px] bg-border" />
            <View className="w-1.5 h-1.5 rounded-full bg-primary" />
          </View>
          <Text className="text-[11px] font-bold text-muted-foreground mt-1">
            {offer.stopCount === 0 ? t('directRoute') : `${offer.stopCount} stops`}
          </Text>
        </View>

        <View className="flex-1 items-end">
          <Text className="text-lg font-black text-foreground">{offer.arrivalTime}</Text>
          <Text className="text-xs font-bold text-foreground/80 mt-0.5 text-right" numberOfLines={2}>
            {destLabel}
          </Text>
          <Text className="text-[11px] font-medium text-muted-foreground mt-0.5 text-right" numberOfLines={1}>
            {offer.arrivalTerminal}
          </Text>
        </View>
      </View>

      {amenityLabels.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5 mb-3">
          {amenityLabels.map((label) => (
            <View key={label} className="bg-muted/60 border border-border px-2 py-0.5 rounded-lg">
              <Text className="text-[11px] font-bold text-muted-foreground">{label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-black text-primary">
            {formatPriceXOF(offer.priceXOF)}
          </Text>
          <View className="mt-1">
            {offer.availability === 'FEW_LEFT' ? (
              <View className="bg-warning/10 border border-warning/20 px-2 py-0.5 rounded-lg">
                <Text className="text-warning text-[11px] font-extrabold">
                  {typeof offer.remainingSeats === 'number'
                    ? t('onlyLeft', { count: offer.remainingSeats })
                    : t('fewSeatsLeft')}
                </Text>
              </View>
            ) : offer.availability === 'SOLD_OUT' ? (
              <View className="bg-muted px-2 py-0.5 rounded-lg">
                <Text className="text-muted-foreground text-[11px] font-extrabold">{t('soldOut')}</Text>
              </View>
            ) : (
              <View className="bg-success/10 border border-success/20 px-2 py-0.5 rounded-lg">
                <Text className="text-success text-[11px] font-extrabold">
                  {typeof offer.remainingSeats === 'number'
                    ? t('seatsAvailable', { count: offer.remainingSeats })
                    : t('seatsAvailableLabel')}
                </Text>
              </View>
            )}
          </View>
        </View>

        <Pressable
          disabled={isSoldOut}
          onPressIn={() => !isSoldOut && onPressIn?.(offer)}
          onPress={() => onSelect(offer)}
          className={`flex-row items-center gap-1.5 px-4 min-h-11 h-11 rounded-2xl ${
            isSoldOut ? 'bg-muted' : 'bg-primary'
          } ${isSoldOut ? '' : 'shadow-md shadow-primary/25'}`}
          style={({ pressed }) => ({
            opacity: pressed && !isSoldOut ? 0.85 : 1,
          })}
        >
          <Text className={`font-black text-xs ${isSoldOut ? 'text-muted-foreground' : 'text-primary-foreground'}`}>
            {isSoldOut ? t('soldOut') : t('selectSeats')}
          </Text>
          {!isSoldOut && <HugeiconsIcon icon={ArrowRight01Icon} size={14} color={IconColors.onBrand} />}
        </Pressable>
      </View>
    </View>
  );
}
