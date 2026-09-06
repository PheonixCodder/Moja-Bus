import Link from "next/link";
import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { format } from "date-fns";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import { Calendar, Clock, ArrowLeft, BookOpen } from "lucide-react";
import { Card } from "@moja/ui/components/ui/card";
import { BlogTelemetry } from "../components/blog-telemetry";
import { BlogShareButtons } from "../components/blog-share-buttons";
import { BookingCTA } from "../components/booking-cta";

const components = {
  BookingCTA,
};

import type { Prisma } from "@moja/db";

export type SerializedPost = Prisma.BlogPostGetPayload<{
  include: {
    author: { select: { fullName: true; image: true } };
    category: { select: { name: true; slug: true } };
    tags: { select: { id: true; name: true; slug: true } };
  };
}>;

interface BlogDetailViewProps {
  locale: string;
  post: SerializedPost;
  recommendedPosts: {
    id: string;
    title: string;
    slug: string;
    coverImage: string | null;
    category: {
      name: string;
    } | null;
  }[];
}

function unescapeMarkdown(content: string): string {
  if (!content) return "";
  return content
    .replace(/\\#/g, "#")
    .replace(/\\-/g, "-")
    .replace(/\\\*/g, "*")
    .replace(/\\_/g, "_")
    .replace(/\\`/g, "`")
    .replace(/\\\[/g, "[")
    .replace(/\\\]/g, "]")
    .replace(/\\\(/g, "(")
    .replace(/\\\)/g, ")")
    .replace(/\\!/g, "!");
}

export async function BlogDetailView({
  locale,
  post,
  recommendedPosts,
}: BlogDetailViewProps) {
  const t = await getTranslations({ locale, namespace: "blog" });
  const formattedDate = post.publishedAt
    ? format(new Date(post.publishedAt), "MMMM d, yyyy")
    : "";

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Client-side View Telemetry tracking trigger */}
      <BlogTelemetry postId={post.id} />

      {/* ── Top Navigation Bar (Header offset layout) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-28">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          {t("backToArticles")}
        </Link>
      </div>

      {/* ── Main content wrapper ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* ─ Left side: Post body (lg:col-span-8) ─ */}
          <article className="lg:col-span-8 bg-card border border-border rounded-2xl p-6 md:p-10 shadow-3xs overflow-hidden">
            {/* Category badge */}
            {post.category && (
              <span className="inline-flex text-[10px] font-extrabold uppercase tracking-wider text-primary mb-4 bg-primary/10 border border-primary/20 px-2.5 py-0.5 rounded-full">
                {post.category.name}
              </span>
            )}

            {/* Post Title */}
            <h1 className="text-3xl md:text-4xl font-extrabold text-foreground leading-tight tracking-tight mb-4">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-base text-muted-foreground leading-relaxed font-normal mb-6 pb-6 border-b border-border">
                {post.excerpt}
              </p>
            )}

            {/* Author info & Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 text-xs text-muted-foreground">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-muted border border-border overflow-hidden flex-shrink-0">
                  {post.displayAuthorAvatar || post.author?.image ? (
                    <Image
                      unoptimized
                      src={post.displayAuthorAvatar || post.author?.image || ""}
                      alt=""
                      width={40}
                      height={40}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-primary/10 text-primary font-bold">
                      M
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-foreground text-sm">
                    {post.displayAuthorName ||
                      post.author?.fullName ||
                      "Moja Ride Editorial"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-muted-foreground text-[11px] font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formattedDate}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {t("minuteRead", { count: post.readingTime })}
                    </span>
                  </div>
                </div>
              </div>

              {/* Share buttons */}
              <BlogShareButtons title={post.title} />
            </div>

            {/* Cover Hero Banner */}
            {post.coverImage && (
              <div className="mb-8 rounded-xl overflow-hidden border border-border shadow-3xs">
                <div className="aspect-[21/9] w-full relative bg-muted">
                  <Image
                    unoptimized
                    src={post.coverImage}
                    alt={post.coverImageAlt || post.title}
                    fill
                    sizes="(max-width: 1024px) 100vw, 800px"
                    className="object-cover"
                    priority
                  />
                </div>
                {post.coverImageCredit && (
                  <p className="px-4 py-2 bg-muted/40 border-t border-border text-center text-[10px] text-muted-foreground font-medium">
                    {post.coverImageCredit}
                  </p>
                )}
              </div>
            )}

            {/* Markdown Rendered Content */}
            <div className="prose prose-sm prose-slate max-w-none text-foreground/80 leading-relaxed space-y-4">
              <MDXRemote
                source={unescapeMarkdown(post.content)}
                components={components}
                options={{
                  mdxOptions: {
                    remarkPlugins: [remarkGfm],
                    rehypePlugins: [rehypeSlug, rehypeAutolinkHeadings],
                  },
                }}
              />
            </div>

            {/* Tags Cloud bottom */}
            {post.tags && post.tags.length > 0 && (
              <div className="mt-10 pt-6 border-t border-border flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex px-2.5 py-0.5 rounded-full bg-muted/40 border border-border text-[10px] font-bold uppercase tracking-wider text-muted-foreground"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Display Author Bio override */}
            {post.displayAuthorBio && (
              <div className="mt-8 p-5 bg-muted/40 border border-border rounded-xl flex gap-3 text-xs leading-relaxed">
                <div className="shrink-0 w-8 h-8 rounded-full bg-muted overflow-hidden">
                  {post.displayAuthorAvatar || post.author?.image ? (
                    <Image
                      unoptimized
                      src={post.displayAuthorAvatar || post.author?.image || ""}
                      alt=""
                      width={32}
                      height={32}
                      className="w-full h-full object-cover"
                    />
                  ) : null}
                </div>
                <div>
                  <p className="font-bold text-foreground mb-0.5">
                    {t("aboutAuthor")}
                  </p>
                  <p className="text-muted-foreground">{post.displayAuthorBio}</p>
                </div>
              </div>
            )}
          </article>

          {/* ─ Right side: Recommendations (lg:col-span-4) ─ */}
          <div className="lg:col-span-4 space-y-6">
            {/* Recommended reading */}
            <Card className="bg-card border-border shadow-3xs p-4 rounded-xl space-y-4">
              <h3 className="text-xs font-extrabold text-foreground uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="size-3.5 text-primary" />
                {t("recommendedReading")}
              </h3>

              <div className="space-y-4">
                {recommendedPosts.length === 0 ? (
                  <p className="text-xs text-muted-foreground italic">
                    {t("noRecommendations")}
                  </p>
                ) : (
                  recommendedPosts.map((rp) => (
                    <Link
                      key={rp.id}
                      href={`/blog/${rp.slug}`}
                      className="group block space-y-1.5 text-xs transition-colors hover:text-primary"
                    >
                      {rp.coverImage && (
                        <div className="aspect-[16/9] w-full rounded-lg overflow-hidden border border-border mb-2 relative">
                          <Image
                            unoptimized
                            src={rp.coverImage}
                            alt=""
                            fill
                            sizes="(max-width: 1024px) 50vw, 300px"
                            className="object-cover group-hover:scale-[1.02] transition-transform duration-300"
                          />
                        </div>
                      )}
                      <p className="font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2 leading-snug">
                        {rp.title}
                      </p>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wider">
                        {rp.category?.name || t("uncategorized")}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </Card>

            {/* Quick search CTA */}
            <Card className="bg-primary text-primary-foreground p-5 rounded-xl space-y-3 shadow-sm border-none">
              <h4 className="font-extrabold text-sm leading-tight">
                {t("ctaTitle")}
              </h4>
              <p className="text-[11px] text-primary-foreground/80 leading-relaxed">
                {t("ctaDesc")}
              </p>
              <Link
                href="/search"
                className="w-full inline-flex items-center justify-center bg-background text-primary font-bold px-4 py-2 rounded-lg hover:bg-muted transition-colors text-xs"
              >
                {t("ctaButton")}
              </Link>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
