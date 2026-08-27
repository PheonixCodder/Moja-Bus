import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import {
  OperatorBookingsView,
  OperatorBookingsViewFallback,
} from "@/features/operator/views/operator-bookings-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { bookingListParamsCache } from "@/features/operator/lib/bookings/booking-search-params";

interface Props {
  params: Promise<{ locale: string }>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "operatorDashboard.bookings",
  });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

const PAGE_SIZE = 50;

type PageProps = {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

export default async function OperatorBookingsPage({
  searchParams,
}: PageProps) {
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
