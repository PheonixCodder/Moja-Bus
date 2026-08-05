"use client";

import { useEffect, useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { useTRPC } from "@/trpc/client";
import { useSuspenseQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import {
  ArrowLeft,
  Save,
  Globe,
  Clock,
  FileText,
  Archive,
  Eye,
  Loader2,
  Tag,
  BookOpen,
  Settings2,
  Search,
  AlertCircle,
  X,
  Hash,
} from "lucide-react";
import { Button } from "@moja/ui/components/ui/button";
import { DateTimePicker } from "@moja/ui/components/ui/date-time-picker";
import { Input } from "@moja/ui/components/ui/input";
import { Textarea } from "@moja/ui/components/ui/textarea";
import { Badge } from "@moja/ui/components/ui/badge";
import { Separator } from "@moja/ui/components/ui/separator";
import { Switch } from "@moja/ui/components/ui/switch";
import { Spinner } from "@moja/ui/components/ui/spinner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { useStorageUpload } from "@/lib/storage-client";
import { ImageUploadField } from "@/components/image-upload-field";

// Lazy-load the MDX editor (browser-only)
const MdxEditorWrapper = dynamic(
  () => import("./mdx-editor-wrapper").then((m) => m.MdxEditorWrapper),
  {
    ssr: false,
    loading: () => (
      <div className="h-[500px] flex items-center justify-center bg-slate-50 border border-slate-200 rounded-lg">
        <Loader2 className="size-6 animate-spin text-slate-400" />
      </div>
    ),
  }
);

// â”€â”€â”€ Zod schema â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const editPostSchema = z
  .object({
    title: z.string().min(1, "Title is required").max(200),
    slug: z
      .string()
      .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Lowercase letters, numbers, hyphens only")
      .min(1, "Slug is required"),
    content: z.string().min(1, "Content is required"),
    excerpt: z.string().max(500).optional().or(z.literal("")),
    status: z.enum(["DRAFT", "REVIEW", "SCHEDULED", "PUBLISHED", "ARCHIVED"]),
    scheduledFor: z.string().optional(),
    coverImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    coverImageAlt: z.string().max(200).optional().or(z.literal("")),
    coverImageCredit: z.string().max(200).optional().or(z.literal("")),
    ogImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    displayAuthorName: z.string().max(100).optional().or(z.literal("")),
    displayAuthorBio: z.string().max(500).optional().or(z.literal("")),
    categoryId: z.string().optional().or(z.literal("")),
    tagIds: z.array(z.string()).default([]),
    featured: z.boolean(),
    allowIndex: z.boolean(),
    allowComments: z.boolean(),
    seoTitle: z.string().max(70).optional().or(z.literal("")),
    seoDescription: z.string().max(160).optional().or(z.literal("")),
    canonicalUrl: z.string().url("Must be a valid URL").optional().or(z.literal("")),
    twitterTitle: z.string().max(70).optional().or(z.literal("")),
    twitterDescription: z.string().max(200).optional().or(z.literal("")),
    twitterImage: z.string().url("Must be a valid URL").optional().or(z.literal("")),
  })
  .refine(
    (data) => {
      if (data.status === "SCHEDULED") {
        return !!data.scheduledFor && data.scheduledFor.trim() !== "";
      }
      return true;
    },
    {
      message: "Publish date/time is required when status is Scheduled",
      path: ["scheduledFor"],
    }
  );

type EditPostFormValues = z.infer<typeof editPostSchema>;

// â”€â”€â”€ Status config â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

const STATUS_CONFIG = {
  PUBLISHED: { icon: Globe, cls: "bg-emerald-50 text-emerald-700 border-emerald-200", label: "Published" },
  DRAFT: { icon: FileText, cls: "bg-slate-100 text-slate-600 border-slate-200", label: "Draft" },
  REVIEW: { icon: Eye, cls: "bg-yellow-50 text-yellow-700 border-yellow-200", label: "In Review" },
  SCHEDULED: { icon: Clock, cls: "bg-indigo-50 text-indigo-700 border-indigo-200", label: "Scheduled" },
  ARCHIVED: { icon: Archive, cls: "bg-red-50 text-red-700 border-red-200", label: "Archived" },
} as const;

// â”€â”€â”€ Tab content components â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1">{children}</p>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <p className="text-[10px] font-extrabold text-slate-800 uppercase tracking-widest mb-2">{children}</p>;
}

// â”€â”€â”€ Main component â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€

export function BlogEditView({ postId }: { postId: string }) {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const t = useTranslations("adminDashboard.blogEditView");

  const { data: post } = useSuspenseQuery(
    trpc.admin.getBlogPostById.queryOptions({ id: postId })
  );
  const { data: categories } = useSuspenseQuery(
    trpc.admin.listBlogCategories.queryOptions()
  );
  const { data: allTags } = useSuspenseQuery(
    trpc.admin.listBlogTags.queryOptions()
  );

  const updatePost = useMutation(
    trpc.admin.updateBlogPost.mutationOptions({
      onSuccess: () => {
        queryClient.invalidateQueries(trpc.admin.listBlogPosts.pathFilter());
        queryClient.invalidateQueries(trpc.admin.getBlogPostById.pathFilter());
        toast.success("Post saved");
      },
      onError: (err: any) => {
        toast.error(err?.message ?? "Failed to save post");
      },
    })
  );

  const form = useForm<EditPostFormValues>({
    resolver: zodResolver(editPostSchema) as any,
    defaultValues: {
      title: post.title,
      slug: post.slug,
      content: post.content,
      excerpt: post.excerpt ?? "",
      status: post.status as EditPostFormValues["status"],
      scheduledFor: post.scheduledFor
        ? new Date(post.scheduledFor).toISOString().slice(0, 16)
        : "",
      coverImage: post.coverImage ?? "",
      coverImageAlt: post.coverImageAlt ?? "",
      coverImageCredit: post.coverImageCredit ?? "",
      ogImage: post.ogImage ?? "",
      displayAuthorName: post.displayAuthorName ?? "",
      displayAuthorBio: post.displayAuthorBio ?? "",
      categoryId: post.categoryId ?? "",
      tagIds: post.tags.map((t) => t.id),
      featured: post.featured,
      allowIndex: post.allowIndex,
      allowComments: post.allowComments,
      seoTitle: post.seoTitle ?? "",
      seoDescription: post.seoDescription ?? "",
      canonicalUrl: post.canonicalUrl ?? "",
      twitterTitle: post.twitterTitle ?? "",
      twitterDescription: post.twitterDescription ?? "",
      twitterImage: post.twitterImage ?? "",
    },
  });

  const { register, control, handleSubmit, watch, setValue, formState: { errors, isDirty } } = form;

  const { upload: uploadCover } = useStorageUpload("blog-cover", { slug: post.slug });

  const watchedStatus = watch("status");
  const watchedSeoTitle = watch("seoTitle");
  const watchedSeoDescription = watch("seoDescription");
  const watchedExcerpt = watch("excerpt");

  const savePost = useCallback(async (values: EditPostFormValues, targetStatus?: "PUBLISHED") => {
    const status = targetStatus || values.status;
    await updatePost.mutateAsync({
      id: postId,
      title: values.title,
      slug: values.slug,
      content: values.content,
      excerpt: values.excerpt || null,
      status,
      scheduledFor: values.scheduledFor ? new Date(values.scheduledFor) : null,
      coverImage: values.coverImage || null,
      coverImageAlt: values.coverImageAlt || null,
      coverImageCredit: values.coverImageCredit || null,
      ogImage: values.ogImage || null,
      displayAuthorName: values.displayAuthorName || null,
      displayAuthorBio: values.displayAuthorBio || null,
      categoryId: values.categoryId || null,
      tagIds: values.tagIds,
      featured: values.featured,
      allowIndex: values.allowIndex,
      allowComments: values.allowComments,
      seoTitle: values.seoTitle || null,
      seoDescription: values.seoDescription || null,
      canonicalUrl: values.canonicalUrl || null,
      twitterTitle: values.twitterTitle || null,
      twitterDescription: values.twitterDescription || null,
      twitterImage: values.twitterImage || null,
    });
    if (targetStatus) {
      form.setValue("status", targetStatus);
    }
  }, [postId, updatePost, form]);

  const onSubmit = useCallback(async (values: EditPostFormValues) => {
    await savePost(values);
  }, [savePost]);

  const onPublish = useCallback(async (values: EditPostFormValues) => {
    await savePost(values, "PUBLISHED");
  }, [savePost]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "s") {
        e.preventDefault();
        handleSubmit(onSubmit)();
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [handleSubmit, onSubmit]);

  const cfg = STATUS_CONFIG[watchedStatus] ?? STATUS_CONFIG.DRAFT;
  const StatusIcon = cfg.icon;

  // â”€â”€ Sidebar Tab state (manual tabs to avoid layout conflicts) â”€â”€
  const [activeTab, setActiveTab] = useState<"post" | "settings" | "seo">("post");
  const [tagSearch, setTagSearch] = useState("");

  const tabs = [
    { id: "post" as const, label: t("post"), icon: BookOpen },
    { id: "settings" as const, label: t("settings"), icon: Settings2 },
    { id: "seo" as const, label: t("seo"), icon: Search },
  ];

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="h-full flex flex-col overflow-hidden bg-white">
      {/* â”€â”€ Top Bar â”€â”€ */}
      <div className="flex items-center justify-between px-5 py-2.5 border-b border-slate-200 bg-white shrink-0 z-10">
        <div className="flex items-center gap-3 min-w-0">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="h-8 w-8 p-0 text-slate-400 hover:text-slate-900 shrink-0"
            onClick={() => router.push("/dashboard/admin/content/posts")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div className="min-w-0 flex items-center gap-2">
            <p className="text-sm font-semibold text-slate-900 truncate max-w-xs">
              {watch("title") || t("untitledPost")}
            </p>
            {isDirty && (
              <Badge className="bg-amber-50 text-amber-600 border-amber-200 text-[10px] font-bold shrink-0 py-0">
                {t("unsaved")}
              </Badge>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className={`hidden sm:inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] uppercase font-extrabold tracking-wider border ${cfg.cls}`}>
            <StatusIcon className="w-3 h-3" />
            {cfg.label}
          </span>

          <Button
            type="submit"
            variant="outline"
            size="sm"
            className="h-8 gap-1.5 text-xs font-semibold border-slate-200"
            disabled={updatePost.isPending}
          >
            {updatePost.isPending ? <Spinner className="size-3.5" /> : <Save className="size-3.5" />}
{t("save")}
            <kbd className="hidden sm:inline-flex items-center text-[10px] text-slate-400 font-mono ml-0.5 gap-0.5">
              âŒ˜S
            </kbd>
          </Button>

          <Button
            type="button"
            size="sm"
            className="h-8 gap-1.5 text-xs font-semibold bg-slate-900 hover:bg-slate-800 text-white"
            disabled={updatePost.isPending || watchedStatus === "PUBLISHED"}
            onClick={() => {
              void handleSubmit(onPublish)();
            }}
          >
            <Globe className="size-3.5" />
            {watchedStatus === "PUBLISHED" ? t("published") : t("publish")}
          </Button>
        </div>
      </div>

      {/* â”€â”€ Main Area (70% content, 30% settings) â”€â”€ */}
      <div className="flex-1 flex overflow-hidden w-full">
        {/* Editor Column (70%) */}
        <div className="w-[70%] min-w-0 h-full overflow-y-auto overflow-x-hidden p-6 space-y-5 flex flex-col">
            {/* Title */}
            <div>
              <input
                {...register("title")}
                placeholder={t("postTitle")}
                className="w-full text-[28px] font-bold text-slate-900 placeholder-slate-300 bg-transparent border-none outline-none leading-tight"
              />
              {errors.title && (
                <p className="flex items-center gap-1 text-xs text-red-600 mt-1">
                  <AlertCircle className="size-3" /> {errors.title.message}
                </p>
              )}
            </div>

            <Separator className="bg-slate-100" />

            {/* MDX Content */}
            <div className="space-y-2 min-w-0 w-full">
              <FieldLabel>{t("content")}</FieldLabel>
              <div className="border border-slate-200 rounded-xl overflow-hidden shadow-sm bg-white w-full min-w-0">
                <Controller
                  name="content"
                  control={control}
                  render={({ field }) => (
                    <MdxEditorWrapper markdown={field.value} onChange={field.onChange} />
                  )}
                />
              </div>
              {errors.content && (
                <p className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="size-3" /> {errors.content.message}
                </p>
              )}
            </div>

            {/* Excerpt */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <FieldLabel>{t("excerpt")}</FieldLabel>
                <span className="text-[10px] text-slate-400">{(watchedExcerpt ?? "").length}/500</span>
              </div>
              <Textarea
                {...register("excerpt")}
                placeholder={t("briefSummaryForSocialSharing")}
                className="resize-none text-sm min-h-[80px]"
                rows={3}
              />
            </div>
        </div>

        {/* Sidebar Column (30%) */}
        <div className="w-[30%] min-w-0 h-full flex flex-col border-l border-slate-200 bg-slate-50/40 overflow-hidden">
            {/* Manual tab bar */}
            <div className="shrink-0 border-b border-slate-200 bg-white px-1 pt-1">
              <div className="flex">
                {tabs.map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    type="button"
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2.5 text-xs font-semibold transition-all border-b-2 -mb-px ${
                      activeTab === id
                        ? "border-slate-900 text-slate-900"
                        : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    <Icon className="size-3.5" />
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">

              {/* â”€â”€ POST TAB â”€â”€ */}
              {activeTab === "post" && (
                <>
                  <div className="space-y-1.5">
                    <SectionLabel>{t("status")}</SectionLabel>
                    <Controller
                      name="status"
                      control={control}
                      render={({ field }) => (
                        <Select value={field.value} onValueChange={field.onChange}>
                          <SelectTrigger className="w-full h-9 text-sm bg-white">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="DRAFT">
                              <div className="flex items-center gap-2">
                                <FileText className="size-3.5 text-slate-500" /> {t("draft")}
                              </div>
                            </SelectItem>
                            <SelectItem value="REVIEW">
                              <div className="flex items-center gap-2">
                                <Eye className="size-3.5 text-yellow-500" /> {t("inReview")}
                              </div>
                            </SelectItem>
                            <SelectItem value="SCHEDULED">
                              <div className="flex items-center gap-2">
                                <Clock className="size-3.5 text-indigo-500" /> {t("scheduled")}
                              </div>
                            </SelectItem>
                            <SelectItem value="PUBLISHED">
                              <div className="flex items-center gap-2">
                                <Globe className="size-3.5 text-emerald-500" /> {t("published")}
                              </div>
                            </SelectItem>
                            <SelectItem value="ARCHIVED">
                              <div className="flex items-center gap-2">
                                <Archive className="size-3.5 text-red-500" /> {t("archived")}
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  {watchedStatus === "SCHEDULED" && (
                    <div className="space-y-1.5">
                      <SectionLabel>{t("publishDateAndTime")}</SectionLabel>
                      <Controller
                        name="scheduledFor"
                        control={control}
                        render={({ field }) => (
                          <DateTimePicker
                            value={field.value ? new Date(field.value) : undefined}
                            onChange={(date) => field.onChange(date ? date.toISOString().slice(0, 16) : "")}
                            placeholder={t("selectPublicationTime")}
                            className="bg-white text-sm"
                          />
                        )}
                      />
                    </div>
                  )}

                  <Separator />

                  <div className="space-y-1.5">
                    <SectionLabel>{t("urlSlug")}</SectionLabel>
                    <Input {...register("slug")} placeholder={t("myPostSlug")} className="h-9 text-sm font-mono bg-white" />
                    {errors.slug && (
                      <p className="flex items-center gap-1 text-[10px] text-red-600">
                        <AlertCircle className="size-3" /> {errors.slug.message}
                      </p>
                    )}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <SectionLabel>{t("author")} — {post.author?.fullName ?? "Unknown"}</SectionLabel>
                    <div className="space-y-1.5">
                      <FieldLabel>{t("displayNameOverride")}</FieldLabel>
                      <Input {...register("displayAuthorName")} placeholder={t("overrideName")} className="h-8 text-sm bg-white" />
                    </div>
                    <div className="space-y-1.5">
                      <FieldLabel>{t("bioOverride")}</FieldLabel>
                      <Textarea {...register("displayAuthorBio")} placeholder={t("overrideBio")} className="text-sm resize-none min-h-[56px] bg-white" rows={2} />
                    </div>
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white rounded-lg border border-slate-200 p-3">
                      <FieldLabel>{t("views")}</FieldLabel>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">{post.viewCount.toLocaleString()}</p>
                    </div>
                    <div className="bg-white rounded-lg border border-slate-200 p-3">
                      <FieldLabel>{t("words")}</FieldLabel>
                      <p className="text-xl font-bold text-slate-900 mt-0.5">{post.wordCount.toLocaleString()}</p>
                    </div>
                  </div>
                </>
              )}

              {/* â”€â”€ SETTINGS TAB â”€â”€ */}
              {activeTab === "settings" && (
                <>
                  <div className="space-y-1.5">
                    <SectionLabel>{t("category")}</SectionLabel>
                    <Controller
                      name="categoryId"
                      control={control}
                      render={({ field }) => (
                        <Select
                          value={field.value ?? ""}
                          onValueChange={(v) => field.onChange(v === "__none__" ? "" : v)}
                        >
                          <SelectTrigger className="w-full h-9 text-sm bg-white">
                            <SelectValue placeholder={t("noCategory")} />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="__none__">
                              <span className="text-slate-400">{t("noCategory")}</span>
                            </SelectItem>
                            {categories.map((cat) => (
                              <SelectItem key={cat.id} value={cat.id}>
                                {cat.parent ? `${cat.parent.name} / ${cat.name}` : cat.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <SectionLabel>{t("tags")}</SectionLabel>
                    <Controller
                      name="tagIds"
                      control={control}
                      render={({ field }) => {
                        const selectedIds = new Set(field.value || []);
                        const filteredTags = allTags.filter((tag) =>
                          tag.name.toLowerCase().includes(tagSearch.toLowerCase())
                        );

                        const toggleTag = (id: string) => {
                          const next = new Set(selectedIds);
                          if (next.has(id)) {
                            next.delete(id);
                          } else {
                            next.add(id);
                          }
                          field.onChange(Array.from(next));
                        };

                        return (
                          <div className="space-y-2.5">
                            {/* Selected tag badges */}
                            <div className="flex flex-wrap gap-1.5 min-h-[26px] p-2 rounded-lg border border-slate-200 bg-white shadow-3xs">
                              {field.value.length === 0 ? (
                                <span className="text-[10px] text-slate-400 italic">{t("noTagsSelected")}</span>
                              ) : (
                                allTags
                                  .filter((t) => selectedIds.has(t.id))
                                  .map((tag) => (
                                    <button
                                      key={tag.id}
                                      type="button"
                                      onClick={() => toggleTag(tag.id)}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-slate-900 border border-slate-800 text-[10px] font-semibold text-white hover:bg-slate-800 transition-colors"
                                    >
                                      {tag.name}
                                      <X className="size-2.5 text-slate-300" />
                                    </button>
                                  ))
                              )}
                            </div>

                            {/* Search Tag input */}
                            <div className="relative">
                              <Search className="absolute left-2.5 top-2 size-3 text-slate-400" />
                              <Input
                                type="text"
                                placeholder={t("searchTagsToAdd")}
                                value={tagSearch}
                                onChange={(e) => setTagSearch(e.target.value)}
                                className="h-7 pl-7 text-[11px] bg-white border-slate-200"
                              />
                              {tagSearch && (
                                <button
                                  type="button"
                                  onClick={() => setTagSearch("")}
                                  className="absolute right-2 top-2 text-slate-400 hover:text-slate-600"
                                >
                                  <X className="size-3" />
                                </button>
                              )}
                            </div>

                            {/* Tags list options */}
                            <div className="max-h-36 overflow-y-auto border border-slate-200 rounded-lg p-1.5 bg-white space-y-1">
                              {filteredTags.length === 0 ? (
                                <p className="text-[10px] text-slate-400 text-center py-2">{t("noMatchingTagsFound")}</p>
                              ) : (
                                filteredTags.map((tag) => {
                                  const isSelected = selectedIds.has(tag.id);
                                  return (
                                    <button
                                      key={tag.id}
                                      type="button"
                                      onClick={() => toggleTag(tag.id)}
                                      className={`w-full flex items-center justify-between px-2 py-1 text-left text-xs rounded-md transition-colors ${
                                        isSelected
                                          ? "bg-slate-50 font-semibold text-slate-900"
                                          : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
                                      }`}
                                    >
                                      <span className="flex items-center gap-1.5">
                                        <Hash className="size-3 text-slate-400" />
                                        {tag.name}
                                      </span>
                                      {isSelected && (
                                        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">{t("added")}</span>
                                      )}
                                    </button>
                                  );
                                })
                              )}
                            </div>
                          </div>
                        );
                      }}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <SectionLabel>{t("featureFlags")}</SectionLabel>
                    {([
                      { name: "featured" as const, label: t("featured"), desc: t("pinToHomepage") },
                      { name: "allowIndex" as const, label: t("allowIndexing"), desc: t("letSearchEnginesIndex") },
                      { name: "allowComments" as const, label: t("allowComments"), desc: t("enableCommentSection") },
                    ]).map(({ name, label, desc }) => (
                      <div key={name} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-slate-700">{label}</p>
                          <p className="text-[10px] text-slate-400">{desc}</p>
                        </div>
                        <Controller
                          name={name}
                          control={control}
                          render={({ field }) => (
                            <Switch checked={field.value} onCheckedChange={field.onChange} size="sm" />
                          )}
                        />
                      </div>
                    ))}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <SectionLabel>{t("coverImage")}</SectionLabel>
                    {(["coverImage", "coverImageAlt", "coverImageCredit"] as const).map((f) =>
                      f === "coverImage" ? (
                        <div key={f} className="space-y-1">
                          <FieldLabel>{t("image")}</FieldLabel>
                          <ImageUploadField
                            purpose="blog-cover"
                            value={watch("coverImage") || null}
                            onUploaded={(r) => setValue("coverImage", r.fileUrl)}
                            label={t("uploadCover")}
                            hint={t("pngOrJpgUpTo5mb")}
                            shape="square"
                            previewClassName="h-28 w-48"
                          />
                        </div>
                      ) : (
                        <div key={f} className="space-y-1">
                          <FieldLabel>
                            {f === "coverImageAlt" ? t("altText") : t("credit")}
                          </FieldLabel>
                          <Input
                            {...register(f)}
                            placeholder={f === "coverImageAlt" ? t("descriptiveAltText") : t("photoByUnsplash")}
                            className="h-8 text-sm bg-white"
                          />
                          {errors[f] && <p className="text-[10px] text-red-600">{errors[f]?.message}</p>}
                        </div>
                      ),
                    )}
                  </div>
                </>
              )}

              {/* â”€â”€ SEO TAB â”€â”€ */}
              {activeTab === "seo" && (
                <>
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <SectionLabel>{t("seoTitle")}</SectionLabel>
                      <span className={`text-[10px] font-bold ${(watchedSeoTitle?.length ?? 0) > 60 ? "text-amber-600" : "text-slate-400"}`}>
                        {watchedSeoTitle?.length ?? 0}/70
                      </span>
                    </div>
                    <Input {...register("seoTitle")} placeholder={t("overrideTitleInSearchResults")} className="h-9 text-sm bg-white" />
                    {errors.seoTitle && <p className="text-[10px] text-red-600">{errors.seoTitle.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between">
                      <SectionLabel>{t("seoDescription")}</SectionLabel>
                      <span className={`text-[10px] font-bold ${(watchedSeoDescription?.length ?? 0) > 140 ? "text-amber-600" : "text-slate-400"}`}>
                        {watchedSeoDescription?.length ?? 0}/160
                      </span>
                    </div>
                    <Textarea {...register("seoDescription")} placeholder={t("metaDescriptionShownInSearch")} className="resize-none text-sm min-h-[72px] bg-white" rows={3} />
                    {errors.seoDescription && <p className="text-[10px] text-red-600">{errors.seoDescription.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <SectionLabel>{t("canonicalUrl")}</SectionLabel>
                    <Input {...register("canonicalUrl")} placeholder={t("https")} className="h-9 text-sm bg-white" />
                    {errors.canonicalUrl && <p className="text-[10px] text-red-600">{errors.canonicalUrl.message}</p>}
                  </div>

                  <div className="space-y-1.5">
                    <SectionLabel>{t("ogImageUrl")}</SectionLabel>
                    <Input {...register("ogImage")} placeholder={t("https")} className="h-9 text-sm bg-white" />
                    {errors.ogImage && <p className="text-[10px] text-red-600">{errors.ogImage.message}</p>}
                  </div>

                  <Separator />

                  <div className="space-y-3">
                    <SectionLabel>{t("twitterCard")}</SectionLabel>
                    {(["twitterTitle", "twitterDescription", "twitterImage"] as const).map((f) => (
                      <div key={f} className="space-y-1">
                        <FieldLabel>
                          {f === "twitterTitle" ? t("twitterTitle") : f === "twitterDescription" ? t("twitterDescription") : t("twitterImageUrl")}
                        </FieldLabel>
                        {f === "twitterDescription" ? (
                          <Textarea {...register(f)} placeholder={t("twitterDescription")} className="resize-none text-sm min-h-[56px] bg-white" rows={2} />
                        ) : (
                          <Input {...register(f)} placeholder={f === "twitterImage" ? t("https") : t("twitterTitle")} className="h-8 text-sm bg-white" />
                        )}
                        {errors[f] && <p className="text-[10px] text-red-600">{errors[f]?.message}</p>}
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>
      </form>
  );
}
