import {
  ArrowRight01Icon,
  QrCodeIcon,
  Shield01Icon,
  Ticket01Icon,
} from '@hugeicons/core-free-icons';
import { HugeiconsIcon } from '@hugeicons/react-native';
import { Colors } from '@moja/theme/tokens';
import * as Haptics from 'expo-haptics';
import { Pressable, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { Text } from '@/components/ui/text';
import { formatDateWithWeekday, formatTimeOnly } from '../lib/format-time';

type DigitalTicketCardProps = {
  bookingReference: string;
  companyName: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
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
  destination,
  departureTime,
  arrivalTime,
  seatLabel,
  passengerName,
  status = 'CONFIRMED',
  onPress,
  onPressIn,
}: DigitalTicketCardProps) {
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
      CONFIRMED: 'VALID',
      PENDING_PAYMENT: 'PENDING',
      EXPIRED: 'EXPIRED',
      CANCELLED: 'CANCELLED',
      COMPLETED: 'COMPLETED',
    }[status ?? 'CONFIRMED'] ?? 'VALID';

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
              <Text className="text-muted-foreground font-mono text-[10px]">
                REF: {bookingReference}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center gap-1 rounded-full border border-emerald-500/20 bg-emerald-500/10 px-2 py-0.5">
            <HugeiconsIcon icon={Shield01Icon} size={10} color="#10b981" />
            <Text className="text-[9px] font-extrabold tracking-widest text-emerald-600 uppercase">
              {badgeLabel}
            </Text>
          </View>
        </View>

        {/* Route Body Section */}
        <View className="flex-row items-center justify-between p-4">
          <View className="flex-1">
            <Text className="text-muted-foreground text-[10px] font-bold tracking-widest uppercase">
              FROM
            </Text>
            <Text className="text-foreground text-base font-extrabold" numberOfLines={1}>
              {origin}
            </Text>
            <Text className="text-primary mt-0.5 text-xs font-semibold">
              {formatTimeOnly(departureTime)}
            </Text>
            <Text className="text-muted-foreground mt-0.5 text-[10px] font-semibold">
              {formatDateWithWeekday(departureTime)}
            </Text>
          </View>

          <View className="items-center px-3">
            <HugeiconsIcon icon={ArrowRight01Icon} size={18} color={Colors.light.primary} />
          </View>

          <View className="flex-1 items-end">
            <Text className="text-muted-foreground text-right text-[10px] font-bold tracking-widest uppercase">
              TO
            </Text>
            <Text className="text-foreground text-right text-base font-extrabold" numberOfLines={1}>
              {destination}
            </Text>
            <Text className="text-primary mt-0.5 text-right text-xs font-semibold">
              {formatTimeOnly(arrivalTime)}
            </Text>
            <Text className="text-muted-foreground mt-0.5 text-right text-[10px] font-semibold">
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
            <Text className="text-muted-foreground text-[10px] font-bold tracking-wider uppercase">
              PASSENGER
            </Text>
            <Text className="text-foreground text-xs font-bold" numberOfLines={1}>
              {passengerName || 'Valued Traveler'}
            </Text>
            <Text className="text-primary mt-0.5 text-[11px] font-extrabold">
              Seat {seatLabel || 'Gen'}
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
