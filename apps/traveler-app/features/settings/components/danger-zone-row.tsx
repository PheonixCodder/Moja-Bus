import { Delete01Icon, Logout01Icon, Shield01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Alert, Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";
import { Colors, Spacing } from "@moja/theme/tokens";

export function DangerZoneRow() {
  return (
    <View>
      <Pressable
        onPress={() => {
          Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Log Out", style: "destructive", onPress: () => {} },
            ],
          );
        }}
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: Spacing.four,
          paddingHorizontal: 20,
          opacity: pressed ? 0.6 : 1,
        })}
      >
        <View style={{ width: Spacing.three, alignItems: "center", marginRight: Spacing.five }}>
          <HugeiconsIcon icon={Logout01Icon} size={20} color={Colors.light.textSecondary} />
        </View>
        <Text style={{ fontSize: 15, fontWeight: "500", color: Colors.light.text }}>Log Out</Text>
      </Pressable>

    </View>
  );
}