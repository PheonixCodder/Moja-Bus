import { getTranslations } from "next-intl/server";
import { Skeleton } from "@moja/ui/components/ui/skeleton";
import { Suspense } from "react";
import { DashboardHeader } from "@/features/admin/components/dashboard-header";
import { AdminCampaignsView } from "@/features/admin/views/admin-campaigns-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata = {
  title: "Marketing Campaigns — Moja Ride Admin",
  description:
    "Create and manage platform discount campaigns, coupon codes, and promo lifecycle.",
};

export default async function AdminMarketingCampaignsPage() {
  const t = await getTranslations("adminDashboard.pages.campaigns");
  await Promise.all([
    prefetch(
      trpc.discountsAdmin.listCampaigns.queryOptions({
        limit: 50,
        offset: 0,
      }),
    ),
    prefetch(trpc.discountsAdmin.marketingSummary.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <DashboardHeader
        breadcrumbs={[
          { label: "Admin", tKey: "overview.breadcrumb.admin" },
          { label: "Marketing", tKey: "nav.sections.marketing" },
          { label: "Campaigns", tKey: "nav.campaigns" },
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
                <Skeleton className="h-28 w-full" />
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            }
          >
            <AdminCampaignsView />
          </Suspense>
        </div>
      </div>
    </HydrateClient>
  );
}
