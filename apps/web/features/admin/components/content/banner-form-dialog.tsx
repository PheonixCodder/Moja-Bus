"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useStorageUpload } from "@/lib/storage-client";
import { useTranslations } from "next-intl";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@moja/ui/components/ui/select";
import { Switch } from "@moja/ui/components/ui/switch";
import { ImagePlus, Loader2 } from "lucide-react";
import Image from "next/image";

export interface PromoBanner {
  id: string;
  title: string;
  subtitle: string | null;
  badge: string | null;
  imageUrl: string;
  actionType: "SEARCH" | "APP_SCREEN" | "BLOG_ARTICLE" | "EXTERNAL_URL";
  actionPayload: any;
  gradientColors: string[];
  isActive: boolean;
  sortOrder: number;
}

interface BannerFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banner?: PromoBanner | null;
}

const bannerSchema = z.object({
  title: z.string().min(1, "Title is required").max(100),
  subtitle: z.string().max(200).optional(),
  badge: z.string().max(30).optional(),
  imageUrl: z.string().url("Valid image URL is required"),
  actionType: z.enum(["SEARCH", "APP_SCREEN", "BLOG_ARTICLE", "EXTERNAL_URL"]),
  targetTab: z.string().optional(),
  searchOrigin: z.string().optional(),
  searchDestination: z.string().optional(),
  blogSlug: z.string().optional(),
  externalUrl: z.string().optional(),
  gradientPreset: z.string(),
  isActive: z.boolean(),
  sortOrder: z.number().int(),
});

type FormValues = z.infer<typeof bannerSchema>;

const GRADIENT_PRESETS = [
  { label: "Rose / Purple (Signature)", colors: ["#ee237c", "#9333ea"] },
  { label: "Midnight / Rose", colors: ["#0f172a", "#ee237c"] },
  { label: "Sunset Amber", colors: ["#f59e0b", "#ee237c"] },
  { label: "Emerald Teal", colors: ["#059669", "#0d9488"] },
];

