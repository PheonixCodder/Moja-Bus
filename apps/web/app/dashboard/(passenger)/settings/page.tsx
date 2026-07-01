import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@moja/ui/components/ui/card";
import { PageHeader } from "@/features/dashboard/components/page-header";

export default function SettingsPage() {
  return (
    <div className="flex flex-1 flex-col">
      <PageHeader title="Settings" className="lg:hidden" />
      <div className="flex flex-1 flex-col gap-8 p-4 lg:p-8">
        <Card className="border-border bg-bg-surface">
          <CardHeader>
            <CardTitle>Settings</CardTitle>
            <CardDescription>
              Profile, security, and notification preferences for passengers.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-sm text-text-secondary">
            Passenger account settings will be expanded here next.
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
