"use client";

import { useTranslation } from "react-i18next";
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
import i18n from "@/lib/i18n";

const items: { icon: typeof UserCircleIcon; labelKey: string; route: string; valueKey?: string; badge?: string }[] = [
  { icon: UserCircleIcon, labelKey: "settings:personalInformation", route: "/personal-info" },
  { icon: GlobeIcon, labelKey: "settings:language", route: "/language", valueKey: "settings:currentLanguage" },
  { icon: Notification03Icon, labelKey: "settings:notifications", route: "/notifications" },
  { icon: Shield01Icon, labelKey: "settings:privacySecurity", route: "/privacy-security" },
];

const moreItems: { icon: any; labelKey: string; route: string; badge?: string }[] = [
  { icon: HelpCircleIcon, labelKey: "settings:helpSupport", route: "/help-support" },
  { icon: LegalDocument01Icon, labelKey: "settings:termsPrivacy", route: "/terms-privacy" },
];

function getLocaleLabel(locale: string) {
  return locale === "fr" ? i18n.t("settings:french") : i18n.t("settings:english");
}

export function AccountSettingsList() {
  const { t } = useTranslation("settings");
  const locale = i18n.language;

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
        {t("account")}
      </Text>

      {items.map((item, index) => (
        <>
          <Pressable
            key={item.labelKey}
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
              {t(item.labelKey as any)}
            </Text>

            {item.valueKey ? (
              <View style={{ marginRight: Spacing.two }}>
                <Text style={{ fontSize: 13, fontWeight: "500", color: Colors.light.textSecondary }}>
                  {item.valueKey === "settings:currentLanguage" ? getLocaleLabel(locale) : t(item.valueKey as any)}
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
            key={item.labelKey}
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
              {t(item.labelKey as any)}
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
