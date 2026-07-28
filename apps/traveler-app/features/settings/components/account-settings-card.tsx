import {
  ArrowRight02Icon,
  GlobeIcon,
  HelpCircleIcon,
  LegalDocument01Icon,
  Notification03Icon,
  Shield01Icon,
  SlidersHorizontalIcon,
  UserCircleIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";

const items = [
  { icon: UserCircleIcon, label: "Personal Information", route: "/personal-info" },
  { icon: GlobeIcon, label: "Language", value: "English", route: "/language" },
  { icon: Notification03Icon, label: "Notifications", route: "/notifications" },
  { icon: Shield01Icon, label: "Privacy & Security", route: "/privacy-security" },
  { icon: SlidersHorizontalIcon, label: "Travel Preferences", route: "/travel-preferences" },
  { icon: HelpCircleIcon, label: "Help & Support", route: "/help-support" },
  { icon: LegalDocument01Icon, label: "Terms & Privacy", route: "/terms-privacy" },
];

export function AccountSettingsCard() {
  return (
    <View>
      <Text
        style={{
          fontSize: 16,
          fontWeight: "800",
          color: "#1c1c1e",
          marginBottom: 12,
        }}
      >
        Account
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
        {items.map((item, index) => (
          <Pressable
            key={item.label}
            onPress={() => router.push(item.route as any)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: 14,
              paddingHorizontal: 16,
              opacity: pressed ? 0.7 : 1,
              borderBottomWidth: index < items.length - 1 ? 0.5 : 0,
              borderBottomColor: "#e5e5e5",
            })}
          >
            <View
              style={{
                width: 28,
                alignItems: "center",
                marginRight: 14,
              }}
            >
              <HugeiconsIcon icon={item.icon} size={22} color="#3a3a3c" />
            </View>

            <Text
              style={{
                fontSize: 15,
                fontWeight: "600",
                color: "#1c1c1e",
                flex: 1,
              }}
            >
              {item.label}
            </Text>

            {item.value ? (
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: "500",
                  color: "#ee237c",
                  marginRight: 8,
                }}
              >
                {item.value}
              </Text>
            ) : null}

            <HugeiconsIcon icon={ArrowRight02Icon} size={18} color="#c7c7cc" />
          </Pressable>
        ))}
      </View>
    </View>
  );
}
