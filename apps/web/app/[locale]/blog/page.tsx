import { getTranslations } from "next-intl/server";
import type { SearchParams } from "nuqs/server";
import { trpc, prefetch, HydrateClient } from "@/trpc/server";
import { blogParamsCache } from "@/features/blog/lib/params";
import { BlogIndexView } from "@/features/blog/views/blog-index-view";

type Props = {
  params: Promise<{ locale: string }>;
  searchParams: Promise<SearchParams>;
};

export async function generateMetadata({ params }: Props) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  return {
    title: t("heroTitle"),
    description: t("heroDesc"),
  };
}

// Revalidate public pages every hour
export const revalidate = 3600;

interface BlogIndexPageProps {
  searchParams: Promise<SearchParams>;
}

export default async function BlogIndexPage({ searchParams }: BlogIndexPageProps) {
  const params = blogParamsCache.parse(await searchParams);

  const offset = (params["page"] - 1) * 9;

  // Prefetch data on the server for instant SSR hydration
  await Promise.all([
    prefetch(trpc.blog.listCategories.queryOptions()),
    prefetch(trpc.blog.listTags.queryOptions()),
    prefetch(
      trpc.blog.getPublishedPosts.queryOptions({
        categorySlug: params["category"] || undefined,
        tagSlug: params["tag"] || undefined,
        searchQuery: params["q"] || undefined,
        limit: 9,
        offset,
      })
    ),
  ]);

  return (
    <HydrateClient>
      <BlogIndexView />
    </HydrateClient>
  );
}
