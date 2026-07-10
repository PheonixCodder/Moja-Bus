import { PageHeader } from "@/features/dashboard/components/page-header";
import { PassengerSettingsView } from "@/features/passenger/views/passenger-settings-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "Settings — Moja Ride",
};

export default async function SettingsPage() {
  // Prefetch preferences on the server
  await prefetch(trpc.passenger.getPreferences.queryOptions());

  return (
    <HydrateClient>
      <div className="flex flex-1 flex-col">
        <PageHeader title="Settings" className="lg:hidden" />
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-8">
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-text-primary">Settings</h1>
            <p className="text-sm text-text-secondary mt-1">
              Profile, travel preferences, and account security.
            </p>
          </div>
          <PassengerSettingsView />
        </div>
      </div>
    </HydrateClient>
  );
}
