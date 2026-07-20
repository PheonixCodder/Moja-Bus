"use client";

import { useState, useEffect } from "react";
import { useTRPC } from "@/trpc/client";
import { useQuery, useQueryClient, keepPreviousData } from "@tanstack/react-query";
import { useQueryState, parseAsInteger } from "nuqs";
import { format } from "date-fns";
import { useRouter } from "next/navigation";
import {
  Plus,
  Edit2,
  Archive,
  Globe,
  Clock,
  FileText,
  SearchX,
  Search,
  Filter,
  FolderKanban,
  Hash,
  BookOpen
} from "lucide-react";
import { Card } from "@moja/ui/components/ui/card";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import { NewBlogPostDialog } from "./new-blog-post-dialog";
import { AdminCategoriesView } from "./admin-categories-view";
import { AdminTagsView } from "./admin-tags-view";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";

export function AdminBlogView() {
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);

  const [activeTab, setActiveTab] = useQueryState("tab", { defaultValue: "posts" });
  const [searchQuery, setSearchQuery] = useQueryState("q", { defaultValue: "" });
  const [selectedStatus, setSelectedStatus] = useQueryState("status", { defaultValue: "" });
  const [currentPageParam, setCurrentPageParam] = useQueryState("page", parseAsInteger.withDefault(1));
  const currentPage = currentPageParam - 1; // 0-indexed internally
  const pageSize = 20;

  const [searchVal, setSearchVal] = useState(searchQuery);

  // Debounce admin search input to avoid triggering RSC fetches/suspensions per keystroke
  useEffect(() => {
    const timer = setTimeout(() => {
      void setSearchQuery(searchVal || null);
      void setCurrentPageParam(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchVal, setSearchQuery, setCurrentPageParam]);

  // Sync back when searchQuery is modified externally (e.g. cleared)
  useEffect(() => {
    setSearchVal(searchQuery);
  }, [searchQuery]);

  const { data: blogData } = useQuery({
    ...trpc.admin.listBlogPosts.queryOptions({
      search: searchQuery || undefined,
      status: selectedStatus || undefined,
      limit: pageSize,
      offset: currentPage * pageSize,
    }),
    placeholderData: keepPreviousData,
  });

  return (
    <div className="space-y-6">
      <NewBlogPostDialog open={isNewPostOpen} onOpenChange={setIsNewPostOpen} />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between mb-2">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Blog Portal</h1>
          <p className="text-gray-500 mt-1">Manage platform publishing, editorial folders, and content tags.</p>
        </div>
        {activeTab === "posts" && (
          <Button onClick={() => setIsNewPostOpen(true)} className="gap-2 bg-gray-900 text-white hover:bg-gray-800 h-9 font-semibold text-xs shrink-0 self-start sm:self-auto">
            <Plus className="size-4" />
            New Post
          </Button>
        )}
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-slate-200">
        <div className="flex gap-4">
          <button
            type="button"
            onClick={() => setActiveTab("posts")}
            className={`flex items-center gap-1.5 pb-3 text-xs font-semibold border-b-2 -mb-px transition-all ${
              activeTab === "posts"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <BookOpen className="size-4" />
            Posts
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-1.5 pb-3 text-xs font-semibold border-b-2 -mb-px transition-all ${
              activeTab === "categories"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <FolderKanban className="size-4" />
            Categories
          </button>
          <button
            type="button"
            onClick={() => setActiveTab("tags")}
            className={`flex items-center gap-1.5 pb-3 text-xs font-semibold border-b-2 -mb-px transition-all ${
              activeTab === "tags"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            <Hash className="size-4" />
            Tags
          </button>
        </div>
      </div>

      {/* Conditionally render views */}
      {activeTab === "categories" && <AdminCategoriesView />}
      {activeTab === "tags" && <AdminTagsView />}

      {activeTab === "posts" && (
        <div className="space-y-6">

      {/* Filters */}
      <Card className="bg-white border-border shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
          <div className="relative w-full sm:w-80">
            <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
            <Input
              type="text"
              placeholder="Search by title or excerpt..."
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              className="h-10 pl-9 pr-4 text-sm"
            />
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <Filter className="size-4 text-slate-400" />
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">Status:</span>
            <Select
              value={selectedStatus || "ALL"}
              onValueChange={(val) => {
                setSelectedStatus(val === "ALL" ? "" : val);
                setCurrentPageParam(1);
              }}
            >
              <SelectTrigger className="h-10 w-full sm:w-40 bg-white">
                <SelectValue placeholder="All Statuses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">All Statuses</SelectItem>
                <SelectItem value="DRAFT">Draft</SelectItem>
                <SelectItem value="REVIEW">In Review</SelectItem>
                <SelectItem value="SCHEDULED">Scheduled</SelectItem>
                <SelectItem value="PUBLISHED">Published</SelectItem>
                <SelectItem value="ARCHIVED">Archived</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </Card>

      {/* Table */}
      {!blogData ? (
        <div className="h-40 flex items-center justify-center bg-white border border-border rounded-md">
          <Spinner className="size-6 text-slate-400" />
        </div>
      ) : blogData.items.length === 0 ? (
        <div className="rounded-md border border-dashed border-slate-200 bg-slate-50/50 p-12 text-center space-y-3">
          <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 mx-auto">
            <SearchX className="size-6" />
          </div>
          <div className="space-y-1">
            <h3 className="text-sm font-bold text-slate-800">No blog posts found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto leading-relaxed">
              {searchQuery || selectedStatus 
                ? "No posts match your current search and filters."
                : "Get started by creating your first blog post to share updates and content."}
            </p>
          </div>
          {!(searchQuery || selectedStatus) && (
            <Button onClick={() => setIsNewPostOpen(true)} variant="outline" className="mt-4 gap-2 h-9">
              <Plus className="size-4" />
              Create First Post
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <div className="border border-border rounded-md bg-white overflow-hidden shadow-sm">
            <Table>
              <TableHeader>
                <TableRow className="bg-slate-50 hover:bg-slate-50">
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Cover</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Title</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Status</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Author</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Views</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4">Last Updated</TableHead>
                  <TableHead className="text-xs font-bold text-slate-500 uppercase tracking-wider h-10 px-4 text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {blogData.items.map((post) => (
                  <TableRow key={post.id} className="hover:bg-slate-50/50 transition-colors">
                    <TableCell className="px-4 py-3">
                      {post.coverImage ? (
                        <img
                          src={post.coverImage}
                          alt={post.title}
                          className="h-10 w-16 rounded-md object-cover border border-border"
                        />
                      ) : (
                        <div className="h-10 w-16 rounded-md border border-dashed border-border bg-slate-50 flex items-center justify-center text-[9px] text-slate-400">
                          N/A
                        </div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <div className="font-semibold text-slate-900 line-clamp-1">{post.title}</div>
                      {post.category && (
                        <div className="text-slate-500 text-[10px] uppercase font-bold tracking-wider mt-1">{post.category.name}</div>
                      )}
                    </TableCell>
                    <TableCell className="px-4 py-3">
                      <StatusBadge status={post.status} />
                    </TableCell>
                    <TableCell className="px-4 py-3 text-slate-600 text-xs font-medium">
                      {post.displayAuthorName || post.author.fullName}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-slate-600 text-xs font-medium">
                      {post.viewCount.toLocaleString()}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-slate-500 text-xs">
                      {format(new Date(post.updatedAt), "MMM d, yyyy")}
                    </TableCell>
                    <TableCell className="px-4 py-3 text-right">
                      <div className="flex justify-end">
                        <Button onClick={() => router.push(`/dashboard/admin/content/posts/${post.id}/edit`)} size="sm" variant="ghost" className="h-8 w-8 p-0 text-slate-500 hover:text-slate-900">
                          <Edit2 className="size-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {blogData.total > pageSize && (
            <div className="flex justify-between items-center text-xs">
              <span className="text-slate-500 font-medium">
                Showing {currentPage * pageSize + 1} - {Math.min((currentPage + 1) * pageSize, blogData.total)} of {blogData.total} posts
              </span>
              <div className="flex gap-2">
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPageParam === 1}
                  onClick={() => setCurrentPageParam((p) => p - 1)}
                  className="h-8 text-xs font-semibold"
                >
                  Previous
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  disabled={currentPageParam * pageSize >= blogData.total}
                  onClick={() => setCurrentPageParam((p) => p + 1)}
                  className="h-8 text-xs font-semibold"
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </div>
      )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const configs: Record<string, { icon: any; class: string; label: string }> = {
    PUBLISHED: { icon: Globe, class: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Published" },
    DRAFT: { icon: FileText, class: "bg-slate-100 text-slate-700 border-slate-200", label: "Draft" },
    REVIEW: { icon: FileText, class: "bg-yellow-50 text-yellow-700 border-yellow-200", label: "In Review" },
    SCHEDULED: { icon: Clock, class: "bg-indigo-50 text-indigo-700 border-indigo-200", label: "Scheduled" },
    ARCHIVED: { icon: Archive, class: "bg-red-50 text-red-700 border-red-200", label: "Archived" },
  };

  const config = configs[status] || configs["DRAFT"];
  const Icon = config!.icon;

  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-[10px] uppercase font-bold tracking-wider border ${config!.class}`}>
      <Icon className="w-3 h-3" />
      {config!.label}
    </span>
  );
}
