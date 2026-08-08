import {
  Bus01Icon,
  Calendar01Icon,
  Clock01Icon,
  Location01Icon,
  Ticket01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Colors } from '@moja/theme/tokens';
import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';
import { Text } from '@/components/ui/text';
import { useHoldCountdown } from '../hooks/use-hold-countdown';
import { formatDate, formatTimeOnly } from '../lib/format-time';

export type BookingStatus = 'CONFIRMED' | 'PENDING_PAYMENT' | 'COMPLETED' | 'CANCELLED' | 'EXPIRED';

export type BookingCardData = {
  bookingReference: string;
  status: BookingStatus;
  companyName: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  seatLabel?: string;
  farePaidXOF?: number;
  holdExpiresAt?: string;
};

type BookingCardProps = {
  booking: BookingCardData;
  onPress: () => void;
  onPressIn?: () => void;
};

const STATUS_CONFIG: Record<
  BookingStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  CONFIRMED: {
    label: 'Confirmed',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-600',
    border: 'border-emerald-500/20',
  },
  PENDING_PAYMENT: {
    label: 'Awaiting Payment',
    bg: 'bg-amber-500/10',
    text: 'text-amber-600',
    border: 'border-amber-500/20',
  },
  COMPLETED: {
    label: 'Completed',
    bg: 'bg-blue-500/10',
    text: 'text-blue-600',
    border: 'border-blue-500/20',
  },
  CANCELLED: {
    label: 'Cancelled',
    bg: 'bg-rose-500/10',
    text: 'text-rose-600',
    border: 'border-rose-500/20',
  },
  EXPIRED: {
    label: 'Expired',
    bg: 'bg-neutral-500/10',
    text: 'text-neutral-500',
    border: 'border-neutral-500/20',
  },
};

export function BookingCard({ booking, onPress, onPressIn }: BookingCardProps) {
  const statusInfo = STATUS_CONFIG[booking.status] ?? STATUS_CONFIG.EXPIRED;
  const isPending = booking.status === 'PENDING_PAYMENT';
  const countdown = useHoldCountdown(
    isPending && booking.holdExpiresAt ? booking.holdExpiresAt : ''
  );

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    onPress();
  };

  const initials = (booking.companyName || 'MB').slice(0, 2).toUpperCase();

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={onPressIn}
      accessibilityRole="button"
      accessibilityLabel={`${booking.origin} to ${booking.destination}, ${statusInfo.label}, ${booking.bookingReference}`}
      style={({ pressed }) => ({
        transform: [{ scale: pressed ? 0.98 : 1 }],
        opacity: pressed ? 0.9 : 1,
      })}
      className="bg-card border-border mb-3 overflow-hidden rounded-2xl border p-4 shadow-sm">
      {/* Top Header: Company Avatar + Name + BookingRef + Status Badge */}
      <View className="mb-3.5 flex-row items-center justify-between">
        <View className="mr-2 min-w-0 flex-1 flex-row items-center gap-2.5">
          <View className="bg-primary/10 border-primary/20 h-10 w-10 shrink-0 items-center justify-center rounded-full border">
            <Text className="text-primary text-xs font-black">{initials}</Text>
          </View>
          <View className="min-w-0 flex-1">
            <Text className="text-foreground truncate text-sm font-bold" numberOfLines={1}>
              {booking.companyName || 'Moja Bus'}
            </Text>
            <Text className="text-muted-foreground font-mono text-[11px]">
              {booking.bookingReference}
            </Text>
          </View>
        </View>

        <View className={`rounded-full border px-2.5 py-1 ${statusInfo.bg} ${statusInfo.border}`}>
          <Text
            className={`text-[10px] font-extrabold tracking-wider uppercase ${statusInfo.text}`}>
            {statusInfo.label}
          </Text>
        </View>
      </View>

      {/* Hold Countdown Warning Banner if Pending */}
      {isPending && countdown && countdown !== 'Expired' ? (
        <View className="mb-3 flex-row items-center gap-1.5 rounded-xl border border-amber-500/20 bg-amber-500/10 px-3 py-1.5">
          <HugeiconsIcon icon={Clock01Icon} size={14} color="#d97706" />
          <Text className="text-xs font-semibold text-amber-700">Hold expires in {countdown}</Text>
        </View>
      ) : null}

      {/* Route Visual Track */}
      <View className="my-2 flex-row items-center justify-between px-1">
        {/* Origin */}
        <View className="flex-1">
          <Text className="text-foreground text-base font-extrabold">
            {formatTimeOnly(booking.departureTime)}
          </Text>
          <Text className="text-muted-foreground mt-0.5 text-xs font-semibold" numberOfLines={1}>
            {booking.origin}
          </Text>
          <Text className="text-muted-foreground/70 text-[10px]">
            {formatDate(booking.departureTime)}
          </Text>
        </View>

        {/* Middle Track Line + Bus Icon */}
        <View className="flex-1 items-center px-2">
          <View className="bg-border relative h-[2px] w-full items-center justify-center">
            <View className="bg-muted-foreground/40 absolute left-0 h-2 w-2 rounded-full" />
            <View className="bg-card z-10 px-1.5">
              <HugeiconsIcon icon={Bus01Icon} size={16} color={Colors.light.primary} />
            </View>
            <View className="bg-primary absolute right-0 h-2 w-2 rounded-full" />
          </View>
        </View>

        {/* Destination */}
        <View className="flex-1 items-end">
          <Text className="text-foreground text-base font-extrabold">
            {formatTimeOnly(booking.arrivalTime)}
          </Text>
          <Text
            className="text-muted-foreground mt-0.5 text-right text-xs font-semibold"
            numberOfLines={1}>
            {booking.destination}
          </Text>
          <Text className="text-muted-foreground/70 text-right text-[10px]">
            {formatDate(booking.arrivalTime)}
          </Text>
        </View>
      </View>

      {/* Footer: Seat + Fare */}
      <View className="border-border/60 mt-2 flex-row items-center justify-between border-t pt-3">
        <View className="flex-row items-center gap-1.5">
          <HugeiconsIcon icon={Ticket01Icon} size={14} color={Colors.light.textSecondary} />
          <Text className="text-muted-foreground text-xs font-medium">
            {booking.seatLabel ? `Seat ${booking.seatLabel}` : 'Reserved'}
          </Text>
        </View>

        {booking.farePaidXOF ? (
          <Text className="text-primary text-sm font-black">
            {booking.farePaidXOF.toLocaleString()} XOF
          </Text>
        ) : null}
      </View>
    </Pressable>
  );
}
