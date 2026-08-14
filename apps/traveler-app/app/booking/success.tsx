import { useLocalSearchParams } from "expo-router";
import { useScreenTransition } from "@/hooks/use-screen-transition";
import Animated from "react-native-reanimated";
import { View } from "react-native";
import { BookingSuccessView } from "@/features/booking/screens/booking-success";

export default function BookingSuccessScreen() {
  const { reference, total, method } = useLocalSearchParams<{
    reference: string;
    total?: string;
    method?: string;
  }>();

  const animatedStyle = useScreenTransition();
  const totalNum = total ? parseFloat(total) : undefined;
  const paymentMethod = method === "WALLET" ? "WALLET" : "PAYSTACK";

  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <View className="flex-1 bg-background">
        <BookingSuccessView
          bookingReference={reference ?? ""}
          totalAmountXOF={totalNum}
          paymentMethod={paymentMethod}
        />
      </View>
    </Animated.View>
  );
}
