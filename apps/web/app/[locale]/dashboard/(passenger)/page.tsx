import { Skeleton } from "@moja/ui/components/ui/skeleton";
import { getTranslations } from "next-intl/server";
import { Suspense } from "react";
import { dashboardSearchParamsCache } from "@/features/dashboard/lib/dashboard-search-params";
import { PassengerDashboardView } from "@/features/dashboard/views/passenger-dashboard-view";
import { getUser } from "@/lib/auth-server";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

type PageProps = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export async function generateMetadata({ params }: PageProps) {
  const { locale } = await params;
  const t = await getTranslations({
    locale,
    namespace: "passengerDashboard.overview",
  });
  return { title: t("metaTitle") };
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-40 w-full rounded-xl" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
        <Skeleton className="h-28 w-full rounded-xl" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <Skeleton className="h-96 w-full rounded-xl lg:col-span-2" />
        <div className="space-y-6">
          <Skeleton className="h-48 w-full rounded-xl" />
          <Skeleton className="h-48 w-full rounded-xl" />
        </div>
      </div>
      <Skeleton className="h-80 w-full rounded-xl" />
    </div>
  );
}

export default async function PassengerDashboardPage({
  searchParams,
}: PageProps) {
  const { from, to } = dashboardSearchParamsCache.parse(await searchParams);
  const user = await getUser();
  const userName = user?.name?.split(" ")[0] ?? "Traveler";

  await Promise.all([
    prefetch(trpc.passenger.getDashboardStats.queryOptions()),
    prefetch(trpc.passenger.getRecentBookings.queryOptions({ limit: 3 })),
    prefetch(trpc.passenger.getNextDeparture.queryOptions()),
    prefetch(trpc.passenger.getWalletBalance.queryOptions()),
    prefetch(
      trpc.passenger.getWalletLedger.queryOptions({ limit: 3, offset: 0 }),
    ),
    prefetch(trpc.passenger.listSaved.queryOptions()),
    prefetch(
      trpc.booking.listMyBookings.queryOptions({
        filter: "upcoming",
        limit: 5,
      }),
    ),
    prefetch(
      trpc.passenger.getTravelInsights.queryOptions({
        from: from.toISOString(),
        to: to.toISOString(),
      }),
    ),
  ]);

  return (
    <HydrateClient>
      <div className="flex flex-1 flex-col">
        <div className="flex flex-1 flex-col gap-6 p-4 lg:p-6">
          <Suspense fallback={<DashboardSkeleton />}>
            <PassengerDashboardView userName={userName} />
          </Suspense>
        </div>
      </div>
    </HydrateClient>
  );
}
