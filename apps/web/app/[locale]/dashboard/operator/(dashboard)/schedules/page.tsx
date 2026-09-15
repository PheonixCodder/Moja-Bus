import type { SearchParams } from "nuqs/server";
import { getTranslations } from "next-intl/server";
import { OperatorSchedulesView } from "@/features/operator/views/operator-schedules-view";
import { scheduleSearchParamsCache } from "@/features/operator/lib/schedules/schedule-search-params";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "operatorDashboard.schedules",
  });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function SchedulesPage({ searchParams }: Props) {
  const parsed = scheduleSearchParamsCache.parse(await searchParams);

  await prefetch(
    trpc.schedules.list.queryOptions({
      q: parsed.q || undefined,
      routeId: parsed.routeId || undefined,
      serviceType: parsed.serviceType === "all" ? undefined : parsed.serviceType,
      isActive:
        parsed.status === "active"
          ? true
          : parsed.status === "inactive"
            ? false
            : undefined,
      page: parsed.page,
      pageSize: 24,
      sort: parsed.sort,
    }),
  );

  return (
    <HydrateClient>
      <OperatorSchedulesView />
    </HydrateClient>
  );
}
