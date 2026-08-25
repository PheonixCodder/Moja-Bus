import type { Metadata } from "next";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";
import { AdminMarketplaceView } from "@/features/admin/views/admin-marketplace-view";

export const metadata: Metadata = {
  title: "Driver Marketplace Control | Moja Admin",
  description:
    "Platform-wide driver marketplace health, featuring, suspensions, and the employment-offer audit log.",
};

export default async function AdminDriverMarketplacePage() {
  prefetch(trpc.admin.getMarketplaceHealth.queryOptions());
  prefetch(
    trpc.admin.listMarketplaceAdminDrivers.queryOptions({
      status: "ALL",
      page: 1,
      limit: 20,
    })
  );
  prefetch(
    trpc.admin.listAllOffers.queryOptions({ status: "ALL", page: 1, limit: 15 })
  );

  return (
    <HydrateClient>
      <AdminMarketplaceView />
    </HydrateClient>
  );
}
