import { useScreenTransition } from "@/hooks/use-screen-transition";
import { useTranslation } from "react-i18next";
import Animated from "react-native-reanimated";
import { View } from "react-native";
import { BookingsView } from "@/features/booking/views/bookings-view";

export default function BookingsScreen() {
  const { t } = useTranslation("common");
  const animatedStyle = useScreenTransition();
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <View className="flex-1 bg-background">
        <BookingsView />
      </View>
    </Animated.View>
  );
}