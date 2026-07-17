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
  const { q, page } = adminRedirectsParamsCache.parse(await searchParams);

  await prefetch(trpc.admin.listBlogRedirects.queryOptions({
    search: q || undefined,
    page: page,
    limit: 20,
  }));

  return (
    <HydrateClient>
      <AdminPageShell
        title="URL Redirects"
        description="Manage 301 and 302 redirects for blog content."
        breadcrumbs={[
          { label: "Content", href: "/dashboard/admin/content/posts" },
          { label: "Redirects" },
        ]}
      >
        <AdminRedirectsView />
      </AdminPageShell>
    </HydrateClient>
  );
}
