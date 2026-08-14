import {
  ArrowRight01Icon,
  QrCodeIcon,
  Shield01Icon,
  Ticket01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import * as Haptics from 'expo-haptics';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { formatDateWithWeekday, formatTimeOnly } from '../lib/format-time';

type DigitalTicketCardProps = {
  bookingReference: string;
  companyName: string;
  origin: string;
  originSub?: string;
  destination: string;
  destinationSub?: string;
  departureTime: string | Date;
  arrivalTime: string | Date;
  seatLabel: string;
  passengerName: string;
  status?: string;
  onPress?: () => void;
  onPressIn?: () => void;
};

export function DigitalTicketCard({
  bookingReference,
  companyName,
  origin,
  originSub,
  destination,
  destinationSub,
  departureTime,
  arrivalTime,
  seatLabel,
  passengerName,
  status = 'CONFIRMED',
  onPress,
  onPressIn,
}: DigitalTicketCardProps) {
  const { t } = useTranslation('booking');
  const scale = useSharedValue(1);

  const handlePress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    onPress?.();
  };

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97);
    onPressIn?.();
  };

  const handlePressOut = () => {
    scale.value = withSpring(1);
  };

  const badgeLabel =
    {
      CONFIRMED: t('confirmed'),
      PENDING_PAYMENT: t('pendingPayment'),
      EXPIRED: t('expired'),
      CANCELLED: t('cancelled'),
      COMPLETED: t('completed'),
    }[status ?? 'CONFIRMED'] ?? t('confirmed');

  return (
    <Animated.View style={animatedStyle} className="mb-4">
      <Pressable
        onPress={handlePress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        className="bg-card border-border relative overflow-hidden rounded-2xl border shadow-sm">
        {/* Top Section: Header */}
        <View className="bg-primary/5 border-border/40 flex-row items-center justify-between border-b p-4">
          <View className="mr-2 min-w-0 flex-1 flex-row items-center gap-2">
            <View className="bg-primary/10 border-primary/20 h-8 w-8 shrink-0 items-center justify-center rounded-full border">
              <HugeiconsIcon icon={Ticket01Icon} size={16} color="#ee237c" />
            </View>
            <View className="min-w-0 flex-1">
              <Text
                className="text-foreground truncate text-xs font-black tracking-wide uppercase"
                numberOfLines={1}>
                {companyName || 'Moja Express'}
              </Text>
              <Text className="text-muted-foreground font-mono text-xs">
                {t('refLabel')} {bookingReference}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5">
            <HugeiconsIcon icon={Shield01Icon} size={10} color="#10b981" />
            <Text className="text-xs font-extrabold tracking-widest text-emerald-600 uppercase">
              {badgeLabel}
            </Text>
          </View>
        </View>

        {/* Route Body Section */}
        <View className="flex-row items-center justify-between p-4">
          <View className="flex-1">
            <Text className="text-muted-foreground text-xs font-bold tracking-widest uppercase">
              {t('departure')}
            </Text>
            <Text className="text-foreground text-base font-extrabold" numberOfLines={1}>
              {origin || 'Origin'}
            </Text>
            {originSub ? (
              <Text className="text-muted-foreground text-xs" numberOfLines={1}>
                {originSub}
              </Text>
            ) : null}
            <Text className="text-primary mt-1 text-xs font-bold">
              {formatTimeOnly(departureTime)}
            </Text>
            <Text className="text-muted-foreground/80 mt-0.5 text-xs font-semibold">
              {formatDateWithWeekday(departureTime)}
            </Text>
          </View>

          <View className="items-center px-3">
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} color="#ee237c" />
          </View>

          <View className="flex-1 items-end">
            <Text className="text-muted-foreground text-right text-xs font-bold tracking-widest uppercase">
              {t('destination')}
            </Text>
            <Text className="text-foreground text-right text-base font-extrabold" numberOfLines={1}>
              {destination || 'Destination'}
            </Text>
            {destinationSub ? (
              <Text className="text-muted-foreground text-right text-xs" numberOfLines={1}>
                {destinationSub}
              </Text>
            ) : null}
            <Text className="text-primary mt-1 text-right text-xs font-bold">
              {formatTimeOnly(arrivalTime)}
            </Text>
            <Text className="text-muted-foreground/80 mt-0.5 text-right text-xs font-semibold">
              {formatDateWithWeekday(arrivalTime)}
            </Text>
          </View>
        </View>

        {/* Dashed Tear-Line with Side Notch Circles */}
        <View className="relative my-1 justify-center">
          {/* Left Notch */}
          <View className="bg-background border-border absolute -left-3.5 z-20 h-6 w-6 rounded-full border" />
          {/* Dashed Separator */}
          <View className="border-border/80 w-full border-t border-dashed" />
          {/* Right Notch */}
          <View className="bg-background border-border absolute -right-3.5 z-20 h-6 w-6 rounded-full border" />
        </View>

        {/* Footer: Passenger + Seat + QR Code Action */}
        <View className="bg-card flex-row items-center justify-between p-4">
          <View className="mr-2 flex-1">
            <Text className="text-muted-foreground text-xs font-bold tracking-wider uppercase">
              {t('passenger')}
            </Text>
            <Text className="text-foreground text-xs font-bold" numberOfLines={1}>
              {passengerName || 'Valued Traveler'}
            </Text>
            <Text className="text-primary mt-0.5 text-sm font-extrabold">
              {t('seatLabel')} {seatLabel || 'Gen'}
            </Text>
          </View>

          {/* QR Code Icon Button */}
          <View className="bg-primary/10 border-primary/20 h-11 w-11 items-center justify-center rounded-full border shadow-xs">
            <HugeiconsIcon icon={QrCodeIcon} size={22} color="#ee237c" />
          </View>
        </View>
      </Pressable>
    </Animated.View>
  );
}
