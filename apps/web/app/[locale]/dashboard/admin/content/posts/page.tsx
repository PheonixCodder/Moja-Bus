import { getTranslations } from "next-intl/server";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { AdminBlogView } from "@/features/admin/views/admin-blog-view";
import { adminBlogParamsCache } from "@/features/admin/lib/params";
import type { SearchParams } from "nuqs/server";
import type { Metadata } from "next";
import { SidebarTrigger } from "@moja/ui/components/ui/sidebar";
import { Separator } from "@moja/ui/components/ui/separator";

export const metadata: Metadata = {
  title: "Posts — Content Management | Admin",
  description: "Manage platform publishing and editorial content.",
};

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const t = await getTranslations("adminDashboard.pages.blogPosts");
  const parsedParams = adminBlogParamsCache.parse(await searchParams);
  const { q, status, page } = parsedParams;

  await Promise.all([
    prefetch(
      trpc.admin.listBlogPosts.queryOptions({
        search: q || undefined,
        status: status || undefined,
        limit: 20,
        offset: (page - 1) * 20,
      })
    ),
    prefetch(trpc.admin.listBlogCategories.queryOptions()),
    prefetch(trpc.admin.listBlogTags.queryOptions()),
  ]);

  return (
    <HydrateClient>
      <header className="flex h-12 shrink-0 items-center gap-2 border-b border-border bg-bg-base px-4">
        <SidebarTrigger className="text-text-muted hover:text-text-primary" />
        <Separator orientation="vertical" className="h-4 bg-border" />
        <nav className="flex items-center gap-1 text-xs text-text-muted">
          <span>{t("breadcrumbAdmin")}</span>
          <span className="mx-1 text-text-muted/40">/</span>
          <span>{t("breadcrumbContent")}</span>
          <span className="mx-1 text-text-muted/40">/</span>
          <span className="text-text-primary font-medium">{t("breadcrumbPosts")}</span>
        </nav>
      </header>
      <div className="flex-1 overflow-y-auto p-6 md:p-8">
        <div className="mx-auto max-w-[1400px]">
          <AdminBlogView />
        </div>
      </div>
    </HydrateClient>
  );
}
