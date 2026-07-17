import { PassengerBookingsView } from "@/features/booking/views/passenger-bookings-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

export const metadata = {
  title: "Bookings — Moja Ride",
};

export default async function BookingsPage() {
  await Promise.all([
    prefetch(trpc.booking.listMyBookings.queryOptions({ filter: "upcoming" })),
    prefetch(trpc.passenger.getDashboardStats.queryOptions()),
    prefetch(trpc.passenger.getUserReviews.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <div className="flex flex-1 flex-col h-[calc(100vh-theme(spacing.12))] overflow-hidden">
        <PassengerBookingsView />
      </div>
    </HydrateClient>
  );
}
