"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTRPC } from "@/trpc/client";
import { Button } from "@moja/ui/components/ui/button";
import { Input } from "@moja/ui/components/ui/input";
import { Card } from "@moja/ui/components/ui/card";
import { Badge } from "@moja/ui/components/ui/badge";
import { Switch } from "@moja/ui/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@moja/ui/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@moja/ui/components/ui/dropdown-menu";
import { Search, Plus, MoreHorizontal, Edit, Trash2, Image as ImageIcon } from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { BannerFormDialog, type PromoBanner } from "../components/content/banner-form-dialog";

export function AdminBannersView() {
  const t = useTranslations("adminDashboard.banners");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedBanner, setSelectedBanner] = useState<PromoBanner | null>(null);

  const { data: bannerData, isLoading } = useQuery(
    trpc.admin.listBanners.queryOptions({ search, page, limit: 20 }),
  );

  const updateMutation = useMutation(trpc.admin.updateBanner.mutationOptions());
  const deleteMutation = useMutation(trpc.admin.deleteBanner.mutationOptions());

  const handleToggleActive = async (banner: PromoBanner, active: boolean) => {
    try {
      await updateMutation.mutateAsync({ id: banner.id, isActive: active });
      await queryClient.invalidateQueries();
      toast.success(active ? t("toast.bannerActivated") : t("toast.bannerDeactivated"));
    } catch {
      toast.error(t("toast.statusUpdateFailed"));
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm(t("deleteConfirm"))) return;
    try {
      await deleteMutation.mutateAsync({ id });
      await queryClient.invalidateQueries();
      toast.success(t("toast.bannerDeleted"));
    } catch {
      toast.error(t("toast.deleteFailed"));
    }
  };

  const handleEdit = (banner: PromoBanner) => {
    setSelectedBanner(banner);
    setIsFormOpen(true);
  };

  const handleCreateNew = () => {
    setSelectedBanner(null);
    setIsFormOpen(true);
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="relative w-full sm:w-72">
          <Search className="absolute left-3 top-2.5 size-4 text-slate-400" />
          <Input
            type="text"
            placeholder={t("searchPlaceholder")}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 text-xs"
          />
        </div>
        <Button onClick={handleCreateNew} className="bg-rose-600 hover:bg-rose-700 text-white text-xs gap-1.5 w-full sm:w-auto">
          <Plus className="size-4" />
          {t("newBanner")}
        </Button>
      </div>

      {/* Main Table */}
      <Card className="overflow-hidden border-slate-200">
        <Table>
          <TableHeader>
            <TableRow className="bg-slate-50/50">
              <TableHead className="w-20">{t("table.preview")}</TableHead>
              <TableHead>{t("table.titleAndSubtitle")}</TableHead>
              <TableHead>{t("table.badge")}</TableHead>
              <TableHead>{t("table.actionTarget")}</TableHead>
              <TableHead className="w-24 text-center">{t("table.status")}</TableHead>
              <TableHead className="w-16 text-center">{t("table.order")}</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-xs text-slate-400">
                  {t("table.loading")}
                </TableCell>
              </TableRow>
            ) : bannerData?.items?.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="h-32 text-center text-xs text-slate-400">
                  {t("table.empty")}
                </TableCell>
              </TableRow>
            ) : (
              bannerData?.items.map((banner: any) => (
                <TableRow key={banner.id}>
                  <TableCell>
                    {banner.imageUrl ? (
                      <div className="relative h-10 w-20 rounded-md overflow-hidden border border-slate-200">
                        <Image
                          src={banner.imageUrl}
                          alt={banner.title}
                          fill
                          className="object-cover"
                        />
                      </div>
                    ) : (
                      <div className="h-10 w-20 rounded-md bg-slate-100 flex items-center justify-center text-slate-400">
                        <ImageIcon className="size-4" />
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="font-bold text-xs text-slate-900">{banner.title}</div>
                    {banner.subtitle && (
                      <div className="text-[11px] text-slate-500 line-clamp-1">
                        {banner.subtitle}
                      </div>
                    )}
                  </TableCell>
                  <TableCell>
                    {banner.badge ? (
                      <Badge className="bg-rose-50 text-rose-700 border-rose-200 text-[10px]">
                        {banner.badge}
                      </Badge>
                    ) : (
                      <span className="text-slate-400 text-xs">—</span>
                    )}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="text-[10px] font-mono">
                      {banner.actionType}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-center">
                    <Switch
                      checked={banner.isActive}
                      onCheckedChange={(val) => handleToggleActive(banner as PromoBanner, val)}
                    />
                  </TableCell>
                  <TableCell className="text-center text-xs font-mono font-semibold">
                    {banner.sortOrder}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="size-7">
                          <MoreHorizontal className="size-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleEdit(banner as PromoBanner)} className="gap-2 text-xs">
                          <Edit className="size-3.5" />
                          {t("editBanner")}
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(banner.id)}
                          className="gap-2 text-xs text-red-600 focus:text-red-600"
                        >
                          <Trash2 className="size-3.5" />
                          {t("deleteBanner")}
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Card>

      {/* Banner Form Dialog */}
      <BannerFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        banner={selectedBanner}
      />
    </div>
  );
}
