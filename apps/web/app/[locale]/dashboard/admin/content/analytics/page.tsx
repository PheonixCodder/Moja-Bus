import { getTranslations } from "next-intl/server";
import { HydrateClient, trpc, prefetch } from "@/trpc/server";
import { AdminPageShell } from "@/features/admin/components/admin-page-shell";
import { AdminBlogAnalyticsView } from "@/features/admin/views/admin-blog-analytics-view";
import { blogAnalyticsSearchParamsCache } from "@/features/admin/lib/search-params";
import type { SearchParams } from "nuqs/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Content Analytics | Admin",
  description: "Deep insights on blog views, engagement, and reader behavior.",
};

export default async function ContentAnalyticsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const t = await getTranslations("adminDashboard.pages.blogAnalytics");
  const { period } = blogAnalyticsSearchParamsCache.parse(await searchParams);

  await prefetch(
    trpc.admin.getBlogAnalytics.queryOptions({
      period: period as "7d" | "30d" | "90d" | "all",
    })
  );

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
        <AdminBlogAnalyticsView />
      </AdminPageShell>
    </HydrateClient>
  );
}
