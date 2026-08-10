import { ActivityIndicator, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useTranslation } from "react-i18next";
import { Text } from "@/components/ui/text";
import { BottomTabInset } from "@/constants/theme";
import { authClient } from "@/lib/auth-client";
import { ProfileHero } from "../components/profile-hero";
import { SettingsDetails } from "../components/settings-details";
import { AccountSettingsList } from "../components/account-settings-list";
import { DangerZoneRow } from "../components/danger-zone-row";

export function SettingsView() {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation("settings");
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <View className="flex-1 items-center justify-center bg-slate-900">
        <ActivityIndicator size="large" color="#ee237c" />
      </View>
    );
  }

  const user = session?.user;

  return (
    <ScrollView
      className="flex-1 bg-slate-900"
      contentContainerStyle={{ paddingBottom: BottomTabInset }}
    >
      <View
        className="px-5 pb-10"
        style={{ paddingTop: insets.top + 35 }}
      >
        {user ? (
          <View className="flex-row items-start">
            <ProfileHero
              name={user.name ?? "Traveler"}
              image={user.image}
            />
          </View>
        ) : (
          <View className="items-center py-10">
            <Text className="text-white/60 text-base">
              {t("signInToManage")}
            </Text>
          </View>
        )}
      </View>

      <View
        className="bg-white rounded-3xl mx-3 px-5 pt-6 shadow-xl"
        style={{ paddingBottom: BottomTabInset }}
      >
        <SettingsDetails />

        <AccountSettingsList />

        <View className="h-[0.5px] bg-slate-100 mx-5 mt-2" />

        <DangerZoneRow />
      </View>
    </ScrollView>
  );
}