export function BannerFormDialog({
  open,
  onOpenChange,
  banner,
}: BannerFormDialogProps) {
  const t = useTranslations("adminDashboard.banners");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const { upload, uploading } = useStorageUpload("blog-cover");

  const createMutation = useMutation(trpc.admin.createBanner.mutationOptions());
  const updateMutation = useMutation(trpc.admin.updateBanner.mutationOptions());

  // Fetch published blog posts for BLOG_ARTICLE action target selector
  const { data: blogPostsData } = useQuery(
    trpc.admin.listBlogPosts.queryOptions({ limit: 50 }),
  );

  const {
    register,
    handleSubmit,
    control,
    reset,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormValues>({
    resolver: zodResolver(bannerSchema),
    defaultValues: {
      title: "",
      subtitle: "",
      badge: "",
      imageUrl: "",
      actionType: "SEARCH",
      targetTab: "search",
      searchOrigin: "",
      searchDestination: "",
      blogSlug: "",
      externalUrl: "",
      gradientPreset: "Rose / Purple (Signature)",
      isActive: true,
      sortOrder: 0,
    },
  });

  const watchActionType = watch("actionType");
  const watchImageUrl = watch("imageUrl");

  useEffect(() => {
    if (banner) {
      const payload = banner.actionPayload || {};
      reset({
        title: banner.title,
        subtitle: banner.subtitle || "",
        badge: banner.badge || "",
        imageUrl: banner.imageUrl,
        actionType: banner.actionType,
        targetTab: payload.targetTab || "search",
        searchOrigin: payload.originSlug || "",
        searchDestination: payload.destinationSlug || "",
        blogSlug: payload.slug || "",
        externalUrl: payload.url || "",
        gradientPreset: "Rose / Purple (Signature)",
        isActive: banner.isActive,
        sortOrder: banner.sortOrder,
      });
    } else {
      reset({
        title: "",
        subtitle: "",
        badge: "",
        imageUrl: "",
        actionType: "SEARCH",
        targetTab: "search",
        searchOrigin: "",
        searchDestination: "",
        blogSlug: "",
        externalUrl: "",
        gradientPreset: "Rose / Purple (Signature)",
        isActive: true,
        sortOrder: 0,
      });
    }
  }, [banner, reset, open]);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const result = await upload(file);
      setValue("imageUrl", result.fileUrl, { shouldValidate: true });
      toast.success(t("toast.imageUploaded"));
    } catch {
      toast.error(t("toast.imageUploadFailed"));
    }
  };

  const onSubmit = async (data: FormValues) => {
    let actionPayload: any = {};
    if (data.actionType === "SEARCH") {
      actionPayload = {
        originSlug: data.searchOrigin || undefined,
        destinationSlug: data.searchDestination || undefined,
      };
    } else if (data.actionType === "APP_SCREEN") {
      actionPayload = { targetTab: data.targetTab || "search" };
    } else if (data.actionType === "BLOG_ARTICLE") {
      actionPayload = { slug: data.blogSlug };
    } else if (data.actionType === "EXTERNAL_URL") {
      actionPayload = { url: data.externalUrl };
    }

    const selectedPreset = GRADIENT_PRESETS.find(
      (p) => p.label === data.gradientPreset,
    );
    const gradientColors = selectedPreset
      ? selectedPreset.colors
      : ["#ee237c", "#9333ea"];

    try {
      if (banner) {
        await updateMutation.mutateAsync({
          id: banner.id,
          title: data.title,
          subtitle: data.subtitle || null,
          badge: data.badge || null,
          imageUrl: data.imageUrl,
          actionType: data.actionType,
          actionPayload,
          gradientColors,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
        });
        toast.success(t("toast.bannerUpdated"));
      } else {
        await createMutation.mutateAsync({
          title: data.title,
          subtitle: data.subtitle || null,
          badge: data.badge || null,
          imageUrl: data.imageUrl,
          actionType: data.actionType,
          actionPayload,
          gradientColors,
          isActive: data.isActive,
          sortOrder: data.sortOrder,
        });
        toast.success(t("toast.bannerCreated"));
      }

      await queryClient.invalidateQueries();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || t("toast.saveFailed"));
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{banner ? t("editBanner") : t("newBannerDialogTitle")}</DialogTitle>
          <DialogDescription>
            {t("dialogDescription")}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Banner Image Upload */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">{t("form.bannerImage")}</label>
            {watchImageUrl ? (
              <div className="relative aspect-[21/9] w-full rounded-lg overflow-hidden border border-slate-200 group">
                <Image
                  unoptimized
                  src={watchImageUrl}
                  alt={t("table.preview")}
                  fill
                  className="object-cover"
                />
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  {t("form.changeImage")}
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleImageFileChange}
                  />
                </label>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center aspect-[21/9] w-full rounded-lg border-2 border-dashed border-slate-200 bg-slate-50 hover:bg-slate-100 transition-colors cursor-pointer">
                {uploading ? (
                  <Loader2 className="size-6 text-rose-500 animate-spin" />
                ) : (
                  <>
                    <ImagePlus className="size-6 text-slate-400 mb-1" />
                    <span className="text-xs font-medium text-slate-600">
                      {t("form.uploadImagePrompt")}
                    </span>
                  </>
                )}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleImageFileChange}
                />
              </label>
            )}
            {errors.imageUrl && (
              <p className="text-xs text-red-500">{errors.imageUrl.message}</p>
            )}
          </div>

          {/* Title & Subtitle */}
          <div className="space-y-3">
            <div>
              <label className="text-xs font-semibold text-slate-700">{t("form.title")}</label>
              <Input
                placeholder={t("form.titlePlaceholder")}
                {...register("title")}
                className="mt-1"
              />
              {errors.title && (
                <p className="text-xs text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                {t("form.subtitle")}
              </label>
              <Input
                placeholder={t("form.subtitlePlaceholder")}
                {...register("subtitle")}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">{t("form.badgeLabel")}</label>
                <Input placeholder={t("form.badgePlaceholder")} {...register("badge")} className="mt-1" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">{t("form.sortOrder")}</label>
                <Input
                  type="number"
                  {...register("sortOrder", { valueAsNumber: true })}
                  className="mt-1"
                />
              </div>
            </div>
          </div>

          {/* Action Type & Target Configurator */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400">
              {t("form.clickBehaviorHeading")}
            </h4>

            <div>
              <label className="text-xs font-semibold text-slate-700">{t("form.actionType")}</label>
              <Controller
                name="actionType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder={t("form.actionType")} />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEARCH">{t("form.actionTypes.search")}</SelectItem>
                      <SelectItem value="APP_SCREEN">{t("form.actionTypes.appScreen")}</SelectItem>
                      <SelectItem value="BLOG_ARTICLE">{t("form.actionTypes.blogArticle")}</SelectItem>
                      <SelectItem value="EXTERNAL_URL">{t("form.actionTypes.externalUrl")}</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Target Configurator by Action Type */}
            {watchActionType === "SEARCH" && (
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">{t("form.originCity")}</label>
                  <Input placeholder="e.g. Abidjan" {...register("searchOrigin")} className="mt-1 text-xs" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">{t("form.destCity")}</label>
                  <Input placeholder="e.g. Yamoussoukro" {...register("searchDestination")} className="mt-1 text-xs" />
                </div>
              </div>
            )}

            {watchActionType === "APP_SCREEN" && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600">{t("form.targetAppTab")}</label>
                <Controller
                  name="targetTab"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="search">{t("form.tabs.search")}</SelectItem>
                        <SelectItem value="bookings">{t("form.tabs.bookings")}</SelectItem>
                        <SelectItem value="tickets">{t("form.tabs.tickets")}</SelectItem>
                        <SelectItem value="settings">{t("form.tabs.settings")}</SelectItem>
                        <SelectItem value="wallet">{t("form.tabs.wallet")}</SelectItem>
                        <SelectItem value="notifications">{t("form.tabs.notifications")}</SelectItem>
                        <SelectItem value="passengers">{t("form.tabs.passengers")}</SelectItem>
                        <SelectItem value="personal-info">{t("form.tabs.personalInfo")}</SelectItem>
                        <SelectItem value="reviews">{t("form.tabs.reviews")}</SelectItem>
                        <SelectItem value="help-support">{t("form.tabs.helpSupport")}</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            {watchActionType === "BLOG_ARTICLE" && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600">{t("form.targetBlogArticle")}</label>
                <Controller
                  name="blogSlug"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder={t("form.selectPost")} />
                      </SelectTrigger>
                      <SelectContent>
                        {blogPostsData?.items?.map((post) => (
                          <SelectItem key={post.id} value={post.slug}>
                            {post.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            {watchActionType === "EXTERNAL_URL" && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600">{t("form.webLinkUrl")}</label>
                <Input placeholder="https://mojaride.com/promo" {...register("externalUrl")} className="mt-1 text-xs" />
              </div>
            )}
          </div>

          {/* Active Switch & Gradient Theme */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-semibold text-slate-700">{t("form.themeColor")}</label>
              <Controller
                name="gradientPreset"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADIENT_PRESETS.map((preset) => (
                        <SelectItem key={preset.label} value={preset.label}>
                          {preset.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            <div className="flex items-center justify-between pt-1">
              <span className="text-xs font-semibold text-slate-700">{t("form.activeStatus")}</span>
              <Controller
                name="isActive"
                control={control}
                render={({ field }) => (
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                )}
              />
            </div>
          </div>

          {/* Dialog Actions */}
          <div className="flex justify-end gap-2 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              {t("form.cancel")}
            </Button>
            <Button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="size-4 animate-spin mr-1" />
              ) : null}
              {banner ? t("form.saveChanges") : t("form.createBanner")}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
