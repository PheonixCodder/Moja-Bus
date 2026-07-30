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
import { Colors, Spacing } from "@moja/theme/tokens";

const items: { icon: typeof UserCircleIcon; label: string; route: string; value?: string; badge?: string }[] = [
  { icon: UserCircleIcon, label: "Personal Information", route: "/personal-info" },
  { icon: GlobeIcon, label: "Language", value: "English", route: "/language" },
  { icon: Notification03Icon, label: "Notifications", route: "/notifications" },
  { icon: Shield01Icon, label: "Privacy & Security", route: "/privacy-security" },
];


const moreItems: { icon: any; label: string; route: string; badge?: string }[] = [
  { icon: HelpCircleIcon, label: "Help & Support", route: "/help-support" },
  { icon: LegalDocument01Icon, label: "Terms & Privacy", route: "/terms-privacy" },
];

export function AccountSettingsList() {
  return (
    <View>
      <Text
        style={{
          fontSize: 11,
          fontWeight: "600",
          color: Colors.light.textSecondary,
          letterSpacing: 0.8,
          textTransform: "uppercase",
          marginBottom: Spacing.two,
          marginTop: Spacing.five,
          paddingHorizontal: 20,
        }}
      >
        Account
      </Text>

      {items.map((item, index) => (
        <>
          <Pressable
            key={item.label}
            onPress={() => router.push(item.route as any)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: Spacing.four,
              paddingHorizontal: 20,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <View style={{ width: Spacing.three, alignItems: "center", marginRight: Spacing.five }}>
              <HugeiconsIcon icon={item.icon} size={20} color={Colors.light.text} />
            </View>

            <Text style={{ fontSize: 15, fontWeight: "500", color: Colors.light.text, flex: 1 }}>
              {item.label}
            </Text>

            {item.value ? (
              <View style={{ marginRight: Spacing.two }}>
                <Text style={{ fontSize: 13, fontWeight: "500", color: Colors.light.textSecondary }}>
                  {item.value}
                </Text>
              </View>
            ) : null}

            {item.badge ? (
              <View style={{ marginRight: Spacing.two }}>
                <Text style={{ fontSize: 12, fontWeight: "500", color: Colors.light.primary }}>
                  {item.badge}
                </Text>
              </View>
            ) : null}

            <HugeiconsIcon icon={ArrowRight02Icon} size={16} color={Colors.light.textSecondary} />
          </Pressable>

          <View style={{ height: 0.5, backgroundColor: Colors.light.backgroundSelected, marginHorizontal: 20 }} />
        </>
      ))}


      {moreItems.map((item, index) => (
        <>
          <Pressable
            key={item.label}
            onPress={() => router.push(item.route as any)}
            style={({ pressed }) => ({
              flexDirection: "row",
              alignItems: "center",
              paddingVertical: Spacing.four,
              paddingHorizontal: 20,
              opacity: pressed ? 0.6 : 1,
            })}
          >
            <View style={{ width: Spacing.three, alignItems: "center", marginRight: Spacing.five }}>
              <HugeiconsIcon icon={item.icon} size={20} color={Colors.light.text} />
            </View>

            <Text style={{ fontSize: 15, fontWeight: "500", color: Colors.light.text, flex: 1 }}>
              {item.label}
            </Text>

            {item.badge ? (
              <View style={{ marginRight: Spacing.two }}>
                <Text style={{ fontSize: 12, fontWeight: "500", color: Colors.light.primary }}>
                  {item.badge}
                </Text>
              </View>
            ) : null}

            <HugeiconsIcon icon={ArrowRight02Icon} size={16} color={Colors.light.textSecondary} />
          </Pressable>
          {index < moreItems.length - 1 ? (
            <View style={{ height: 0.5, backgroundColor: Colors.light.backgroundSelected, marginHorizontal: 20 }} />
          ) : null}
        </>
      ))}
    </View>
  );
}
