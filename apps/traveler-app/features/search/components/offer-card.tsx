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
  const { t } = useTranslation('search');
  const isSoldOut = offer.availability === 'SOLD_OUT';

  const getClassBadgeStyle = (c: string) => {
    switch (c) {
      case 'VIP':
        return { bg: '#fef3c7', border: '#fde68a', text: '#78350f' };
      case 'Standard':
        return { bg: '#eff6ff', border: '#bfdbfe', text: '#1e40af' };
      default:
        return { bg: '#f8fafc', border: '#e2e8f0', text: '#475569' };
    }
  };

  const badgeStyle = getClassBadgeStyle(offer.busClass);

  return (
    <View
      style={{
        backgroundColor: '#ffffff',
        borderRadius: 24,
        padding: 16,
        marginHorizontal: 16,
        marginBottom: 14,
        borderWidth: 1,
        borderColor: '#f1f5f9',
        opacity: isSoldOut ? 0.65 : 1,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 3 },
        shadowOpacity: 0.04,
        shadowRadius: 10,
        elevation: 2,
      }}
    >
      {/* ── Header: Operator Avatar & Bus Class Badge ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 }}>
          <View
            style={{
              width: 36,
              height: 36,
              borderRadius: 12,
              backgroundColor: '#fce7f3',
              borderWidth: 1,
              borderColor: '#fbcfe8',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Text style={{ color: '#ee237c', fontWeight: '900', fontSize: 13 }}>
              {(offer.operatorName || 'MB').substring(0, 2).toUpperCase()}
            </Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: 15, fontWeight: '800', color: '#0f172a' }} numberOfLines={1}>
              {offer.operatorName}
            </Text>
            {offer.isExpress && (
              <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 4 }}>
                <HugeiconsIcon icon={SparklesIcon} size={10} color="#7c3aed" />
                <Text style={{ fontSize: 10, fontWeight: '800', color: '#7c3aed', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Express Non-Stop
                </Text>
              </View>
            )}
          </View>
        </View>

        {/* Bus Class Badge */}
        <View
          style={{
            paddingHorizontal: 10,
            paddingVertical: 4,
            borderRadius: 12,
            backgroundColor: badgeStyle.bg,
            borderWidth: 1,
            borderColor: badgeStyle.border,
          }}
        >
          <Text style={{ fontSize: 10, fontWeight: '900', color: badgeStyle.text, textTransform: 'uppercase', letterSpacing: 0.8 }}>
            {offer.busClass}
          </Text>
        </View>
      </View>

      {/* ── Timeline Box ── */}
      <View
        style={{
          backgroundColor: '#f8fafc',
          borderRadius: 18,
          padding: 12,
          flexDirection: 'row',
          alignItems: 'center',
          borderWidth: 1,
          borderColor: '#f1f5f9',
          marginBottom: 14,
        }}
      >
        {/* Departure */}
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>{offer.departureTime}</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginTop: 2 }} numberOfLines={1}>
            {offer.departureCity}
          </Text>
          <Text style={{ fontSize: 10, fontWeight: '500', color: '#94a3b8', marginTop: 1 }} numberOfLines={1}>
            {offer.departureTerminal}
          </Text>
        </View>

        {/* Timeline Indicator */}
        <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6 }}>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#94a3b8', marginBottom: 4 }}>{offer.duration}</Text>
          <View style={{ width: '100%', flexDirection: 'row', alignItems: 'center' }}>
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#cbd5e1' }} />
            <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
            <View
              style={{
                width: 24,
                height: 24,
                borderRadius: 12,
                backgroundColor: '#ffffff',
                borderWidth: 1.5,
                borderColor: '#fce7f3',
                alignItems: 'center',
                justifyContent: 'center',
                shadowColor: '#ee237c',
                shadowOffset: { width: 0, height: 1 },
                shadowOpacity: 0.1,
                shadowRadius: 3,
                elevation: 1,
              }}
            >
              <HugeiconsIcon icon={Bus01Icon} size={12} color="#ee237c" />
            </View>
            <View style={{ flex: 1, height: 1, backgroundColor: '#e2e8f0' }} />
            <View style={{ width: 6, height: 6, borderRadius: 3, backgroundColor: '#ee237c' }} />
          </View>
          <Text style={{ fontSize: 10, fontWeight: '700', color: '#64748b', marginTop: 4 }}>
            {offer.stopCount === 0 ? t('directRoute') : `${offer.stopCount} stops`}
          </Text>
        </View>

        {/* Arrival */}
        <View style={{ flex: 1, alignItems: 'flex-end' }}>
          <Text style={{ fontSize: 18, fontWeight: '900', color: '#0f172a' }}>{offer.arrivalTime}</Text>
          <Text style={{ fontSize: 12, fontWeight: '700', color: '#334155', marginTop: 2, textAlign: 'right' }} numberOfLines={1}>
            {offer.arrivalCity}
          </Text>
          <Text style={{ fontSize: 10, fontWeight: '500', color: '#94a3b8', marginTop: 1, textAlign: 'right' }} numberOfLines={1}>
            {offer.arrivalTerminal}
          </Text>
        </View>
      </View>

      {/* ── Footer: Price & Select Seats Button ── */}
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View>
          <Text style={{ fontSize: 20, fontWeight: '900', color: '#ee237c' }}>
            {formatPriceXOF(offer.priceXOF)}
          </Text>
          <View style={{ marginTop: 4 }}>
            {offer.availability === 'FEW_LEFT' ? (
              <View style={{ backgroundColor: '#fef3c7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                <Text style={{ color: '#92400e', fontSize: 10, fontWeight: '800' }}>Few Seats Left</Text>
              </View>
            ) : offer.availability === 'SOLD_OUT' ? (
              <View style={{ backgroundColor: '#f1f5f9', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                <Text style={{ color: '#64748b', fontSize: 10, fontWeight: '800' }}>{t('soldOut')}</Text>
              </View>
            ) : (
              <View style={{ backgroundColor: '#dcfce7', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 10 }}>
                <Text style={{ color: '#166534', fontSize: 10, fontWeight: '800' }}>Seats Available</Text>
              </View>
            )}
          </View>
        </View>

        <Pressable
          disabled={isSoldOut}
          onPress={() => onSelect(offer)}
          style={({ pressed }) => ({
            flexDirection: 'row',
            alignItems: 'center',
            gap: 6,
            paddingHorizontal: 18,
            paddingVertical: 12,
            borderRadius: 16,
            backgroundColor: isSoldOut ? '#e2e8f0' : pressed ? '#d01867' : '#ee237c',
            shadowColor: isSoldOut ? 'transparent' : '#ee237c',
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: isSoldOut ? 0 : 0.25,
            shadowRadius: 8,
            elevation: isSoldOut ? 0 : 4,
          })}
        >
          <Text style={{ color: isSoldOut ? '#94a3b8' : '#ffffff', fontWeight: '900', fontSize: 13 }}>
            {isSoldOut ? t('soldOut') : t('selectSeats')}
          </Text>
          {!isSoldOut && <HugeiconsIcon icon={ArrowRight01Icon} size={14} color="#ffffff" />}
        </Pressable>
      </View>
    </View>
  );
}
