import { getTranslations } from "next-intl/server";
import { HydrateClient, trpc, prefetch } from "@/trpc/server";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminDispatchView } from "@/features/admin/views/admin-dispatch-view";
import { dispatchSearchParamsCache } from "@/features/admin/lib/search-params";
import type { SearchParams } from "nuqs/server";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Live Dispatch Board | Admin",
  description: "Global dispatch board to monitor all operations",
};

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminDispatchPage({ searchParams }: PageProps) {
  const t = await getTranslations("adminDashboard.pages.dispatch");
  const params = await searchParams;
  const { status, companyId, from, to } =
    dispatchSearchParamsCache.parse(params);

  await Promise.all([
    prefetch(trpc.public.listOperators.queryOptions()),
    prefetch(
      trpc.admin.listDispatchTrips.queryOptions({
        status: status as any,
        companyId,
        from,
        to,
      }),
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
        <AdminDispatchView />
      </AdminPageShell>
    </HydrateClient>
  );
}
