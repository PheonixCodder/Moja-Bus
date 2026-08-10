"use client";

import { useTranslation } from "react-i18next";
import {
  ArrowRight02Icon,
  GlobeIcon,
  HelpCircleIcon,
  LegalDocument01Icon,
  Notification03Icon,
  Shield01Icon,
  UserCircleIcon,
  UserGroupIcon,
  Wallet01Icon,
  Comment01Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react-native";
import { Pressable, View } from "react-native";
import { router } from "expo-router";
import { Text } from "@/components/ui/text";
import i18n from "@/lib/i18n";

const primaryItems = [
  { icon: UserCircleIcon, labelKey: "settings:personalInformation", route: "/personal-info" },
  { icon: UserGroupIcon, labelKey: "settings:passengersLabel", route: "/passengers" },
  { icon: Wallet01Icon, labelKey: "settings:wallet", route: "/wallet" },
  { icon: Notification03Icon, labelKey: "settings:notifications", route: "/notifications" },
  { icon: Comment01Icon, label: "My Trip Reviews", route: "/reviews" },
  { icon: GlobeIcon, labelKey: "settings:language", route: "/language", valueKey: "settings:currentLanguage" },
];

const securityAndSupportItems = [
  { icon: Shield01Icon, labelKey: "settings:privacySecurity", route: "/privacy-security" },
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
      <Text className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2 mt-4 px-5">
        Account & Preferences
      </Text>

      {primaryItems.map((item) => (
        <View key={item.route}>
          <Pressable
            onPress={() => router.push(item.route as any)}
            className="flex-row items-center py-4 px-5 active:opacity-60"
          >
            <View className="w-6 items-center mr-5">
              <HugeiconsIcon icon={item.icon} size={20} color="#ee237c" />
            </View>

            <Text className="text-base font-medium text-slate-900 flex-1">
              {item.labelKey ? t(item.labelKey as any) : item.label}
            </Text>

            {item.valueKey ? (
              <View className="mr-2">
                <Text className="text-xs font-medium text-slate-500">
                  {item.valueKey === "settings:currentLanguage" ? getLocaleLabel(locale) : t(item.valueKey as any)}
                </Text>
              </View>
            ) : null}

            <HugeiconsIcon icon={ArrowRight02Icon} size={16} color="#94a3b8" />
          </Pressable>

          <View className="h-[0.5px] bg-slate-100 mx-5" />
        </View>
      ))}

      <Text className="text-[11px] font-bold text-slate-400 tracking-wider uppercase mb-2 mt-5 px-5">
        Support & Security
      </Text>

      {securityAndSupportItems.map((item, index) => (
        <View key={item.route}>
          <Pressable
            onPress={() => router.push(item.route as any)}
            className="flex-row items-center py-4 px-5 active:opacity-60"
          >
            <View className="w-6 items-center mr-5">
              <HugeiconsIcon icon={item.icon} size={20} color="#ee237c" />
            </View>

            <Text className="text-base font-medium text-slate-900 flex-1">
              {t(item.labelKey as any)}
            </Text>

            <HugeiconsIcon icon={ArrowRight02Icon} size={16} color="#94a3b8" />
          </Pressable>
          {index < securityAndSupportItems.length - 1 ? (
            <View className="h-[0.5px] bg-slate-100 mx-5" />
          ) : null}
        </View>
      ))}
    </View>
  );
}
