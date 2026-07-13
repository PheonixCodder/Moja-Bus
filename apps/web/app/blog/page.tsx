import type { SearchParams } from "nuqs/server";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { blogParamsCache } from "@/features/blog/lib/params";
import { BlogIndexView } from "@/features/blog/views/blog-index-view";

export const metadata = {
  title: "Blog | Moja Ride",
  description: "Travel tips, transit route guides, operator news, and insights from Moja Ride.",
};

// Revalidate public pages every hour
export const revalidate = 3600;

interface BlogIndexPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const params = blogParamsCache.parse(await searchParams);

  // Prefetch data on the server for instant SSR hydration
  await Promise.all([
    prefetch(trpc.blog.listCategories.queryOptions()),
    prefetch(trpc.blog.listTags.queryOptions()),
    prefetch(
      trpc.blog.getPublishedPosts.queryOptions({
        categorySlug: params.category || undefined,
        tagSlug: params.tag || undefined,
        searchQuery: params.q || undefined,
        limit: 9,
      })
    ),
  ]);

  return (
    <HydrateClient>
      <BlogIndexView />
    </HydrateClient>
  );
}
