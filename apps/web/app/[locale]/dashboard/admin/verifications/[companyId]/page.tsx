import { getTranslations } from "next-intl/server";
import { AdminVerificationDetailsView } from "@/features/admin/views/admin-verification-details-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { Skeleton } from "@moja/ui/components/ui/skeleton";
import { verificationDetailsSearchParamsCache } from "@/features/admin/lib/search-params";
import Link from "next/link";
import { ChevronLeft } from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { DashboardHeader } from "@/features/admin/components/dashboard-header";

export const metadata = {
  title: "Operator Profile Verification Details — Moja Ride Admin",
};

export default async function VerificationDetailsPage({
  params,
  searchParams,
}: {
  params: Promise<{ companyId: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations("adminDashboard.pages.verificationDetails");
  const { companyId } = await params;
  const parsed = verificationDetailsSearchParamsCache.parse(await searchParams);

  // Prefetch data in parallel
  await Promise.all([
    prefetch(
      trpc.admin.getCompanyForVerification.queryOptions({ companyId })
    ),
    prefetch(
      trpc.payments.listBanks.queryOptions({})
    ),
  ]);

  return (
    <HydrateClient>
      <DashboardHeader
        breadcrumbs={[
          { label: "Admin", tKey: "overview.breadcrumb.admin" },
          { label: "Verification Queue", tKey: "nav.verifications", href: "/dashboard/admin/verifications" },
          { label: "{t("title")}", tKey: "overview.breadcrumb.operatorDetails" },
        ]}
      />
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              size="icon-sm"
              className="size-8"
              nativeButton={false}
              render={
                <Link href="/dashboard/admin/verifications">
                  <ChevronLeft className="size-4" />
                </Link>
              }
            />
            <div className="space-y-0.5">
              <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900">
                {t("title")}
              </h1>
              <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
                {t("description")}
              </p>
            </div>
          </div>
          <Suspense
            fallback={
              <div className="space-y-4">
                <Skeleton className="h-10 w-full" />
                <Skeleton className="h-64 w-full" />
              </div>
            }
          >
            <AdminVerificationDetailsView companyId={companyId} />
          </Suspense>
        </div>
      </div>
    </HydrateClient>
  );
}
