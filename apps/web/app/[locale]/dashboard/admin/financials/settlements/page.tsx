import { HydrateClient, trpc, prefetch } from "@/trpc/server";
import { AdminSettlementsView } from "@/features/admin/views/admin-settlements-view";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { SearchParams } from "nuqs";
import { settlementsSearchParamsCache } from "@/features/admin/lib/search-params";

interface SettlementsPageProps {
  searchParams: Promise<SearchParams>;
}

export const metadata = {
  title: "Settlements — Moja Ride Admin",
  description:
    "Audit the Paystack clearing account balance and record manual offline operator settlements.",
};

export default async function SettlementsPage({ searchParams }: SettlementsPageProps) {
  const parsed = await settlementsSearchParamsCache.parse(searchParams);
  const PAGE_SIZE = 20;

  // Prefetch everything the page needs server-side in parallel
  await Promise.all([
    prefetch(trpc.payments.getTreasuryOverview.queryOptions()),
    prefetch(trpc.public.listOperators.queryOptions()),
    prefetch(
      trpc.payments.listSettlementHistory.queryOptions({
        limit: PAGE_SIZE,
        offset: (parsed.page - 1) * PAGE_SIZE,
      })
    ),
  ]);

  return (
    <HydrateClient>
      <AdminPageShell
        title="Paystack Clearing & Settlements"
        description="Monitor the central clearing account balance and record manual offline operator disbursements."
        breadcrumbs={[{ label: "Financials" }, { label: "Settlements" }]}
      >
        <AdminSettlementsView />
      </AdminPageShell>
    </HydrateClient>
  );
}
