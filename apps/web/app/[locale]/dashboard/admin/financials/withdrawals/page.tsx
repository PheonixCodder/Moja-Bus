import { getTranslations } from "next-intl/server";
import { HydrateClient, trpc, prefetch } from "@/trpc/server";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminWithdrawalsView } from "@/features/admin/views/admin-withdrawals-view";
import { withdrawalsSearchParamsCache } from "@/features/admin/lib/search-params";
import { Suspense } from "react";
import { Skeleton } from "@moja/ui/components/ui/skeleton";

export const metadata = {
  title: "Withdrawal Queue - Admin",
};

export default async function AdminWithdrawalsPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const t = await getTranslations("adminDashboard.pages.withdrawals");
  const parsed = await withdrawalsSearchParamsCache.parse(await searchParams);
  const PAGE_SIZE = 15;

  await Promise.all([
    prefetch(
      trpc.admin.getWithdrawalStats.queryOptions({
        from: parsed.from || undefined,
        to: parsed.to || undefined,
      })
    ),
    prefetch(
      trpc.admin.listAllWithdrawals.queryOptions({
        limit: PAGE_SIZE,
        offset: (parsed.page - 1) * PAGE_SIZE,
        status: parsed.status === "ALL" ? undefined : parsed.status,
        from: parsed.from || undefined,
        to: parsed.to || undefined,
      })
    ),
  ]);

  return (
    <HydrateClient>
      <AdminPageShell
        title={t("title")}
        description={t("description")}
        breadcrumbs={[
          { label: t("breadcrumbSection") },
          { label: t("breadcrumbPage") },
        ]}
      >
        <Suspense
          fallback={
            <div className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-xl" />
                <Skeleton className="h-28 w-full rounded-xl" />
              </div>
              <Skeleton className="h-16 w-full rounded-xl" />
              <Skeleton className="h-96 w-full rounded-xl" />
            </div>
          }
        >
          <AdminWithdrawalsView />
        </Suspense>
      </AdminPageShell>
    </HydrateClient>
  );
}
