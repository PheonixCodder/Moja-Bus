import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { OperatorMarketplaceView } from "@/features/operator/views/operator-marketplace-view";

export async function generateMetadata() {
  return {
    title: "Driver Marketplace | Moja Operator",
    description:
      "Browse and recruit verified commercial drivers for your fleet from the Moja driver talent pool.",
  };
}

export default async function DriverMarketplacePage() {
  // Prefetch first page server-side so operators see content immediately on navigation
  prefetch(
    trpc.drivers.listMarketplaceDrivers.queryOptions({
      page: 1,
      limit: 18,
    }),
  );

  return (
    <HydrateClient>
      <OperatorMarketplaceView />
    </HydrateClient>
  );
}
