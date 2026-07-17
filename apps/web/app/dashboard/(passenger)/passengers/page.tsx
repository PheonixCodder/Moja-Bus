import { SavedPassengersView } from "@/features/passenger/views/saved-passengers-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { PageTitleHeader } from "@/features/dashboard/components/page-title-header";

export const metadata = {
  title: "Saved passengers — Moja Ride",
};

export default async function PassengersPage() {
  await prefetch(trpc.passenger.listSaved.queryOptions());

  return (
    <HydrateClient>
      <div className="flex-1 p-6 lg:p-10 max-w-6xl mx-auto w-full">
        <PageTitleHeader
          title="Saved Passengers"
          description="Manage saved traveler profiles and companions for fast ticket checkout."
        />
        <SavedPassengersView />
      </div>
    </HydrateClient>
  );
}
