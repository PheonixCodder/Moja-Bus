import React from 'react';
import { View, Text, Pressable } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Bus01Icon, Wifi01Icon, CheckmarkCircle01Icon, Luggage01Icon } from '@hugeicons/core-free-icons';
import { Colors } from '@moja/theme/tokens';
import { formatPriceXOF } from '../lib/format';

export interface Offer {
  id: string;
  operatorName: string;
  isExpress: boolean;
  busClass: 'Economy' | 'Standard' | 'VIP';
  departureTime: string;
  departureTerminal: string;
  departureCity: string;
  arrivalTime: string;
  arrivalTerminal: string;
  arrivalCity: string;
  duration: string;
  stopCount: number;
  priceXOF: number;
  availability: 'AVAILABLE' | 'FEW_LEFT' | 'SOLD_OUT';
  amenities: string[];
}

interface OfferCardProps {
  offer: Offer;
  onSelect: (offer: Offer) => void;
}

export function OfferCard({ offer, onSelect }: OfferCardProps) {
  const { t } = useTranslation("search");
  const isSoldOut = offer.availability === 'SOLD_OUT';

  const getClassBadge = (c: string) => {
    switch (c) {
      case 'VIP': return 'bg-amber-100 text-amber-900';
      case 'Standard': return 'bg-blue-50 text-blue-700';
      default: return 'bg-slate-100 text-slate-700';
    }
  };

  return (
    <View className={`bg-white rounded-2xl p-4 shadow-sm border border-slate-100 mb-4 mx-4 ${isSoldOut ? 'opacity-60' : ''}`}>
      {/* Header */}
      <View className="flex-row justify-between items-center mb-3">
        <View className="flex-row items-center gap-2">
          <View className="w-8 h-8 rounded-full bg-pink-100 border border-pink-200 items-center justify-center">
            <Text className="text-[#ee237c] font-black text-xs">
              {(offer.operatorName || 'MB').substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <Text className="font-bold text-slate-900 text-sm">{offer.operatorName}</Text>
          {offer.isExpress && (
            <View className="bg-purple-50 border border-purple-200 px-2 py-0.5 rounded">
              <Text className="text-purple-700 text-[10px] font-bold uppercase">{t("express")}</Text>
            </View>
          )}
        </View>
        <View className={`px-2 py-0.5 rounded ${getClassBadge(offer.busClass).split(' ')[0]}`}>
          <Text className={`text-[10px] font-bold ${getClassBadge(offer.busClass).split(' ')[1]}`}>
            {offer.busClass}
          </Text>
        </View>
      </View>

      {/* Timeline */}
      <View className="flex-row mb-3 items-center">
        {/* Departure */}
        <View className="flex-1">
          <Text className="text-lg font-bold text-slate-900">{offer.departureTime}</Text>
          <Text className="text-xs font-bold text-slate-600 mt-0.5" numberOfLines={1}>{offer.departureTerminal}</Text>
          <Text className="text-[10px] text-slate-400" numberOfLines={1}>{offer.departureCity}</Text>
        </View>
        
        {/* Timeline Graphic */}
        <View className="flex-1 items-center justify-center px-2">
          <Text className="text-[10px] font-medium text-slate-400 mb-1">{offer.duration}</Text>
          <View className="w-full flex-row items-center">
            <View className="w-1.5 h-1.5 rounded-full bg-slate-300" />
            <View className="flex-1 h-[1px] bg-slate-200" />
            <HugeiconsIcon icon={Bus01Icon} size={14} color={Colors.light.textSecondary} />
            <View className="flex-1 h-[1px] bg-slate-200" />
            <View className="w-1.5 h-1.5 rounded-full bg-[#ee237c]" />
          </View>
          <Text className="text-[10px] font-medium text-slate-400 mt-1">
            {offer.stopCount === 0 ? t("directRoute") : t("stops_other", { count: offer.stopCount })}
          </Text>
        </View>

        {/* Arrival */}
        <View className="flex-1 items-end">
          <Text className="text-lg font-bold text-slate-900">{offer.arrivalTime}</Text>
          <Text className="text-xs font-bold text-slate-600 mt-0.5 text-right" numberOfLines={1}>{offer.arrivalTerminal}</Text>
          <Text className="text-[10px] text-slate-400 text-right" numberOfLines={1}>{offer.arrivalCity}</Text>
        </View>
      </View>

      <View className="h-[1px] bg-slate-100 my-2" />

      {/* Footer */}
      <View className="flex-row justify-between items-center pt-1">
        <View>
          <Text className="text-xl font-black text-[#ee237c]">{formatPriceXOF(offer.priceXOF)}</Text>
          <View className="flex-row mt-1 items-center gap-1">
            {offer.amenities.includes('AC') && <HugeiconsIcon icon={CheckmarkCircle01Icon} size={12} color={Colors.light.textSecondary} />}
            {offer.amenities.includes('WiFi') && <HugeiconsIcon icon={Wifi01Icon} size={12} color={Colors.light.textSecondary} />}
            {offer.amenities.includes('Luggage') && <HugeiconsIcon icon={Luggage01Icon} size={12} color={Colors.light.textSecondary} />}
            <Text className={`text-[10px] font-bold ml-1
              ${offer.availability === 'AVAILABLE' ? 'text-emerald-600' : ''}
              ${offer.availability === 'FEW_LEFT' ? 'text-amber-600' : ''}
              ${offer.availability === 'SOLD_OUT' ? 'text-slate-400' : ''}
            `}>
              {offer.availability === 'SOLD_OUT' ? t("soldOut") : offer.availability === 'FEW_LEFT' ? t("onlyLeft", { count: 3 }) : t("seatsAvailable", { count: 12 })}
            </Text>
          </View>
        </View>

        <Pressable 
          className={`px-4 py-2.5 rounded-xl will-change-pressable will-change-variable ${isSoldOut ? 'bg-slate-200' : 'bg-[#ee237c] active:bg-pink-700'}`}
          disabled={isSoldOut}
          onPress={() => onSelect(offer)}
        >
          <Text className={`font-bold text-xs ${isSoldOut ? 'text-slate-400' : 'text-white'}`}>
            {isSoldOut ? t("soldOut") : t("selectSeats")}
          </Text>
        </Pressable>
      </View>
    </View>
  );
}
