import { HydrateClient, trpc, prefetch } from "@/trpc/server";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminTripAuditView } from "@/features/admin/views/admin-trip-audit-view";
import { tripAuditSearchParamsCache } from "@/features/admin/lib/search-params";
import type { SearchParams } from "nuqs/server";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Trip Audit | Admin",
  description: "Deep-dive audit view for a single trip — manifest, occupancy, and reviews.",
};

interface PageProps {
  params: Promise<{ tripId: string }>;
  searchParams: Promise<SearchParams>;
}

export default async function AdminTripAuditPage({ params, searchParams }: PageProps) {
  const { tripId } = await params;
  await searchParams.then((p) => tripAuditSearchParamsCache.parse(p));

  await prefetch(trpc.admin.getTripAudit.queryOptions({ id: tripId }));

  return (
    <HydrateClient>
      <AdminPageShell
        title="Trip Audit"
        description="Full read-only audit view of a single trip — passenger manifest, segment occupancy, and post-trip reviews."
        breadcrumbs={[
          { label: "Operations", href: "/dashboard/admin/operations" },
          { label: "Live Dispatch", href: "/dashboard/admin/operations/dispatch" },
          { label: "Trip Audit" },
        ]}
      >
        <AdminTripAuditView tripId={tripId} />
      </AdminPageShell>
    </HydrateClient>
  );
}
