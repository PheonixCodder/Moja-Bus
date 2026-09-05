"use client";

import { useState, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useQueryStates } from "nuqs";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "next/link";
import Image from "next/image";
import { format } from "date-fns";
import {
  Search,
  BookOpen,
  Tag as TagIcon,
  FolderOpen,
  Calendar,
  Clock,
  ChevronRight,
  SearchX,
  ArrowRight,
} from "lucide-react";
import { blogParamsSchema } from "../lib/params";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Card } from "@moja/ui/components/ui/card";
import { Badge } from "@moja/ui/components/ui/badge";

export function BlogIndexView() {
  const t = useTranslations("blog");
  const trpc = useTRPC();

  const [params, setParams] = useQueryStates(blogParamsSchema, {
    shallow: true,
    history: "replace",
  });

  const [searchVal, setSearchVal] = useState(params.q);

  // Debounce query search input updates to prevent Next.js RSC network transition flickers on every keypress
  useEffect(() => {
    const timer = setTimeout(() => {
      void setParams({ q: searchVal, page: 1 });
    }, 300);
    return () => clearTimeout(timer);
  }, [searchVal, setParams]);

  // Sync back when search parameters are cleared externally
  useEffect(() => {
    setSearchVal(params.q);
  }, [params.q]);

  const limit = 9;
  const offset = (params.page - 1) * limit;

  // Suspense queries for categories, tags, and posts
  const { data: categories } = useSuspenseQuery(
    trpc.blog.listCategories.queryOptions(),
  );

  const { data: tags } = useSuspenseQuery(trpc.blog.listTags.queryOptions());

  const { data: postsData } = useSuspenseQuery(
    trpc.blog.getPublishedPosts.queryOptions({
      categorySlug: params.category || undefined,
      tagSlug: params.tag || undefined,
      searchQuery: params.q || undefined,
      limit: limit,
      offset: offset,
    }),
  );

  const posts = postsData.posts;

  // Active filters helper
  const hasActiveFilters = !!params.q || !!params.category || !!params.tag;

  const handleClearFilters = () => {
    void setParams({
      q: "",
      category: "",
      tag: "",
      page: 1,
    });
  };

  const handlePageChange = (newPage: number) => {
    void setParams({ page: newPage });
  };

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* ── Top Hero Zone (Matching Bus Search visual theme) ── */}
      <div className="bg-primary/10 border-b border-primary/20 pt-28 md:pt-36 pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/20 text-xs py-0.5 px-3 rounded-full font-semibold uppercase tracking-wider">
            {t("badge")}
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold text-foreground tracking-tight">
            {t("heroTitle")}
          </h1>
          <p className="max-w-2xl mx-auto text-sm md:text-base text-muted-foreground leading-relaxed">
            {t("heroDesc")}
          </p>

          {/* Inline search bar */}
          <div className="max-w-md mx-auto pt-4 relative">
            <Search className="absolute left-3.5 top-[25px] size-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t("searchPlaceholder")}
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-10 pr-4 h-11 text-sm bg-card border-border rounded-full shadow-sm focus:border-primary/50 focus:ring-primary/20"
            />
          </div>
        </div>
      </div>

      {/* ── Main Layout (Columns) ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 pb-24">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8 items-start">
          {/* ─ Left sidebar (Filters cloud) ─ */}
          <div className="space-y-6 lg:col-span-1">
            {/* Category selection */}
            <Card className="bg-card border-border shadow-3xs p-4 rounded-xl">
              <h3 className="text-xs font-extrabold text-foreground uppercase tracking-widest flex items-center gap-2 mb-3">
                <FolderOpen className="size-3.5 text-primary" />
                {t("categories")}
              </h3>
              <div className="space-y-1">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void setParams({ category: "", page: 1 })}
                  className={`w-full justify-between h-auto px-2.5 py-1.5 rounded-md text-xs font-semibold ${
                    !params.category
                      ? "bg-primary/10 text-primary hover:bg-primary/15"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <span>{t("allCategories")}</span>
                </Button>

                {categories.map((cat) => {
                  const isSelected = params.category === cat.slug;
                  return (
                    <Button
                      key={cat.id}
                      type="button"
                      variant="ghost"
                      onClick={() =>
                        void setParams({ category: cat.slug, page: 1 })
                      }
                      className={`w-full justify-between h-auto py-1.5 rounded-md text-xs ${
                        cat.parentId
                          ? "pl-5 font-normal"
                          : "pl-2.5 font-semibold"
                      } ${
                        isSelected
                          ? "bg-primary/10 text-primary hover:bg-primary/15"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {cat.parentId && (
                          <ChevronRight className="size-3 text-muted-foreground" />
                        )}
                        {cat.name}
                      </span>
                    </Button>
                  );
                })}
              </div>
            </Card>

            {/* Tag cloud */}
            <Card className="bg-card border-border shadow-3xs p-4 rounded-xl">
              <h3 className="text-xs font-extrabold text-foreground uppercase tracking-widest flex items-center gap-2 mb-3">
                <TagIcon className="size-3.5 text-primary" />
                {t("popularTags")}
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => void setParams({ tag: "", page: 1 })}
                  className={`h-auto px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border transition-all ${
                    !params.tag
                      ? "bg-primary/10 border-primary/20 text-primary font-extrabold hover:bg-primary/15"
                      : "bg-card border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                  }`}
                >
                  {t("allTags")}
                </Button>
                {tags.map((tag) => {
                  const isSelected = params.tag === tag.slug;
                  return (
                    <Button
                      key={tag.id}
                      type="button"
                      variant="ghost"
                      onClick={() => void setParams({ tag: tag.slug, page: 1 })}
                      className={`h-auto px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border transition-all ${
                        isSelected
                          ? "bg-primary/10 border-primary/20 text-primary font-extrabold hover:bg-primary/15"
                          : "bg-card border-border text-muted-foreground hover:border-border/80 hover:text-foreground"
                      }`}
                    >
                      #{tag.name}
                    </Button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ─ Right grids (Content stream) ─ */}
          <div className="lg:col-span-3 space-y-8">
            {/* Filter Reset Alert */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between bg-card border border-border px-4 py-2.5 rounded-xl shadow-3xs text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground">{t("activeFilters")}</span>
                  {params.q && (
                    <Badge
                      variant="outline"
                      className="border-primary/20 bg-primary/10 text-primary"
                    >
                      {t("filterSearch", { query: params.q })}
                    </Badge>
                  )}
                  {params.category && (
                    <Badge
                      variant="outline"
                      className="border-primary/20 bg-primary/10 text-primary"
                    >
                      {t("filterCategory", { category: params.category })}
                    </Badge>
                  )}
                  {params.tag && (
                    <Badge
                      variant="outline"
                      className="border-primary/20 bg-primary/10 text-primary"
                    >
                      {t("filterTag", { tag: params.tag })}
                    </Badge>
                  )}
                </div>
                <Button
                  type="button"
                  variant="link"
                  onClick={handleClearFilters}
                  className="h-auto p-0 text-primary hover:text-primary/80 font-semibold underline text-xs"
                >
                  {t("clearAll")}
                </Button>
              </div>
            )}

            {/* Posts Grid */}
            {posts.length === 0 ? (
              <div className="text-center py-20 bg-card border border-border rounded-2xl flex flex-col items-center justify-center p-8 space-y-4">
                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <SearchX className="size-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-foreground">
                    {t("noResults")}
                  </h3>
                  <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                    {t("noResultsDesc")}
                  </p>
                </div>
                <Button
                  onClick={handleClearFilters}
                  className="h-9 bg-foreground hover:bg-foreground/90 text-background font-semibold text-xs"
                >
                  {t("resetFilters")}
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col bg-card rounded-xl shadow-3xs border border-border overflow-hidden hover:shadow-xs hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {/* Cover image banner */}
                    {post.coverImage ? (
                      <div className="aspect-[16/10] w-full bg-muted relative overflow-hidden">
                        <Image
                          unoptimized
                          src={post.coverImage}
                          alt={post.coverImageAlt || post.title}
                          fill
                          sizes="(max-width: 768px) 100vw, (max-width: 1024px) 50vw, 33vw"
                          className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/10] w-full bg-primary/10 flex items-center justify-center">
                        <BookOpen className="size-8 text-primary/40" />
                      </div>
                    )}

                    {/* Meta & titles */}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-1.5 mb-2">
                        {post.category && (
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-primary">
                            {post.category.name}
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-foreground mb-2 line-clamp-2 leading-tight group-hover:text-primary transition-colors">
                        {post.title}
                      </h3>

                      <p className="text-xs text-muted-foreground line-clamp-3 mb-4 leading-relaxed flex-1">
                        {post.excerpt || t("noExcerpt")}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-border text-[10px] text-muted-foreground font-medium">
                        <span className="truncate max-w-[120px]">
                          {post.displayAuthorName || post.author.fullName}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="flex items-center gap-0.5">
                            <Clock className="size-3 text-muted-foreground/60" />
                            {t("minuteRead", { count: post.readingTime })}
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {posts.length > 0 && (
              <div className="flex justify-between items-center pt-4 border-t border-border text-xs">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={params.page === 1}
                  onClick={() => handlePageChange(params.page - 1)}
                  className="h-8 font-semibold text-xs border-border"
                >
                  {t("previous")}
                </Button>
                <span className="text-muted-foreground font-semibold">
                  {t("page", { page: params.page })} /{" "}
                  {Math.ceil((postsData.total || 1) / limit)}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={
                    params.page >= Math.ceil((postsData.total || 0) / limit)
                  }
                  onClick={() => handlePageChange(params.page + 1)}
                  className="h-8 font-semibold text-xs border-border"
                >
                  {t("next")}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
