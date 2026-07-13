import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { AdminBlogView } from "@/features/admin/views/admin-blog-view";
import { adminBlogParamsCache } from "@/features/admin/lib/params";

export const metadata = {
  title: "Blog Management — Admin Portal",
  description: "Manage platform publishing and editorial content.",
};

export default async function AdminBlogPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const { q, status, page } = adminBlogParamsCache.parse(searchParams);

  await prefetch(
    trpc.admin.listBlogPosts.queryOptions({
      search: q || undefined,
      status: status || undefined,
      limit: 20,
      offset: (page - 1) * 20,
    })
  );

  return (
    <HydrateClient>
      <AdminBlogView />
    </HydrateClient>
  );
}
