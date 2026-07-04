import { PageHeader } from "@/features/dashboard/components/page-header";
import { PassengerBookingsView } from "@/features/booking/views/passenger-bookings-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "Bookings — Moja Ride",
};

export default async function BookingsPage() {
  await prefetch(
    trpc.booking.listMyBookings.queryOptions({ filter: "upcoming" }),
  );

  return (
    <HydrateClient>
      <div className="flex flex-1 flex-col">
        <PageHeader title="Bookings" className="lg:hidden" />
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-8">
          <div className="hidden lg:block">
            <h1 className="text-2xl font-bold text-text-primary">Bookings</h1>
            <p className="text-sm text-text-secondary mt-1">
              Your confirmed trips, pending payments, and travel history.
            </p>
          </div>
          <PassengerBookingsView />
        </div>
      </div>
    </HydrateClient>
  );
}
