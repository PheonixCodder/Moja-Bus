import { PageHeader } from "@/features/dashboard/components/page-header";
import { PassengerTicketsView } from "@/features/booking/views/passenger-tickets-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "Tickets — Moja Ride",
};

export default async function TicketsPage() {
  await prefetch(
    trpc.booking.listMyBookings.queryOptions({ filter: "upcoming" }),
  );

  return (
    <HydrateClient>
      <div className="flex flex-1 flex-col">
        <PageHeader title="Tickets" className="lg:hidden" />
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-8">
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-text-primary">Tickets</h1>
            <p className="text-sm text-text-secondary mt-1">
              Digital tickets with QR codes for your upcoming trips.
            </p>
          </div>
          <PassengerTicketsView />
        </div>
      </div>
    </HydrateClient>
  );
}
