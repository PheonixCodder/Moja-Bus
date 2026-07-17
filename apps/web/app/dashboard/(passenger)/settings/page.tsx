import { PassengerSettingsView } from "@/features/passenger/views/passenger-settings-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { PageTitleHeader } from "@/features/dashboard/components/page-title-header";

export const metadata = {
  title: "Settings — Moja Ride",
};

export default async function SettingsPage() {
  // Prefetch preferences on the server
  await prefetch(trpc.passenger.getPreferences.queryOptions());

  return (
    <HydrateClient>
      <div className="flex-1 p-6 lg:p-10 max-w-6xl mx-auto w-full">
        <PageTitleHeader
          title="Account Settings"
          description="Manage your profile details, default travel preferences, and email notifications."
        />
        <PassengerSettingsView />
      </div>
    </HydrateClient>
  );
}
