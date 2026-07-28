import { ActivityIndicator, ScrollView, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { PageHeader } from "@/components/page-header";
import { Text } from "@/components/ui/text";
import { authClient } from "@/lib/auth-client";
import { AccountSettingsCard } from "../components/account-settings-card";
import { DangerZoneCard } from "../components/danger-zone-card";
import { ProfileCard } from "../components/profile-card";
import { QuickActionsCard } from "../components/quick-actions-card";

const TAB_BAR_TOTAL_HEIGHT = 64 + 22;

export function SettingsView() {
  const insets = useSafeAreaInsets();
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#f2f2f7" }}>
        <ActivityIndicator size="large" color="#ee237c" />
      </View>
    );
  }

  const user = session?.user;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f2f2f7" }}
      contentContainerStyle={{ paddingBottom: TAB_BAR_TOTAL_HEIGHT + insets.bottom + 24 }}
    >
      <PageHeader
        title="Settings"
        description="Manage your account and travel preferences"
      />

      <View style={{ paddingHorizontal: 20, gap: 28 }}>
        {user ? (
          <ProfileCard
            name={user.name ?? "Traveler"}
            email={user.email ?? ""}
            phoneNumber={"phoneNumber" in user ? (user as any).phoneNumber : null}
            image={user.image}
          />
        ) : (
          <View
            style={{
              backgroundColor: "#ffffff",
              borderRadius: 16,
              padding: 24,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "#8e8e93" }}>Sign in to manage your settings</Text>
          </View>
        )}

        <QuickActionsCard />
        <AccountSettingsCard />
        <DangerZoneCard />
      </View>
    </ScrollView>
  );
}
