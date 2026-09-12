import { Tabs } from "expo-router";
import { useTranslation } from "react-i18next";
import { TabBar } from "@/components/tab-bar";

export default function TabsLayout() {
  const { t } = useTranslation();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
      }}
      tabBar={(props) => <TabBar {...props} />}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t("sell.tabLabel"),
        }}
      />
      <Tabs.Screen
        name="checkin"
        options={{
          title: t("checkin.tabLabel"),
        }}
      />
      <Tabs.Screen
        name="bookings"
        options={{
          title: t("bookings.tabLabel"),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t("profile.tabLabel"),
        }}
      />
    </Tabs>
  );
}
