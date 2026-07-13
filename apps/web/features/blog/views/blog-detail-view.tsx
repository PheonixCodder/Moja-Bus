import Link from "next/link";
import { format } from "date-fns";
import { MDXRemote } from "next-mdx-remote/rsc";
import remarkGfm from "remark-gfm";
import rehypeSlug from "rehype-slug";
import rehypeAutolinkHeadings from "rehype-autolink-headings";
import {
  Calendar,
  Clock,
  ArrowLeft,
  BookOpen,
} from "lucide-react";
import { Card } from "@moja/ui/components/ui/card";
import { BlogTelemetry } from "../components/blog-telemetry";
import { BlogShareButtons } from "../components/blog-share-buttons";

// Custom MDX Components for Moja Ride Domain
const components = {
  BookingCTA: (props: any) => (
    <div className="my-8 p-6 bg-rose-50/70 border border-rose-100 rounded-xl text-center space-y-4">
      <h3 className="text-base font-extrabold text-slate-900 mb-1">
        Ready to travel from {props.origin || "Abidjan"} to {props.destination || "Yamoussoukro"}?
      </h3>
      <p className="text-xs text-slate-600 max-w-sm mx-auto leading-relaxed">
        Compare ticket departures from top operators and book securely on Moja Ride today.
      </p>
      <Link
        href="/search"
        className="inline-flex items-center justify-center bg-rose-600 text-white font-bold px-5 py-2.5 rounded-lg hover:bg-rose-700 transition-colors text-xs"
      >
        Find Intercity Tickets
      </Link>
    </div>
  ),
};

export interface SerializedPost {
  id: string;
  title: string;
  slug: string;
  content: string;
  excerpt: string | null;
  coverImage: string | null;
  coverImageAlt: string | null;
  coverImageCredit: string | null;
  displayAuthorName: string | null;
  displayAuthorAvatar: string | null;
  displayAuthorBio: string | null;
  publishedAt: Date | null;
  readingTime: number;
  viewCount: number;
  author: {
    fullName: string;
    image: string | null;
  };
  category: {
    name: string;
    slug: string;
  } | null;
  tags: {
    id: string;
    name: string;
    slug: string;
  }[];
}

