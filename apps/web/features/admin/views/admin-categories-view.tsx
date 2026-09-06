"use client";

import { Button } from "@moja/ui/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@moja/ui/components/ui/dialog";
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
import { Textarea } from "@moja/ui/components/ui/textarea";
import {
  useMutation,
  useQueryClient,
  useSuspenseQuery,
} from "@tanstack/react-query";
import {
  ArrowRight,
  Edit2,
  FolderKanban,
  Plus,
  Tag,
  Trash2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useState } from "react";
import { toast } from "sonner";
import { useTRPC } from "@/trpc/client";

export function AdminCategoriesView() {
  const t = useTranslations("adminDashboard.adminCategoriesView");
  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<{
    id: string;
    name: string;
    description: string;
    parentId: string;
  } | null>(null);

  // Form states
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [parentId, setParentId] = useState("");

  const { data: categories } = useSuspenseQuery(
    trpc.admin.listBlogCategories.queryOptions(),
  );

  const createCategory = useMutation({
    ...trpc.admin.createBlogCategory.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.admin.listBlogCategories.pathFilter());
      toast.success(t("categoryCreated"));
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.message ?? t("failedToCreate"));
    },
  });

  const updateCategory = useMutation({
    ...trpc.admin.updateBlogCategory.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.admin.listBlogCategories.pathFilter());
      toast.success(t("categoryUpdated"));
      resetForm();
    },
    onError: (err: any) => {
      toast.error(err?.message ?? t("failedToUpdate"));
    },
  });

  const deleteCategory = useMutation({
    ...trpc.admin.deleteBlogCategory.mutationOptions(),
    onSuccess: () => {
      queryClient.invalidateQueries(trpc.admin.listBlogCategories.pathFilter());
      toast.success(t("categoryDeleted"));
    },
    onError: (err: any) => {
      toast.error(err?.message ?? t("failedToDelete"));
    },
  });

  const resetForm = () => {
    setName("");
    setDescription("");
    setParentId("");
    setEditingCategory(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (cat: any) => {
    setEditingCategory({
      id: cat.id,
      name: cat.name,
      description: cat.description ?? "",
      parentId: cat.parentId ?? "",
    });
    setName(cat.name);
    setDescription(cat.description ?? "");
    setParentId(cat.parentId ?? "");
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (editingCategory) {
      updateCategory.mutate({
        id: editingCategory.id,
        name,
        description,
        parentId: parentId || null,
      });
    } else {
      createCategory.mutate({
        name,
        description,
        parentId: parentId || null,
      });
    }
  };

  const handleDelete = (id: string) => {
    if (confirm(t("deleteConfirm"))) {
      deleteCategory.mutate({ id });
    }
  };

  // Filter out the editing category from parent options to avoid circular references
  const parentOptions = categories.filter(
    (c) => !editingCategory || c.id !== editingCategory.id,
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-foreground">{t("title")}</h2>
          <p className="text-xs text-muted-foreground mt-0.5">{t("subtitle")}</p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsDialogOpen(true);
          }}
          className="gap-2 h-9 text-xs font-semibold"
        >
          <Plus className="size-4" />
          {t("addCategory")}
        </Button>
      </div>

      <div className="bg-card rounded-xl border border-border overflow-hidden shadow-sm">
        <Table>
          <TableHeader className="bg-muted/40">
            <TableRow>
              <TableHead className="w-1/3 text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                {t("name")}
              </TableHead>
              <TableHead className="w-1/3 text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                {t("description")}
              </TableHead>
              <TableHead className="w-1/4 text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                {t("parentCategory")}
              </TableHead>
              <TableHead className="text-right text-xs font-bold text-muted-foreground uppercase tracking-wider h-10 px-4">
                {t("actions")}
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {categories.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="text-center py-10 text-muted-foreground text-xs"
                >
                  {t("noCategories")}
                </TableCell>
              </TableRow>
            ) : (
              categories.map((cat) => (
                <TableRow key={cat.id} className="hover:bg-muted/50">
                  <TableCell className="px-4 py-3 text-sm font-semibold text-foreground">
                    <div className="flex items-center gap-2">
                      {cat.parentId ? (
                        <>
                          <ArrowRight className="size-3 text-muted-foreground ml-2" />
                          <span className="text-muted-foreground font-normal">
                            {cat.name}
                          </span>
                        </>
                      ) : (
                        <span className="text-foreground font-bold">
                          {cat.name}
                        </span>
                      )}
                    </div>
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground truncate max-w-60">
                    {cat.description || "—"}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-sm text-muted-foreground">
                    {cat.parent ? (
                      <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md bg-muted border border-border text-foreground text-xs font-medium">
                        {cat.parent.name}
                      </span>
                    ) : (
                      <span className="text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="px-4 py-3 text-right">
                    <div className="flex justify-end gap-1.5">
                      <Button
                        onClick={() => handleEdit(cat)}
                        size="sm"
                        variant="ghost"
                        className="size-8 p-0 text-muted-foreground hover:text-foreground"
                      >
                        <Edit2 className="size-3.5" />
                        <span className="sr-only">{t("edit")}</span>
                      </Button>
                      <Button
                        onClick={() => handleDelete(cat.id)}
                        size="sm"
                        variant="ghost"
                        className="size-8 p-0 text-muted-foreground hover:text-destructive"
                        disabled={deleteCategory.isPending}
                      >
                        <Trash2 className="size-3.5" />
                        <span className="sr-only">{t("delete")}</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-2.5 mb-1">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center shrink-0">
                <FolderKanban className="size-4 text-primary-foreground" />
              </div>
              <DialogTitle className="text-base font-bold text-foreground">
                {editingCategory ? t("editCategory") : t("addCategoryTitle")}
              </DialogTitle>
            </div>
            <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
              {t("createCategoryFolder")}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <div className="space-y-1">
              <label
                htmlFor="cat-name"
                className="text-xs font-bold text-foreground uppercase tracking-wider"
              >
                {t("name")}
              </label>
              <Input
                id="cat-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder={t("namePlaceholder")}
                className="h-9 text-sm bg-background"
                required
                autoFocus
              />
            </div>

            <div className="space-y-1">
              <label
                htmlFor="cat-parent"
                className="text-xs font-bold text-foreground uppercase tracking-wider"
              >
                {t("parentCategory")}
              </label>
              <Select
                value={parentId || "__none__"}
                onValueChange={(val) =>
                  setParentId(!val || val === "__none__" ? "" : val)
                }
              >
                <SelectTrigger
                  id="cat-parent"
                  className="w-full h-9 text-sm bg-background"
                >
                  <SelectValue placeholder={t("noParentCategory")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">
                    <span className="text-muted-foreground">
                      {t("noParentCategory")}
                    </span>
                  </SelectItem>
                  {parentOptions.map((po) => (
                    <SelectItem key={po.id} value={po.id}>
                      {po.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <label
                htmlFor="cat-desc"
                className="text-xs font-bold text-foreground uppercase tracking-wider"
              >
                {t("description")}
              </label>
              <Textarea
                id="cat-desc"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={t("optionalDescription")}
                className="text-sm resize-none min-h-16 bg-background"
                rows={2}
              />
            </div>

            <DialogFooter className="pt-2">
              <Button
                type="button"
                variant="outline"
                className="h-9"
                onClick={resetForm}
                disabled={createCategory.isPending || updateCategory.isPending}
              >
                {t("cancel")}
              </Button>
              <Button
                type="submit"
                disabled={
                  !name.trim() ||
                  createCategory.isPending ||
                  updateCategory.isPending
                }
                className="h-9 font-semibold text-xs"
              >
                {createCategory.isPending || updateCategory.isPending ? (
                  <>
                    <Spinner className="mr-2 size-3.5" />
                    {t("saving")}
                  </>
                ) : (
                  t("saveCategory")
                )}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
