"use client";

import { useEffect } from "react";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "sonner";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { useStorageUpload } from "@/lib/storage-client";
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
      toast.success("Banner image uploaded successfully");
    } catch {
      toast.error("Failed to upload banner image");
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
        toast.success("Banner updated successfully");
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
        toast.success("Banner created successfully");
      }

      await queryClient.invalidateQueries();
      onOpenChange(false);
    } catch (err: any) {
      toast.error(err?.message || "Failed to save banner");
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{banner ? "Edit Banner" : "New Promotional Banner"}</DialogTitle>
          <DialogDescription>
            Configure banner image, title, badge, and mobile app click behavior.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-2">
          {/* Banner Image Upload */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700">Banner Image</label>
            {watchImageUrl ? (
              <div className="relative aspect-[21/9] w-full rounded-lg overflow-hidden border border-slate-200 group">
                <Image
                  src={watchImageUrl}
                  alt="Banner preview"
                  fill
                  className="object-cover"
                />
                <label className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer">
                  Change Image
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
                      Upload Banner Image (1200x500)
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
              <label className="text-xs font-semibold text-slate-700">Title</label>
              <Input
                placeholder="e.g. 15% OFF Weekend Escapes"
                {...register("title")}
                className="mt-1"
              />
              {errors.title && (
                <p className="text-xs text-red-500">{errors.title.message}</p>
              )}
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-700">
                Subtitle / Short Description
              </label>
              <Input
                placeholder="e.g. Travel Abidjan to Yamoussoukro in luxury"
                {...register("subtitle")}
                className="mt-1"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-semibold text-slate-700">Badge</label>
                <Input placeholder="e.g. 15% OFF" {...register("badge")} className="mt-1" />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700">Sort Order</label>
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
              Click Behavior & Redirection
            </h4>

            <div>
              <label className="text-xs font-semibold text-slate-700">Action Type</label>
              <Controller
                name="actionType"
                control={control}
                render={({ field }) => (
                  <Select value={field.value} onValueChange={field.onChange}>
                    <SelectTrigger className="mt-1">
                      <SelectValue placeholder="Select Action Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="SEARCH">Search Route (Pre-fill From/To)</SelectItem>
                      <SelectItem value="APP_SCREEN">App Screen Tab</SelectItem>
                      <SelectItem value="BLOG_ARTICLE">Blog Article Reader</SelectItem>
                      <SelectItem value="EXTERNAL_URL">External Web Link</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>

            {/* Target Configurator by Action Type */}
            {watchActionType === "SEARCH" && (
              <div className="grid grid-cols-2 gap-2 p-3 bg-slate-50 rounded-lg border border-slate-200">
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Origin City</label>
                  <Input placeholder="e.g. Abidjan" {...register("searchOrigin")} className="mt-1 text-xs" />
                </div>
                <div>
                  <label className="text-[11px] font-semibold text-slate-600">Destination City</label>
                  <Input placeholder="e.g. Yamoussoukro" {...register("searchDestination")} className="mt-1 text-xs" />
                </div>
              </div>
            )}

            {watchActionType === "APP_SCREEN" && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600">Target App Tab</label>
                <Controller
                  name="targetTab"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="search">Search Tab</SelectItem>
                        <SelectItem value="bookings">Bookings Tab</SelectItem>
                        <SelectItem value="tickets">Tickets Tab</SelectItem>
                        <SelectItem value="settings">Settings Tab</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                />
              </div>
            )}

            {watchActionType === "BLOG_ARTICLE" && (
              <div className="p-3 bg-slate-50 rounded-lg border border-slate-200">
                <label className="text-[11px] font-semibold text-slate-600">Target Blog Article</label>
                <Controller
                  name="blogSlug"
                  control={control}
                  render={({ field }) => (
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select a published post" />
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
                <label className="text-[11px] font-semibold text-slate-600">Web Link URL</label>
                <Input placeholder="https://mojaride.com/promo" {...register("externalUrl")} className="mt-1 text-xs" />
              </div>
            )}
          </div>

          {/* Active Switch & Gradient Theme */}
          <div className="space-y-3 pt-2 border-t border-slate-100">
            <div>
              <label className="text-xs font-semibold text-slate-700">Theme Color</label>
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
              <span className="text-xs font-semibold text-slate-700">Active Status</span>
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
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-slate-900 hover:bg-slate-800 text-white"
              disabled={createMutation.isPending || updateMutation.isPending}
            >
              {createMutation.isPending || updateMutation.isPending ? (
                <Loader2 className="size-4 animate-spin mr-1" />
              ) : null}
              {banner ? "Save Changes" : "Create Banner"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
