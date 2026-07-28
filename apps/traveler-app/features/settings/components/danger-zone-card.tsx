import { Delete01Icon, Logout01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Alert, Pressable, View } from "react-native";
import { Text } from "@/components/ui/text";

export function DangerZoneCard() {
  return (
    <View
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 16,
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.06,
        shadowRadius: 8,
        elevation: 3,
      }}
    >
      <Pressable
        onPress={() =>
          Alert.alert(
            "Log Out",
            "Are you sure you want to log out?",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Log Out", style: "destructive", onPress: () => {} },
            ],
          )
        }
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          paddingHorizontal: 16,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View
          style={{
            width: 28,
            alignItems: "center",
            marginRight: 14,
          }}
        >
          <HugeiconsIcon icon={Logout01Icon} size={22} color="#ee237c" />
        </View>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: "#ee237c",
          }}
        >
          Log Out
        </Text>
      </Pressable>

      <View style={{ height: 0.5, backgroundColor: "#e5e5e5", marginHorizontal: 16 }} />

      <Pressable
        onPress={() =>
          Alert.alert(
            "Delete Account",
            "This action cannot be undone. All your data will be permanently deleted.",
            [
              { text: "Cancel", style: "cancel" },
              { text: "Delete", style: "destructive", onPress: () => {} },
            ],
          )
        }
        style={({ pressed }) => ({
          flexDirection: "row",
          alignItems: "center",
          paddingVertical: 14,
          paddingHorizontal: 16,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <View
          style={{
            width: 28,
            alignItems: "center",
            marginRight: 14,
          }}
        >
          <HugeiconsIcon icon={Delete01Icon} size={22} color="#ee237c" />
        </View>
        <Text
          style={{
            fontSize: 15,
            fontWeight: "600",
            color: "#ee237c",
          }}
        >
          Delete Account
        </Text>
      </Pressable>
    </View>
  );
}
