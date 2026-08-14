import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import {
  Bus01Icon,
  ArrowRight01Icon,
  SparklesIcon,
} from '@hugeicons/core-free-icons';
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
        return { bgClass: 'bg-amber-100', borderClass: 'border-amber-200', textClass: 'text-amber-900' };
      case 'Standard':
        return { bgClass: 'bg-blue-50', borderClass: 'border-blue-200', textClass: 'text-blue-800' };
      default:
        return { bgClass: 'bg-slate-50', borderClass: 'border-slate-200', textClass: 'text-slate-600' };
    }
  };

  const badgeStyle = getClassBadgeStyle(offer.busClass);
  const amenityLabels = offer.amenities.slice(0, 3).map((a) =>
    t(`amenity${a}` as 'amenityAC', a),
  );

  return (
    <View
      className={`bg-white rounded-3xl p-4 mx-4 mb-3.5 border border-slate-100 shadow-sm shadow-black/5 elevation-2 ${
        isSoldOut ? 'opacity-65' : ''
      }`}
    >
      <View className="flex-row items-center justify-between mb-3.5">
        <View className="flex-row items-center gap-2.5 flex-1">
          <View className="w-9 h-9 rounded-xl bg-pink-50 border border-pink-200 items-center justify-center">
            <Text className="text-[#ee237c] font-black text-xs">
              {(offer.operatorName || 'MB').substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View className="flex-1">
            <Text className="text-base font-extrabold text-slate-900" numberOfLines={1}>
              {offer.operatorName}
            </Text>
            <View className="flex-row items-center mt-0.5 gap-2 flex-wrap">
              {offer.isExpress ? (
                <View className="flex-row items-center gap-1">
                  <HugeiconsIcon icon={SparklesIcon} size={10} color="#7c3aed" />
                  <Text className="text-[10px] font-extrabold text-purple-600 uppercase tracking-wide">
                    {t('expressNonStop')}
                  </Text>
                </View>
              ) : null}
              {offer.busTypeName ? (
                <Text className="text-[10px] font-semibold text-slate-400">{offer.busTypeName}</Text>
              ) : null}
            </View>
          </View>
        </View>

        <View className={`px-2.5 py-1 rounded-xl border ${badgeStyle.bgClass} ${badgeStyle.borderClass}`}>
          <Text className={`text-[10px] font-black uppercase tracking-wider ${badgeStyle.textClass}`}>
            {offer.busClass}
          </Text>
        </View>
      </View>

      <View className="bg-slate-50 rounded-2xl p-3 flex-row items-center border border-slate-100 mb-3">
        <View className="flex-1">
          <Text className="text-lg font-black text-slate-900">{offer.departureTime}</Text>
          <Text className="text-xs font-bold text-slate-700 mt-0.5" numberOfLines={2}>
            {originLabel}
          </Text>
          <Text className="text-[10px] font-medium text-slate-400 mt-0.5" numberOfLines={1}>
            {offer.departureTerminal}
          </Text>
        </View>

        <View className="flex-1 items-center justify-center px-1.5">
          <Text className="text-[10px] font-bold text-slate-400 mb-1">{offer.duration}</Text>
          <View className="w-full flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <View className="flex-1 h-[1px] bg-slate-200" />
            <View className="w-6 h-6 rounded-full bg-white border-[1.5px] border-pink-100 items-center justify-center shadow-xs">
              <HugeiconsIcon icon={Bus01Icon} size={12} color="#ee237c" />
            </View>
            <View className="flex-1 h-[1px] bg-slate-200" />
            <View className="w-1.5 h-1.5 rounded-full bg-[#ee237c]" />
          </View>
          <Text className="text-[10px] font-bold text-slate-600 mt-1">
            {offer.stopCount === 0 ? t('directRoute') : `${offer.stopCount} stops`}
          </Text>
        </View>

        <View className="flex-1 items-end">
          <Text className="text-lg font-black text-slate-900">{offer.arrivalTime}</Text>
          <Text className="text-xs font-bold text-slate-700 mt-0.5 text-right" numberOfLines={2}>
            {destLabel}
          </Text>
          <Text className="text-[10px] font-medium text-slate-400 mt-0.5 text-right" numberOfLines={1}>
            {offer.arrivalTerminal}
          </Text>
        </View>
      </View>

      {amenityLabels.length > 0 ? (
        <View className="flex-row flex-wrap gap-1.5 mb-3">
          {amenityLabels.map((label) => (
            <View key={label} className="bg-slate-50 border border-slate-100 px-2 py-0.5 rounded-lg">
              <Text className="text-[10px] font-bold text-slate-500">{label}</Text>
            </View>
          ))}
        </View>
      ) : null}

      <View className="flex-row items-center justify-between">
        <View>
          <Text className="text-xl font-black text-[#ee237c]">
            {formatPriceXOF(offer.priceXOF)}
          </Text>
          <View className="mt-1">
            {offer.availability === 'FEW_LEFT' ? (
              <View className="bg-amber-100 px-2 py-0.5 rounded-lg">
                <Text className="text-amber-800 text-[10px] font-extrabold">
                  {typeof offer.remainingSeats === 'number'
                    ? t('onlyLeft', { count: offer.remainingSeats })
                    : t('fewSeatsLeft')}
                </Text>
              </View>
            ) : offer.availability === 'SOLD_OUT' ? (
              <View className="bg-slate-100 px-2 py-0.5 rounded-lg">
                <Text className="text-slate-500 text-[10px] font-extrabold">{t('soldOut')}</Text>
              </View>
            ) : (
              <View className="bg-emerald-100 px-2 py-0.5 rounded-lg">
                <Text className="text-emerald-800 text-[10px] font-extrabold">
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
          className={`flex-row items-center gap-1.5 px-4 py-3 rounded-2xl ${
            isSoldOut ? 'bg-slate-200' : 'bg-[#ee237c]'
          } ${isSoldOut ? '' : 'shadow-md shadow-pink-500/30'}`}
          style={({ pressed }) => ({
            opacity: pressed && !isSoldOut ? 0.85 : 1,
            backgroundColor: pressed && !isSoldOut ? '#d01867' : undefined,
          })}
        >
          <Text className={`font-black text-xs ${isSoldOut ? 'text-slate-400' : 'text-white'}`}>
            {isSoldOut ? t('soldOut') : t('selectSeats')}
          </Text>
          {!isSoldOut && <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="#ffffff" />}
        </Pressable>
      </View>
    </View>
  );
}
