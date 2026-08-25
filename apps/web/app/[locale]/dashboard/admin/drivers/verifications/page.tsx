import { getTranslations } from "next-intl/server";
import { AdminDriverVerificationsView } from "@/features/admin/views/admin-driver-verifications-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { Skeleton } from "@moja/ui/components/ui/skeleton";
import { DashboardHeader } from "@/features/admin/components/dashboard-header";

export const metadata = {
  title: "Driver Verifications Queue — Moja Ride Admin",
  description: "Review and verify commercial driver licenses, national IDs, and carrier affiliations.",
};

export default async function DriverVerificationsPage() {
  await prefetch(
    trpc.admin.listDriversForVerification.queryOptions({
      status: "PENDING",
      limit: 50,
      offset: 0,
    })
  );

  return (
    <HydrateClient>
      <DashboardHeader
        breadcrumbs={[
          { label: "Admin", tKey: "overview.breadcrumb.admin" },
          { label: "Driver Verifications", tKey: "nav.driverVerifications" },
        ]}
      />
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900">
              Commercial Driver Compliance & Licensing
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
              Review driver licensing documents, inspect Ministry of Transport credentials, and grant commercial clearance for platform-wide dispatch.
            </p>
          </div>
          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            }
          >
            <AdminDriverVerificationsView />
          </Suspense>
        </div>
      </div>
    </HydrateClient>
  );
}
