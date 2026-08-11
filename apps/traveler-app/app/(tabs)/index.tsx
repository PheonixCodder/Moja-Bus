import Animated from "react-native-reanimated";
import { useScreenTransition } from "@/hooks/use-screen-transition";
import { HomeView } from "@/features/home/views/home-view";

export default function HomeScreen() {
  const animatedStyle = useScreenTransition();
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <HomeView />
    </Animated.View>
  );
}
