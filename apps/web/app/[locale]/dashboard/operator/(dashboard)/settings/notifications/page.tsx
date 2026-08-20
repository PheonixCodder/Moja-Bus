import { getTranslations } from "next-intl/server";
import { NotificationPreferences } from "@/features/notifications/components/notification-preferences";

export const metadata = {
  title: "Notification Preferences - Operator Settings",
};

export default async function NotificationsSettingsPage() {
  const t = await getTranslations("settings.notificationsPage");
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">{t("title")}</h3>
        <p className="text-sm text-muted-foreground">
          {t("description")}
        </p>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <NotificationPreferences />
      </div>
    </div>
  );
}
