import { PassengerTicketsView } from "@/features/booking/views/passenger-tickets-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { PageTitleHeader } from "@/features/dashboard/components/page-title-header";

export const metadata = {
  title: "Tickets — Moja Ride",
};

export default async function TicketsPage() {
  await prefetch(
    trpc.booking.listMyBookings.queryOptions({ filter: "upcoming" }),
  );

  return (
    <HydrateClient>
      <div className="flex-1 p-6 lg:p-10 max-w-6xl mx-auto w-full">
        <PageTitleHeader
          title="My Tickets"
          description="Digital tickets with QR codes for your upcoming and past trips."
        />
        <PassengerTicketsView />
      </div>
    </HydrateClient>
  );
}
