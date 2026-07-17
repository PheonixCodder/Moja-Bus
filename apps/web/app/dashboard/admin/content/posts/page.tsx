import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { AdminBlogView } from "@/features/admin/views/admin-blog-view";
import { adminBlogParamsCache } from "@/features/admin/lib/params";
import type { SearchParams } from "nuqs/server";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Posts — Content Management | Admin",
  description: "Manage platform publishing and editorial content.",
};

export default async function AdminPostsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
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
      <AdminBlogView />
    </HydrateClient>
  );
}
