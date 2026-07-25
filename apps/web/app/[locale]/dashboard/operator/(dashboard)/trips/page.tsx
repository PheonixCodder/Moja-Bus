import { Suspense } from "react";
import { getTranslations } from "next-intl/server";
import {
  OperatorTripsView,
  OperatorTripsViewFallback,
} from "@/features/operator/views/operator-trips-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { tripListParamsCache } from "@/features/operator/lib/trips/trip-search-params";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "operatorDashboard.trips" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
  };
}

export default async function TripsPage({ params, searchParams: searchParamsProp }: Props) {
  const sp = await searchParamsProp;
  const spParsed = await tripListParamsCache.parse(sp);
  const listInput = {
    status: spParsed.status === "ALL" ? undefined : spParsed.status,
    scheduleId: spParsed.scheduleId || undefined,
    q: spParsed.q || undefined,
    startDate: spParsed.startDate || undefined,
    endDate: spParsed.endDate || undefined,
    page: spParsed.page,
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
