"use client";

import { useState, useEffect } from "react";
import { useQueryStates } from "nuqs";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery } from "@tanstack/react-query";
import Link from "next/link";
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
    trpc.blog.listCategories.queryOptions()
  );
  
  const { data: tags } = useSuspenseQuery(
    trpc.blog.listTags.queryOptions()
  );

  const { data: postsData } = useSuspenseQuery(
    trpc.blog.getPublishedPosts.queryOptions({
      categorySlug: params.category || undefined,
      tagSlug: params.tag || undefined,
      searchQuery: params.q || undefined,
      limit: limit,
      offset: offset,
    })
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
    <div className="min-h-screen bg-slate-50/50 text-slate-800 antialiased">
      {/* ── Top Hero Zone (Matching Bus Search visual theme) ── */}
      <div className="bg-rose-50/70 border-b border-rose-100/50 pt-28 md:pt-36 pb-14">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
          <Badge className="bg-rose-100 text-rose-800 border-rose-200 hover:bg-rose-100 text-xs py-0.5 px-3 rounded-full font-semibold uppercase tracking-wider">
            Travel Guide
          </Badge>
          <h1 className="text-4xl md:text-5xl font-extrabold text-slate-900 tracking-tight">
            Moja Ride Blog
          </h1>
          <p className="max-w-2xl mx-auto text-sm md:text-base text-slate-600 leading-relaxed">
            Discover route maps, transit advisories, safety guides, and partner company news directly from our transport team.
          </p>

          {/* Inline search bar */}
          <div className="max-w-md mx-auto pt-4 relative">
            <Search className="absolute left-3.5 top-[25px] size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search guides, news, or articles..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="w-full pl-10 pr-4 h-11 text-sm bg-white border-slate-200 rounded-full shadow-sm focus:border-rose-400 focus:ring-rose-400/20"
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
            <Card className="bg-white border-slate-200 shadow-3xs p-4 rounded-xl">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-3">
                <FolderOpen className="size-3.5 text-rose-500" />
                Categories
              </h3>
              <div className="space-y-1">
                <button
                  type="button"
                  onClick={() => void setParams({ category: "", page: 1 })}
                  className={`w-full text-left px-2.5 py-1.5 rounded-md text-xs font-semibold flex items-center justify-between transition-all ${
                    !params.category
                      ? "bg-rose-50 text-rose-700"
                      : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                  }`}
                >
                  <span>All Categories</span>
                </button>

                {categories.map((cat) => {
                  const isSelected = params.category === cat.slug;
                  return (
                    <button
                      key={cat.id}
                      type="button"
                      onClick={() => void setParams({ category: cat.slug, page: 1 })}
                      className={`w-full text-left py-1.5 rounded-md text-xs transition-all flex items-center justify-between ${
                        cat.parentId ? "pl-5 font-normal" : "pl-2.5 font-semibold"
                      } ${
                        isSelected
                          ? "bg-rose-50 text-rose-700"
                          : "text-slate-600 hover:bg-slate-50 hover:text-slate-900"
                      }`}
                    >
                      <span className="flex items-center gap-1">
                        {cat.parentId && <ChevronRight className="size-3 text-slate-400" />}
                        {cat.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            </Card>

            {/* Tag cloud */}
            <Card className="bg-white border-slate-200 shadow-3xs p-4 rounded-xl">
              <h3 className="text-xs font-extrabold text-slate-900 uppercase tracking-widest flex items-center gap-2 mb-3">
                <TagIcon className="size-3.5 text-rose-500" />
                Popular Tags
              </h3>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => void setParams({ tag: "", page: 1 })}
                  className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border transition-all ${
                    !params.tag
                      ? "bg-rose-50 border-rose-200 text-rose-700 font-extrabold"
                      : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800"
                  }`}
                >
                  All Tags
                </button>
                {tags.map((tag) => {
                  const isSelected = params.tag === tag.slug;
                  return (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => void setParams({ tag: tag.slug, page: 1 })}
                      className={`px-2.5 py-1 rounded-full text-[10px] uppercase font-bold tracking-wider border transition-all ${
                        isSelected
                          ? "bg-rose-50 border-rose-200 text-rose-700 font-extrabold"
                          : "bg-white border-slate-200 text-slate-500 hover:border-slate-300 hover:text-slate-800"
                      }`}
                    >
                      #{tag.name}
                    </button>
                  );
                })}
              </div>
            </Card>
          </div>

          {/* ─ Right grids (Content stream) ─ */}
          <div className="lg:col-span-3 space-y-8">
            
            {/* Filter Reset Alert */}
            {hasActiveFilters && (
              <div className="flex items-center justify-between bg-white border border-slate-200 px-4 py-2.5 rounded-xl shadow-3xs text-xs">
                <div className="flex items-center gap-2">
                  <span className="text-slate-500">Active Filters:</span>
                  {params.q && <Badge variant="outline" className="border-rose-100 bg-rose-50/50 text-rose-700">Search: {params.q}</Badge>}
                  {params.category && <Badge variant="outline" className="border-rose-100 bg-rose-50/50 text-rose-700">Category: {params.category}</Badge>}
                  {params.tag && <Badge variant="outline" className="border-rose-100 bg-rose-50/50 text-rose-700">Tag: #{params.tag}</Badge>}
                </div>
                <button
                  type="button"
                  onClick={handleClearFilters}
                  className="text-rose-600 hover:text-rose-700 font-semibold underline"
                >
                  Clear all
                </button>
              </div>
            )}

            {/* Posts Grid */}
            {posts.length === 0 ? (
              <div className="text-center py-20 bg-white border border-slate-200 rounded-2xl flex flex-col items-center justify-center p-8 space-y-4">
                <div className="w-12 h-12 bg-rose-50 rounded-full flex items-center justify-center text-rose-600">
                  <SearchX className="size-6" />
                </div>
                <div className="space-y-1">
                  <h3 className="text-base font-bold text-slate-800">No matching articles found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
                    We couldn't find any published blog posts matching your search criteria. Try removing filters or searching for something else.
                  </p>
                </div>
                <Button onClick={handleClearFilters} className="h-9 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs">
                  Reset Search Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {posts.map((post) => (
                  <Link
                    key={post.id}
                    href={`/blog/${post.slug}`}
                    className="group flex flex-col bg-white rounded-xl shadow-3xs border border-slate-200 overflow-hidden hover:shadow-xs hover:-translate-y-0.5 transition-all duration-300"
                  >
                    {/* Cover image banner */}
                    {post.coverImage ? (
                      <div className="aspect-[16/10] w-full bg-slate-100 relative overflow-hidden">
                        <img
                          src={post.coverImage}
                          alt={post.coverImageAlt || post.title}
                          className="object-cover w-full h-full group-hover:scale-[1.03] transition-transform duration-500"
                        />
                      </div>
                    ) : (
                      <div className="aspect-[16/10] w-full bg-gradient-to-br from-rose-100/60 to-rose-50/30 flex items-center justify-center">
                        <BookOpen className="size-8 text-rose-200" />
                      </div>
                    )}

                    {/* Meta & titles */}
                    <div className="p-5 flex flex-col flex-1">
                      <div className="flex items-center gap-1.5 mb-2">
                        {post.category && (
                          <span className="text-[10px] uppercase font-extrabold tracking-wider text-rose-600">
                            {post.category.name}
                          </span>
                        )}
                      </div>
                      
                      <h3 className="text-sm font-bold text-slate-900 mb-2 line-clamp-2 leading-tight group-hover:text-rose-600 transition-colors">
                        {post.title}
                      </h3>
                      
                      <p className="text-xs text-slate-500 line-clamp-3 mb-4 leading-relaxed flex-1">
                        {post.excerpt || "No description provided."}
                      </p>

                      <div className="flex items-center justify-between pt-3 border-t border-slate-100 text-[10px] text-slate-400 font-medium">
                        <span className="truncate max-w-[120px]">
                          {post.displayAuthorName || post.author.fullName}
                        </span>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="flex items-center gap-0.5">
                            <Clock className="size-3 text-slate-300" />
                            {post.readingTime}m read
                          </span>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Pagination Controls */}
            {/* Since cursor-based pagination is supported in TRPC, we can simply restrict/load pages.
                For basic simplicity synced with page, we can render simple Prev/Next controls. */}
            {posts.length > 0 && (
              <div className="flex justify-between items-center pt-4 border-t border-slate-200 text-xs">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={params.page === 1}
                  onClick={() => handlePageChange(params.page - 1)}
                  className="h-8 font-semibold text-xs border-slate-200"
                >
                  Previous
                </Button>
                <span className="text-slate-500 font-semibold">
                  Page {params.page}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={posts.length < limit}
                  onClick={() => handlePageChange(params.page + 1)}
                  className="h-8 font-semibold text-xs border-slate-200"
                >
                  Next
                </Button>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}
