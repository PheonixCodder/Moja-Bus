import type { PassengerBookingSummary } from '@moja/types';
import {
  ArrowRight01Icon,
  Bus01Icon,
  Clock01Icon,
  Ticket01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { formatLocationLabel } from '@/lib/format-location-label';
import { useHoldCountdown } from '../hooks/use-hold-countdown';
import { formatDate, formatDateWithWeekday, formatPriceXOF, formatTimeOnly } from '../lib/format-time';

type BookingCardProps = {
  booking: PassengerBookingSummary;
  onPress: () => void;
  onPressIn?: () => void;
};

const STATUS_CONFIG: Record<
  PassengerBookingSummary['status'],
  { labelKey: string; bg: string; text: string; border: string }
> = {
  CONFIRMED: {
    labelKey: 'confirmed',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    border: 'border-emerald-500/20',
  },
  PENDING_PAYMENT: {
    labelKey: 'awaitingPayment',
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-500/20',
  },
  COMPLETED: {
    labelKey: 'completed',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-500/20',
  },
  CANCELLED: {
    labelKey: 'cancelled',
    bg: 'bg-rose-500/10',
    text: 'text-rose-600',
    border: 'border-rose-500/20',
  },
  EXPIRED: {
    labelKey: 'expired',
    bg: 'bg-neutral-500/10',
    text: 'text-neutral-500',
    border: 'border-neutral-500/20',
  },
  REFUND_PENDING: {
    labelKey: 'refundPending',
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-500/20',
  },
};

export function BookingCard({ booking, onPress, onPressIn }: BookingCardProps) {
  const { t } = useTranslation('booking');
  const statusInfo = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.EXPIRED;
  const isPending = booking.status === 'PENDING_PAYMENT';
  const countdown = useHoldCountdown(
    isPending && booking.holdExpiresAt ? booking.holdExpiresAt.toString() : ''
  );

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const isUrban = booking.serviceType === 'URBAN';
  const originFormatted = formatLocationLabel({
    cityName: booking.originCityName,
    municipalityName: booking.originMunicipalityName,
    quarterName: booking.originQuarterName,
    isUrban,
  });

  const destFormatted = formatLocationLabel({
    cityName: booking.destinationCityName,
    municipalityName: booking.destinationMunicipalityName,
    quarterName: booking.destinationQuarterName,
    isUrban,
  });

  const seatCount = booking.seats?.length ?? 1;
  const seatLabels = booking.seats?.map((s) => s.seatLabel).join(', ') ?? '';
  const statusLabel = t(statusInfo.labelKey as any) as string;

  const initials = (booking.companyName || 'MB').slice(0, 2).toUpperCase();

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={onPressIn}
      accessibilityRole="button"
      accessibilityLabel={`${originFormatted} to ${destFormatted}, ${statusLabel}`}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.98 : 1 }],
        opacity: pressed ? 0.9 : 1,
      })}
      className="bg-card border-border mb-3.5 overflow-hidden rounded-2xl border p-4 shadow-xs">
      {/* Top Header: Company Avatar + Name + Group Reference + Status Badge */}
      <View className="mb-3.5 flex-row items-center justify-between">
        <View className="mr-2 min-w-0 flex-1 flex-row items-center gap-2.5">
          <View className="bg-primary/10 border-primary/20 h-10 w-10 shrink-0 items-center justify-center rounded-full border">
            <Text className="text-primary text-xs font-black">{initials}</Text>
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-foreground truncate text-sm font-bold" numberOfLines={1}>
              {booking.companyName || 'Moja Transport'}
            </Text>
            <Text className="text-muted-foreground font-mono text-sm">
              {booking.seats?.[0]?.bookingReference || booking.groupId}
            </Text>
          </View>
        </View>

        <View className={`rounded-full border px-2.5 py-1 ${statusInfo.bg} ${statusInfo.border}`}>
          <Text
            className={`text-xs font-extrabold tracking-wider uppercase ${statusInfo.text}`}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* Hold Countdown Warning Banner if Pending */}
      {isPending && countdown && countdown !== 'Expired' ? (
        <View className="mb-3 flex-row items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-2">
          <HugeiconsIcon icon={Clock01Icon} size={14} color="#d97706" />
          <Text className="text-xs font-semibold text-amber-700">
            {t('holdExpiresIn')} {countdown}
          </Text>
        </View>
      ) : null}

      {/* Route Track Header */}
      <View className="my-2 flex-row items-center justify-between px-1">
        {/* Origin */}
        <View className="flex-1">
          <Text className="text-foreground text-lg font-extrabold" numberOfLines={1}>
            {originFormatted}
          </Text>
          <Text className="text-muted-foreground mt-0.5 text-xs font-medium" numberOfLines={1}>
            {booking.originTerminalName}
          </Text>
          <Text className="text-primary mt-1 text-xs font-bold">
            {formatTimeOnly(booking.departureTime)}
          </Text>
          <Text className="text-muted-foreground/70 text-xs">
            {formatDateWithWeekday(booking.departureTime)}
          </Text>
        </View>

        {/* Arrow Divider */}
        <View className="items-center px-3">
          <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#ee237c" />
        </View>

        {/* Destination */}
        <View className="flex-1 items-end">
          <Text className="text-foreground text-right text-lg font-extrabold" numberOfLines={1}>
            {destFormatted}
          </Text>
          <Text
            className="text-muted-foreground mt-0.5 text-right text-xs font-medium"
            numberOfLines={1}>
            {booking.destinationTerminalName}
          </Text>
          <Text className="text-primary mt-1 text-right text-xs font-bold">
            {formatTimeOnly(booking.arrivalTime)}
          </Text>
          <Text className="text-muted-foreground/70 text-right text-xs">
            {formatDateWithWeekday(booking.arrivalTime)}
          </Text>
        </View>
      </View>

      {/* Footer: Passenger / Seats + Total Price */}
      <View className="border-border/60 mt-3 flex-row items-center justify-between border-t pt-3">
        <View className="flex-row items-center gap-1.5">
          <HugeiconsIcon icon={Ticket01Icon} size={14} color="#64748b" />
          <Text className="text-muted-foreground text-xs font-medium">
            {seatCount === 1
              ? t('seatSingle', { label: seatLabels })
              : t('seatsMultiple', { count: seatCount, labels: seatLabels })}
          </Text>
        </View>

        <Text className="text-primary text-sm font-black">
          {formatPriceXOF(booking.totalAmountXOF)}
        </Text>
      </View>
    </Pressable>
  );
}
