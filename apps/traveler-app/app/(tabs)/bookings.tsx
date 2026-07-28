import Animated from "react-native-reanimated";
import { Text, View } from "react-native";
import { useScreenTransition } from "@/hooks/use-screen-transition";

export default function BookingsScreen() {
  const animatedStyle = useScreenTransition();
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-2xl font-bold text-foreground">Bookings</Text>
      </View>
    </Animated.View>
  );
}
