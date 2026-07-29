import { Notification03Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Pressable, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "./ui/text";

type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        paddingTop: insets.top + 30,
        paddingBottom: 16,
        paddingHorizontal: 20,
        flexDirection: "row",
        alignItems: "flex-start",
        justifyContent: "space-between",
      }}
    >
      <View style={{ flex: 1, gap: 4 }}>
        <Text className="text-2xl font-bold text-foreground">{title}</Text>
        {description && (
          <Text className="text-muted-foreground text-sm">{description}</Text>
        )}
      </View>
      <Pressable
        onPress={() => {}}
        style={({ pressed }) => ({
          opacity: pressed ? 0.7 : 1,
          marginTop: 4,
        })}
      >
        <HugeiconsIcon icon={Notification03Icon} size={24} color="#a3a3a3" />
      </Pressable>
    </View>
  );
}
