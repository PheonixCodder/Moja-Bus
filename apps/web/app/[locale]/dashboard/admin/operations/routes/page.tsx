import { getTranslations } from "next-intl/server";
import { HydrateClient, trpc, prefetch } from "@/trpc/server";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminRoutesView } from "@/features/admin/views/admin-routes-view";
import { adminRoutesSearchParamsCache } from "@/features/admin/lib/search-params";
import type { SearchParams } from "nuqs/server";
import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Routes & Terminals | Admin",
  description: "Manage and view platform routes across all operators",
};

interface PageProps {
  searchParams: Promise<SearchParams>;
}

export default async function AdminRoutesPage({ searchParams }: PageProps) {
  const t = await getTranslations("adminDashboard.pages.routes");
  const params = await searchParams;
  const { q, status, page, pageSize } = adminRoutesSearchParamsCache.parse(params);

  await prefetch(trpc.admin.listRoutes.queryOptions({ search: q, status, page, pageSize }));

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
        <AdminRoutesView />
      </AdminPageShell>
    </HydrateClient>
  );
}
