import { getTranslations } from "next-intl/server";
import { Skeleton } from "@moja/ui/components/ui/skeleton";
import { Suspense } from "react";
import { DashboardHeader } from "@/features/admin/components/dashboard-header";
import { AdminPromoAbuseView } from "@/features/admin/views/admin-promo-abuse-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata = {
  title: "Promo Abuse Queue — Moja Ride Admin",
  description: "Review blocked referral and promo abuse events.",
};

export default async function AdminMarketingAbusePage() {
  const t = await getTranslations("adminDashboard.pages.promoAbuse");
  await prefetch(
    trpc.discountsAdmin.listAbuseEvents.queryOptions({
      limit: 50,
      offset: 0,
    }),
  );

  return (
    <HydrateClient>
      <DashboardHeader
        breadcrumbs={[
          { label: "Admin", tKey: "overview.breadcrumb.admin" },
          { label: "Abuse queue", tKey: "nav.abuseQueue" },
        ]}
      />
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="space-y-1">
            <h1 className="font-display text-2xl font-bold tracking-tight text-slate-900">
              {t("title")}
            </h1>
            <p className="max-w-2xl text-sm leading-relaxed text-slate-500">
              {t("description")}
            </p>
          </div>
          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-10 w-48" />
                <Skeleton className="h-64 w-full" />
              </div>
            }
          >
            <AdminPromoAbuseView />
          </Suspense>
        </div>
      </div>
    </HydrateClient>
  );
}