interface BlogDetailViewProps {
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

export function BlogDetailView({ post, recommendedPosts }: BlogDetailViewProps) {
  const formattedDate = post.publishedAt
    ? format(new Date(post.publishedAt), "MMMM d, yyyy")
    : "";

  return (
    <div className="min-h-screen bg-slate-50/50 pb-24">
      {/* Client-side View Telemetry tracking trigger */}
      <BlogTelemetry postId={post.id} />

      {/* ── Top Navigation Bar (Header offset layout) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 md:pt-28">
        <Link
          href="/blog"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="size-3.5" />
          Back to all articles
        </Link>
      </div>

      {/* ── Main content wrapper ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mt-6">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* ─ Left side: Post body (lg:col-span-8) ─ */}
          <article className="lg:col-span-8 bg-white border border-slate-200 rounded-2xl p-6 md:p-10 shadow-3xs overflow-hidden">
            
            {/* Category badge */}
            {post.category && (
              <span className="inline-flex text-[10px] font-extrabold uppercase tracking-wider text-rose-600 mb-4 bg-rose-50 border border-rose-100/50 px-2.5 py-0.5 rounded-full">
                {post.category.name}
              </span>
            )}

            {/* Post Title */}
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 leading-tight tracking-tight mb-4">
              {post.title}
            </h1>

            {/* Excerpt */}
            {post.excerpt && (
              <p className="text-base text-slate-600 leading-relaxed font-normal mb-6 pb-6 border-b border-slate-100">
                {post.excerpt}
              </p>
            )}

            {/* Author info & Metadata */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8 text-xs text-slate-400">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200 overflow-hidden flex-shrink-0">
                  {post.displayAuthorAvatar || post.author?.image ? (
                    <img
                      src={post.displayAuthorAvatar || post.author?.image || ""}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-rose-50 text-rose-300 font-bold">
                      M
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-bold text-slate-800 text-sm">
                    {post.displayAuthorName || post.author?.fullName || "Moja Ride Editorial"}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5 text-slate-400 text-[11px] font-medium">
                    <span className="flex items-center gap-1">
                      <Calendar className="size-3" />
                      {formattedDate}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <Clock className="size-3" />
                      {post.readingTime} min read
                    </span>
                  </div>
                </div>
              </div>

              {/* Share buttons */}
              <BlogShareButtons title={post.title} />
            </div>

            {/* Cover Hero Banner */}
            {post.coverImage && (
              <div className="mb-8 rounded-xl overflow-hidden border border-slate-200 shadow-3xs">
                <div className="aspect-[21/9] w-full relative bg-slate-100">
                  <img
                    src={post.coverImage}
                    alt={post.coverImageAlt || post.title}
                    className="w-full h-full object-cover"
                  />
                </div>
                {post.coverImageCredit && (
                  <p className="px-4 py-2 bg-slate-50 border-t border-slate-200 text-center text-[10px] text-slate-400 font-medium">
                    {post.coverImageCredit}
                  </p>
                )}
              </div>
            )}

            {/* Markdown Rendered Content */}
            <div className="prose prose-sm prose-slate max-w-none text-slate-700 leading-relaxed space-y-4">
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
              <div className="mt-10 pt-6 border-t border-slate-100 flex flex-wrap gap-1.5">
                {post.tags.map((tag) => (
                  <span
                    key={tag.id}
                    className="inline-flex px-2.5 py-0.5 rounded-full bg-slate-50 border border-slate-200 text-[10px] font-bold uppercase tracking-wider text-slate-500"
                  >
                    #{tag.name}
                  </span>
                ))}
              </div>
            )}

            {/* Display Author Bio override */}
            {post.displayAuthorBio && (
              <div className="mt-8 p-5 bg-slate-50/50 border border-slate-200 rounded-xl flex gap-3 text-xs leading-relaxed">
                <div className="shrink-0 w-8 h-8 rounded-full bg-slate-200 overflow-hidden">
                  {post.displayAuthorAvatar || post.author?.image ? (
                    <img src={post.displayAuthorAvatar || post.author?.image || ""} alt="" className="w-full h-full object-cover" />
                  ) : null}
                </div>
                <div>
                  <p className="font-bold text-slate-900 mb-0.5">About the author</p>
                  <p className="text-slate-500">{post.displayAuthorBio}</p>
                </div>
              </div>
            )}
          </article>

          {/* ─ Right side: Recommendations (lg:col-span-4) ─ */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Recommended reading */}
            <Card className="bg-white border-slate-200 shadow-3xs p-4 rounded-xl space-y-4">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2">
                <BookOpen className="size-3.5 text-rose-500" />
                Recommended Reading
              </h3>

              <div className="space-y-4">
                {recommendedPosts.length === 0 ? (
                  <p className="text-xs text-slate-400 italic">No recommendations found.</p>
                ) : (
                  recommendedPosts.map((rp) => (
                    <Link
                      key={rp.id}
                      href={`/blog/${rp.slug}`}
                      className="group block space-y-1.5 text-xs transition-colors hover:text-rose-600"
                    >
                      {rp.coverImage && (
                        <div className="aspect-[16/9] w-full rounded-lg overflow-hidden border border-slate-200 mb-2">
                          <img
                            src={rp.coverImage}
                            alt=""
                            className="object-cover w-full h-full group-hover:scale-[1.02] transition-transform duration-300"
                          />
                        </div>
                      )}
                      <p className="font-bold text-slate-800 group-hover:text-rose-600 transition-colors line-clamp-2 leading-snug">
                        {rp.title}
                      </p>
                      <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">
                        {rp.category?.name || "Uncategorized"}
                      </p>
                    </Link>
                  ))
                )}
              </div>
            </Card>

            {/* Quick search CTA */}
            <Card className="bg-gradient-to-br from-rose-500 to-rose-600 text-white p-5 rounded-xl space-y-3 shadow-sm border-none">
              <h4 className="font-extrabold text-sm leading-tight">Need to book travel in Côte d'Ivoire?</h4>
              <p className="text-[11px] text-rose-100 leading-relaxed">
                Moja Ride aggregates all intercity coach schedules. Compare prices, features, and buy your tickets online in seconds.
              </p>
              <Link
                href="/search"
                className="w-full inline-flex items-center justify-center bg-white text-rose-600 font-bold px-4 py-2 rounded-lg hover:bg-rose-50 transition-colors text-xs"
              >
                Search Tickets
              </Link>
            </Card>
          </div>

        </div>
      </div>
    </div>
  );
}
