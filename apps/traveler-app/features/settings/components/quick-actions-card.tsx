import { ArrowRight02Icon, UserGroupIcon, Wallet01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";

const actions = [
  {
    icon: Wallet01Icon,
    title: "Wallet",
    subtitle: "Available Balance: 0 XOF",
    route: "/wallet",
  },
  {
    icon: UserGroupIcon,
    title: "Saved Passengers",
    subtitle: "1 passenger saved",
    route: "/saved-passengers",
  },
];

export function QuickActionsCard() {
  return (
    <View>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "900",
          color: "#1c1c1e",
          marginBottom: 12,
        }}
      >
        Quick Actions
      </Text>

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
        {actions.map((item, index) => (
          <Pressable
            key={item.title}
            onPress={() => router.push(item.route as any)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 16,
              paddingHorizontal: 16,
              opacity: pressed ? 0.7 : 1,
              borderBottomWidth: index < actions.length - 1 ? 0.5 : 0,
              borderBottomColor: "#e5e5e5",
            })}
          >
            <View
              style={{
                width: 44,
                height: 44,
                borderRadius: 22,
                backgroundColor: "rgba(238, 35, 124, 0.1)",
                alignItems: "center",
                justifyContent: "center",
                marginRight: 14,
              }}
            >
              <HugeiconsIcon icon={item.icon} size={20} color="#ee237c" />
            </View>

            <View style={{ flex: 1 }}>
              <Text
                style={{
                  fontSize: 15,
                  fontWeight: "600",
                  color: "#1c1c1e",
                }}
              >
                {item.title}
              </Text>
              <Text
                style={{
                  fontSize: 13,
                  color: "#8e8e93",
                  marginTop: 2,
                }}
              >
                {item.subtitle}
              </Text>
            </View>

            <HugeiconsIcon icon={ArrowRight02Icon} size={18} color="#c7c7cc" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
