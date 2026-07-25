import { BlogDetailView } from "@/features/blog/views/blog-detail-view";
import { getPrismaClient } from "@moja/db";
import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

interface Props {
  params: Promise<{ locale: string; slug: string }>;
}

// Cache the Prisma query so that generateMetadata and the page component share a single request lifecycle lookup
const getPostBySlug = cache(async (slug: string) => {
  const prisma = getPrismaClient();
  return prisma.blogPost.findUnique({
    where: { slug },
    include: {
      author: { select: { fullName: true, image: true } },
      category: { select: { name: true, slug: true } },
      tags: { select: { id: true, name: true, slug: true } },
    },
  });
});

// Custom Metadata generator for SEO and Open Graph previews
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const t = await getTranslations({ locale, namespace: "blog" });
  const post = await getPostBySlug(slug);

  if (!post || post.deletedAt || post.status !== "PUBLISHED") {
    return { title: t("notFound") };
  }

  const seoTitle = post.seoTitle || post.title;
  const seoDescription = post.seoDescription || post.excerpt || "";
  const robots = post.robots || (post.allowIndex ? "index, follow" : "noindex, nofollow");
  const canonicalUrl = post.canonicalUrl || undefined;

  // Prevent empty strings in metadata arrays
  const ogImageUrl = post.ogImage || post.coverImage || "/default-og.png";
  const twitterImageUrl = post.twitterImage || post.ogImage || post.coverImage || "/default-og.png";

  return {
    title: seoTitle,
    description: seoDescription,
    alternates: {
      canonical: canonicalUrl,
    },
    robots,
    openGraph: {
      title: seoTitle,
      description: seoDescription,
      type: "article",
      images: [
        {
          url: ogImageUrl,
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.twitterTitle || post.title,
      description: post.twitterDescription || post.excerpt || "",
      images: [twitterImageUrl],
    },
  };
}

export const revalidate = 3600;

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  const post = await getPostBySlug(slug);

  if (!post || post.deletedAt || post.status !== "PUBLISHED") {
    notFound();
  }

  const prisma = getPrismaClient();

  // Fetch recommended articles
  const recommendedPosts = await prisma.blogPost.findMany({
    where: {
      status: "PUBLISHED",
      deletedAt: null,
      id: { not: post.id },
      ...(post.categoryId && { categoryId: post.categoryId }),
    },
    take: 3,
    orderBy: { publishedAt: "desc" },
    select: {
      id: true,
      title: true,
      slug: true,
      coverImage: true,
      category: { select: { name: true } },
    },
  });

  return (
    <BlogDetailView locale={locale} post={post as any} recommendedPosts={recommendedPosts} />
  );
}
