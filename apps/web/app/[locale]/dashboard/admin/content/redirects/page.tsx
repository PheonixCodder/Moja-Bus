import { getTranslations } from "next-intl/server";
import { prefetch, HydrateClient, trpc } from "@/trpc/server";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminRedirectsView } from "@/features/admin/views/admin-redirects-view";
import { adminRedirectsParamsCache } from "@/features/admin/lib/search-params";
import type { SearchParams } from "nuqs/server";

export const metadata = {
  title: "Redirects | Admin",
  description: "Manage SEO URL redirects for the platform.",
};

export default async function RedirectsPage({ searchParams }: { searchParams: Promise<SearchParams> }) {
  const t = await getTranslations("adminDashboard.pages.redirects");
  const { q, page } = adminRedirectsParamsCache.parse(await searchParams);

  await prefetch(trpc.admin.listBlogRedirects.queryOptions({
    search: q || undefined,
    page: page,
    limit: 20,
  }));

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
        <AdminRedirectsView />
      </AdminPageShell>
    </HydrateClient>
  );
}
