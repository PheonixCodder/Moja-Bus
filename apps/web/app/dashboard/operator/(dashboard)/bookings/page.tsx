import { Suspense } from "react";
import {
  OperatorBookingsView,
  OperatorBookingsViewFallback,
} from "@/features/operator/views/operator-bookings-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { bookingListParamsCache } from "@/features/operator/lib/bookings/booking-search-params";

export const metadata = {
  title: "Bookings — Moja Ride Operator",
  description:
    "View passenger bookings, check in tickets, and manage reservations for your company.",
};

const PAGE_SIZE = 50;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OperatorBookingsPage({ searchParams }: PageProps) {
  const params = await bookingListParamsCache.parse(searchParams);
  await prefetch(
    trpc.operator.listBookings.queryOptions({
      filter: params.filter,
      search: params.q.trim() || undefined,
      status: params.status === "ALL" ? undefined : params.status,
      tripId: params.tripId || undefined,
      limit: PAGE_SIZE,
      offset: (params.page - 1) * PAGE_SIZE,
    }),
  );

  return (
    <HydrateClient>
      <Suspense fallback={<OperatorBookingsViewFallback />}>
        <OperatorBookingsView />
      </Suspense>
    </HydrateClient>
  );
}
