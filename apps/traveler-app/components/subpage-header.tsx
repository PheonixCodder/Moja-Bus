import { ArrowLeft02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router, type Href } from "expo-router";
import { Text } from "./ui/text";

type SubpageHeaderProps = {
  title: string;
  backRoute?: Href;
};

export function SubpageHeader({ title, backRoute }: SubpageHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + 12,
        paddingBottom: 16,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "center",
      }}
    >
      <Pressable
        onPress={() => {
          if (backRoute) {
            router.navigate(backRoute);
          } else {
            router.back();
          }
        }}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
          paddingRight: 12,
        })}
      >
        <HugeiconsIcon icon={ArrowLeft02Icon} size={24} color="#a3a3a3" />
      </Pressable>
      <View style={{ flex: 1, alignItems: "center" }}>
        <Text className="text-lg font-semibold text-foreground">{title}</Text>
      </View>
      <View style={{ width: 24 }} />
    </View>
  );
}
