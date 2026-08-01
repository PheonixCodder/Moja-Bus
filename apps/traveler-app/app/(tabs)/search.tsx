import Animated from "react-native-reanimated";
import { Text, View } from "react-native";
import { useScreenTransition } from "@/hooks/use-screen-transition";
import { useTranslation } from "react-i18next";

export default function SearchScreen() {
  const { t } = useTranslation("common");
  const animatedStyle = useScreenTransition();
  return (
    <Animated.View style={[{ flex: 1 }, animatedStyle]}>
      <View className="flex-1 items-center justify-center bg-background">
        <Text className="text-2xl font-bold text-foreground">{t("search")}</Text>
      </View>
    </Animated.View>
  );
}
