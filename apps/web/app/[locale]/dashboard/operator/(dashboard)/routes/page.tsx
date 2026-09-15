import { getTranslations } from "next-intl/server";
import type { SearchParams } from "nuqs/server";
import { OperatorRoutesView } from "@/features/operator/views/operator-routes-view";
import { routeSearchParamsCache } from "@/features/operator/lib/routes/route-search-params";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "operatorDashboard.routes",
  });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

export default async function RoutesPage({ searchParams }: Props) {
  const { status } = routeSearchParamsCache.parse(await searchParams);
  const showArchived = status === "ARCHIVED" || status === "ALL";

  await Promise.all([
    prefetch(trpc.routes.list.queryOptions({ showArchived })),
  ]);

  return (
    <HydrateClient>
      <OperatorRoutesView />
    </HydrateClient>
  );
}
