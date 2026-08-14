import { SearchView } from "@/features/search/screens/search";
import { useScreenTransition } from "@/hooks/use-screen-transition";
import Animated from "react-native-reanimated";

export default function SearchScreen() {
  const animatedStyle = useScreenTransition();
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <SearchView />
    </Animated.View>
  );
}
