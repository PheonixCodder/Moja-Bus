"use client";

import Image from "next/image";
import { Button } from "@moja/ui/components/ui/button";
import { Card } from "@moja/ui/components/ui/card";
import { Input } from "@moja/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import {
  keepPreviousData,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import { format } from "date-fns";
import {
  Archive,
  BookOpen,
  Clock,
  Edit2,
  FileText,
  Filter,
  FolderKanban,
  Globe,
  Hash,
  Plus,
  Search,
  SearchX,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { parseAsInteger, useQueryState } from "nuqs";
import { useEffect, useState } from "react";
import { useTRPC } from "@/trpc/client";
import { AdminCategoriesView } from "./admin-categories-view";
import { AdminTagsView } from "./admin-tags-view";
import { AdminBannersView } from "./admin-banners-view";
import { NewBlogPostDialog } from "./new-blog-post-dialog";

export function AdminBlogView() {
  const t = useTranslations("adminDashboard.adminBlogView");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const router = useRouter();
  const [isNewPostOpen, setIsNewPostOpen] = useState(false);

  const [activeTab, setActiveTab] = useQueryState("tab", {
    defaultValue: "posts",
  });
  const [searchQuery, setSearchQuery] = useQueryState("q", {
    defaultValue: "",
  });
  const [selectedStatus, setSelectedStatus] = useQueryState("status", {
    defaultValue: "",
  });
  const [currentPageParam, setCurrentPageParam] = useQueryState(
    "page",
    parseAsInteger.withDefault(1),
  );
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
          <h1 className="text-3xl font-bold text-foreground">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">{t("subtitle")}</p>
        </div>
        {activeTab === "posts" && (
          <Button
            onClick={() => setIsNewPostOpen(true)}
            className="gap-2 h-9 font-semibold text-xs shrink-0 self-start sm:self-auto"
          >
            <Plus className="size-4" />
            {t("newPost")}
          </Button>
        )}
      </div>

      {/* Navigation tabs */}
      <div className="border-b border-border">
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("posts")}
            className={`flex items-center gap-1.5 pb-3 text-xs font-semibold rounded-none border-b-2 -mb-px transition-all h-auto py-2 hover:bg-transparent ${
              activeTab === "posts"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <BookOpen className="size-4" />
            {t("posts")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("categories")}
            className={`flex items-center gap-1.5 pb-3 text-xs font-semibold rounded-none border-b-2 -mb-px transition-all h-auto py-2 hover:bg-transparent ${
              activeTab === "categories"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <FolderKanban className="size-4" />
            {t("categories")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("tags")}
            className={`flex items-center gap-1.5 pb-3 text-xs font-semibold rounded-none border-b-2 -mb-px transition-all h-auto py-2 hover:bg-transparent ${
              activeTab === "tags"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Hash className="size-4" />
            {t("tags")}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setActiveTab("banners")}
            className={`flex items-center gap-1.5 pb-3 text-xs font-semibold rounded-none border-b-2 -mb-px transition-all h-auto py-2 hover:bg-transparent ${
              activeTab === "banners"
                ? "border-foreground text-foreground"
                : "border-transparent text-muted-foreground hover:text-foreground"
            }`}
          >
            <Globe className="size-4" />
            {t("banners")}
          </Button>
        </div>
      </div>

      {/* Conditionally render views */}
      {activeTab === "categories" && <AdminCategoriesView />}
      {activeTab === "tags" && <AdminTagsView />}
      {activeTab === "banners" && <AdminBannersView />}

      {activeTab === "posts" && (
        <div className="space-y-6">
          {/* Filters */}
          <Card className="bg-card border-border shadow-sm p-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
              <div className="relative w-full sm:w-80">
                <Search className="absolute left-3 top-2.5 size-4 text-muted-foreground" />
                <Input
                  type="text"
                  placeholder={t("searchPlaceholder")}
                  value={searchVal}
                  onChange={(e) => setSearchVal(e.target.value)}
                  className="h-10 pl-9 pr-4 text-sm"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <Filter className="size-4 text-muted-foreground" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wider">
                  {t("statusLabel")}
                </span>
                <Select
                  value={selectedStatus || "ALL"}
                  onValueChange={(val) => {
                    setSelectedStatus(val === "ALL" ? "" : val);
                    setCurrentPageParam(1);
                  }}
                >
                  <SelectTrigger className="h-10 w-full sm:w-40 bg-card">
                    <SelectValue placeholder={t("allStatuses")} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="ALL">{t("allStatuses")}</SelectItem>
                    <SelectItem value="DRAFT">{t("draft")}</SelectItem>
                    <SelectItem value="REVIEW">{t("inReview")}</SelectItem>
                    <SelectItem value="SCHEDULED">{t("scheduled")}</SelectItem>
                    <SelectItem value="PUBLISHED">{t("published")}</SelectItem>
                    <SelectItem value="ARCHIVED">{t("archived")}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </Card>

          {/* Table */}
          {!blogData ? (
            <div className="h-40 flex items-center justify-center bg-card border border-border rounded-md">
              <Spinner className="size-6 text-muted-foreground" />
            </div>
          ) : blogData.items.length === 0 ? (
            <div className="rounded-md border border-dashed border-border bg-muted/30 p-12 text-center space-y-3">
              <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center text-muted-foreground mx-auto">
                <SearchX className="size-6" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground">
                  {t("noPostsFound")}
                </h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  {searchQuery || selectedStatus
                    ? t("noPostsMatchFilters")
                    : t("getStartedCreatingPost")}
                </p>
              </div>
              {!(searchQuery || selectedStatus) && (
                <Button
                  onClick={() => setIsNewPostOpen(true)}
                  variant="outline"
                  className="mt-4 gap-2 h-9"
                >
                  <Plus className="size-4" />
                  {t("createFirstPost")}
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              <div className="border border-border rounded-md bg-card overflow-hidden shadow-sm">
                <Table>
                  <TableHeader>
                    <TableRow className="bg-muted/40 hover:bg-muted/40">
                      <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                        {t("cover")}
                      </TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                        {t("title")}
                      </TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                        {t("status")}
                      </TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                        {t("author")}
                      </TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                        {t("views")}
                      </TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                        {t("lastUpdated")}
                      </TableHead>
                      <TableHead className="text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4 text-right">
                        {t("actions")}
                      </TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {blogData.items.map((post) => (
                      <TableRow
                        key={post.id}
                        className="hover:bg-muted/50 transition-colors"
                      >
                        <TableCell className="px-4 py-3">
                          {post.coverImage ? (
                            <Image
                              unoptimized
                              src={post.coverImage}
                              alt={post.title}
                              width={64}
                              height={40}
                              className="h-10 w-16 rounded-md object-cover border border-border"
                            />
                          ) : (
                            <div className="h-10 w-16 rounded-md border border-dashed border-border bg-muted/40 flex items-center justify-center text-xs text-muted-foreground">
                              N/A
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <div className="font-semibold text-foreground line-clamp-1">
                            {post.title}
                          </div>
                          {post.category && (
                            <div className="text-muted-foreground text-xs uppercase font-bold tracking-wider mt-1">
                              {post.category.name}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="px-4 py-3">
                          <StatusBadge status={post.status} />
                        </TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground text-xs font-medium">
                          {post.displayAuthorName || post.author.fullName}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground text-xs font-medium">
                          {post.viewCount.toLocaleString()}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-muted-foreground text-xs">
                          {format(new Date(post.updatedAt), "MMM d, yyyy")}
                        </TableCell>
                        <TableCell className="px-4 py-3 text-right">
                          <div className="flex justify-end">
                            <Button
                              onClick={() =>
                                router.push(
                                  `/dashboard/admin/content/posts/${post.id}/edit`,
                                )
                              }
                              size="sm"
                              variant="ghost"
                              className="size-8 p-0 text-muted-foreground hover:text-foreground"
                            >
                              <Edit2 className="size-4" />
                              <span className="sr-only">{t("edit")}</span>
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
                  <span className="text-muted-foreground font-medium">
                    {t("showing", {
                      start: currentPage * pageSize + 1,
                      end: Math.min(
                        (currentPage + 1) * pageSize,
                        blogData.total,
                      ),
                      total: blogData.total,
                    })}
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPageParam === 1}
                      onClick={() => setCurrentPageParam((p) => p - 1)}
                      className="h-8 text-xs font-semibold"
                    >
                      {t("previous")}
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      disabled={currentPageParam * pageSize >= blogData.total}
                      onClick={() => setCurrentPageParam((p) => p + 1)}
                      className="h-8 text-xs font-semibold"
                    >
                      {t("next")}
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
    PUBLISHED: {
      icon: Globe,
      class: "bg-success/15 text-success border-success/30",
      label: "Published",
    },
    DRAFT: {
      icon: FileText,
      class: "bg-muted text-muted-foreground border-border",
      label: "Draft",
    },
    REVIEW: {
      icon: FileText,
      class: "bg-warning/15 text-warning border-warning/30",
      label: "In Review",
    },
    SCHEDULED: {
      icon: Clock,
      class: "bg-primary/15 text-primary border-primary/30",
      label: "Scheduled",
    },
    ARCHIVED: {
      icon: Archive,
      class: "bg-destructive/15 text-destructive border-destructive/30",
      label: "Archived",
    },
  };

  const config = configs[status] || configs["DRAFT"];
  const Icon = config!.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded text-xs uppercase font-bold tracking-wider border ${config!.class}`}
    >
      <Icon className="w-3 h-3" />
      {config!.label}
    </span>
  );
}
