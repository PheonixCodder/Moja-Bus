import { getTranslations } from "next-intl/server";
import { Skeleton } from "@moja/ui/components/ui/skeleton";
import { Suspense } from "react";
import { DashboardHeader } from "@/features/admin/components/dashboard-header";
import { AdminReferralsView } from "@/features/admin/views/admin-referrals-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata = {
  title: "Referral Program — Moja Ride Admin",
  description:
    "Configure passenger referral incentives, recurring booking rewards, anti-fraud rules, and issue promo credits.",
};

export default async function AdminMarketingReferralsPage() {
  const t = await getTranslations("adminDashboard.pages.referrals");
  await Promise.all([
    prefetch(trpc.discountsAdmin.getReferralProgram.queryOptions()),
    prefetch(trpc.discountsAdmin.marketingSummary.queryOptions()),
    prefetch(
      trpc.discountsAdmin.listCampaigns.queryOptions({
        status: "ACTIVE",
        limit: 100,
        offset: 0,
      }),
    ),
  ]);

  return (
    <HydrateClient>
      <DashboardHeader
        breadcrumbs={[
          { label: "Admin", tKey: "overview.breadcrumb.admin" },
          { label: "Marketing", tKey: "nav.sections.marketing" },
          { label: "Referrals", tKey: "nav.referrals" },
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
                <Skeleton className="h-44 w-full" />
                <Skeleton className="h-72 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            }
          >
            <AdminReferralsView />
          </Suspense>
        </div>
      </div>
    </HydrateClient>
  );
}
