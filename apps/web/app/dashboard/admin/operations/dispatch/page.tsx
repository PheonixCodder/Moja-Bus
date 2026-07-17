import { HydrateClient, trpc, prefetch } from "@/trpc/server";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminDispatchView } from "@/features/admin/views/admin-dispatch-view";
import { dispatchSearchParamsCache } from "@/features/admin/lib/search-params";
import type { SearchParams } from "nuqs/server";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Dispatch Board | Admin",
  description: "Global dispatch board to monitor all operations",
};

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminDispatchPage({ searchParams }: PageProps) {
  const params = await searchParams;
  const { status, companyId, from, to } = dispatchSearchParamsCache.parse(params);

  await Promise.all([
    prefetch(trpc.public.listOperators.queryOptions()),
    prefetch(trpc.admin.listDispatchTrips.queryOptions({
      status: status as any,
      companyId,
      from,
      to,
    })),
  ]);

  return (
    <HydrateClient>
      <AdminPageShell
        title="Live Dispatch Board"
        description="Monitor real-time operations, trip delays, and bus assignments across all transport operators. Click on a trip to view passenger manifests and segment occupancy."
        breadcrumbs={[
          { label: "Operations", href: "/dashboard/admin/operations" },
          { label: "Live Dispatch" },
        ]}
      >
        <AdminDispatchView />
      </AdminPageShell>
    </HydrateClient>
  );
}
