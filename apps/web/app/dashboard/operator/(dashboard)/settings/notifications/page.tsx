import { NotificationPreferences } from "@/features/notifications/components/notification-preferences";

export const metadata = {
  title: "Notification Preferences - Operator Settings",
};

export default function NotificationsSettingsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Notifications</h3>
        <p className="text-sm text-muted-foreground">
          Configure how you receive alerts and updates from Moja Ride.
        </p>
      </div>
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <NotificationPreferences />
      </div>
    </div>
  );
}
