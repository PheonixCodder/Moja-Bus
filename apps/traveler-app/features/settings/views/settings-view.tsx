import { ActivityIndicator, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";
import { BottomTabInset } from "@/constants/theme";
import { Colors, Spacing } from "@moja/theme/tokens";
import { ProfileHero } from "../components/profile-hero";
import { SettingsDetails } from "../components/settings-details";
import { AccountSettingsList } from "../components/account-settings-list";
import { DangerZoneRow } from "../components/danger-zone-row";

export function SettingsView() {
  const insets = useSafeAreaInsets();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: Colors.light.surface,
        }}
      >
        <ActivityIndicator size="large" color={Colors.light.primary} />
      </View>
    );
  }

  const user = session?.user;

  return (
    <ScrollView
      style={{
        flex: 1,
        backgroundColor: Colors.light.surface,
      }}
      contentContainerStyle={{ paddingBottom: BottomTabInset }}
    >
      <View style={{ paddingHorizontal: 20, paddingTop: insets.top + 35, paddingBottom: 40 }}>
        {user ? (
          <View style={{ flexDirection: "row", alignItems: "flex-start" }}>
            <ProfileHero
              name={user.name ?? "Traveler"}
              image={user.image}
            />
          </View>
        ) : (
          <View style={{ alignItems: "center", paddingVertical: 40 }}>
            <Text style={{ color: "rgba(255,255,255,0.6)", fontSize: 15 }}>
              Sign in to manage your settings
            </Text>
          </View>
        )}
      </View>

      <View
        style={{
          backgroundColor: Colors.light.background,
          borderTopLeftRadius: 28,
          borderTopRightRadius: 28,
          borderBottomLeftRadius: 28,
          borderBottomRightRadius: 28,
          marginHorizontal: 12,
          paddingHorizontal: 20,
          paddingTop: 24,
          paddingBottom: BottomTabInset ,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -4 },
          shadowOpacity: 0.08,
          shadowRadius: 20,
          elevation: 16,
        }}
      >
        <SettingsDetails />


        <AccountSettingsList />

        <View style={{ height: 0.5, backgroundColor: Colors.light.backgroundSelected, marginHorizontal: 20, marginTop: Spacing.two }} />

        <DangerZoneRow />
      </View>
    </ScrollView>
  );
}