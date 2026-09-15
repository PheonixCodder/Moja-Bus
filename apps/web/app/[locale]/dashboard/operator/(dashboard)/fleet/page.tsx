import { getTranslations } from "next-intl/server";
import type { SearchParams } from "nuqs/server";
import { OperatorFleetView } from "@/features/operator/views/operator-fleet-view";
import { fleetSearchParamsCache } from "@/features/operator/lib/fleet/fleet-search-params";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

interface Props {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
}

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "operatorDashboard.fleet",
  });
  return { title: t("metaTitle"), description: t("metaDescription") };
}

/**
 * Fleet page — client view handles IAM gating.
 * Users without fleet:read will see an access denied state.
 */
export default async function FleetPage({ searchParams }: Props) {
  const { tab } = fleetSearchParamsCache.parse(await searchParams);

  await Promise.all([
    prefetch(trpc.fleet.getBuses.queryOptions()),
    prefetch(trpc.fleet.getBusTypes.queryOptions()),
    ...(tab === "layouts"
      ? [
          prefetch(trpc.fleet.getCustomLayouts.queryOptions()),
          prefetch(trpc.fleet.getLayoutTemplates.queryOptions()),
        ]
      : []),
  ]);

  return (
    <HydrateClient>
      <OperatorFleetView />
    </HydrateClient>
  );
}
