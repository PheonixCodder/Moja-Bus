import { SearchView } from "@/features/search/views/search-view";
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
