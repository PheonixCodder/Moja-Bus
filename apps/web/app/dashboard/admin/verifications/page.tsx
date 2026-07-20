import { AdminVerificationsView } from "@/features/admin/views/admin-verifications-view";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { Suspense } from "react";
import { Skeleton } from "@moja/ui/components/ui/skeleton";
import { verificationsSearchParamsCache } from "@/features/admin/lib/search-params";
import { DashboardHeader } from "@/features/admin/components/dashboard-header";

export const metadata = {
  title: "Verification Queue — Moja Ride Admin",
  description:
    "Review operator legal documents, tax clearance files, and bank details. Approve to activate the operator's internal ledger account and register them as a Paystack Transfer Recipient.",
};

export default async function VerificationsQueuePage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const parsed = verificationsSearchParamsCache.parse(await searchParams);

  const limit = parsed.pageSize;
  const offset = (parsed.page - 1) * parsed.pageSize;
  const status = parsed.status === "ALL" ? undefined : (parsed.status as any);
  const search = parsed.q || undefined;

  // Prefetch data in parallel
  await Promise.all([
    prefetch(
      trpc.admin.listCompaniesForVerification.queryOptions({
        search,
        status,
        limit,
        offset,
      })
    ),
    prefetch(
      trpc.payments.listBanks.queryOptions({})
    ),
  ]);

  return (
    <HydrateClient>
      <DashboardHeader
        breadcrumbs={[
          { label: "Admin" },
          { label: "Verification Queue" },
        ]}
      />
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-6xl space-y-6">
          <div className="space-y-1">
            <h1 className="text-2xl font-bold font-display tracking-tight text-slate-900">
              Verification Queue
            </h1>
            <p className="text-sm text-slate-500 max-w-2xl leading-relaxed">
              Review operator legal documents, tax clearance files, and bank details. Approve to activate the operator's internal ledger account and register them as a Paystack Transfer Recipient.
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
            <AdminVerificationsView />
          </Suspense>
        </div>
      </div>
    </HydrateClient>
  );
}
