import { useLocalSearchParams } from "expo-router";
import { useScreenTransition } from "@/hooks/use-screen-transition";
import { useTranslation } from "react-i18next";
import Animated from "react-native-reanimated";
import { View } from "react-native";
import { TicketsView } from "@/features/booking/screens/tickets";

export default function TicketScreen() {
  const { token } = useLocalSearchParams<{ token: string }>();
  const animatedStyle = useScreenTransition();
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <View className="flex-1 bg-background">
        <TicketsView />
      </View>
    </Animated.View>
  );
}