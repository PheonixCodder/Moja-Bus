import Animated from "react-native-reanimated";
import { Text, View } from "react-native";
import { useScreenTransition } from "@/hooks/use-screen-transition";
import { SettingsView } from "@/features/settings/views/settings-view";

export default function SettingsScreen() {
  const animatedStyle = useScreenTransition();
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <SettingsView />
    </Animated.View>
  );
}
