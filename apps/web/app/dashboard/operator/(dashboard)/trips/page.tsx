import { Suspense } from "react";
import {
  OperatorTripsView,
  OperatorTripsViewFallback,
} from "@/features/operator/views/operator-trips-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { tripListParamsCache } from "@/features/operator/lib/trips/trip-search-params";

export const metadata = {
  title: "Dispatch Board — Moja Ride Operator",
  description:
    "Assign buses to trips, manage departures, and track live operations.",
};

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function TripsPage({ searchParams }: PageProps) {
  const params = await tripListParamsCache.parse(searchParams);
  const listInput = {
    status: params.status === "ALL" ? undefined : params.status,
    scheduleId: params.scheduleId || undefined,
    // M10: include `q` so the prefetch query key matches the client's first
    // query key (useDebounce returns the initial value immediately, so the
    // client query uses the same `q` on first render). Omitting it caused a
    // prefetch/query key mismatch whenever a search term was present in the URL.
    q: params.q || undefined,
    startDate: params.startDate || undefined,
    endDate: params.endDate || undefined,
    page: params.page,
    pageSize: 50,
  };

  await prefetch(trpc.trips.list.queryOptions(listInput));

  return (
    <HydrateClient>
      <Suspense fallback={<OperatorTripsViewFallback />}>
        <OperatorTripsView />
      </Suspense>
    </HydrateClient>
  );
}
