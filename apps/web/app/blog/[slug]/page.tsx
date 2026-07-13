import { BlogDetailView } from "@/features/blog/views/blog-detail-view";
import { getPrismaClient } from "@moja/db";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

interface Props {
  params: Promise<{ slug: string }>;
}

// Custom Metadata generator for SEO and Open Graph previews
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const prisma = getPrismaClient();
  
  const post = await prisma.blogPost.findUnique({
    where: { slug },
  });

  if (!post || post.deletedAt || post.status !== "PUBLISHED") {
    return { title: "Post Not Found" };
  }

  return {
    title: post.seoTitle || post.title,
    description: post.seoDescription || post.excerpt || "",
    alternates: {
      canonical: post.canonicalUrl,
    },
    robots: post.robots || (post.allowIndex ? "index, follow" : "noindex, nofollow"),
    openGraph: {
      title: post.seoTitle || post.title,
      description: post.seoDescription || post.excerpt || "",
      type: "article",
      images: [
        {
          url: post.ogImage || post.coverImage || "/default-og.png",
          width: 1200,
          height: 630,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: post.twitterTitle || post.title,
      description: post.twitterDescription || post.excerpt || "",
      images: [post.twitterImage || post.ogImage || post.coverImage || ""],
    },
  };
}

export const revalidate = 3600;

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const prisma = getPrismaClient();

  // Query details on the server
  const post = await prisma.blogPost.findUnique({
    where: { slug },
    include: {
      author: { select: { fullName: true, image: true } },
      category: { select: { name: true, slug: true } },
      tags: { select: { id: true, name: true, slug: true } },
    },
  });

  if (!post || post.deletedAt || post.status !== "PUBLISHED") {
    notFound();
  }

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
    <BlogDetailView post={post} recommendedPosts={recommendedPosts} />
  );
}
