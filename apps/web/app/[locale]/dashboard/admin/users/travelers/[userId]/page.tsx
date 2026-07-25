import { AdminTravelerProfileView } from "@/features/admin/views/admin-traveler-profile-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { DashboardHeader } from "@/features/admin/components/dashboard-header";
import { Suspense } from "react";
import { Skeleton } from "@moja/ui/components/ui/skeleton";

export default async function TravelerProfilePage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;

  await prefetch(trpc.admin.getUserProfile.queryOptions({ userId }));

  return (
    <HydrateClient>
      <DashboardHeader
        breadcrumbs={[
          { label: "Admin" },
          { label: "Travelers", href: "/dashboard/admin/users/travelers" },
          { label: "Profile" },
        ]}
      />
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-5xl space-y-6">
          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-32 w-full rounded-xl" />
                <Skeleton className="h-64 w-full rounded-xl" />
              </div>
            }
          >
            <AdminTravelerProfileView userId={userId} />
          </Suspense>
        </div>
      </div>
    </HydrateClient>
  );
}
