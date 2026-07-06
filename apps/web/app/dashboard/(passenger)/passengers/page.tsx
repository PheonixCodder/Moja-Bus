import { PageHeader } from "@/features/dashboard/components/page-header";
import { SavedPassengersView } from "@/features/passenger/views/saved-passengers-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "Saved passengers — Moja Ride",
};

export default async function PassengersPage() {
  await prefetch(trpc.passenger.listSaved.queryOptions());

  return (
    <HydrateClient>
      <div className="flex flex-1 flex-col">
        <PageHeader title="Passengers" className="lg:hidden" />
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-8">
          <SavedPassengersView />
        </div>
      </div>
    </HydrateClient>
  );
}
