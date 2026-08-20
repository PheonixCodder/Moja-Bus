import { getTranslations } from "next-intl/server";
import { Skeleton } from "@moja/ui/components/ui/skeleton";
import { Suspense } from "react";
import { DashboardHeader } from "@/features/admin/components/dashboard-header";
import { inquiriesSearchParamsCache } from "@/features/admin/lib/search-params";
import { AdminInquiriesView } from "@/features/admin/views/admin-inquiries-view";
import { HydrateClient, prefetch, trpc } from "@/trpc/server";

export const metadata = {
  title: "Contact Inquiries — Moja Ride Admin",
  description: "Manage and respond to contact inquiries submitted by users.",
};

export default async function AdminInquiriesPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations("adminDashboard.pages.inquiries");
  const parsed = inquiriesSearchParamsCache.parse(await searchParams);

  const limit = parsed.pageSize;
  const offset = (parsed.page - 1) * parsed.pageSize;
  const status =
    parsed.status === "All"
      ? undefined
      : (parsed.status as "NEW" | "IN_PROGRESS" | "RESOLVED" | "CLOSED");
  const search = parsed.q || undefined;

  await prefetch(
    trpc.contact.listInquiries.queryOptions({
      search,
      status,
      limit,
      offset,
    }),
  );

  return (
    <HydrateClient>
      <DashboardHeader
        breadcrumbs={[
          { label: "Admin", tKey: "overview.breadcrumb.admin" },
          { label: "Contact Inquiries", tKey: "nav.inquiries" },
        ]}
      />
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900">
              {t("title")}
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
              {t("description")}
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
            <AdminInquiriesView />
          </Suspense>
        </div>
      </div>
    </HydrateClient>
  );
}
